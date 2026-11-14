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
    const likes = mergeLikes(x.likes, y.likes), dislikes = mergeLikes(x.dislikes, y.dislikes);
    out[id] = { ...win, ...(photos.length ? { photos } : {}), ...(gone.length ? { gone } : {}), ...(Object.keys(likes).length ? { likes } : {}), ...(Object.keys(dislikes).length ? { dislikes } : {}) };
  });
  return { items: out };
}

/** ❤️ (et 👎 `dislikes`, même forme) : { auteur: date } ; date > 0 = aimé, < 0 = retiré. Fusion : pour chaque auteur, l’action la plus récente. */
function mergeLikes(a, b){
  const out = { ...(a || {}) };
  Object.entries(b || {}).forEach(([who, t]) => { if (Math.abs(t) > Math.abs(out[who] || 0)) out[who] = t; });
  return out;
}

/** Auteurs qui ont aimé un item. */
export const likedBy = (it) => Object.entries((it && it.likes) || {}).filter(([, t]) => t > 0).map(([who]) => who);

/** Auteurs qui n’ont pas aimé un item (👎). */
export const dislikedBy = (it) => Object.entries((it && it.dislikes) || {}).filter(([, t]) => t > 0).map(([who]) => who);

/** Aime / n’aime plus un item (sans toucher à sa date de modification : ne réécrit pas le reste). Aimer retire le 👎 du même auteur. */
export function setLike(day, id, author, liked, now = Date.now()){
  return setVote(day, id, author, "likes", "dislikes", liked, now);
}

/** Marque / retire un 👎 sur un item. Le poser retire le ❤️ du même auteur. */
export function setDislike(day, id, author, disliked, now = Date.now()){
  return setVote(day, id, author, "dislikes", "likes", disliked, now);
}

/** `field` = le vote posé ou retiré ; `other` = le vote opposé, retiré au passage s’il était actif (on ne peut pas aimer et ne pas aimer). */
function setVote(day, id, author, field, other, on, now){
  const items = { ...((day && day.items) || {}) };
  if (!items[id]) return day || emptyDay();
  const it = items[id];
  const next = { ...it, [field]: { ...(it[field] || {}), [author]: on ? now : -now } };
  if (on && ((it[other] || {})[author] || 0) > 0) next[other] = { ...it[other], [author]: -now };
  items[id] = next;
  return { items };
}

/**
 * ❤️ sur une JOURNÉE : un élément spécial « x:jour » du fichier du jour (genre « jour », sans photo ni statut), qui ne se mélange
 * ni aux idées ni aux activités ajoutées ; ses cœurs se fusionnent comme ceux des moments (un par auteur, le plus récent gagne).
 */
export const DAY_LIKE_ID = "x:jour";

/** Auteurs qui ont aimé la journée. */
export const dayLikedBy = (day) => likedBy(day && day.items && day.items[DAY_LIKE_ID]);

/** Auteurs qui n’ont pas aimé la journée (👎). */
export const dayDislikedBy = (day) => dislikedBy(day && day.items && day.items[DAY_LIKE_ID]);

function withDayItem(day, now){
  const items = { ...((day && day.items) || {}) };
  if (!items[DAY_LIKE_ID]) items[DAY_LIKE_ID] = { id: DAY_LIKE_ID, kind: "day", title: "Journée", status: "todo", at: now };
  return { items };
}

/** Aime / n’aime plus la journée pour l’auteur `author` (crée l’élément spécial au premier cœur). */
export function setDayLike(day, author, liked, now = Date.now()){
  return setLike(withDayItem(day, now), DAY_LIKE_ID, author, liked, now);
}

/** 👎 sur la journée entière. */
export function setDayDislike(day, author, disliked, now = Date.now()){
  return setDislike(withDayItem(day, now), DAY_LIKE_ID, author, disliked, now);
}

