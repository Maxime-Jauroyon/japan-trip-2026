import { test } from "node:test";
import assert from "node:assert/strict";
import { LEGS } from "../src/core/data.js";
import { bookingOpenStatus, collectPrepReminders } from "../src/domain/bookings.js";
import { pinKind, stopPinKind } from "../src/domain/classify.js";
import { legEndPoint, legRouteParts, legsInJourney, legVehicleKind } from "../src/domain/legs.js";
import { loadTripData } from "./helpers.js";

loadTripData();

test("type de véhicule selon le mode", () => {
  assert.equal(legVehicleKind("Avion"), "plane");
  assert.equal(legVehicleKind("Shinkansen Hokuriku"), "shinkansen");
  assert.equal(legVehicleKind("Bus"), "bus");
  assert.equal(legVehicleKind("Train Hida"), "train");
  assert.equal(legVehicleKind("Correspondance"), "transfer");
  assert.equal(legVehicleKind("Métro Ginza"), "metro");
});

test("segments carte et extrémités des trajets", () => {
  LEGS.filter((l) => !l.skipMap).forEach((l) => {
    const parts = legRouteParts(l);
    assert.ok(parts.length >= 1);
    parts.forEach((p) => assert.equal(p.legId, l.id));
  });
  const tf = LEGS.find((l) => l.id === "tokyo-fuji");
  assert.equal(legEndPoint(tf, "from").cityId, "tokyo");
  assert.equal(legEndPoint(tf, "to").cityId, "fuji");
  assert.deepEqual(legsInJourney("fuji-kana").map((l) => l.id), ["fuji-tokyo", "tokyo-kana"]);
});

test("statut d’ouverture des réservations", () => {
  assert.equal(bookingOpenStatus({ openFrom: "2000-01-01" }, { status: "placeholder" }).key, "bookable");
  assert.equal(bookingOpenStatus({ openFrom: "2099-01-01" }, { status: "placeholder" }).key, "wait");
  assert.equal(bookingOpenStatus({ openFrom: "2000-01-01" }, { status: "paid" }).key, "reserved");
  assert.equal(bookingOpenStatus({ optional: true }, null).key, "optional");
});

test("rappels : une case cochée disparaît", () => {
  const all = collectPrepReminders({});
  if (!all.length) return;
  const first = all[0];
  assert.ok(!collectPrepReminders({ [first.id]: true }).some((r) => r.id === first.id));
});

test("icônes de pins", () => {
  assert.equal(pinKind("Sanctuaire Meiji"), "torii");
  assert.equal(pinKind("Marché Nishiki"), "market");
  assert.equal(stopPinKind({ kind: "Aéroport", name: "Haneda" }), "plane");
  assert.equal(stopPinKind({ kind: "Gare / terminal bus", name: "Shinjuku" }), "bus");
});
