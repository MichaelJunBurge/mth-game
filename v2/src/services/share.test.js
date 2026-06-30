import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeGame, decodeGame, parseShareParams } from "./share.js";

const payload = {
  t: 421, n: [100, 75, 8, 3, 50, 25], s: 38, pr: 1, w: ["100x8"],
  intro: [{ i: 0, t: 1600 }], o: { solved: true, timeSec: 38, score: 421 },
};

test("encode/decode round-trips a payload", () => {
  assert.deepEqual(decodeGame(encodeGame(payload)), payload);
});

test("encode handles non-ASCII (Korean working strings)", () => {
  const p = { w: ["목표 421", "100x8 = 800"] };
  assert.deepEqual(decodeGame(encodeGame(p)), p);
});

test("parseShareParams reads the modern ?g= form and returns the code", () => {
  const code = encodeGame(payload);
  const r = parseShareParams("?g=" + code);
  assert.deepEqual(r.data, payload);
  assert.equal(r.code, code);
});

test("parseShareParams reads the legacy ?t=&n= form (code null)", () => {
  const r = parseShareParams("?t=642&n=100,50,9,7,25,75");
  assert.deepEqual(r.data, { t: 642, n: [100, 50, 9, 7, 25, 75] });
  assert.equal(r.code, null);
});

test("parseShareParams: legacy form needs exactly six valid numbers", () => {
  assert.equal(parseShareParams("?t=642&n=1,2,3").data, null);       // too few
  assert.equal(parseShareParams("?t=642&n=1,2,3,4,5,x").data, null); // NaN
  assert.equal(parseShareParams("?t=abc&n=1,2,3,4,5,6").data, null); // bad target
});

test("parseShareParams returns nulls for malformed / empty", () => {
  assert.deepEqual(parseShareParams("?g=not-valid-base64!!!"), { data: null, code: null });
  assert.deepEqual(parseShareParams(""), { data: null, code: null });
});
