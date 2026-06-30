import { test } from "node:test";
import assert from "node:assert/strict";
import { I18N, t, setLang, getLang } from "./i18n.js";

test("defaults to English", () => {
  setLang("en");
  assert.equal(getLang(), "en");
  assert.equal(t("menu.home"), "Home");
});

test("setLang switches language", () => {
  setLang("ko");
  assert.equal(t("menu.home"), "홈");
  setLang("en"); // reset for other tests
});

test("falls back to English then the key for missing entries", () => {
  setLang("ko");
  // a key present in both
  assert.equal(typeof t("win.youWin"), "string");
  // an unknown key returns itself
  assert.equal(t("nonexistent.key"), "nonexistent.key");
  setLang("en");
});

test("substitutes {placeholders} from vars", () => {
  setLang("en");
  assert.equal(t("beat", { x: "00:38" }), "Beat 00:38");
  assert.equal(t("win.score", { s: 953, d: 532, g: 421 }), "953 · 532 from 421");
  assert.equal(t("win.bangOn", { g: 642 }), "Bang on 642");
});

test("leaves unknown placeholders intact", () => {
  setLang("en");
  assert.equal(t("beat", {}), "Beat {x}");
});

test("en and ko have the same keys (no missing translations)", () => {
  const enKeys = Object.keys(I18N.en).sort();
  const koKeys = Object.keys(I18N.ko).sort();
  assert.deepEqual(koKeys, enKeys);
});

test("array entries (overview/rules/walk) are parallel length in both langs", () => {
  for (const key of ["overview", "rules", "walk"]) {
    assert.ok(Array.isArray(I18N.en[key]));
    assert.equal(I18N.ko[key].length, I18N.en[key].length, `${key} length mismatch`);
  }
});
