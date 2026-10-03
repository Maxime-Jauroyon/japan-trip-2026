#!/usr/bin/env node
/* Vérifie la cohérence des données du voyage (data/*.json) :
   identifiants uniques, références (villes, trajets, journeys, jours), coordonnées,
   emprises de carte, dates. À lancer après chaque modification des données.
   Usage : node scripts/validate-data.mjs   (code de sortie 1 en cas d’erreur) */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = (name) => JSON.parse(fs.readFileSync(path.join(ROOT, "data", name + ".json"), "utf8"));

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where} : ${msg}`);
/* Contenu manquant mais non bloquant (ex. photo pas encore ajoutée) */
const warn = (where, msg) => warnings.push(`${where} : ${msg}`);
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const isStr = (v) => typeof v === "string" && v.trim() !== "";
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = new Set(["paid", "reserved", "placeholder"]);

function checkUnique(list, where, key = "id") {
  const seen = new Set();
  list.forEach((x, i) => {
    if (!isStr(x[key])) err(`${where}[${i}]`, `${key} manquant`);
    else if (seen.has(x[key])) err(`${where}[${i}]`, `${key} en double « ${x[key]} »`);
    seen.add(x[key]);
  });
  return seen;
}
function checkCoord(p, where, optional = false) {
  if (!p || (p.lat == null && p.lng == null)) {
    if (!optional) err(where, "coordonnées manquantes");
    return false;
  }
  if (!isNum(p.lat) || p.lat < 20 || p.lat > 50) err(where, `latitude invalide ${p.lat}`);
  if (!isNum(p.lng) || p.lng < 120 || p.lng > 155) err(where, `longitude invalide ${p.lng}`);
  return true;
}
/** Vignette d’une photo (cf. scripts/make-thumbs.mjs et thumbOf dans src/domain/photos.js). */
const thumbPath = (p) => p.replace(/^\.\//, "").replace(/\/([^/]+?)\.(jpe?g|png|webp)$/i, "/thumb/$1.jpg");
const phraseRefs = [];   // [où, contexte] — vérifiés une fois phrases.json chargé
const inside = (b, p) => p.lng >= b.west && p.lng <= b.east && p.lat >= b.south && p.lat <= b.north;

// —— Villes ——
const citiesFile = load("cities");
const cities = citiesFile.cities;
const cityIds = checkUnique(cities, "cities");
const jb = citiesFile.japanBounds;
if (!jb || !(jb.west < jb.east && jb.south < jb.north)) err("cities.japanBounds", "emprise invalide");
const stayIds = new Set();
cities.forEach((c) => {
  const w = `ville ${c.id}`;
  ["name", "jp"].forEach((k) => { if (!isStr(c[k])) err(w, `${k} manquant`); });
  checkCoord(c, w);
  const b = c.map && c.map.bounds;
  if (!b || !(b.west < b.east && b.south < b.north)) err(w, "map.bounds invalide");
  else if (!inside(b, c)) err(w, "le centre de la ville est hors de map.bounds");
  if (!c.map || !c.map.label || !["left", "right"].includes(c.map.label.side)) err(w, "map.label.side doit valoir left ou right");
  if (c.climate && !(isNum(c.climate.hi) && isNum(c.climate.lo) && c.climate.lo <= c.climate.hi)) err(w, "climate hi/lo invalide");
  (c.stays || []).forEach((s, i) => {
    const ws = `${w} séjour ${s.id || i}`;
    if (s.phrases) phraseRefs.push([ws, s.phrases]);
    if (!isStr(s.id)) err(ws, "id manquant");
    else if (stayIds.has(s.id)) err(ws, "id de séjour en double");
    stayIds.add(s.id);
    ["label", "from", "to"].forEach((k) => { if (!isStr(s[k])) err(ws, `${k} manquant`); });
    if (s.days && !(Number.isInteger(s.days.from ?? 1) && (s.days.to == null || s.days.to >= (s.days.from ?? 1)))) err(ws, "plage days invalide");
    const h = s.hotel;
    if (!h || !isStr(h.name)) { err(ws, "hôtel sans nom"); return; }
    if (h.status && !STATUSES.has(h.status)) err(ws, `statut inconnu ${h.status}`);
    if (h.lat != null && checkCoord(h, ws + " hôtel") && b && !inside(b, h)) err(ws, "hôtel hors de l’emprise de la ville");
    (h.photos || []).forEach((ph) => {
      if (!fs.existsSync(path.join(ROOT, ph))) err(ws, `photo introuvable ${ph}`);
      else if (!fs.existsSync(path.join(ROOT, thumbPath(ph)))) err(ws, `vignette manquante pour ${ph} (npm run thumbs)`);
    });
  });
});

// —— Trajets & journeys ——
const legs = load("legs");
const legIds = checkUnique(legs, "legs");
const journeys = load("journeys");
const journeyIds = checkUnique(journeys, "journeys");
const endpoint = (p, where) => {
  if (!p) return err(where, "extrémité manquante");
  if (p.city) { if (!cityIds.has(p.city)) err(where, `ville inconnue « ${p.city} »`); return; }
  if (p.id && !cityIds.has(p.id)) err(where, `ville inconnue « ${p.id} »`);
  checkCoord(p, where);
};
legs.forEach((l) => {
  const w = `trajet ${l.id}`;
  ["title", "mode"].forEach((k) => { if (!isStr(l[k])) err(w, `${k} manquant`); });
  if (!STATUSES.has(l.status)) err(w, `statut inconnu ${l.status}`);
  endpoint(l.from, w + " from");
  endpoint(l.to, w + " to");
  (l.via || []).forEach((v, i) => checkCoord(v, `${w} via[${i}]`));
  if (l.curveSide && !["north", "south"].includes(l.curveSide)) err(w, `curveSide inconnu ${l.curveSide}`);
  if (l.journey && !journeyIds.has(l.journey)) err(w, `journey inconnu « ${l.journey} »`);
  [["fromStop", l.fromStop], ["toStop", l.toStop]].forEach(([k, s]) => {
    if (s && s.lat != null && checkCoord(s, `${w} ${k}`) && !/aéroport/i.test(s.kind || "")
      && !cities.some((c) => c.map && c.map.bounds && inside(c.map.bounds, s))) err(w, `${k} hors de toute ville du voyage`);
  });
  ((l.bookings && l.bookings.links) || []).forEach((link, i) => {
    const wl = `${w} réservation ${i}`;
    if (!/^https:\/\//.test(link.url || "")) err(wl, "url https manquante");
    if (link.openFrom && !ISO.test(link.openFrom)) err(wl, `openFrom doit être AAAA-MM-JJ (${link.openFrom})`);
  });
});

// —— Jours ——
const days = load("days");
days.forEach((d, i) => {
  const w = `jour ${d.n}`;
  if (d.n !== i + 1) err(w, `numérotation attendue ${i + 1}`);
  if (!cityIds.has(d.city)) err(w, `ville inconnue « ${d.city} »`);
  if (d.extraCity && !cityIds.has(d.extraCity)) err(w, `extraCity inconnue « ${d.extraCity} »`);
  if (!/^\d{1,2} \w+ \d{4}$/u.test(d.date || "")) err(w, `date au format « 8 nov 2026 » attendue (${d.date})`);
  (d.moves || []).forEach((m, k) => {
    if (m.leg && !legIds.has(m.leg)) err(`${w} déplacement ${k}`, `trajet inconnu « ${m.leg} »`);
    if (m.journey && !journeyIds.has(m.journey)) err(`${w} déplacement ${k}`, `journey inconnu « ${m.journey} »`);
  });
  if (d.reminders != null && !Array.isArray(d.reminders)) err(w, "reminders doit être une liste");
  (d.reminders || []).forEach((r, k) => { if (!isStr(r.title)) err(`${w} reminders[${k}]`, "title manquant"); });
  ["ideas", "ideasAfter"].forEach((key) => (d[key] || []).forEach((a, k) => {
    const wa = `${w} ${key}[${k}] « ${a.title} »`;
    if (!isStr(a.title)) err(wa, "titre manquant");
    if (a.phrases) phraseRefs.push([wa, a.phrases]);
    if ((a.lat != null || a.lng != null) && checkCoord(a, wa)) {
      // Un pin mal géocodé tombe souvent dans une autre région : il doit être dans l’emprise d’une ville
      if (!cities.some((c) => c.map && c.map.bounds && inside(c.map.bounds, a))) err(wa, "coordonnées hors de toute ville du voyage");
    }
  }));
});
journeys.forEach((j) => {
  const w = `journey ${j.id}`;
  (j.legs || []).forEach((id) => { if (!legIds.has(id)) err(w, `trajet inconnu « ${id} »`); });
  if (j.day != null && !days.some((d) => d.n === j.day)) err(w, `jour inconnu ${j.day}`);
});

// —— Préparatifs, phrases, voyage ——
const prep = load("prep");
checkUnique(prep.checks, "prep.checks");
prep.checks.forEach((c) => {
  if (c.remindFrom && !ISO.test(c.remindFrom)) err(`prep ${c.id}`, `remindFrom doit être AAAA-MM-JJ (${c.remindFrom})`);
});
const phrases = load("phrases");
const checkPhrase = (where) => (p, i) => {
  if (!isStr(p.fr) || !isStr(p.jp) || !isStr(p.ro)) err(`${where} phrase ${i}`, "fr / jp / ro manquant");
};
(phrases.onsite || []).forEach((g, k) => {
  if (!isStr(g.title) || !Array.isArray(g.phrases) || !g.phrases.length) err(`phrases.onsite[${k}]`, "title + phrases attendus");
  else g.phrases.forEach(checkPhrase(`phrases.onsite « ${g.title} »`));
});
Object.entries(phrases.context || {}).forEach(([key, c]) => {
  if (!isStr(c.label) || !Array.isArray(c.phrases) || !c.phrases.length) err(`phrases.context.${key}`, "label + phrases attendus");
  else c.phrases.forEach(checkPhrase(`phrases.context.${key}`));
});
// Contexte imposé sur un lieu / un séjour (« phrases »: "park") : doit exister
phraseRefs.forEach(([where, key]) => {
  if (!phrases.context || !phrases.context[key]) err(where, `contexte de phrases inconnu « ${key} »`);
});
const trip = load("trip");
(trip.emergency || []).forEach((e, i) => {
  if (!isStr(e.label) || !/^\+?[0-9]{3,15}$/.test(e.number || "")) err(`trip.emergency[${i}]`, "label + number (chiffres, + autorisé) attendus");
});
["title", "shortTitle", "datesLabel", "datesLabelLong", "startLabel", "climateMonth"].forEach((k) => {
  if (!isStr(trip[k])) err("trip", `${k} manquant`);
});
if (!ISO.test(trip.startDate || "") || !ISO.test(trip.endDate || "") || trip.startDate > trip.endDate) err("trip", "startDate / endDate (AAAA-MM-JJ) invalides");
if (!Array.isArray(trip.travelers) || !trip.travelers.length) err("trip", "travelers vide");
if (!isNum(trip.fxDefault) || trip.fxDefault <= 0) err("trip", "fxDefault invalide");
load("practical").forEach((p, i) => { if (!isStr(p.title) || !Array.isArray(p.items)) err(`practical[${i}]`, "title / items"); });
load("places-meta");
const photos = load("photos");
photos.rules.forEach((r, i) => {
  try { new RegExp(r.match); } catch (e) { err(`photos.rules[${i}]`, `motif invalide ${r.match}`); }
  if (!photos.places[r.slug]) warn(`photos « ${r.match} »`, `aucune photo pour « ${r.slug} »`);
});
Object.entries(photos.places).forEach(([slug, list]) => list.forEach((ph, i) => {
  const w = `photos.places.${slug}[${i}]`;
  if (!fs.existsSync(path.join(ROOT, "img/activities", ph.file || ""))) err(w, `img/activities/${ph.file} introuvable`);
  else if (!fs.existsSync(path.join(ROOT, thumbPath("img/activities/" + ph.file)))) err(w, `vignette manquante pour ${ph.file} (npm run thumbs)`);
  if (!isStr(ph.author) || !isStr(ph.license)) err(w, "auteur / licence manquants (crédit obligatoire)");
}));

if (warnings.length) console.warn(`⚠ ${warnings.length} avertissement(s) :\n  - ` + warnings.join("\n  - "));
if (errors.length) {
  console.error(`✗ ${errors.length} erreur(s) dans data/ :\n  - ` + errors.join("\n  - "));
  process.exit(1);
}
console.log(`✓ données valides : ${cities.length} villes, ${days.length} jours, ${legs.length} trajets, ${journeys.length} journeys`);
