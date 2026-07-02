-- Each group member's GLOBAL ranked points (same points formula as ranked_leaderboard:
-- solved -> 100 + greatest(0,120-time_sec); else greatest(0,40-distance); summed).
create or replace function public.group_standings_global(p_gid text)
returns table (user_id uuid, username text, points int)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from group_members where group_id = p_gid and user_id = auth.uid() and status = 'accepted') then
    raise exception 'not a member';
  end if;
  return query
  select p.id, p.username,
         coalesce(sum(case when gr.solved then 100 + greatest(0, 120 - gr.time_sec)
                           else greatest(0, 40 - gr.distance) end), 0)::int
    from group_members gm
    join profiles p on p.id = gm.user_id
    left join game_results gr on gr.user_id = gm.user_id
   where gm.group_id = p_gid and gm.status = 'accepted'
   group by p.id, p.username
   order by 3 desc;
end;
$$;
grant execute on function public.group_standings_global(text) to authenticated;
