import { test } from "node:test";
import assert from "node:assert/strict";
import { DAY_LIKE_ID, applyJournal, dayLikedBy, heroPhoto, orderedPhotos, clockJst, collectPhotos, doneItems, likedBy, setLike, dayScore, isVideo, livePhotos, thumbName, emptyDay, extrasOf, mergeDay, newExtraId, nextStatus, plannedId, sameDay, sanitizeDay, setDayLike, statusOfPlanned, upsertItem } from "../src/domain/journal.js";

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
  assert.deepEqual(doneItems(day).map((i) => i.title).sort(), ["A", "C", "Ramen"]);
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

test("Carnet : les moments se rangent dans l’ordre vécu, pas par nombre de photos", () => {
  const iso = "2026-11-09";
  const at = (hhmm) => Date.parse(`${iso}T${hhmm}:00+09:00`);
  let day = upsertItem(emptyDay(), plannedId("Station"), { kind: "planned", title: "Station" }, { status: "done", doneAt: at("10:30"), photos: ["a.jpg", "b.jpg", "c.jpg"] }, at("23:00"));
  day = upsertItem(day, plannedId("Nakano"), { kind: "planned", title: "Nakano" }, { status: "done", doneAt: at("15:56"), photos: ["d.jpg"] }, at("23:10"));
  day = upsertItem(day, plannedId("Shinjuku"), { kind: "planned", title: "Shinjuku" }, { status: "done", doneAt: at("20:49"), photos: ["e.jpg", "f.jpg"] }, at("20:49"));
  day = upsertItem(day, newExtraId(1, 0.2), { kind: "extra", title: "Ramen", time: "13:00" }, { status: "done" }, at("22:00"));
  assert.deepEqual(doneItems(day, iso).map((i) => i.title), ["Station", "Ramen", "Nakano", "Shinjuku"]);
});

test("heures du Carnet : affichées seulement si elles sont réelles (fait à tel instant ou heure saisie)", () => {
  const iso = "2026-11-10";
  let day = upsertItem(emptyDay(), plannedId("Ueno"), { kind: "planned", title: "Ueno" }, { status: "done", doneAt: Date.parse(`${iso}T11:09:00+09:00`) }, 1);
  day = upsertItem(day, plannedId("Ancien"), { kind: "planned", title: "Ancien" }, { status: "done" }, 2);
  const items = doneItems(day, iso);
  assert.deepEqual(items.map((i) => [i.title, i.timed]), [["Ancien", false], ["Ueno", true]]);
  assert.equal(clockJst(items[1].when), "11 h 09");
});

test("photo phare d’une activité en premier, couverture du carnet = le choix le plus récent", () => {
  const id = plannedId("Meiji");
  let d1 = upsertItem(emptyDay(), id, { kind: "planned", title: "Meiji" }, { status: "done", photos: ["a.jpg", "b.jpg", "c.jpg"], cover: "c.jpg", hero: { name: "b.jpg", at: 10 } }, 1);
  assert.deepEqual(orderedPhotos(d1.items[id]), ["c.jpg", "a.jpg", "b.jpg"]);
  assert.deepEqual(doneItems(d1, "2026-11-10")[0].photos, ["c.jpg", "a.jpg", "b.jpg"]);
  const d2 = upsertItem(emptyDay(), plannedId("Ueno"), { kind: "planned", title: "Ueno" }, { status: "done", photos: ["u.jpg"], hero: { name: "u.jpg", at: 20 } }, 2);
  assert.equal(heroPhoto([["2026-11-10", d1], ["2026-11-09", d2]]).name, "u.jpg");
  d1 = upsertItem(d1, id, {}, { gone: ["c.jpg"] }, 3);   // photo phare supprimée : l’ordre normal revient
  assert.deepEqual(orderedPhotos(d1.items[id]), ["a.jpg", "b.jpg"]);
  assert.equal(heroPhoto([]), null);
  assert.equal(sanitizeDay({ items: { "p:a": { title: "A", cover: "../x", hero: { name: "ok.jpg", at: "5" } } } }).items["p:a"].hero.at, 5);
});

test("vidéos : reconnues par l’extension, miniature .t.jpg, acceptées par sanitizeDay", () => {
  assert.equal(isVideo("abc.mp4"), true);
  assert.equal(isVideo("abc.webm"), true);
  assert.equal(isVideo("abc.jpg"), false);
  assert.equal(thumbName("abc.mp4"), "abc.t.jpg");
  assert.equal(thumbName("abc.webm"), "abc.t.jpg");
  assert.equal(thumbName("abc.jpg"), "abc.t.jpg");
  const day = sanitizeDay({ items: { "p:x": { title: "X", photos: ["a.jpg", "b.mp4", "c.webm", "../d.mp4", "e.gif"], cover: "b.mp4" } } });
  assert.deepEqual(day.items["p:x"].photos, ["a.jpg", "b.mp4", "c.webm"]);
  assert.equal(day.items["p:x"].cover, "b.mp4");
  assert.deepEqual(livePhotos({ photos: ["a.jpg", "b.mp4"], gone: ["a.jpg"] }), ["b.mp4"]);
});

test("❤️ sur une journée : un seul élément spécial, un cœur par auteur, qui se fusionne entre téléphones", () => {
  let a = setDayLike(emptyDay(), "Maxime", true, 1000);
  assert.deepEqual(dayLikedBy(a), ["Maxime"]);
  assert.equal(a.items[DAY_LIKE_ID].kind, "day");
  // Léo aime depuis son téléphone, Maxime retire le sien : chacun garde le dernier mot sur son propre cœur
  const b = setDayLike(emptyDay(), "Léo", true, 2000);
  const retire = setDayLike(a, "Maxime", false, 3000);
  const merged = mergeDay(retire, b);
  assert.deepEqual(dayLikedBy(merged), ["Léo"]);
  assert.deepEqual(dayLikedBy(mergeDay(a, b)).sort(), ["Léo", "Maxime"]);
  // survit à la validation d’un fichier lu sur le réseau
  assert.deepEqual(dayLikedBy(sanitizeDay(JSON.parse(JSON.stringify(mergeDay(a, b))))).sort(), ["Léo", "Maxime"]);
});

test("❤️ sur une journée : n’apparaît ni comme moment du carnet, ni comme activité, ni dans le score du jour", () => {
  const day = setDayLike(upsertItem(emptyDay(), plannedId("Odaiba"), { kind: "planned", title: "Odaiba", status: "todo" }, { status: "done", doneAt: 5 }, 5), "Maxime", true);
  assert.deepEqual(doneItems(day, "2026-11-11").map((x) => x.title), ["Odaiba"]);
  assert.deepEqual(extrasOf(day), []);
  assert.deepEqual(dayScore(applyJournal([{ title: "Odaiba" }], day)), { done: 1, total: 1 });
  // un jour qui n’a que le cœur n’affiche aucun moment
  assert.deepEqual(doneItems(setDayLike(emptyDay(), "Maxime", true), "2026-11-11"), []);
  assert.deepEqual(collectPhotos([["2026-11-11", day]]), []);
});
