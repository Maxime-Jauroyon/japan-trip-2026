import { test } from "node:test";
import assert from "node:assert/strict";
import { FADE_FAMILY_S, FADE_TRACK_S, crossfadeStart, equalPowerGains, familiesAhead, gainAt, nextTrackIndex, rampCurve, shouldCrossfade, trimCache } from "../src/domain/music.js";

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test("fondu enchaîné : la puissance totale reste constante (pas de creux ni de bosse)", () => {
  for (let i = 0; i <= 20; i++) {
    const g = equalPowerGains(i / 20);
    near(g.out * g.out + g.in * g.in, 1);
  }
  near(equalPowerGains(0).out, 1); near(equalPowerGains(0).in, 0);
  near(equalPowerGains(1).out, 0); near(equalPowerGains(1).in, 1);
  near(equalPowerGains(-3).in, 0); near(equalPowerGains(9).in, 1);   // borné
});

test("rampe : de `from` à `to`, montée et descente monotones, bornes exactes", () => {
  const up = { from: 0, to: 0.5, t0: 10, dur: 2.5 };
  near(gainAt(up, 9), 0); near(gainAt(up, 10), 0); near(gainAt(up, 12.5), 0.5); near(gainAt(up, 99), 0.5);
  const down = { from: 0.5, to: 0, t0: 10, dur: 2.5 };
  near(gainAt(down, 9), 0.5); near(gainAt(down, 12.5), 0);
  let prev = -1;
  for (let t = 10; t <= 12.5; t += 0.25) { const g = gainAt(up, t); assert.ok(g >= prev); prev = g; }
  prev = 2;
  for (let t = 10; t <= 12.5; t += 0.25) { const g = gainAt(down, t); assert.ok(g <= prev); prev = g; }
  assert.equal(gainAt(null, 5), 0);
  near(gainAt({ from: 0.2, to: 0.7, t0: 5, dur: 0 }, 5), 0.7);   // durée nulle : tout de suite à `to`
});

test("deux rampes croisées (sortante + entrante) gardent une puissance constante", () => {
  const out = { from: 0.6, to: 0, t0: 0, dur: 4 }, inn = { from: 0, to: 0.6, t0: 0, dur: 4 };
  for (let t = 0; t <= 4; t += 0.4) near(gainAt(out, t) ** 2 + gainAt(inn, t) ** 2, 0.36, 1e-9);
});

test("courbe de fondu : bonne longueur, bons points de départ et d’arrivée", () => {
  const c = rampCurve(0.2, 0.8, 32);
  assert.equal(c.length, 32);
  near(c[0], 0.2); near(c[31], 0.8);
  assert.equal(rampCurve(0, 1, 1).length, 2);
  assert.ok(c.every((v, i) => i === 0 || v >= c[i - 1]));
});

test("playlist : circulaire, sans sortir des bornes", () => {
  assert.equal(nextTrackIndex(0, 3), 1);
  assert.equal(nextTrackIndex(2, 3), 0);
  assert.equal(nextTrackIndex(0, 1), 0);
  assert.equal(nextTrackIndex(5, 0), 0);
});

test("le morceau suivant démarre assez tôt pour recouvrir la fin du courant", () => {
  assert.equal(crossfadeStart(75, FADE_TRACK_S), 71);
  assert.equal(crossfadeStart(3, FADE_TRACK_S), 0);
  assert.ok(FADE_FAMILY_S > 0 && FADE_TRACK_S > FADE_FAMILY_S);
});

test("même famille : la musique continue ; autre famille : fondu enchaîné", () => {
  assert.equal(shouldCrossfade("temple", "temple"), false);
  assert.equal(shouldCrossfade("temple", "arcade"), true);
  assert.equal(shouldCrossfade(null, "ville"), true);
  assert.equal(shouldCrossfade("ville", null), false);
});

test("préchargement : les prochaines familles, sans doublon ni la famille en cours", () => {
  const fam = (t) => ({ A: "temple", B: "temple", C: "arcade", D: "ville", E: "arcade", F: "nature" })[t] || null;
  const slides = "ABCDEF".split("").map((title) => ({ title }));
  assert.deepEqual(familiesAhead(slides, 0, fam), ["arcade", "ville"]);
  assert.deepEqual(familiesAhead(slides, 2, fam, 3), ["ville", "nature"]);
  assert.deepEqual(familiesAhead(slides, 5, fam), []);
  assert.deepEqual(familiesAhead([], 0, fam), []);
});

test("mémoire des morceaux décodés : au plus `max`, les plus anciens partent d’abord, jamais ceux en cours", () => {
  const m = new Map([["a", 1], ["b", 2], ["c", 3], ["d", 4], ["e", 5]]);
  assert.deepEqual(trimCache(m, 3, ["a"]), ["b", "c"]);
  assert.deepEqual([...m.keys()], ["a", "d", "e"]);
  assert.deepEqual(trimCache(m, 5), []);
});
