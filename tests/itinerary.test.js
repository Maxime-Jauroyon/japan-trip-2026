import { test } from "node:test";
import assert from "node:assert/strict";
import { DAYS, MAP_BOUNDS } from "../src/core/data.js";
import { distanceKm, dayItinerary, formatDistance, formatMinutes, itinerarySummary, nextStop, segmentEstimate } from "../src/domain/itinerary.js";
import { inBounds } from "../src/domain/places.js";
import { bowedSegment } from "../src/map/geo.js";
import { loadTripData } from "./helpers.js";

loadTripData();
const day = (n) => DAYS.find((d) => d.n === n);

test("journée classique : hôtel → activités dans l’ordre → hôtel", () => {
  const it = dayItinerary("kyoto", day(12));
  assert.equal(it[0].kind, "hotel");
  assert.equal(it.at(-1).kind, "hotel");
  assert.deepEqual(it.filter((s) => s.kind === "activity").map((s) => s.step), [1, 2, 3]);
});

test("jour d’arrivée : départ de la gare ; jour de départ : fin à la gare", () => {
  assert.equal(dayItinerary("kanazawa", day(7))[0].kind, "station");
  assert.equal(dayItinerary("nara", day(16)).at(-1).kind, "station");
});

test("toutes les étapes sont dans la ville et sans doublon consécutif", () => {
  DAYS.forEach((d) => [d.city, d.extraCity].filter(Boolean).forEach((c) => {
    const it = dayItinerary(c, d);
    it.forEach((s) => assert.ok(inBounds(MAP_BOUNDS[c], s.lat, s.lng), `J${d.n} ${c} ${s.title}`));
    for (let i = 1; i < it.length; i++) assert.ok(it[i].lat !== it[i - 1].lat || it[i].lng !== it[i - 1].lng);
  }));
});

test("estimations : à pied si proche, transports sinon", () => {
  const a = { lat: 35.0, lng: 135.75 };
  assert.ok(Math.abs(distanceKm(a, { lat: 35.009, lng: 135.75 }) - 1.0) < 0.01);
  assert.equal(segmentEstimate(a, { lat: 35.005, lng: 135.75 }).mode, "walk");
  assert.equal(segmentEstimate(a, { lat: 35.05, lng: 135.75 }).mode, "transit");
  const s = itinerarySummary(dayItinerary("kyoto", day(12)));
  assert.equal(s.activities, 3);
  assert.ok(s.km > 0 && s.minutes >= 5);
});

test("tronçon courbé : commence et finit sur les étapes", () => {
  const a = { lat: 35.0, lng: 135.75 }, b = { lat: 35.01, lng: 135.77 };
  const seg = bowedSegment(a, b);
  assert.ok(Math.abs(seg.coords[0][0] - a.lng) < 1e-9 && Math.abs(seg.coords.at(-1)[1] - b.lat) < 1e-9);
  assert.equal(seg.mid.length, 2);
});

test("ordre des idées optimisé : aucun autre ordre ne gagne 5 min de trajet ou plus", () => {
  const cost = (a, b) => { const km = distanceKm(a, b) * 1.3; return km <= 2.2 ? km / 4.5 * 60 : 10 + km / 24 * 60; };
  const perms = (a) => a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
  DAYS.forEach((d) => [d.city, d.extraCity].filter(Boolean).forEach((c) => {
    const it = dayItinerary(c, d);
    const acts = it.filter((s) => s.kind === "activity");
    if (acts.length < 2) return;
    const start = it[0].kind !== "activity" ? it[0] : null, end = it.at(-1).kind !== "activity" ? it.at(-1) : null;
    const total = (p) => [start, ...p, end].filter(Boolean).reduce((t, s, i, all) => (i ? t + cost(all[i - 1], s) : 0), 0);
    const best = Math.min(...perms(acts).map(total));
    assert.ok(total(acts) - best < 5, `J${d.n} ${c} : ${Math.round(total(acts))} min, optimum ${Math.round(best)} min`);
  }));
});

test("prochaine étape du jour et formats", () => {
  const stops = [
    { kind: "hotel", title: "Hôtel" },
    { kind: "activity", title: "A" },
    { kind: "activity", title: "B" },
    { kind: "hotel", title: "Hôtel" }
  ];
  assert.equal(nextStop(stops, new Set()).stop.title, "A");
  assert.equal(nextStop(stops, new Set()).from.title, "Hôtel");
  const n = nextStop(stops, new Set(["A"]));
  assert.equal(n.stop.title, "B");
  assert.equal(n.from.title, "A");
  assert.equal(nextStop(stops, new Set(["A", "B"])), null);
  assert.equal(formatDistance(0.83), "850 m");
  assert.equal(formatDistance(3.24), "3,2 km");
  assert.equal(formatMinutes(65), "1 h 05");
});
