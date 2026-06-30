// Pure number-pool logic for the six drawn numbers. No DOM, no globals — safe to
// unit-test and (later) reuse server-side for daily-challenge generation.

export const SLOT_COUNT = 6;

// The "large" pool: multiples of five from 20..100, one of each (no duplicates).
export function freshLargeBag() {
  const bag = [];
  for (let n = 20; n <= 100; n += 5) bag.push(n);
  return bag;
}

// The "small" pool: 1..10, one of each — so all six drawn numbers are distinct.
export function freshSmallBag() {
  const bag = [];
  for (let n = 1; n <= 10; n++) bag.push(n);
  return bag;
}

// Inclusive integer in [min, max]. `rng` defaults to Math.random; injecting a
// seeded generator later (daily challenges) keeps draws reproducible without
// changing today's behavior.
export function randInt(min, max, rng = Math.random) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
