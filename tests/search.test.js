import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize, searchIndex } from "../src/domain/search.js";

test("normalisation sans accents", () => {
  assert.equal(normalize("Kōfuku-ji"), "kofuku ji");
  assert.equal(normalize("Château d’Osaka"), "chateau dosaka");
  assert.equal(normalize("  Sensō-ji  "), "senso ji");
});

test("recherche : début de mot, tous les mots, titre d’abord", () => {
  const items = [
    { title: "Marché Nishiki", sub: "Jour 15 · Kyoto" },
    { title: "Kinkaku-ji", sub: "Jour 13 · Kyoto", keywords: "pavillon d’or" },
    { title: "Kyoto Tower", sub: "Kyoto" },
    { title: "Fushimi Inari", sub: "Jour 14 · Kyoto" }
  ];
  assert.deepEqual(searchIndex(items, "kyo").map((x) => x.title)[0], "Kyoto Tower");
  assert.deepEqual(searchIndex(items, "marche").map((x) => x.title), ["Marché Nishiki"]);
  assert.deepEqual(searchIndex(items, "pavillon").map((x) => x.title), ["Kinkaku-ji"]);
  assert.deepEqual(searchIndex(items, "inari kyoto").map((x) => x.title), ["Fushimi Inari"]);
  assert.deepEqual(searchIndex(items, "nari"), []);   // pas au milieu d’un mot
  assert.deepEqual(searchIndex(items, "  "), []);
});
