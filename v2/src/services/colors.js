// Account colors: a per-profile display color, shown for that user's username
// wherever it appears. Needs v2/sql/account-color.sql run in Supabase; degrades
// to "no colors" if the RPCs aren't there yet.
import { supabase } from "./supabase.js";
import { getSession } from "./auth.js";

// Set (or clear, with null) my own color.
export async function setColor(color) {
  const { error } = await supabase.rpc("set_my_color", { p_color: color || null });
  return { ok: !error };
}

// My current color (null if none / signed out).
export async function myColor() {
  const s = await getSession();
  if (!s) return null;
  const { data } = await supabase.from("profiles").select("color").eq("id", s.user.id).maybeSingle();
  return data ? (data.color || null) : null;
}

// Map of username -> color for the given usernames (only those who set one).
export async function colorsFor(names) {
  const uniq = [...new Set((names || []).filter(Boolean))];
  if (!uniq.length) return {};
  const { data, error } = await supabase.rpc("profile_colors", { p_names: uniq });
  if (error) return {};
  const map = {};
  (data || []).forEach((r) => { map[r.username] = r.color; });
  return map;
}
