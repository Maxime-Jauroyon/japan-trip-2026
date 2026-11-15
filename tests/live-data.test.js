import { test } from "node:test";
import assert from "node:assert/strict";
import { agoLabel, isFresh, parseFxRate } from "../src/domain/live-data.js";

test("taux de change : lecture des deux API, valeurs aberrantes refusées", () => {
  assert.equal(parseFxRate({ base: "EUR", rates: { JPY: 176.83 } }), 176.83);
  assert.equal(parseFxRate({ result: "success", rates: { JPY: 176.317002 } }), 176.32);
  assert.equal(parseFxRate({ result: "error", rates: { JPY: 176 } }), null);
  assert.equal(parseFxRate({ rates: { JPY: 1.76 } }), null);
  assert.equal(parseFxRate({ rates: {} }), null);
  assert.equal(parseFxRate(null), null);
});

test("fraîcheur et ancienneté lisible", () => {
  const now = 1_000_000_000;
  assert.ok(isFresh(now - 60_000, now, 120_000));
  assert.ok(!isFresh(now - 200_000, now, 120_000));
  assert.ok(!isFresh(0, now, 120_000));
  assert.ok(!isFresh(now + 5000, now, 120_000));   // horloge en avance : pas frais
  assert.equal(agoLabel(now - 30_000, now), "à l’instant");
  assert.equal(agoLabel(now - 10 * 60_000, now), "il y a 10 min");
  assert.equal(agoLabel(now - 3 * 3600_000, now), "il y a 3 h");
  assert.equal(agoLabel(now - 50 * 3600_000, now), "il y a 2 j");
});
