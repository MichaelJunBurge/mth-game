import { test } from "node:test";
import assert from "node:assert/strict";
import { SLOT_COUNT, freshLargeBag, freshSmallBag, randInt } from "./numbers.js";

test("SLOT_COUNT is 6", () => {
  assert.equal(SLOT_COUNT, 6);
});

test("large bag = multiples of 5 from 20..100, distinct", () => {
  const bag = freshLargeBag();
  assert.deepEqual(bag, [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]);
  assert.equal(new Set(bag).size, bag.length);
});

test("small bag = 1..10, distinct", () => {
  const bag = freshSmallBag();
  assert.deepEqual(bag, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(new Set(bag).size, bag.length);
});

test("randInt is inclusive on both ends and stays in range", () => {
  assert.equal(randInt(5, 5), 5); // single-value range
  assert.equal(randInt(0, 9, () => 0), 0); // rng=0 -> min
  assert.equal(randInt(0, 9, () => 0.9999999), 9); // rng->1 -> max
  for (let i = 0; i < 500; i++) {
    const n = randInt(1, 10);
    assert.ok(n >= 1 && n <= 10 && Number.isInteger(n));
  }
});

test("randInt accepts an injected (seedable) rng without changing the formula", () => {
  // A deterministic sequence proves reproducibility for future daily challenges.
  let i = 0;
  const seq = [0, 0.5, 0.99];
  const rng = () => seq[i++];
  assert.equal(randInt(1, 10, rng), 1);
  assert.equal(randInt(1, 10, rng), 6);
  assert.equal(randInt(1, 10, rng), 10);
});
