import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DAYS, SOUNDS } from "../src/core/data.js";
import { ideasOf } from "../src/domain/trip.js";
import { soundFamily, soundFor } from "../src/domain/sounds.js";
import { loadTripData } from "./helpers.js";

loadTripData();

test("chaque activité a une famille de musique : au moins 2 morceaux, fichiers présents, crédits complets", () => {
  DAYS.forEach((d) => ideasOf(d).forEach((a) => {
    const s = soundFor(a.title);
    assert.ok(s, `pas de musique pour « ${a.title} »`);
    assert.ok(s.tracks.length >= 2, `${s.id} : playlist trop courte`);
    s.tracks.forEach((t) => {
      assert.ok(t.title && t.author && t.license && t.source, `crédit manquant pour ${t.file}`);
      assert.ok(fs.existsSync(new URL("../" + t.file.replace("./", ""), import.meta.url)), `fichier ${t.file} introuvable`);
      assert.ok(t.seconds >= 60, `${t.file} : extrait trop court`);
      assert.ok(!/NC|ND/.test(t.license), `${t.file} : licence incompatible`);
    });
  }));
});

test("la famille de musique suit le type d’activité", () => {
  assert.equal(soundFamily("Sanctuaire Meiji"), "temple");
  assert.equal(soundFamily("Zōjō-ji — grand temple"), "temple");
  assert.equal(soundFamily("Akihabara"), "arcade");
  assert.equal(soundFamily("Baseball — batting center Active AKIBA"), "arcade");
  assert.equal(soundFamily("teamLab Planets"), "eau");
  assert.equal(soundFamily("Jardins Est du Palais impérial"), "nature");
  assert.equal(soundFamily("Ryōgoku — Edo-Tokyo Museum"), "musee");
  assert.equal(soundFamily("Ueno — Tokyo National Museum & sanctuaire Tōshō-gū"), "musee");
  assert.equal(soundFamily("Shinjuku — mairie de Tokyo, observatoire gratuit"), "nuit");
  assert.equal(soundFamily("Sumida de nuit — pont Azuma-bashi & Skytree"), "nuit");
  assert.equal(soundFamily("Shibuya — Parco"), "ville");
  assert.equal(soundFamily("Tokyo Tower"), "ville");
  assert.equal(soundFamily(""), "ville");
  assert.ok(Object.keys(SOUNDS.families).length >= 7);
});
