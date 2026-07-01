-- ============================================================================
-- mth game v2 — GROUPS phase 2 (PROPOSED migration — review before running)
--
-- Adds: member invites (pending/accept/decline), one-outstanding-sent-game per
-- member with a 24h expiry (no delete), participation-based scoring, group
-- standings + trophies (fastest ⚡ / most-correct 👓).
--
-- Assumes the Phase-5 tables already exist (created via the SQL you ran then):
--   groups(id text pk, name text, creator uuid, created_at timestamptz)
--   group_members(group_id text, user_id uuid, unique(group_id,user_id))   [+ maybe joined_at]
--   group_challenges(group_id text, challenge_id text, ...)                 [share_to_group inserts here]
--   challenges(id text pk, creator uuid, creator_username text, payload jsonb, created_at)
--   challenge_attempts(challenge_id text, user_id uuid, username text,
--                      solved bool, score int, distance int, goal int,
--                      time_sec numeric, working jsonb, unique(challenge_id,user_id))
-- All access stays through SECURITY DEFINER RPCs (RLS on, no direct table policies)
-- to avoid the RLS recursion issue groups already had.
--
-- >>> CONFIRM the real column names of group_members / group_challenges match
--     the ALTERs below before running; adjust if your Phase-5 schema differs. <<<
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Schema additions
-- ---------------------------------------------------------------------------

-- Members are invited first; they must accept.
alter table public.group_members
  add column if not exists status text not null default 'accepted'
    check (status in ('pending', 'accepted'));
-- (existing rows keep 'accepted'; newly-invited members are inserted 'pending')

-- Which member sent a group game, and when (drives the 24h expiry + one-active rule).
alter table public.group_challenges
  add column if not exists sender_id  uuid references auth.users(id);
alter table public.group_challenges
  add column if not exists created_at timestamptz not null default now();

create index if not exists group_challenges_group_created_idx
  on public.group_challenges (group_id, created_at desc);

-- A group game is ACTIVE for 24h and until every other accepted member has attempted it.
-- Both are derived (no status column needed): see is_group_challenge_active().

-- ---------------------------------------------------------------------------
-- 2) Helpers
-- ---------------------------------------------------------------------------

-- Count of accepted members in a group.
create or replace function public.group_member_count(p_gid text)
returns int language sql security definer set search_path = public as $$
  select count(*)::int from group_members
   where group_id = p_gid and status = 'accepted';
$$;

-- Has the given challenge been attempted by everyone except its sender?
create or replace function public.group_challenge_completed(p_cid text, p_gid text, p_sender uuid)
returns boolean language sql security definer set search_path = public as $$
  select (
    select count(distinct ca.user_id) from challenge_attempts ca
     where ca.challenge_id = p_cid and ca.user_id <> p_sender
  ) >= greatest(public.group_member_count(p_gid) - 1, 0);
$$;

-- Is a group game still open (within 24h AND not yet completed)?
create or replace function public.is_group_challenge_active(p_cid text, p_gid text, p_sender uuid, p_created timestamptz)
returns boolean language sql security definer set search_path = public as $$
  select p_created > now() - interval '24 hours'
     and not public.group_challenge_completed(p_cid, p_gid, p_sender);
$$;

-- ---------------------------------------------------------------------------
-- 3) Invites
-- ---------------------------------------------------------------------------

-- Invite a user to a group (creator or any accepted member can invite).
-- Inserts a PENDING membership. Replaces the old add_group_member behaviour.
create or replace function public.invite_group_member(p_gid text, p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from group_members
                  where group_id = p_gid and user_id = auth.uid() and status = 'accepted') then
    raise exception 'not a member';
  end if;
  insert into group_members (group_id, user_id, status)
  values (p_gid, p_uid, 'pending')
  on conflict (group_id, user_id) do nothing;
end;
$$;

-- Pending invites for the current user (to show the accept/decline notification).
create or replace function public.my_group_invites()
returns table (group_id text, name text, inviter text) language sql security definer set search_path = public as $$
  select g.id, g.name, p.username
    from group_members gm
    join groups g   on g.id = gm.group_id
    left join profiles p on p.id = g.creator
   where gm.user_id = auth.uid() and gm.status = 'pending';
$$;

-- Accept or decline an invite.
create or replace function public.respond_group_invite(p_gid text, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_accept then
    update group_members set status = 'accepted'
     where group_id = p_gid and user_id = auth.uid();
  else
    delete from group_members
     where group_id = p_gid and user_id = auth.uid() and status = 'pending';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4) Sending a game (one active per member, 24h expiry, no delete)
-- ---------------------------------------------------------------------------

