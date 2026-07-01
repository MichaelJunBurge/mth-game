// Auth + profile helpers on top of the Supabase client. DOM-free; index.html
// owns the UI. "Log in / sign up" is one action: sign in if the account exists,
// otherwise create it. Only the browser imports this (via supabase.js); the Node
// test runner never does.
import { supabase } from "./supabase.js";

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}

// Subscribe to sign-in / sign-out. Returns the subscription (has .unsubscribe()).
export function onAuth(cb) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return data.subscription;
}

export async function signOut() { await supabase.auth.signOut(); }

// Account settings.
export async function changeEmail(email) {
  const { error } = await supabase.auth.updateUser({ email: String(email).trim() });
  return { ok: !error, message: error ? error.message : null };
}
export async function changePassword(password) {
  const { error } = await supabase.auth.updateUser({ password });
  return { ok: !error, message: error ? error.message : null };
}
export async function resetAccount() {
  const { error } = await supabase.rpc("reset_my_account");
  return { ok: !error, message: error ? error.message : null };
}
export async function deleteAccount() {
  const { error } = await supabase.rpc("delete_my_account");
  if (!error) await supabase.auth.signOut();
  return { ok: !error, message: error ? error.message : null };
}

// Resolve a login identifier to an email: emails pass through; a username is looked
// up (needs username-login.sql). Returns null if a username has no account.
export async function resolveLoginEmail(identifier) {
  const id = String(identifier).trim();
  if (id.includes("@")) return id;
  const { data, error } = await supabase.rpc("email_for_username", { p_uname: id });
  return error ? null : (data || null);
}

// One button for both: try to sign in; if the account doesn't exist, create it.
// Returns { status }:
//   "signedin"     — logged in (session active)
//   "confirm"      — account created but email confirmation is required first
//   "wrongpassword"— the email exists but the password was wrong
//   "error"        — something else (message included)
export async function loginOrSignup(email, password) {
  email = String(email).trim();
  const si = await supabase.auth.signInWithPassword({ email, password });
  if (!si.error) return { status: "signedin" };

  const msg = (si.error.message || "").toLowerCase();
  // Only fall through to sign-up when the credentials were rejected (account may
  // not exist). Other errors (rate limit, network) surface as-is.
  if (!msg.includes("invalid login credentials")) return { status: "error", message: si.error.message };

  const su = await supabase.auth.signUp({ email, password });
  if (su.error) {
    const m = (su.error.message || "").toLowerCase();
    if (m.includes("already registered") || m.includes("already been registered"))
      return { status: "wrongpassword" };            // email exists -> the sign-in password was wrong
    return { status: "error", message: su.error.message };
  }
  if (su.data.session) return { status: "signedin" }; // confirmation off -> logged in immediately
  return { status: "confirm" };                       // confirmation on -> must click the email link
}

// The signed-in user's chosen username (or null if not set yet). Needs the
// `profiles` table + RLS to exist.
export async function getUsername() {
  const s = await getSession();
  if (!s) return null;
  const { data, error } = await supabase
    .from("profiles").select("username").eq("id", s.user.id).maybeSingle();
  if (error || !data) return null;
  return data.username || null;
}

// Claim a username. Lowercase, 3–20 of [a-z0-9_]. Uniqueness is enforced by a
// case-insensitive index; a clash comes back as { ok:false, taken:true }.
export async function setUsername(name) {
  const s = await getSession();
  if (!s) return { ok: false, message: "not signed in" };
  const clean = String(name).trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(clean)) return { ok: false, message: "3–20 letters, numbers or _" };
  const { error } = await supabase.from("profiles").update({ username: clean }).eq("id", s.user.id);
  if (error) {
    if (error.code === "23505") return { ok: false, taken: true, message: "that name's taken" };
    return { ok: false, message: error.message };
  }
  return { ok: true, username: clean };
}
