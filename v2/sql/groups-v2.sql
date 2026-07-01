-- ============================================================================
-- mth game v2 — GROUPS phase 2  (finalized to the real schema, 2026-07-01)
--
-- Adds: member invites (pending/accept/decline), one-outstanding-sent-game per
-- member with a 24h expiry (no delete), participation-based scoring, group
-- standings + trophies (⚡ fastest correct / 👓 most correct), and the group
-- loop RPC (games to play + per-game scoreboard + completion).
--
-- Real schema this is written against:
--   groups(id text pk, name text, owner uuid, created_at timestamptz)
--   group_members(group_id text, user_id uuid, username text, joined_at timestamptz)
--       [+ status added below]   -- assumed unique(group_id, user_id)
--   group_challenges(group_id text, challenge_id text, added_by uuid, created_at timestamptz)
--   challenges(id text pk, creator uuid, creator_username text, payload jsonb, created_at)
--   challenge_attempts(id bigint, challenge_id text, user_id uuid, username text,
--       solved bool, score int, distance int, goal int, time_sec numeric,
--       working jsonb, created_at timestamptz)  -- unique(challenge_id, user_id)
--
-- Access stays through SECURITY DEFINER RPCs (RLS on, no direct table policies).
-- Safe to re-run (IF NOT EXISTS / CREATE OR REPLACE). If any statement errors,
-- paste the error and the statement can be fixed in isolation.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Schema additions
-- ---------------------------------------------------------------------------
alter table public.group_members
  add column if not exists status text not null default 'accepted'
    check (status in ('pending', 'accepted'));   -- existing rows stay 'accepted'

create index if not exists group_challenges_group_created_idx
  on public.group_challenges (group_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 2) Helpers
-- ---------------------------------------------------------------------------
create or replace function public.group_member_count(p_gid text)
returns int language sql security definer set search_path = public as $$
  select count(*)::int from group_members
   where group_id = p_gid and status = 'accepted';
$$;

-- Everyone except the sender has attempted this challenge?
create or replace function public.group_challenge_completed(p_cid text, p_gid text, p_sender uuid)
returns boolean language sql security definer set search_path = public as $$
  select (
    select count(distinct ca.user_id) from challenge_attempts ca
     where ca.challenge_id = p_cid and ca.user_id <> p_sender
  ) >= greatest(public.group_member_count(p_gid) - 1, 0);
$$;

-- Still open = within 24h AND not yet completed.
create or replace function public.is_group_challenge_active(p_cid text, p_gid text, p_sender uuid, p_created timestamptz)
returns boolean language sql security definer set search_path = public as $$
  select p_created > now() - interval '24 hours'
     and not public.group_challenge_completed(p_cid, p_gid, p_sender);
$$;

-- ---------------------------------------------------------------------------
-- 3) Invites  (members join 'pending' → accept/decline)
-- ---------------------------------------------------------------------------
create or replace function public.invite_group_member(p_gid text, p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from group_members
                  where group_id = p_gid and user_id = auth.uid() and status = 'accepted') then
    raise exception 'not a member';
  end if;
  if not exists (select 1 from group_members where group_id = p_gid and user_id = p_uid) then
    insert into group_members (group_id, user_id, username, status)
    values (p_gid, p_uid, coalesce((select username from profiles where id = p_uid), ''), 'pending');
  end if;
end;
$$;

create or replace function public.my_group_invites()
returns table (group_id text, name text, inviter text) language sql security definer set search_path = public as $$
  select g.id, g.name, p.username
    from group_members gm
    join groups g   on g.id = gm.group_id
    left join profiles p on p.id = g.owner
   where gm.user_id = auth.uid() and gm.status = 'pending';
$$;

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
-- 4) Sending a game  (one active per member, 24h expiry, no delete)
-- ---------------------------------------------------------------------------
create or replace function public.group_send_status(p_gid text)
returns table (can_send boolean, active_expires timestamptz) language plpgsql security definer set search_path = public as $$
declare v_created timestamptz; v_cid text;
begin
  select gc.created_at, gc.challenge_id into v_created, v_cid
    from group_challenges gc
   where gc.group_id = p_gid and gc.added_by = auth.uid()
   order by gc.created_at desc limit 1;

  if v_created is null or not public.is_group_challenge_active(v_cid, p_gid, auth.uid(), v_created) then
    return query select true, null::timestamptz;
  else
    return query select false, v_created + interval '24 hours';
  end if;
