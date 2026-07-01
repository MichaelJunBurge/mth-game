// Stats: record ranked game results and read them back for the profile view.
// Practice/shared games aren't recorded in detail — only a total-games counter is
// bumped for own games. Ranked games get a full granular row so any future view
// (buckets, trends, per-category times) can be derived without re-instrumenting.
import { supabase } from "./supabase.js";
import { getSession } from "./auth.js";

// Called at the end of every OWN game. Always bumps the total-games counter;
// ranked games additionally store a detailed result row. No-op when signed out.
export async function recordGame(r) {
  const s = await getSession();
  if (!s) return;
  await supabase.rpc("bump_games_played");
  if (!r.ranked) return;
  await supabase.from("game_results").insert({
    user_id: s.user.id,
    distance: Math.max(0, Math.round(r.distance)),
    solved: !!r.solved,
    time_sec: r.timeSec,
    target: r.target ?? null,
    goal: r.goal ?? null,
    score: r.score ?? null,
  });
}

// Everything the profile needs: the total-games counter + every ranked row
// (oldest → newest, so trends read left-to-right). Aggregation happens in the UI.
export async function getStats() {
  const s = await getSession();
  if (!s) return null;
  const [prof, res] = await Promise.all([
    supabase.from("profiles").select("games_played").eq("id", s.user.id).maybeSingle(),
    supabase.from("game_results")
      .select("distance, solved, time_sec, created_at")
      .eq("user_id", s.user.id)
      .order("created_at", { ascending: true }),
  ]);
  return { totalPlayed: (prof.data && prof.data.games_played) || 0, ranked: res.data || [] };
}

// The global ranked standings (top players by points) + my own id to highlight me.
export async function getLeaderboard() {
  const s = await getSession();
  const { data, error } = await supabase.rpc("ranked_leaderboard");
  return { rows: error ? [] : (data || []), me: s ? s.user.id : null };
}
