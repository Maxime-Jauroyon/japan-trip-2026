import { test } from "node:test";
import assert from "node:assert/strict";
import { applyJournal, collectPhotos, doneItems, likedBy, setLike, dayScore, livePhotos, thumbName, emptyDay, extrasOf, mergeDay, newExtraId, nextStatus, plannedId, sameDay, sanitizeDay, statusOfPlanned, upsertItem } from "../src/domain/journal.js";

test("id d’une idée : stable, sans accents ni ponctuation", () => {
  assert.equal(plannedId("Asakusa — Sensō-ji"), "p:asakusa-senso-ji");
  assert.match(newExtraId(1000, 0.5), /^x:/);
  assert.notEqual(newExtraId(1000, 0.1), newExtraId(1000, 0.9));
});

test("statut : à faire → fait → pas fait → à faire", () => {
  assert.equal(nextStatus("todo"), "done");
  assert.equal(nextStatus("done"), "skipped");
  assert.equal(nextStatus("skipped"), "todo");
  assert.equal(statusOfPlanned(emptyDay(), "Kinkaku-ji"), "todo");
});

test("fusion : le plus récent gagne, les photos s’additionnent, rien n’est perdu", () => {
  const base = { kind: "planned", title: "Kinkaku-ji" };
  const a = upsertItem(emptyDay(), plannedId("Kinkaku-ji"), base, { status: "done", photos: ["a.jpg"] }, 100);
  const b = upsertItem(emptyDay(), plannedId("Kinkaku-ji"), base, { status: "skipped", photos: ["b.jpg"] }, 200);
  const x = upsertItem(a, newExtraId(5, 0.2), { kind: "extra", title: "Karaoké" }, { status: "done" }, 150);
  const m = mergeDay(x, b);
  assert.equal(m.items[plannedId("Kinkaku-ji")].status, "skipped");
  assert.deepEqual(m.items[plannedId("Kinkaku-ji")].photos.sort(), ["a.jpg", "b.jpg"]);
  assert.equal(Object.keys(m.items).length, 2);
  assert.ok(sameDay(mergeDay(m, b), m));
  assert.ok(!sameDay(m, b));
});

test("suppression d’un ajout : il disparaît des extras mais la fusion garde le tombstone", () => {
  const id = newExtraId(1, 0.3);
  const d1 = upsertItem(emptyDay(), id, { kind: "extra", title: "Pachinko" }, { status: "done" }, 10);
  const d2 = upsertItem(d1, id, {}, { deleted: true }, 20);
  assert.equal(extrasOf(d1).length, 1);
  assert.equal(extrasOf(mergeDay(d1, d2)).length, 0);
});

test("vue effective et score du jour", () => {
  const planned = [{ title: "Fushimi Inari" }, { title: "Daigo-ji" }, { title: "Chemin des Philosophes", fixed: true }];
  let day = upsertItem(emptyDay(), plannedId("Fushimi Inari"), { kind: "planned", title: "Fushimi Inari" }, { status: "done" }, 1);
  day = upsertItem(day, plannedId("Daigo-ji"), { kind: "planned", title: "Daigo-ji" }, { status: "skipped" }, 2);
  day = upsertItem(day, newExtraId(3, 0.1), { kind: "extra", title: "Ramen de minuit", time: "22:30" }, { status: "done" }, 3);
  const v = applyJournal(planned, day);
  assert.deepEqual(v.planned.map((p) => p.status), ["done", "skipped", "todo"]);
  assert.equal(v.planned[2].fixed, true);
  assert.deepEqual(dayScore(v), { done: 2, total: 3 });
});

test("jour illisible : nettoyé sans planter", () => {
  assert.deepEqual(sanitizeDay(null), { items: {} });
  const d = sanitizeDay({ items: { "p:a": { title: "A", status: "n’importe quoi", at: "7" }, bad: { title: "B" }, "x:1": 3 } });
  assert.deepEqual(Object.keys(d.items), ["p:a"]);
  assert.equal(d.items["p:a"].status, "todo");
});

test("photos : retirer une photo la retire partout, la miniature suit le nom", () => {
  const id = plannedId("Fushimi Inari");
  const a = upsertItem(emptyDay(), id, { kind: "planned", title: "Fushimi Inari" }, { photos: ["a.jpg", "b.jpg"] }, 1);
  const b = upsertItem(a, id, {}, { gone: ["a.jpg"] }, 2);
  const m = mergeDay(a, b);
  assert.deepEqual(livePhotos(m.items[id]), ["b.jpg"]);
  assert.equal(thumbName("b.jpg"), "b.t.jpg");
  assert.deepEqual(collectPhotos([["2026-11-21", m]]), [{ iso: "2026-11-21", id, title: "Fushimi Inari", name: "b.jpg" }]);
  assert.deepEqual(sanitizeDay({ items: { "p:a": { title: "A", photos: ["ok.jpg", "../evil", 3] } } }).items["p:a"].photos, ["ok.jpg"]);
});

test("page famille : idées faites, ajouts et éléments avec photos ; pas les idées écartées", () => {
  let day = upsertItem(emptyDay(), plannedId("A"), { kind: "planned", title: "A" }, { status: "done" }, 1);
  day = upsertItem(day, plannedId("B"), { kind: "planned", title: "B" }, { status: "skipped" }, 2);
  day = upsertItem(day, plannedId("C"), { kind: "planned", title: "C" }, { status: "todo", photos: ["c.jpg"] }, 3);
  day = upsertItem(day, newExtraId(9, 0.1), { kind: "extra", title: "Ramen", time: "20:00" }, { status: "done" }, 4);
  assert.deepEqual(doneItems(day).map((i) => i.title), ["Ramen", "A", "C"]);
});

test("❤️ : chacun aime / retire, la fusion garde l’action la plus récente de chaque personne", () => {
  const id = newExtraId(1, 0.1);
  const base = upsertItem(emptyDay(), id, { kind: "extra", title: "Ramen" }, { status: "done" }, 5);
  const a = setLike(setLike(base, id, "Maxime", true, 10), id, "Maxime", false, 30);   // aimé puis retiré
  const b = setLike(setLike(base, id, "Maxime", true, 20), id, "Léo", true, 25);
  const m = mergeDay(a, b);
  assert.deepEqual(likedBy(m.items[id]), ["Léo"]);
  assert.equal(m.items[id].at, 5);   // un cœur ne réécrit pas le reste de l’item
  assert.deepEqual(sanitizeDay({ items: { "x:1": { title: "A", likes: { Léo: 5, Bad: "x" } } } }).items["x:1"].likes, { Léo: 5 });
});
