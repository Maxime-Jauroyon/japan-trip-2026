/* Journal de voyage : ce qu’on a vraiment fait (fonctions pures, sans réseau ni DOM).
   Un jour = { items: { [id]: item } } avec item = { id, kind: "planned" | "extra", title, status, at, by?, ref?, time?, note?, lat?, lng?, photos?, deleted? }.
   - « planned » : une idée du programme (id « p:<titre> », identique sur les deux téléphones) ;
   - « extra »   : une activité ajoutée sur place (id « x:<hasard> »).
   Fusion entre deux appareils : pour chaque item, le plus récent (`at`) gagne ; les photos des deux côtés sont conservées. */

export const STATUSES = ["todo", "done", "skipped"];
export const STATUS_LABELS = { todo: "À faire", done: "Fait", skipped: "Pas fait" };

const slug = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Id stable d’une idée du programme (même clé sur tous les appareils). */
export const plannedId = (title) => "p:" + slug(title);

/** Id d’une activité ajoutée (unique : date + hasard). */
export function newExtraId(now = Date.now(), rnd = Math.random()){
  return "x:" + now.toString(36) + Math.floor(rnd * 36 ** 3).toString(36).padStart(3, "0");
}

export const emptyDay = () => ({ items: {} });

/** Fusion de deux versions d’un même jour (aucune n’est modifiée). */
export function mergeDay(a, b){
  const out = {};
  const A = (a && a.items) || {}, B = (b && b.items) || {};
  new Set([...Object.keys(A), ...Object.keys(B)]).forEach((id) => {
    const x = A[id], y = B[id];
    if (!x || !y) { out[id] = x || y; return; }
    const win = (y.at || 0) > (x.at || 0) ? y : x;
    const photos = [...new Set([...(x.photos || []), ...(y.photos || [])])];
    const gone = [...new Set([...(x.gone || []), ...(y.gone || [])])];   // photos retirées : retirées partout
    out[id] = { ...win, ...(photos.length ? { photos } : {}), ...(gone.length ? { gone } : {}) };
  });
  return { items: out };
}

/** Deux jours identiques (même contenu) ? Sert à éviter un envoi inutile. */
export const sameDay = (a, b) => JSON.stringify(sortKeys((a && a.items) || {})) === JSON.stringify(sortKeys((b && b.items) || {}));
function sortKeys(o){
  return Object.keys(o).sort().reduce((r, k) => { r[k] = o[k]; return r; }, {});
}

/** Nouvelle version du jour avec `patch` appliqué à l’item `id` (créé si besoin avec `base`). */
export function upsertItem(day, id, base, patch, now = Date.now()){
  const items = { ...((day && day.items) || {}) };
  const cur = items[id] || { id, ...base };
  items[id] = { ...cur, ...patch, id, at: now };
  Object.keys(items[id]).forEach((k) => { if (items[id][k] === undefined) delete items[id][k]; });
  return { items };
}

/** Statut d’une idée du programme : « todo » tant que personne n’a rien dit. */
export function statusOfPlanned(day, title){
  const it = day && day.items && day.items[plannedId(title)];
  return it && !it.deleted && STATUSES.includes(it.status) ? it.status : "todo";
}

/** Enchaînement d’un appui sur le bouton d’état : à faire → fait → pas fait → à faire. */
export const nextStatus = (s) => (s === "todo" ? "done" : s === "done" ? "skipped" : "todo");

/** Activités ajoutées sur place (non supprimées), triées par heure puis par date de saisie. */
export function extrasOf(day){
  return Object.values((day && day.items) || {})
    .filter((it) => it.kind === "extra" && !it.deleted)
    .sort((a, b) => String(a.time || "99:99").localeCompare(String(b.time || "99:99")) || (a.at || 0) - (b.at || 0));
}

/** Photos visibles d’un item (noms de fichiers, sans celles retirées). */
export const livePhotos = (it) => (it && !it.deleted ? (it.photos || []).filter((n) => !(it.gone || []).includes(n)) : []);

/** Photos (noms de fichiers) d’un item d’un jour, ou []. */
export const photosOfItem = (day, id) => livePhotos(day && day.items && day.items[id]);

/** Miniature associée à une photo (« x.jpg » → « x.t.jpg »). */
export const thumbName = (name) => String(name).replace(/\.jpg$/, ".t.jpg");

/** Toutes les photos de plusieurs jours : [{ iso, id, title, name }] dans l’ordre des jours. */
export function collectPhotos(days){
  const out = [];
  (days || []).forEach(([iso, day]) => Object.values((day && day.items) || {}).forEach((it) => {
    livePhotos(it).forEach((name) => out.push({ iso, id: it.id, title: it.title, name }));
  }));
  return out;
}

/**
 * Vue effective d’un jour : les idées du programme avec leur statut + les ajouts.
 * `planned` : idées ({ title, fixed? … }) ; retourne { planned: [{ act, id, status, item, photos, fixed }], extras }.
 */
export function applyJournal(planned, day){
  return {
    planned: (planned || []).map((act) => {
      const id = plannedId(act.title);
      const item = day && day.items && day.items[id];
      return { act, id, status: statusOfPlanned(day, act.title), item: item && !item.deleted ? item : null,
        photos: photosOfItem(day, id), fixed: !!act.fixed };
    }),
    extras: extrasOf(day)
  };
}

/** Compte « fait / total » (les idées « pas fait » ne comptent pas dans le total, les ajouts comptent comme faits). */
export function dayScore(view){
  const done = view.planned.filter((p) => p.status === "done").length + view.extras.length;
  const total = view.planned.filter((p) => p.status !== "skipped").length + view.extras.length;
  return { done, total };
}

/** Valide un jour lu depuis le réseau (garde-fou contre un fichier abîmé). */
export function sanitizeDay(raw){
  const items = {};
  const src = raw && typeof raw === "object" && raw.items && typeof raw.items === "object" ? raw.items : {};
  Object.entries(src).forEach(([id, it]) => {
    if (!it || typeof it !== "object" || typeof it.title !== "string" || !/^[px]:/.test(id)) return;
    const clean = (a) => (Array.isArray(a) ? a.filter((n) => typeof n === "string" && /^[\w.-]+\.jpg$/.test(n)) : undefined);
    items[id] = { ...it, id, status: STATUSES.includes(it.status) ? it.status : "todo", at: Number(it.at) || 0, photos: clean(it.photos), gone: clean(it.gone) };
    Object.keys(items[id]).forEach((k) => { if (items[id][k] === undefined) delete items[id][k]; });
  });
  return { items };
}
