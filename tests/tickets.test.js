import { test } from "node:test";
import assert from "node:assert/strict";
import { DAYS, LEGS } from "../src/core/data.js";
import { TICKET_KINDS, ticketTimeline, validTicket } from "../src/domain/tickets.js";
import { loadTripData } from "./helpers.js";

loadTripData();

test("ticket valide", () => {
  assert.ok(validTicket({ kind: "qr", headline: "QR", steps: ["a"] }));
  assert.ok(!validTicket({ kind: "inconnu", headline: "QR", steps: ["a"] }));
  assert.ok(!validTicket({ kind: "qr", headline: "", steps: ["a"] }));
  assert.ok(!validTicket({ kind: "qr", headline: "QR", steps: [] }));
  assert.ok(!validTicket(null));
});

test("chaque trajet payé a une méthode pour montrer le billet", () => {
  LEGS.filter((l) => l.status === "paid").forEach((l) => assert.ok(validTicket(l.ticket), `ticket manquant ou invalide : ${l.id}`));
  Object.keys(TICKET_KINDS).forEach((k) => assert.ok(TICKET_KINDS[k].label && TICKET_KINDS[k].icon));
});

test("billets dans l’ordre du voyage", () => {
  const tl = ticketTimeline(DAYS, LEGS);
  assert.equal(tl.length, LEGS.length);
  for (let i = 1; i < tl.length; i++) assert.ok(tl[i - 1].day.n <= tl[i].day.n);
  assert.equal(tl[0].leg.id, "arrive");
  assert.equal(tl.at(-1).leg.id, "depart");
  assert.deepEqual(tl.filter((x) => x.day.n === 7).map((x) => x.leg.id), ["fuji-tokyo", "tokyo-kana"]);
});
