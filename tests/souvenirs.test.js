import { test } from "node:test";
import assert from "node:assert/strict";
import { addItem, allocateRefunds, detaxeByStore, groupKey, level, parseAmount, remaining, removeItem, setNoTax, toBoth, totalsByPerson } from "../src/domain/souvenirs.js";

const P = ["Maxime", "Léo"];
const it = (id, who, eur, yen, store = "", day = "2026-11-20") => ({ id, who, eur, yen, store, day, label: id });

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

test("chaque achat compte pour son acheteur : dépassement de franchise et suppression", () => {
  let items = addItem(addItem([], it("a", "Maxime", 300, 53100)), it("b", "Maxime", 200, 35400));
  items = addItem(items, it("c", "Léo", 50, 8850));
  let t = totalsByPerson(items, P);
  assert.equal(t.Maxime.eur, 500);
  assert.equal(t.Maxime.count, 2);
  assert.equal(t.Léo.eur, 50);
  assert.equal(level(t.Maxime.eur, 430), "over");
  assert.equal(remaining(t.Maxime.eur, 430), -70);
  assert.equal(remaining(t.Léo.eur, 430), 380);
  assert.equal(totalsByPerson(removeItem(items, "a"), P).Maxime.eur, 200);
});

test("niveaux de la franchise : vert < 80 %, orange jusqu’à 430 €, rouge au-delà", () => {
  assert.equal(level(343.99, 430), "ok");
  assert.equal(level(344, 430), "warn");
  assert.equal(level(430, 430), "warn");
  assert.equal(level(430.01, 430), "over");
});

test("détaxe Japon : achats regroupés par magasin et par jour, seuil en ¥", () => {
  const items = [
    it("1", "Maxime", 10, 1800, "Don Quijote"),
    it("2", "Léo", 20, 3600, "don quijote"),
    it("3", "Maxime", 50, 8850, "Uniqlo"),
    it("4", "Maxime", 5, 900, "Don Quijote", "2026-11-21"),
    it("5", "Maxime", 5, 900, ""),
  ];
  const g = detaxeByStore(items, 5000);
  assert.equal(g.length, 3);
  const dq = g.find((x) => x.day === "2026-11-20" && x.store === "Don Quijote");
  assert.equal(dq.yen, 5400);
  assert.equal(dq.ok, true);
  assert.equal(g.find((x) => x.day === "2026-11-21").missing, 4100);
});

test("détaxe retirée : plus d’indicateur, total réduit, rétablissable, franchise inchangée", () => {
  let items = [it("1", "Maxime", 40, 7000, "Uniqlo"), it("2", "Maxime", 10, 1800, "Uniqlo")];
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
  assert.equal(totalsByPerson(items, P).Maxime.eur, 50);
  items = setNoTax(items, g.ids, false);
  assert.equal(detaxeByStore(items, 5000)[0].ok, true);
  assert.equal("noTax" in items[0], false);
});

test("détaxe reçue : répartie au prorata, plafonnée, déduite de la valeur à déclarer de l’acheteur", () => {
  const items = [
    { id: "a", who: "Maxime", eur: 40, yen: 7000, store: "Uniqlo", day: "2026-11-20" },
    { id: "b", who: "Léo", eur: 10, yen: 1750, store: "Uniqlo", day: "2026-11-20" },
    { id: "c", who: "Maxime", eur: 20, yen: 3500, store: "", day: "2026-11-20" },
  ];
  const key = "2026-11-20|uniqlo";
  assert.equal(groupKey(items[0]), key);
  assert.equal(groupKey(items[2]), null);
  const al = allocateRefunds(items, { [key]: 875 });
  assert.equal(Math.round(al.a), 700);
  assert.equal(Math.round(al.b), 175);
  assert.equal(al.c, undefined);
  const t = totalsByPerson(items, P, { [key]: 875 });
  assert.equal(t.Maxime.gross, 60);
  assert.equal(t.Maxime.eur, 56);
  assert.equal(t.Maxime.refund, 4);
  assert.equal(t.Léo.eur, 9);
  // plafond : jamais plus que le total du groupe ; sans remboursement, rien ne change
  assert.equal(Math.round(allocateRefunds(items, { [key]: 99999 }).a), 7000);
  assert.equal(totalsByPerson(items, P).Maxime.eur, 60);
  // un achat sans détaxe (noTax) ne reçoit rien
  const noTax = items.map((x) => (x.id === "b" ? { ...x, noTax: true } : x));
  assert.equal(allocateRefunds(noTax, { [key]: 700 }).b, undefined);
});
