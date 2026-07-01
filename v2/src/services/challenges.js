// Async challenges: a shared puzzle persisted so attempts can be tracked. A
// signed-in share creates a challenge row (link = ?c=<id>); anyone can open it
// (public read) and, if signed in, their finish is recorded as an attempt.
import { supabase } from "./supabase.js";
import { getSession, getUsername } from "./auth.js";

const ALPHA = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function genId() {
  let s = "";
  for (let i = 0; i < 8; i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)];
  return s;
}

// Persist a puzzle (the same payload the ?g= link carries). Returns the id or null.
export async function createChallenge(payload) {
  const s = await getSession();
  if (!s) return null;
  const id = genId();
  const { error } = await supabase.from("challenges").insert({
    id, creator: s.user.id, creator_username: await getUsername(), payload,
  });
  return error ? null : id;
}

// Fetch a challenge by id (public read — the receiver may be signed out).
export async function getChallenge(id) {
  const { data, error } = await supabase.from("challenges").select("*").eq("id", id).maybeSingle();
  return error ? null : data;
}

// Record (or replace) my attempt at a challenge.
export async function recordAttempt(challengeId, r) {
  const s = await getSession();
  if (!s) return;
  await supabase.from("challenge_attempts").upsert({
    challenge_id: challengeId, user_id: s.user.id, username: await getUsername(),
    solved: !!r.solved, score: r.score, distance: r.distance, goal: r.goal,
    time_sec: r.timeSec, working: r.working || [],
  }, { onConflict: "challenge_id,user_id" });
}

// Challenges I created, newest first, each with its attempts (creator can read them).
export async function listSent() {
  const s = await getSession();
  if (!s) return [];
  const { data: challs } = await supabase.from("challenges")
    .select("*").eq("creator", s.user.id).order("created_at", { ascending: false }).limit(40);
  if (!challs || !challs.length) return [];
  const { data: atts } = await supabase.from("challenge_attempts")
    .select("*").in("challenge_id", challs.map((c) => c.id)).order("created_at", { ascending: false });
  const byChall = new Map();
  (atts || []).forEach((a) => {
    if (!byChall.has(a.challenge_id)) byChall.set(a.challenge_id, []);
    byChall.get(a.challenge_id).push(a);
  });
  return challs.map((c) => ({ ...c, attempts: byChall.get(c.id) || [] }));
}

// Challenges others made that I've attempted (my attempt + the challenge/creator).
export async function listPlayed() {
  const s = await getSession();
  if (!s) return [];
  const { data: mine } = await supabase.from("challenge_attempts")
    .select("*").eq("user_id", s.user.id).order("created_at", { ascending: false }).limit(40);
  if (!mine || !mine.length) return [];
  const ids = [...new Set(mine.map((a) => a.challenge_id))];
  const { data: challs } = await supabase.from("challenges").select("*").in("id", ids);
  const byId = new Map((challs || []).map((c) => [c.id, c]));
  return mine.filter((a) => byId.get(a.challenge_id) && byId.get(a.challenge_id).creator !== s.user.id)
    .map((a) => ({ attempt: a, challenge: byId.get(a.challenge_id) }));
}