/** Auteurs (triés) qui ont mis au moins un ❤️ (ou un 👎 si `vote` = "dislikes") quelque part (moment ou journée) : [["2026-11-08", jour], …]. */
export function likersOf(days, vote = "likes"){
  const set = new Set(), by = vote === "dislikes" ? dislikedBy : likedBy;
  (days || []).forEach(([, day]) => Object.values((day && day.items) || {}).forEach((it) => { if (!it.deleted) by(it).forEach((a) => set.add(a)); }));
  return [...set].sort((a, b) => a.localeCompare(b, "fr"));
}

/**
 * Coups de cœur : les journées et les moments aimés (par `who`, ou par n’importe qui si `who` est vide), les plus récents d’abord ;
 * avec `vote` = "dislikes", ceux qui ont reçu un 👎 à la place.
 * Retourne { days: [{ iso, who }], moments: [{ iso, id, title, photos, who, when }] } ; `who` = auteurs qui ont aimé (filtrés).
 */
export function favorites(days, who, vote = "likes"){
  const out = { days: [], moments: [] }, by = vote === "dislikes" ? dislikedBy : likedBy;
  (days || []).forEach(([iso, day]) => Object.values((day && day.items) || {}).forEach((it) => {
    if (it.deleted) return;
    const likers = by(it).filter((a) => !who || a === who);
    if (!likers.length) return;
    if (it.id === DAY_LIKE_ID) out.days.push({ iso, who: likers });
    else out.moments.push({ iso, id: it.id, title: it.title, photos: orderedPhotos(it), who: likers, when: momentOf(it, iso) });
  }));
  out.days.sort((a, b) => b.iso.localeCompare(a.iso));
  out.moments.sort((a, b) => b.iso.localeCompare(a.iso) || a.when - b.when);
  return out;
}

/** Poids moyen d’une photo en haute qualité sur le dépôt (mesuré : ≈ 660 Ko ; une miniature = ≈ 50 Ko). */
export const FULL_PHOTO_KB = 660;

/**
 * Ce que le Carnet dit des photos en haute qualité : { show, text, button, action, complete }.
 * `st` = { total, have, running } ; `action` = « all » (tout télécharger) ou « stop » (pause).
 * Tant que ce n’est pas fait, les photos se montrent d’abord floues (miniature) au défilement : on le dit, avec le poids à prévoir.
 */
export function hqSummary(st, avgKb = FULL_PHOTO_KB){
  const total = (st && st.total) || 0, have = Math.min(total, (st && st.have) || 0), missing = total - have;
  if (!total) return { show: false, complete: false };
  if (st.running) return { show: true, complete: false, text: `Haute qualité : ${have} / ${total}`, button: "Pause", action: "stop" };
  if (missing <= 0) return { show: false, complete: true };
  const mb = Math.max(1, Math.round(missing * avgKb / 1024));
  return { show: true, complete: false, text: `${missing} photo${missing > 1 ? "s" : ""} en qualité réduite (floues un instant au défilement)`, button: `Tout télécharger (≈ ${mb} Mo)`, action: "all" };
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

/** Photos visibles, la photo phare (`cover`) en premier si elle existe encore. */
export function orderedPhotos(it){
  const list = livePhotos(it);
  return it && it.cover && list.includes(it.cover) ? [it.cover, ...list.filter((n) => n !== it.cover)] : list;
}

/**
 * Couverture du carnet choisie à la main : la photo dont le marqueur `hero` ({ name, at }) est le plus récent
 * parmi tous les jours ([[iso, jour]]) et qui existe encore. Retourne { iso, id, name, title } ou null.
 */
export function heroPhoto(days){
  let best = null;
  (days || []).forEach(([iso, day]) => Object.values((day && day.items) || {}).forEach((it) => {
    const h = it.hero;
    if (!h || !h.name || !livePhotos(it).includes(h.name)) return;
    if (!best || (h.at || 0) > best.at) best = { iso, id: it.id, name: h.name, title: it.title, at: h.at || 0 };
  }));
  return best ? { iso: best.iso, id: best.id, name: best.name, title: best.title } : null;
}

/** Photos (noms de fichiers) d’un item d’un jour, ou []. */
export const photosOfItem = (day, id) => orderedPhotos(day && day.items && day.items[id]);

/** Miniature associée à une photo ou à une vidéo (« x.jpg » / « x.mp4 » / « x.webm » → « x.t.jpg »). */
export const thumbName = (name) => String(name).replace(/\.(jpg|mp4|webm)$/, ".t.jpg");

/** Une « photo » du journal dont le nom finit par .mp4 ou .webm est une vidéo (sans son) ; sa miniature est l’image d’ouverture. */
export const isVideo = (name) => /\.(mp4|webm)$/i.test(String(name || ""));

/** Nom de fichier valide d’un média du journal (photo .jpg ou vidéo .mp4). */
export const isMediaName = (n) => typeof n === "string" && /^[\w.-]+\.(jpg|mp4|webm)$/.test(n);

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
    const clean = (a) => (Array.isArray(a) ? a.filter(isMediaName) : undefined);
    const votes = (v) => (v && typeof v === "object" ? Object.fromEntries(Object.entries(v).filter(([, t]) => Number.isFinite(t))) : undefined);
    const likes = votes(it.likes), dislikes = votes(it.dislikes);
    items[id] = { ...it, id, status: STATUSES.includes(it.status) ? it.status : "todo", at: Number(it.at) || 0, photos: clean(it.photos), gone: clean(it.gone), likes, dislikes,
      cover: isMediaName(it.cover) ? it.cover : undefined,
      hero: it.hero && typeof it.hero === "object" && isMediaName(it.hero.name) ? { name: it.hero.name, at: Number(it.hero.at) || 0 } : undefined };
    Object.keys(items[id]).forEach((k) => { if (items[id][k] === undefined) delete items[id][k]; });
  });
  return { items };
}

