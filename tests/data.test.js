import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { CITIES, CITY_ZONES, JOURNEYS, LEGS, MAP_BOUNDS, MARK_LABELS, ORDER } from "../src/core/data.js";
import { loadTripData, ROOT } from "./helpers.js";

const raw = loadTripData();

test("l’ordre des villes suit data/cities.json", () => {
  assert.deepEqual(ORDER, raw.cities.cities.map((c) => c.id));
  ORDER.forEach((id) => {
    assert.equal(CITIES[id].id, id);
    assert.deepEqual(MAP_BOUNDS[id], CITIES[id].map.bounds);
    assert.ok(MARK_LABELS[id].side);
  });
});

test("les références { city } des trajets pointent vers l’objet ville", () => {
  const arrive = LEGS.find((l) => l.id === "arrive");
  assert.equal(arrive.to, CITIES.tokyo);
  const depart = LEGS.find((l) => l.id === "depart");
  assert.equal(depart.from, CITIES.tokyo);
});

test("index des journeys et zones", () => {
  assert.ok(JOURNEYS["fuji-kana"]);
  assert.ok(CITY_ZONES.tokyo.length > 0);
});

test("scripts/validate-data.mjs accepte les données", () => {
  const out = execFileSync(process.execPath, [path.join(ROOT, "scripts/validate-data.mjs")], { encoding: "utf8" });
  assert.match(out, /données valides/);
});
