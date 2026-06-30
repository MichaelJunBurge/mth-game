import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSnapshot, normalizeSnapshot, normalizeCalcPage } from "./gameState.js";

const liveSample = {
  phase: "play",
  currentTarget: 421,
  slotValues: [100, 75, 8, 3, 50, 25],
  calcPages: [{ expr: "100x8", lineSum: 800, hasLineEntry: true, available: [], slotUsed: [true, false, true, false, false, false], history: ["100x8"], undoStack: [{ big: "drop me" }], lastResult: 800, tapeOpen: false }],
  padStrokes: [[{ x: 0.1, y: 0.2 }]],
  pageIndex: 1,
  lastOutcome: { solved: false, timeSec: 30, score: 953, goal: 421, distance: 532 },
  sharedGame: null,
  practiceGame: false,
  borderDurationSec: 120,
  startEpoch: 1700000000000,
  largeBag: [20, 25],
  smallBag: [1, 2],
  shareCode: "abc",
  introDraws: [{ i: 0, t: 1600 }, { i: 1, t: 2000 }],
};

test("buildSnapshot keeps the fields and strips calc-page undo stacks", () => {
  const snap = buildSnapshot(liveSample);
  assert.equal(snap.phase, "play");
  assert.equal(snap.currentTarget, 421);
  assert.deepEqual(snap.slotValues, [100, 75, 8, 3, 50, 25]);
  assert.deepEqual(snap.calcPages[0].undoStack, []); // stripped
  assert.equal(snap.calcPages[0].lineSum, 800);
  assert.deepEqual(snap.introDraws, [{ i: 0, t: 1600 }, { i: 1, t: 2000 }]);
});

test("buildSnapshot slices slotValues (no shared reference)", () => {
  const snap = buildSnapshot(liveSample);
  snap.slotValues[0] = 999;
  assert.equal(liveSample.slotValues[0], 100); // original untouched
});

test("normalizeSnapshot returns null for non-restorable input", () => {
  assert.equal(normalizeSnapshot(null), null);
  assert.equal(normalizeSnapshot({}), null);
  assert.equal(normalizeSnapshot({ currentTarget: null }), null);
});

test("normalizeSnapshot round-trips a built snapshot", () => {
  const norm = normalizeSnapshot(buildSnapshot(liveSample));
  assert.equal(norm.currentTarget, 421);
  assert.deepEqual(norm.slotValues, [100, 75, 8, 3, 50, 25]);
  assert.equal(norm.calcPages[0].lineSum, 800);
  assert.deepEqual(norm.calcPages[0].undoStack, []);
  assert.deepEqual(norm.introDraws, [{ i: 0, t: 1600 }, { i: 1, t: 2000 }]);
  assert.equal(norm.pageIndex, 1);
});

test("normalizeSnapshot applies defaults for missing/old fields", () => {
  const norm = normalizeSnapshot({ currentTarget: 642 });
  assert.deepEqual(norm.slotValues, [null, null, null, null, null, null]);
  assert.equal(norm.largeBag, null);
  assert.deepEqual(norm.introDraws, []);
  assert.equal(norm.lastOutcome, null);
  assert.equal(norm.sharedGame, null);
  assert.equal(norm.practiceGame, false);
  assert.deepEqual(norm.calcPages, []);
  assert.deepEqual(norm.padStrokes, []);
  assert.equal(norm.pageIndex, 1); // default
});

test("normalizeSnapshot pads short slotValues to SLOT_COUNT", () => {
  const norm = normalizeSnapshot({ currentTarget: 1, slotValues: [5, 6] });
  assert.equal(norm.slotValues.length, 6);
  assert.deepEqual(norm.slotValues, [5, 6, null, null, null, null]);
});

test("normalizeCalcPage fills defaults and drops undo", () => {
  const p = normalizeCalcPage({ expr: undefined, available: undefined, undoStack: [1, 2, 3] });
  assert.equal(p.expr, "");
  assert.equal(p.lineSum, null);
  assert.deepEqual(p.available, []);
  assert.deepEqual(p.undoStack, []);
  assert.equal(p.tapeOpen, false);
});