-- For the current user in a group: can they send, and when does their active game expire?
create or replace function public.group_send_status(p_gid text)
returns table (can_send boolean, active_expires timestamptz) language plpgsql security definer set search_path = public as $$
declare v_created timestamptz; v_cid text;
begin
  select gc.created_at, gc.challenge_id into v_created, v_cid
    from group_challenges gc
   where gc.group_id = p_gid and gc.sender_id = auth.uid()
   order by gc.created_at desc limit 1;

  if v_created is null or not public.is_group_challenge_active(v_cid, p_gid, auth.uid(), v_created) then
    return query select true, null::timestamptz;         -- no active game -> can send
  else
    return query select false, v_created + interval '24 hours'; -- blocked until this expires/completes
  end if;
end;
$$;

-- Send a game to a group (must be a member with no active sent game there).
create or replace function public.send_group_game(p_gid text, p_cid text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from group_members
                  where group_id = p_gid and user_id = auth.uid() and status = 'accepted') then
    raise exception 'not a member';
  end if;
  if not (select can_send from public.group_send_status(p_gid)) then
    raise exception 'you already have an active game in this group';
  end if;
  insert into group_challenges (group_id, challenge_id, sender_id, created_at)
  values (p_gid, p_cid, auth.uid(), now());
end;
$$;

-- ---------------------------------------------------------------------------
-- 5) Standings + trophies (participation scoring)
-- ---------------------------------------------------------------------------
-- For each group game, participants = the sender (their result in challenges.payload->'o')
-- plus everyone in challenge_attempts. Rank per game by (solved desc, time asc, distance asc);
-- points = participants - rank + 1 (last place still scores 1). Sum per member.
-- Trophies: ⚡ = most games where the member had the fastest correct solve;
--           👓 = most correct (solved) answers.
create or replace function public.group_standings(p_gid text)
returns table (
  user_id uuid, username text, played int, wins int, points int,
  fastest boolean, most_correct boolean
) language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from group_members
                  where group_id = p_gid and user_id = auth.uid() and status = 'accepted') then
    raise exception 'not a member';
  end if;

  return query
  with games as (   -- the group's games + the sender's own recorded result
    select gc.challenge_id as cid, gc.sender_id,
           c.creator_username as sender_name,
           (c.payload->'o') as sender_o
      from group_challenges gc
      join challenges c on c.id = gc.challenge_id
     where gc.group_id = p_gid
  ),
  results as (      -- one row per (game, participant)
    select g.cid, g.sender_id as uid, g.sender_name as uname,
           coalesce((g.sender_o->>'solved')::boolean, false) as solved,
           coalesce((g.sender_o->>'timeSec')::numeric, 1e9)  as time_sec,
           coalesce((g.sender_o->>'distance')::numeric, 1e9) as distance
      from games g where g.sender_o is not null
    union all
    select ca.challenge_id as cid, ca.user_id as uid, ca.username as uname,
           coalesce(ca.solved, false), coalesce(ca.time_sec, 1e9), coalesce(ca.distance, 1e9)
      from challenge_attempts ca
      join games g on g.cid = ca.challenge_id
  ),
  ranked as (
    select r.*,
           rank() over (partition by r.cid order by r.solved desc, r.time_sec asc, r.distance asc) as rnk,
           count(*) over (partition by r.cid) as participants,
           row_number() over (partition by r.cid, r.solved order by r.time_sec asc) as fast_rn
      from results r
  ),
  agg as (
    select uid,
           max(uname) as uname,
           count(*)::int as played,
           sum(case when rnk = 1 then 1 else 0 end)::int as wins,
           sum(participants - rnk + 1)::int as points,
           sum(case when solved and fast_rn = 1 then 1 else 0 end)::int as fastest_wins,
           sum(case when solved then 1 else 0 end)::int as correct
      from ranked group by uid
  )
  select a.uid, a.uname, a.played, a.wins, a.points,
         (a.fastest_wins > 0 and a.fastest_wins = (select max(fastest_wins) from agg)) as fastest,
         (a.correct     > 0 and a.correct     = (select max(correct)      from agg)) as most_correct
    from agg a
   order by a.points desc, a.wins desc;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6) Grants (RPCs are SECURITY DEFINER; expose to authenticated users)
-- ---------------------------------------------------------------------------
grant execute on function public.invite_group_member(text, uuid)      to authenticated;
grant execute on function public.my_group_invites()                   to authenticated;
grant execute on function public.respond_group_invite(text, boolean)  to authenticated;
grant execute on function public.group_send_status(text)              to authenticated;
grant execute on function public.send_group_game(text, text)          to authenticated;
grant execute on function public.group_standings(text)                to authenticated;
grant execute on function public.group_member_count(text)             to authenticated;
