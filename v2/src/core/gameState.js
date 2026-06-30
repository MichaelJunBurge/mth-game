// The serializable saved-game model — DOM-free, so it can be unit-tested and
// (later) synced to the cloud. index.html owns the live globals + DOM; this
// module owns the SHAPE of a save and the parsing/validation of one.

import { SLOT_COUNT } from "./numbers.js";

// Normalize one calculator page to its canonical shape (drops the undo history,
// which is never persisted). Reused for every page in a save.
export function normalizeCalcPage(c) {
  return {
    expr: c.expr || "",
    lineSum: c.lineSum == null ? null : c.lineSum,
    hasLineEntry: !!c.hasLineEntry,
    available: (c.available || []).map((e) => ({
      value: e.value, slotIndex: e.slotIndex, isTarget: e.isTarget, tentative: !!e.tentative,
    })),
    slotUsed: (c.slotUsed || []).slice(),
    history: (c.history || []).slice(),
    undoStack: [],
    lastResult: c.lastResult == null ? null : c.lastResult,
    tapeOpen: !!c.tapeOpen,
  };
}

// Build the save snapshot from the live game values (the object passed in mirrors
// the relevant globals). Calc pages drop their undo stacks.
export function buildSnapshot(live) {
  return {
    phase: live.phase,
    currentTarget: live.currentTarget,
    slotValues: live.slotValues.slice(),
    calcPages: (live.calcPages || []).map((c) => Object.assign({}, c, { undoStack: [] })),
    padStrokes: live.padStrokes,
    pageIndex: live.pageIndex,
    lastOutcome: live.lastOutcome,
    sharedGame: live.sharedGame,
    practiceGame: live.practiceGame,
    borderDurationSec: live.borderDurationSec,
    startEpoch: live.startEpoch,
    largeBag: live.largeBag,
    smallBag: live.smallBag,
    shareCode: live.shareCode,
    introDraws: live.introDraws,
  };
}

// Parse/validate a raw loaded snapshot into a clean state object (DOM-free).
// Returns null when it isn't a restorable game. The caller applies the result to
// the globals + DOM; nothing here touches the DOM.
export function normalizeSnapshot(raw) {
  if (!raw || raw.currentTarget == null) return null;
  const slotValues = new Array(SLOT_COUNT).fill(null);
  if (Array.isArray(raw.slotValues)) {
    for (let i = 0; i < SLOT_COUNT; i++) slotValues[i] = raw.slotValues[i] == null ? null : raw.slotValues[i];
  }
  return {
    phase: raw.phase,
    currentTarget: raw.currentTarget,
    slotValues,
    largeBag: Array.isArray(raw.largeBag) ? raw.largeBag.slice() : null,
    smallBag: Array.isArray(raw.smallBag) ? raw.smallBag.slice() : null,
    introDraws: Array.isArray(raw.introDraws) ? raw.introDraws.map((d) => ({ i: d.i, t: d.t })) : [],
    lastOutcome: raw.lastOutcome || null,
    sharedGame: raw.sharedGame || null,
    practiceGame: !!raw.practiceGame,
    startEpoch: raw.startEpoch || null,
    shareCode: raw.shareCode || null,
    calcPages: (raw.calcPages || []).map(normalizeCalcPage),
    padStrokes: Array.isArray(raw.padStrokes) ? raw.padStrokes : [],
    pageIndex: raw.pageIndex == null ? 1 : raw.pageIndex,
  };
}
