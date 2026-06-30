// Thin localStorage wrapper: swallows the exceptions that storage can throw
// (private mode, quota, disabled) so callers don't each need a try/catch. This
// is also the seam where a cloud-sync backend (Supabase) slots in later.

export const storage = {
  get(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  },
  // Convenience for JSON payloads (the saved game).
  getJSON(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  },
  setJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  },
};
