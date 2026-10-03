import { test } from "node:test";
import assert from "node:assert/strict";
import { CITIES, DAYS, MAP_BOUNDS, ORDER } from "../src/core/data.js";
import { cityIdForAct, cityIdForCoords, inBounds } from "../src/domain/places.js";
import { cityStayDates, dayPinPoints, defaultCityDay, daysForCity, hotelsOnMap, ideasOf, placesOnMap, stayForDay, stayGroups, stopsOnMap } from "../src/domain/trip.js";
import { dayToISO, findTripDayByISO } from "../src/core/dates.js";
import { photoSlug } from "../src/domain/photos.js";
import { loadTripData } from "./helpers.js";

loadTripData();

test("chaque jour du voyage apparaît dans sa ville", () => {
  DAYS.forEach((d) => {
    assert.ok(daysForCity(d.city).some((x) => x.n === d.n), `jour ${d.n} absent de ${d.city}`);
  });
});

test("le centre de chaque ville est reconnu", () => {
  ORDER.forEach((id) => assert.equal(cityIdForCoords(CITIES[id].lat, CITIES[id].lng), id));
  assert.equal(cityIdForCoords(0, 0), null);
  assert.equal(cityIdForAct({ lat: 0, lng: 0 }, "kyoto"), "kyoto");
  assert.equal(cityIdForAct(null, "nara"), "nara");
});

test("lieux, hôtels et arrêts d’une ville sont dans son emprise", () => {
  ORDER.forEach((id) => {
    const b = MAP_BOUNDS[id];
    placesOnMap(id).forEach((a) => assert.ok(inBounds(b, a.lat, a.lng), `${a.title} hors de ${id}`));
    hotelsOnMap(id).forEach((s) => assert.ok(inBounds(b, s.hotel.lat, s.hotel.lng)));
    stopsOnMap(id).forEach((s) => assert.ok(inBounds(b, s.lat, s.lng)));
  });
  assert.ok(placesOnMap("tokyo").length > 5);
});

test("hôtel du jour et points à cadrer", () => {
  const day1 = DAYS.find((d) => d.n === 1);
  assert.equal(stayForDay("tokyo", day1).id, "tokyo-1");
  const pts = dayPinPoints("tokyo", day1);
  assert.ok(pts.length >= ideasOf(day1).filter((a) => a.lat != null).length);
});

test("séjours multiples : plages de jours (Tokyo aller / retour)", () => {
  const groups = stayGroups(CITIES.tokyo, daysForCity("tokyo"));
  assert.deepEqual(groups.map((g) => g.stay.id), ["tokyo-1", "tokyo-2"]);
  assert.ok(groups[0].days.every((d) => d.n <= 5));
  assert.ok(groups[1].days.every((d) => d.n >= 20));
  assert.equal(stayForDay("tokyo", DAYS.find((d) => d.n === 21)).id, "tokyo-2");
});

test("dates des jours ↔ ISO", () => {
  assert.equal(dayToISO({ date: "8 nov 2026" }), "2026-11-08");
  assert.equal(dayToISO({ date: "3 déc 2026" }), "2026-12-03");
  assert.equal(findTripDayByISO("2026-11-08").n, 1);
  DAYS.forEach((d) => assert.match(dayToISO(d), /^2026-11-\d\d$/));
});

test("photo d’une activité d’après son titre", () => {
  assert.equal(photoSlug({ title: "Asakusa — Sensō-ji" }), "sensoji");
  assert.equal(photoSlug({ title: "Fushimi Inari" }), "fushimi");
  assert.equal(photoSlug({ title: "xyz", slug: "custom" }), "custom");
  assert.equal(photoSlug({ title: "Lieu inconnu" }), null);
});

test("photos d’une activité : fichiers locaux avec crédit", async () => {
  const { photosFor } = await import("../src/domain/photos.js");
  const fs = await import("node:fs");
  const list = photosFor({ title: "Kiyomizu-dera" });
  assert.ok(list.length >= 2 && list.length <= 4);
  list.forEach((p) => {
    assert.ok(fs.existsSync(new URL("../" + p.src.replace("./", ""), import.meta.url)), p.src);
    assert.ok(p.credit.author && p.credit.license);
  });
  DAYS.forEach((d) => ideasOf(d).forEach((a) => assert.ok(photosFor(a).length > 0, a.title)));
});

test("un jour de voyage n’apparaît que dans les villes qu’il touche", () => {
  const withDay7 = Object.keys(CITIES).filter((id) => daysForCity(id).some((d) => d.n === 7));
  assert.deepEqual(withDay7.sort(), ["fuji", "kanazawa", "tokyo"]);
});

test("dates de séjour pour l’étiquette de la carte", () => {
  assert.equal(cityStayDates(CITIES.kyoto), "18–22 nov");
  assert.equal(cityStayDates(CITIES.tokyo), "8–12 nov · 27–29 nov");
  assert.equal(cityStayDates(CITIES.shirakawa), "17 nov");
  assert.equal(cityStayDates({ stays: [{ from: "30 oct", to: "2 nov" }] }), "30 oct–2 nov");
});

test("jour ouvert par défaut dans le panneau ville", () => {
  const kyoto = daysForCity("kyoto");
  assert.equal(defaultCityDay(kyoto, "2026-10-03", 13), 13);      // demandé
  assert.equal(defaultCityDay(kyoto, "2026-11-20", null), 13);    // aujourd’hui (20 nov = J13)
  assert.equal(defaultCityDay(kyoto, "2026-10-03", null), null);  // hors voyage → aperçu
  assert.equal(defaultCityDay(kyoto, "2026-10-03", 2), null);     // jour d’une autre ville
});

test("phrases utiles adaptées à chaque lieu", async () => {
  const { phraseContextForAct } = await import("../src/domain/classify.js");
  const { CONTEXT_PHRASES } = await import("../src/core/data.js");
  const idea = (title) => DAYS.flatMap(ideasOf).find((a) => a.title === title);
  assert.equal(phraseContextForAct(idea("Universal Studios Japan")), "park");
  assert.equal(phraseContextForAct(idea("Marché Nishiki")), "market");
  assert.equal(phraseContextForAct(idea("Cérémonie du thé")), "culture");
  assert.equal(phraseContextForAct(idea("Fushimi Inari")), "temple");
  // Chaque lieu du voyage tombe sur un contexte qui existe
  DAYS.flatMap(ideasOf).forEach((a) => assert.ok(CONTEXT_PHRASES[phraseContextForAct(a)], a.title));
});

test("vols internationaux : arrivée le 1er jour, départ le dernier", () => {
  const tokyo = daysForCity("tokyo");
  assert.equal(tokyo.find((d) => d.n === 1).moves[0].role, "arrivée");
  assert.equal(tokyo.find((d) => d.n === 22).moves[0].role, "départ");
});
