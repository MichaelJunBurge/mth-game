// Challenge-link format: encode/decode the shared-game payload and parse a link's
// query into raw data. DOM-free. (The payload-building from live state and the
// applying of it stay in index.html.)

import { SLOT_COUNT } from "../core/numbers.js";

// base64 of a UTF-8 JSON payload (the escape/unescape dance keeps non-ASCII safe).
export function encodeGame(payload) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}
export function decodeGame(code) {
  return JSON.parse(decodeURIComponent(escape(atob(code))));
}

// Parse a share link's query string into { data, code }:
//   - modern  ?g=<base64>      -> { data: <decoded>, code: <the base64> }
//   - legacy  ?t=<n>&n=a,b,..  -> { data: { t, n }, code: null }
//   - neither / malformed      -> { data: null, code: null }
// `code` is returned (only for a valid ?g=) so the caller can remember it for
// refresh-restore. Validation beyond basic shape is left to the caller.
export function parseShareParams(search) {
  const p = new URLSearchParams(search);
  const g = p.get("g");
  if (g) {
    try { return { data: decodeGame(g), code: g }; } catch (e) { /* fall through */ }
  }
  const t = parseInt(p.get("t"), 10);
  const nRaw = p.get("n");
  if (!isNaN(t) && nRaw) {
    const nums = nRaw.split(",").map((s) => parseInt(s, 10));
    if (nums.length === SLOT_COUNT && !nums.some(isNaN)) return { data: { t, n: nums }, code: null };
  }
  return { data: null, code: null };
}
