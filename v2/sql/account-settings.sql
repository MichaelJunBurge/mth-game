-- Account settings: reset (wipe play data, keep account) + delete (remove entirely).
-- SECURITY DEFINER; access via RPC only. Deleting from auth.users needs the function
-- owner's privileges (postgres) — if an FK blocks, add the missing table's delete above.
create or replace function public.reset_my_account()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from ranked_plays        where user_id = auth.uid();
  delete from challenge_attempts  where user_id = auth.uid();
  delete from game_results        where user_id = auth.uid();
  update profiles set games_played = 0 where id = auth.uid();
end;
$$;

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  delete from group_challenges where group_id in (select id from groups where owner = uid);
  delete from group_members    where group_id in (select id from groups where owner = uid);
  delete from groups           where owner = uid;
  delete from group_challenges where added_by = uid;
  delete from group_members    where user_id = uid;
  delete from challenge_attempts where user_id = uid;
  delete from challenges        where creator = uid;
  delete from ranked_plays      where user_id = uid;
  delete from game_results      where user_id = uid;
  delete from friendships       where requester = uid or addressee = uid;
  delete from profiles          where id = uid;
  delete from auth.users        where id = uid;
end;
$$;

grant execute on function public.reset_my_account()  to authenticated;
grant execute on function public.delete_my_account() to authenticated;
