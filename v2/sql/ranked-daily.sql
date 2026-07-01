-- Daily ranked limit: 3 plays per user per UTC day, no carryover.
-- Each ranked target ROLL spends one try (prevents re-roll target-fishing).
-- Access via SECURITY DEFINER RPCs only. Safe + re-runnable.
create table if not exists public.ranked_plays (
  user_id   uuid not null references auth.users(id) on delete cascade,
  play_date date not null default (now() at time zone 'utc')::date,
  count     int  not null default 0,
  primary key (user_id, play_date)
);
alter table public.ranked_plays enable row level security;

-- How many ranked plays I have left today (0..3).
create or replace function public.ranked_tries_left()
returns int language sql security definer set search_path = public as $$
  select greatest(0, 3 - coalesce((
    select count from ranked_plays
     where user_id = auth.uid() and play_date = (now() at time zone 'utc')::date
  ), 0));
$$;

-- Spend one ranked play. Returns tries remaining, or -1 if none were left.
create or replace function public.consume_ranked_try()
returns int language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'utc')::date; c int;
begin
  select count into c from ranked_plays where user_id = auth.uid() and play_date = d;
  if c is null then
    insert into ranked_plays (user_id, play_date, count) values (auth.uid(), d, 1);
    return 2;
  elsif c >= 3 then
    return -1;
  else
    update ranked_plays set count = c + 1 where user_id = auth.uid() and play_date = d;
    return 3 - (c + 1);
  end if;
end;
$$;

grant execute on function public.ranked_tries_left()  to authenticated;
grant execute on function public.consume_ranked_try() to authenticated;
