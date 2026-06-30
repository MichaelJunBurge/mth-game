import { test } from "node:test";
import assert from "node:assert/strict";
import { evalExpression } from "./evaluate.js";

test("empty expression", () => {
  assert.deepEqual(evalExpression(""), { status: "empty" });
});

test("basic operators (x ÷ + - ^)", () => {
  assert.deepEqual(evalExpression("100x8"), { status: "ok", closed: "100x8", value: 800 });
  assert.deepEqual(evalExpression("10÷2"), { status: "ok", closed: "10÷2", value: 5 });
  assert.deepEqual(evalExpression("50+25"), { status: "ok", closed: "50+25", value: 75 });
  assert.deepEqual(evalExpression("9-4"), { status: "ok", closed: "9-4", value: 5 });
  assert.deepEqual(evalExpression("2^3"), { status: "ok", closed: "2^3", value: 8 });
});

test("square root: perfect square is ok, non-perfect is a fraction", () => {
  assert.deepEqual(evalExpression("√(25)"), { status: "ok", closed: "√(25)", value: 5 });
  assert.equal(evalExpression("√(2)").status, "fraction");
});

test("fractions are rejected with the rounded value", () => {
  assert.deepEqual(evalExpression("10÷3"), { status: "fraction", closed: "10÷3", value: 3.333333 });
  assert.equal(evalExpression("7÷2").value, 3.5);
});

test("float noise rounds to a whole number (treated as ok)", () => {
  // e.g. operations that should be integers but carry FP error
  assert.equal(evalExpression("0.1+0.2+0.7").status, "ok"); // 1
  assert.equal(evalExpression("0.1+0.2+0.7").value, 1);
});

test("auto-closes unclosed brackets and reports the closed form", () => {
  assert.deepEqual(evalExpression("(10+2"), { status: "ok", closed: "(10+2)", value: 12 });
  assert.deepEqual(evalExpression("(3x(4+1"), { status: "ok", closed: "(3x(4+1))", value: 15 });
});

test("bad characters are invalid (and not auto-closed)", () => {
  const r = evalExpression("10&2");
  assert.equal(r.status, "invalid");
  assert.equal(r.closed, undefined);
});

test("eval failure / non-finite is invalid", () => {
  assert.equal(evalExpression("5÷0").status, "invalid"); // Infinity
  assert.equal(evalExpression("(").status, "invalid");   // syntax error after auto-close
});

test("operator precedence matches JS", () => {
  assert.equal(evalExpression("2+3x4").value, 14);
  assert.equal(evalExpression("(2+3)x4").value, 20);
});
