import { test } from "node:test";
import assert from "node:assert/strict";
import { computeScore, goalFor, distance, verdict } from "./scoring.js";

test("computeScore: reached + sum of unused numbers", () => {
  // reached 800, slots [100,75,8,3,50,25], used the 100 and 8 -> unused = 75+3+50+25 = 153
  const slotValues = [100, 75, 8, 3, 50, 25];
  const slotUsed = [true, false, true, false, false, false];
  assert.equal(computeScore({ reached: 800, slotUsed, slotValues }), 800 + 153);
});

test("computeScore: null reached counts as 0", () => {
  assert.equal(computeScore({ reached: null, slotUsed: [false], slotValues: [42] }), 42);
  assert.equal(computeScore({ reached: undefined, slotUsed: [true], slotValues: [42] }), 0);
});

test("computeScore: all used -> just the reached value", () => {
  const slotValues = [1, 2, 3, 4, 5, 6];
  const slotUsed = [true, true, true, true, true, true];
  assert.equal(computeScore({ reached: 421, slotUsed, slotValues }), 421);
});

test("computeScore: ignores null slot values", () => {
  assert.equal(computeScore({ reached: 10, slotUsed: [false, false], slotValues: [5, null] }), 15);
});

test("goalFor: 0 when target used, else the target", () => {
  assert.equal(goalFor({ targetUsed: true, target: 421 }), 0);
  assert.equal(goalFor({ targetUsed: false, target: 421 }), 421);
});

test("distance is absolute", () => {
  assert.equal(distance(430, 421), 9);
  assert.equal(distance(410, 421), 11);
  assert.equal(distance(421, 421), 0);
});

test("verdict: closer to goal wins", () => {
  assert.equal(verdict({ distance: 0, timeSec: 90 }, { distance: 5, timeSec: 10 }), "win");
  assert.equal(verdict({ distance: 8, timeSec: 10 }, { distance: 3, timeSec: 99 }), "lose");
});

test("verdict: equal distance -> faster time wins", () => {
  assert.equal(verdict({ distance: 4, timeSec: 30 }, { distance: 4, timeSec: 45 }), "win");
  assert.equal(verdict({ distance: 4, timeSec: 50 }, { distance: 4, timeSec: 45 }), "lose");
});

test("verdict: equal distance and (rounded) time -> tie", () => {
  assert.equal(verdict({ distance: 0, timeSec: 30.1 }, { distance: 0, timeSec: 30.4 }), "tie");
});
