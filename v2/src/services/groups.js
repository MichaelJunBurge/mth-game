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
