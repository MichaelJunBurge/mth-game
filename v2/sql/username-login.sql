-- Resolve a username to its account email, so people can log in with either their
-- email OR their username (Supabase auth needs the email client-side).
-- PRIVACY NOTE: this is callable before login (anon), so anyone can look up the
-- email for a given username. Fine for a casual game; revoke if that's not ok.
create or replace function public.email_for_username(p_uname text)
returns text language sql security definer set search_path = public as $$
  select u.email::text
    from profiles p join auth.users u on u.id = p.id
   where lower(p.username) = lower(trim(p_uname))
   limit 1;
$$;
grant execute on function public.email_for_username(text) to anon, authenticated;
