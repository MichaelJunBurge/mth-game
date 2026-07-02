// Groups: create, membership, and a shared board of challenges (a group leaderboard
// per posted puzzle). All access goes through SECURITY DEFINER RPCs that enforce
// membership, so the tables stay locked down and RLS never recurses.
import { supabase } from "./supabase.js";

const ALPHA = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function genId() { let s = ""; for (let i = 0; i < 8; i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)]; return s; }

export async function createGroup(name) {
  const { data, error } = await supabase.rpc("create_group", { p_id: genId(), p_name: name || "" });
  return error ? null : data;
}
export async function listGroups() {
  const { data, error } = await supabase.rpc("my_groups");
  return error ? [] : (data || []);
}
export async function listMembers(gid) {
  const { data, error } = await supabase.rpc("group_members_list", { p_gid: gid });
  return error ? [] : (data || []);
}
export async function addMember(gid, uid) {
  const { error } = await supabase.rpc("add_group_member", { p_gid: gid, p_uid: uid });
  return { ok: !error };
}
export async function leaveGroup(gid) {
  const { error } = await supabase.rpc("leave_group", { p_gid: gid });
  return { ok: !error };
}
export async function shareToGroup(gid, cid) {
  const { error } = await supabase.rpc("share_to_group", { p_gid: gid, p_cid: cid });
  return { ok: !error };
}
// Challenges posted to a group, each with its ranked attempts (the leaderboard).
export async function groupBoard(gid) {
  const { data, error } = await supabase.rpc("group_board", { p_gid: gid });
  return error ? [] : (data || []);
}

// ---- Groups phase 2 (needs v2/sql/groups-v2.sql run in Supabase) ----
// These degrade gracefully (empty / can-send) if the RPCs aren't there yet.

// Invite a user — they join as 'pending' until they accept.
export async function inviteMember(gid, uid) {
  const { error } = await supabase.rpc("invite_group_member", { p_gid: gid, p_uid: uid });
  return { ok: !error };
}
// Pending group invites for me (for the accept/decline notification).
export async function listInvites() {
  const { data, error } = await supabase.rpc("my_group_invites");
  return error ? [] : (data || []);
}
export async function respondInvite(gid, accept) {
  const { error } = await supabase.rpc("respond_group_invite", { p_gid: gid, p_accept: !!accept });
  return { ok: !error };
}
// Whether I can send a game to this group right now, and when my active one frees up.
export async function sendStatus(gid) {
  const { data, error } = await supabase.rpc("group_send_status", { p_gid: gid });
  if (error) return { can_send: true, active_expires: null };
  const row = Array.isArray(data) ? data[0] : data;
  return row || { can_send: true, active_expires: null };
}
// Send a game (challenge id) to a group; enforced one-active-per-member server-side.
export async function sendGame(gid, cid) {
  const { error } = await supabase.rpc("send_group_game", { p_gid: gid, p_cid: cid });
  return { ok: !error, error: error ? error.message : null };
}
// Within-group standings: per member points/wins + trophy flags (fastest / most_correct).
export async function standings(gid) {
  const { data, error } = await supabase.rpc("group_standings", { p_gid: gid });
  return error ? [] : (data || []);
}
// Each member's GLOBAL ranked points (for the within-group ↔ global toggle).
export async function standingsGlobal(gid) {
  const { data, error } = await supabase.rpc("group_standings_global", { p_gid: gid });
  return error ? [] : (data || []);
}
// Every game sent to a group: sender, 24h status, whether I've played it, + ranked scoreboard.
export async function games(gid) {
  const { data, error } = await supabase.rpc("group_games", { p_gid: gid });
  return error ? [] : (data || []);
}
