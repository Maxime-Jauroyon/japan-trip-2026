import { test } from "node:test";
import assert from "node:assert/strict";
import { dayTag, lastMoment, newSince, routeSteps, tripProgress } from "../src/domain/carnet-live.js";

const days = [
  { n: 1, iso: "2026-11-08", city: "tokyo" }, { n: 2, iso: "2026-11-09", city: "tokyo" },
  { n: 3, iso: "2026-11-10", city: "fuji" }, { n: 4, iso: "2026-11-11", city: "kanazawa" }
];

test("avancement du voyage : avant, pendant, après", () => {
  assert.deepEqual(tripProgress(days, "2026-11-05"), { status: "before", n: 0, total: 4, pct: 0, cityId: "tokyo", until: 3 });
  const mid = tripProgress(days, "2026-11-10");
  assert.equal(mid.status, "during"); assert.equal(mid.n, 3); assert.equal(mid.pct, 75); assert.equal(mid.cityId, "fuji");
  assert.equal(tripProgress(days, "2026-11-20").status, "after");
  assert.equal(tripProgress([], "2026-11-10").total, 0);
});

test("étapes : villes dans l’ordre avec leur état", () => {
  const r = routeSteps(days, 3);
  assert.deepEqual(r.map((s) => s.cityId + ":" + s.state), ["tokyo:done", "fuji:now", "kanazawa:next"]);
  assert.deepEqual(routeSteps(days, 0).map((s) => s.state), ["next", "next", "next"]);
});

test("dernier moment et nouveautés", () => {
  const model = [
    { iso: "2026-11-09", items: [{ id: "p:a", title: "A", when: 100, at: 100, photos: ["a.jpg"] }] },
    { iso: "2026-11-10", items: [{ id: "p:b", title: "B", when: 200, at: 900, photos: ["b1.jpg", "b2.jpg"] }, { id: "p:c", title: "C", when: 300, at: 400, photos: [] }] }
  ];
  assert.equal(lastMoment(model).id, "p:c");
  assert.equal(lastMoment([]), null);
  const n = newSince(model, 350);
  assert.equal(n.moments, 2); assert.equal(n.photos, 2); assert.equal(n.first, "2026-11-10|p:b"); assert.ok(n.keys.has("2026-11-10|p:b"));
  assert.equal(newSince(model, 0).moments, 0);       // première visite : rien n’est « nouveau »
  assert.equal(newSince(model, 5000).moments, 0);
});

test("repère du jour", () => {
  assert.equal(dayTag("2026-11-15", "2026-11-15"), "Aujourd’hui");
  assert.equal(dayTag("2026-11-14", "2026-11-15"), "Hier");
  assert.equal(dayTag("2026-11-10", "2026-11-15"), "");
});
