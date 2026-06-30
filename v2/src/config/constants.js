// Single source of truth for cross-cutting constants. DOM-free.

// Local-storage keys. All version-suffixed so v1 and v2 (same origin) never
// collide. NOTE: the theme key + dark colour are also hard-coded in the inline
// boot <script> in index.html (it runs before this module can load) — keep them
// in sync with THEME_BG / THEME_KEY below.
export const SAVE_KEY = "numbersRound.save.v2";
export const THEME_KEY = "numbersRound.theme.v2";
export const AUTOEQ_KEY = "numbersRound.autoeq.v2";
export const AUTOSIGN_KEY = "numbersRound.autosign.v2";
export const LANG_KEY = "numbersRound.lang.v2";
export const MODE_KEY = "numbersRound.mode.v2";

// The timed budget: the green ring's full lap, in seconds (2:00).
export const TIMED_SEC = 120;

// Most calculator pages allowed per puzzle.
export const MAX_CALCS = 8;

// Theme background colours — must match the --bg CSS variables (light/dark) and
// the inline boot script's theme-color value.
export const THEME_BG = { light: "#ffffff", dark: "#14161a" };
