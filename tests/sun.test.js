import { test } from "node:test";
import assert from "node:assert/strict";
import { fmtClock, sunTimes } from "../src/domain/sun.js";

const near = (actual, expected, tol = 3) => assert.ok(Math.abs(actual - expected) <= tol, `${fmtClock(actual)} ≠ ${fmtClock(expected)}`);

test("lever / coucher du soleil (heure du Japon)", () => {
  const tokyo = sunTimes(35.68, 139.77, "2026-11-08");
  near(tokyo.rise, 6 * 60 + 9);     // 6 h 09
  near(tokyo.set, 16 * 60 + 40);    // 16 h 40
  const kyoto = sunTimes(35.01, 135.77, "2026-11-20");
  near(kyoto.set, 16 * 60 + 49);
  assert.equal(sunTimes(NaN, 0, "2026-11-08"), null);
});

test("format horaire", () => {
  assert.equal(fmtClock(16 * 60 + 5), "16 h 05");
  assert.equal(fmtClock(6 * 60 + 9.6), "6 h 10");
});
