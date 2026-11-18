import { test } from "node:test";
import assert from "node:assert/strict";
import { addItem, detaxeByStore, level, parseAmount, remaining, removeItem, setCarrier, setNoTax, toBoth, totalsByPerson } from "../src/domain/souvenirs.js";

const P = ["Maxime", "Léo"];
const it = (id, who, carrier, eur, yen, store = "", day = "2026-11-20") => ({ id, who, carrier, eur, yen, store, day, label: id });

test("montant saisi : virgule décimale, vide et négatif refusés", () => {
  assert.equal(parseAmount("12,5"), 12.5);
  assert.equal(parseAmount(" 3 000 "), 3000);
  assert.equal(parseAmount(""), null);
  assert.equal(parseAmount("abc"), null);
  assert.equal(parseAmount("-4"), null);
});

test("saisie en ¥ ou en € : l’autre devise est convertie, la saisie reste exacte", () => {
  assert.deepEqual(toBoth(5000, "yen", 177), { yen: 5000, eur: 28.25 });
  assert.deepEqual(toBoth(30, "eur", 177), { eur: 30, yen: 5310 });
  assert.equal(toBoth(10, "eur", 0), null);
});

test("seul le porteur compte : changer de porteur fait baisser l’un et monter l’autre", () => {
  let items = addItem(addItem([], it("a", "Maxime", "Maxime", 300, 53100)), it("b", "Maxime", "Maxime", 200, 35400));
  let t = totalsByPerson(items, P);
  assert.equal(t.Maxime.eur, 500);
  assert.equal(level(t.Maxime.eur, 430), "over");
  assert.equal(remaining(t.Maxime.eur, 430), -70);
  items = setCarrier(items, "b", "Léo");
  t = totalsByPerson(items, P);
  assert.equal(t.Maxime.eur, 300);
  assert.equal(t.Léo.eur, 200);
  assert.equal(t.Maxime.away, 1);
  assert.equal(remaining(t.Léo.eur, 430), 230);
  assert.equal(totalsByPerson(removeItem(items, "a"), P).Maxime.eur, 0);
});

test("niveaux de la franchise : vert < 80 %, orange jusqu’à 430 €, rouge au-delà", () => {
  assert.equal(level(343.99, 430), "ok");
  assert.equal(level(344, 430), "warn");
  assert.equal(level(430, 430), "warn");
  assert.equal(level(430.01, 430), "over");
});

test("détaxe Japon : achats regroupés par magasin et par jour, seuil en ¥", () => {
  const items = [
    it("1", "Maxime", "Maxime", 10, 1800, "Don Quijote"),
    it("2", "Léo", "Léo", 20, 3600, "don quijote"),
    it("3", "Maxime", "Maxime", 50, 8850, "Uniqlo"),
    it("4", "Maxime", "Maxime", 5, 900, "Don Quijote", "2026-11-21"),
    it("5", "Maxime", "Maxime", 5, 900, ""),
  ];
  const g = detaxeByStore(items, 5000);
  assert.equal(g.length, 3);
  const dq = g.find((x) => x.day === "2026-11-20" && x.store === "Don Quijote");
  assert.equal(dq.yen, 5400);
  assert.equal(dq.ok, true);
  assert.equal(g.find((x) => x.day === "2026-11-21").missing, 4100);
});

test("détaxe retirée : plus d’indicateur, total réduit, rétablissable, franchise inchangée", () => {
  let items = [it("1", "Maxime", "Maxime", 40, 7000, "Uniqlo"), it("2", "Maxime", "Léo", 10, 1800, "Uniqlo")];
  let g = detaxeByStore(items, 5000)[0];
  assert.equal(g.ok, true);
  assert.deepEqual(g.ids, ["1", "2"]);
  items = setNoTax(items, ["1"], true);
  g = detaxeByStore(items, 5000)[0];
  assert.equal(g.ok, false);
  assert.equal(g.removed, false);
  assert.equal(g.yen, 1800);
  items = setNoTax(items, g.ids, true);
  g = detaxeByStore(items, 5000)[0];
  assert.equal(g.removed, true);
  assert.equal(g.ok, false);
  assert.equal(totalsByPerson(items, P).Maxime.eur, 40);
  items = setNoTax(items, g.ids, false);
  assert.equal(detaxeByStore(items, 5000)[0].ok, true);
  assert.equal("noTax" in items[0], false);
});
