import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DAYS, SOUNDS } from "../src/core/data.js";
import { ideasOf } from "../src/domain/trip.js";
import { soundFamily, soundFor } from "../src/domain/sounds.js";
import { loadTripData } from "./helpers.js";

loadTripData();

test("chaque activité a une ambiance sonore avec crédit et fichier présent", () => {
  DAYS.forEach((d) => ideasOf(d).forEach((a) => {
    const s = soundFor(a.title);
    assert.ok(s, `pas d’ambiance pour « ${a.title} »`);
    assert.ok(s.author && s.license, `crédit manquant pour ${s.id}`);
    assert.ok(fs.existsSync(new URL("../" + s.file.replace("./", ""), import.meta.url)), `fichier ${s.file} introuvable`);
  }));
});

test("la famille d’ambiance suit le type d’activité", () => {
  assert.equal(soundFamily("Sanctuaire Meiji"), "temple");
  assert.equal(soundFamily("Zōjō-ji — grand temple"), "temple");
  assert.equal(soundFamily("Akihabara"), "arcade");
  assert.equal(soundFamily("teamLab Planets"), "eau");
  assert.equal(soundFamily("Jardins Est du Palais impérial"), "nature");
  assert.equal(soundFamily("Shibuya — Parco"), "ville");
  assert.equal(soundFamily(""), "ville");
  assert.ok(Object.keys(SOUNDS.families).length >= 5);
});