end;
$$;

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
  insert into group_challenges (group_id, challenge_id, added_by, created_at)
  values (p_gid, p_cid, auth.uid(), now());
end;
$$;

-- ---------------------------------------------------------------------------
-- 5) Standings + trophies  (participation scoring)
-- Per game, participants = sender (challenges.payload->'o') + everyone who
-- attempted. Rank by (solved desc, time asc, distance asc); points =
-- participants - rank + 1 (last still scores 1). Summed per member.
-- ⚡ = most games where you had the fastest correct solve; 👓 = most solved.
-- ---------------------------------------------------------------------------
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
  with games as (
    select gc.challenge_id as cid, gc.added_by, c.creator_username, c.creator, (c.payload->'o') as o
      from group_challenges gc
      join challenges c on c.id = gc.challenge_id
     where gc.group_id = p_gid
  ),
  results as (
    select g.cid, g.creator as uid, g.creator_username as uname,
           coalesce((g.o->>'solved')::boolean, false) as solved,
           coalesce((g.o->>'timeSec')::numeric, 1e9)  as time_sec,
           coalesce((g.o->>'distance')::numeric, 1e9) as distance
      from games g where g.o is not null
    union all
    select ca.challenge_id, ca.user_id, ca.username,
           coalesce(ca.solved, false), coalesce(ca.time_sec, 1e9), coalesce(ca.distance, 1e9)
      from challenge_attempts ca
      join games g on g.cid = ca.challenge_id
     where ca.user_id <> g.creator
  ),
  ranked as (
    select r.*,
           rank() over (partition by r.cid order by r.solved desc, r.time_sec asc, r.distance asc) as rnk,
           count(*) over (partition by r.cid) as participants,
           row_number() over (partition by r.cid, r.solved order by r.time_sec asc) as fast_rn
      from results r
  ),
  agg as (
    select uid, max(uname) as uname, count(*)::int as played,
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
-- 6) The group loop: each sent game + whether YOU still need to play it +
--    its ranked scoreboard. Drives "games to play", the scoreboard, and the
--    "everyone's played" completion marker.
-- ---------------------------------------------------------------------------
create or replace function public.group_games(p_gid text)
returns table (
  cid text, target int, sender text, created_at timestamptz, expires timestamptz,
  active boolean, completed boolean, i_played boolean, i_sent boolean, board jsonb
) language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from group_members
                  where group_id = p_gid and user_id = auth.uid() and status = 'accepted') then
    raise exception 'not a member';
  end if;

  return query
  select gc.challenge_id,
         nullif(c.payload->>'t','')::int,
         c.creator_username,
         gc.created_at,
         gc.created_at + interval '24 hours',
         public.is_group_challenge_active(gc.challenge_id, p_gid, gc.added_by, gc.created_at),
         public.group_challenge_completed(gc.challenge_id, p_gid, gc.added_by),
         exists (select 1 from challenge_attempts a where a.challenge_id = gc.challenge_id and a.user_id = auth.uid()),
         gc.added_by = auth.uid(),
         (
           select coalesce(jsonb_agg(x order by x.solved desc, x.time_sec asc, x.distance asc), '[]'::jsonb)
           from (
             select c.creator_username as username,
                    coalesce((c.payload->'o'->>'solved')::boolean, false) as solved,
                    coalesce((c.payload->'o'->>'timeSec')::numeric, 1e9)  as time_sec,
                    coalesce((c.payload->'o'->>'distance')::numeric, 1e9) as distance
             union all
             select a.username, coalesce(a.solved, false),
                    coalesce(a.time_sec, 1e9), coalesce(a.distance, 1e9)
               from challenge_attempts a
              where a.challenge_id = gc.challenge_id and a.user_id <> c.creator
           ) x
         )
  from group_challenges gc
  join challenges c on c.id = gc.challenge_id
  where gc.group_id = p_gid
  order by gc.created_at desc;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7) Grants
-- ---------------------------------------------------------------------------
grant execute on function public.group_member_count(text)            to authenticated;
grant execute on function public.invite_group_member(text, uuid)     to authenticated;
grant execute on function public.my_group_invites()                  to authenticated;
grant execute on function public.respond_group_invite(text, boolean) to authenticated;
grant execute on function public.group_send_status(text)             to authenticated;
grant execute on function public.send_group_game(text, text)         to authenticated;
grant execute on function public.group_standings(text)               to authenticated;
grant execute on function public.group_games(text)                   to authenticated;
