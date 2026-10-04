import { test } from "node:test";
import assert from "node:assert/strict";
import { LEGS } from "../src/core/data.js";
import { bookingOpenStatus, collectPrepReminders, collectTodos, todoDueLabel } from "../src/domain/bookings.js";
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

test("à faire : urgence et tri", () => {
  const today = new Date(2026, 9, 3);
  const todos = collectTodos({}, new Set(), today);
  // tâche cochée dans les données (billets USJ achetés) : jamais dans les alertes
  assert.ok(!todos.some((t) => t.id === "usj-tickets"));
  assert.equal(todos.find((t) => t.id === "fujiq-tickets").urgency, "soon");
  // passé la date de rappel : en retard
  const late = collectTodos({}, new Set(), new Date(2026, 9, 22)).find((t) => t.id === "fujiq-tickets");
  assert.equal(late.urgency, "late");
  assert.equal(todoDueLabel(late), "En retard · depuis 9 j");
  // trié : retards d’abord
  const rank = { late: 0, now: 1, soon: 2 };
  for (let i = 1; i < todos.length; i++) assert.ok(rank[todos[i - 1].urgency] <= rank[todos[i].urgency]);
  // fait = disparaît (case cochée, réservation marquée)
  assert.ok(!collectTodos({ "fujiq-tickets": true }, new Set(), today).some((t) => t.id === "fujiq-tickets"));
  assert.ok(!collectTodos({}, new Set(["tokyo-fuji:0"]), today).some((t) => t.id === "tokyo-fuji:0"));
  // le jour même : « now », pas « late »
  assert.equal(collectTodos({}, new Set(), new Date(2026, 9, 13)).find((t) => t.id === "fujiq-tickets").urgency, "now");
});
