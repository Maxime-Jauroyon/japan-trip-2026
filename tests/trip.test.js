import { test } from "node:test";
import assert from "node:assert/strict";
import { CITIES, DAYS, MAP_BOUNDS, ORDER } from "../src/core/data.js";
import { cityIdForAct, cityIdForCoords, inBounds } from "../src/domain/places.js";
import { dayPinPoints, daysForCity, hotelsOnMap, ideasOf, placesOnMap, stayForDay, stayGroups, stopsOnMap } from "../src/domain/trip.js";
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
