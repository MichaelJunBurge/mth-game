-- Account color: each profile picks a display color (a hex like #3b82f6, or NULL
-- for none). Shown for their username in the profile menu, leaderboards, groups,
-- etc. A "color vision" toggle client-side can hide everyone else's color.
alter table public.profiles add column if not exists color text;

-- Set my own color (NULL clears it). Only ever touches my row.
create or replace function public.set_my_color(p_color text)
returns void language sql security definer set search_path = public as $$
  update public.profiles set color = p_color where id = auth.uid();
$$;

-- Colors for a set of usernames (only those who set one). Small, cacheable.
create or replace function public.profile_colors(p_names text[])
returns table (username text, color text)
language sql security definer set search_path = public as $$
  select username, color from public.profiles
   where username = any(p_names) and color is not null;
$$;

grant execute on function public.set_my_color(text)      to authenticated;
grant execute on function public.profile_colors(text[])  to authenticated;
