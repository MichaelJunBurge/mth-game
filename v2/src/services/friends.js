// Friends: username lookup, requests, accept/decline, remove. Profile data stays
// private (RLS) until a request is accepted; lookup + relationship listing go
// through security-definer RPCs that only expose id + username.
import { supabase } from "./supabase.js";
import { getSession } from "./auth.js";

// Prefix search by username (excludes yourself). Returns [{ id, username }].
export async function searchUsers(q) {
  q = String(q).trim().toLowerCase();
  if (!q) return [];
  const { data, error } = await supabase.rpc("search_users", { q });
  return error ? [] : (data || []);
}

// All my relationships (accepted + pending, both directions) with usernames.
// Returns [{ friendship_id, other_id, username, status, direction }].
export async function listFriendships() {
  const { data, error } = await supabase.rpc("my_friendships");
  return error ? [] : (data || []);
}

export async function sendRequest(otherId) {
  const s = await getSession();
  if (!s) return { ok: false };
  const { error } = await supabase.from("friendships").insert({ requester: s.user.id, addressee: otherId });
  return { ok: !error, error: error && error.message };
}

// Accept an incoming request (RLS only lets the addressee set 'accepted').
export async function acceptRequest(friendshipId) {
  const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
  return { ok: !error };
}

// Remove a friend, decline an incoming request, or cancel an outgoing one — all
// a delete (RLS lets either side delete).
export async function removeFriendship(friendshipId) {
  const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
  return { ok: !error };
}
