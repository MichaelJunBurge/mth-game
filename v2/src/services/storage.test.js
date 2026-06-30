import { test } from "node:test";
import assert from "node:assert/strict";
import { storage } from "./storage.js";

// Minimal in-memory localStorage mock installed on globalThis.
function mockStorage({ throwOn } = {}) {
  const map = new Map();
  globalThis.localStorage = {
    getItem(k) { if (throwOn === "get") throw new Error("blocked"); return map.has(k) ? map.get(k) : null; },
    setItem(k, v) { if (throwOn === "set") throw new Error("quota"); map.set(k, String(v)); },
    removeItem(k) { if (throwOn === "remove") throw new Error("blocked"); map.delete(k); },
  };
  return map;
}

test("get/set/remove round-trip", () => {
  mockStorage();
  storage.set("k", "v");
  assert.equal(storage.get("k"), "v");
  storage.remove("k");
  assert.equal(storage.get("k"), null);
});

test("getJSON/setJSON round-trip", () => {
  mockStorage();
  storage.setJSON("g", { a: 1, b: [2, 3] });
  assert.deepEqual(storage.getJSON("g"), { a: 1, b: [2, 3] });
});

test("getJSON returns null on missing / malformed", () => {
  const map = mockStorage();
  assert.equal(storage.getJSON("missing"), null);
  map.set("bad", "{not json");
  assert.equal(storage.getJSON("bad"), null);
});

test("swallows storage exceptions (private mode / quota)", () => {
  mockStorage({ throwOn: "set" });
  assert.doesNotThrow(() => storage.set("k", "v"));
  mockStorage({ throwOn: "get" });
  assert.equal(storage.get("k"), null);
  mockStorage({ throwOn: "remove" });
  assert.doesNotThrow(() => storage.remove("k"));
});

test("setJSON swallows exceptions too", () => {
  mockStorage({ throwOn: "set" });
  assert.doesNotThrow(() => storage.setJSON("k", { x: 1 }));
});
