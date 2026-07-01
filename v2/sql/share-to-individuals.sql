-- Direct challenge sends (share a puzzle to a specific person, like a group send).
-- The recipient sees it in Active Games "to play". Access via RPC only.
create table if not exists public.challenge_recipients (
  challenge_id text not null references challenges(id) on delete cascade,
  sender_id    uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (challenge_id, recipient_id)
);
alter table public.challenge_recipients enable row level security;

create or replace function public.send_challenge_to(p_cid text, p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from challenges where id = p_cid and creator = auth.uid()) then
    raise exception 'not your challenge';
  end if;
  insert into challenge_recipients (challenge_id, sender_id, recipient_id)
  values (p_cid, auth.uid(), p_uid)
  on conflict (challenge_id, recipient_id) do nothing;
end;
$$;

create or replace function public.my_received_challenges()
returns table (cid text, sender text, target int, created_at timestamptz, i_played boolean, sender_o jsonb)
language sql security definer set search_path = public as $$
  select cr.challenge_id, sp.username, nullif(c.payload->>'t','')::int, cr.created_at,
         exists (select 1 from challenge_attempts a where a.challenge_id = cr.challenge_id and a.user_id = auth.uid()),
         c.payload->'o'
    from challenge_recipients cr
    join challenges c on c.id = cr.challenge_id
    left join profiles sp on sp.id = cr.sender_id
   where cr.recipient_id = auth.uid()
   order by cr.created_at desc;
$$;

grant execute on function public.send_challenge_to(text, uuid) to authenticated;
grant execute on function public.my_received_challenges()      to authenticated;
