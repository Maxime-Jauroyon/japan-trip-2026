/* Données du voyage : chargées depuis /data/*.json au démarrage.
   Les exports sont des liaisons « live » : remplies par loadData() / hydrate(),
   à n’utiliser qu’après le chargement (jamais au niveau module). */

export let CITIES = {};
export let ORDER = [];
export let MAP_BOUNDS = {};
export let JAPAN_BOUNDS = null;
export let CITY_CLIMATE = {};
export let MARK_LABELS = {};
export let DAYS = [];
export let LEGS = [];
export let JOURNEYS = {};
export let TRAVELERS = [];
export let FX_DEFAULT = 0;
export let PREP_CHECKS = [];
export let PREP_BUDGET = [];
export let PREP_BUDGET_TOTAL = null;
/** Phrases de l’onglet Sur place : [{ title, phrases: [{ fr, jp, ro, note? }] }]. */
export let ONSITE_PHRASES = [];
/** Phrases par type de lieu : { clé: { label, phrases } } (cf. domain/classify.js). */
export let CONTEXT_PHRASES = {};
export let ACT_META = {};
export let TRIP = null;
export let PHOTO_RULES = [];
export let PLACE_PHOTOS = {};
export let PRACTICAL_INFO = [];

export const DATA_FILES = [
  "trip", "cities", "days", "legs", "journeys", "prep", "phrases", "places-meta", "practical", "photos"
];

/** Construit les structures utilisées par l’app à partir du JSON brut
    ({ trip, cities, days, … } — une clé par fichier de DATA_FILES). */
export function hydrate(raw) {
  const cityList = raw.cities.cities;
  CITIES = {};
  ORDER = [];
  MAP_BOUNDS = {};
  CITY_CLIMATE = {};
  MARK_LABELS = {};
  cityList.forEach(c => {
    CITIES[c.id] = c;
    ORDER.push(c.id);
    MAP_BOUNDS[c.id] = c.map.bounds;
    if (c.climate) CITY_CLIMATE[c.id] = c.climate;
    MARK_LABELS[c.id] = { side: c.map.label.side, zoom: c.map.label.minZoom || 0 };
  });
  JAPAN_BOUNDS = raw.cities.japanBounds;

  /* Trajets : { "city": "tokyo" } → objet ville (même référence qu’avant). */
  const resolve = p => (p && p.city && CITIES[p.city]) ? CITIES[p.city] : p;
  LEGS = raw.legs.map(l => Object.assign({}, l, { from: resolve(l.from), to: resolve(l.to) }));
  JOURNEYS = {};
  raw.journeys.forEach(j => { JOURNEYS[j.id] = j; });
  DAYS = raw.days;

  TRIP = raw.trip;
  TRAVELERS = raw.trip.travelers;
  FX_DEFAULT = raw.trip.fxDefault;
  PREP_CHECKS = raw.prep.checks;
  PREP_BUDGET = raw.prep.budget;
  PREP_BUDGET_TOTAL = raw.prep.budgetTotal;
  ONSITE_PHRASES = raw.phrases.onsite;
  CONTEXT_PHRASES = raw.phrases.context;
  ACT_META = raw["places-meta"];
  PRACTICAL_INFO = raw.practical;
  /* Photos : motif (sur le titre en minuscules) → nom de fichier dans img/activities. */
  PHOTO_RULES = raw.photos.rules.map(r => ({ re: new RegExp(r.match), slug: r.slug }));
  /* Photos par lieu : [{ file, author, license, licenseUrl, source }] (img/activities/<file>) */
  PLACE_PHOTOS = raw.photos.places;
}

/** Charge tous les fichiers de /data (réseau d’abord, cache SW hors ligne). */
export async function loadData(baseUrl = "./data/") {
  const entries = await Promise.all(DATA_FILES.map(async name => {
    const res = await fetch(baseUrl + name + ".json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`data/${name}.json : HTTP ${res.status}`);
    return [name, await res.json()];
  }));
  hydrate(Object.fromEntries(entries));
}