/** « 14 h 52 » : heure au Japon d’un instant (ms). */
export function clockJst(ms){
  const d = new Date(ms + 9 * 3600000);
  return `${d.getUTCHours()} h ${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

/** Instant réel d’un moment : « fait » à tel instant (`doneAt`), sinon l’heure saisie (heure du Japon), sinon sa dernière modification. */
export function momentOf(it, iso){
  if (it.doneAt) return it.doneAt;
  if (it.time && iso) { const t = Date.parse(`${iso}T${it.time}:00+09:00`); if (Number.isFinite(t)) return t; }
  return it.at || 0;
}

/**
 * Ce qui s’est vraiment passé un jour, pour le Carnet et la page famille : idées faites + activités ajoutées + tout élément qui a des photos,
 * **dans l’ordre de la journée** (matin → nuit). [{ id, title, kind, time?, note?, by?, photos: [noms], likes, at }]
 *
 * L’heure de coche n’est pas toujours l’heure vécue (on coche souvent le soir, ou toutes d’un coup, dans le désordre). `opts.order` = ids du
 * programme du jour dans l’ordre vécu ; on le suit quand le jour est « à ordre fixe » (`opts.fixed`) ou quand rien n’a d’heure réelle
 * (ni « fait à telle heure », ni heure saisie) ; sinon on suit les heures. Ce qui n’est pas au programme passe après, par heure.
 */
export function doneItems(day, iso, opts = {}){
  const pos = new Map((opts.order || []).map((id, k) => [id, k]));
  const items = Object.values((day && day.items) || {})
    .filter((it) => !it.deleted && (it.kind === "extra" || it.status === "done" || livePhotos(it).length))
    .map((it) => ({ id: it.id, title: it.title, kind: it.kind, time: it.time, note: it.note, by: it.by, photos: orderedPhotos(it), likes: likedBy(it), dislikes: dislikedBy(it), at: it.at || 0, when: momentOf(it, iso), timed: !!(it.doneAt || it.time) }));
  const byProgram = pos.size > 0 && (!!opts.fixed || items.every((x) => !x.timed));
  const rank = (x) => (pos.has(x.id) ? pos.get(x.id) : 1e6);
  return items.sort((a, b) => (byProgram ? rank(a) - rank(b) : 0) || a.when - b.when || a.at - b.at);
}
