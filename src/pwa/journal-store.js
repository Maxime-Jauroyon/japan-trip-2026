/* Journal de voyage partagé : stockage local (marche hors ligne) + synchro avec le dépôt GitHub.
   - Les modifications sont enregistrées tout de suite sur le téléphone, puis envoyées dès que possible.
   - Un fichier par jour (journal/days/AAAA-MM-JJ.json) sur la branche `journal` ; fusion par item (domain/journal.js).
   - Le jeton GitHub (limité à ce dépôt) est saisi dans Réglages et reste sur l’appareil. */

import { DAY_PROGRESS_KEY, JOURNAL_CFG_KEY, JOURNAL_KEY } from "../config.js";
import { DAYS, TRIP } from "../core/data.js";
import { dayToISO, japanTodayISO } from "../core/dates.js";
import { dayDislikedBy, dayLikedBy, dislikedBy, emptyDay, isVideo, livePhotos, mergeDay, newExtraId, plannedId, sameDay, sanitizeDay, setDayDislike, setDayLike, setDislike, setLike, likedBy, thumbName, upsertItem } from "../domain/journal.js";
import { loadPublicJournal, publicPhotoUrl } from "./journal-public.js";
import { createDedupe, createJobQueue } from "../shared/job-queue.js";
import { resizeImage, compressVideo } from "./photo-resize.js";

export const JOURNAL_CHANGED = "japan-trip:journal-changed";
export const JOURNAL_SYNC = "japan-trip:journal-sync";
export const JOURNAL_PREFETCH = "japan-trip:journal-prefetch";

const SYNC_EVERY_MS = 60000;
const API = "https://api.github.com";

/** { days: { iso: jour }, shas: { iso: sha }, dirty: [iso], photos: [{ iso, name }] (photos à envoyer) } */
let mem = null;
let timer = null;
let running = false;
let again = false;
export const syncStatus = { state: "idle", at: 0, error: "" };

const emit = (name) => document.dispatchEvent(new CustomEvent(name));

function load(){
  if (mem) return mem;
  try { mem = JSON.parse(localStorage.getItem(JOURNAL_KEY) || "null"); } catch (_) { mem = null; }
  if (!mem || typeof mem !== "object") mem = {};
  mem.days = mem.days || {};
  mem.shas = mem.shas || {};
  mem.dirty = Array.isArray(mem.dirty) ? mem.dirty : [];
  mem.photos = Array.isArray(mem.photos) ? mem.photos : [];
  return mem;
}

function save(){
  try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(load())); } catch (_) { /* quota */ }
}

/* —— Réglages —— */

export function journalConfig(){
  try {
    const c = JSON.parse(localStorage.getItem(JOURNAL_CFG_KEY) || "{}") || {};
    return { token: String(c.token || ""), author: String(c.author || "") };
  } catch (_) { return { token: "", author: "" }; }
}

export function setJournalConfig(patch){
  const c = { ...journalConfig(), ...patch };
  try { localStorage.setItem(JOURNAL_CFG_KEY, JSON.stringify(c)); } catch (_) { /* quota */ }
  if (c.token) syncNow(); else setStatus("nocfg");
}

const repoCfg = () => (TRIP.journal || {});
export const journalReady = () => !!(journalConfig().token && repoCfg().repo);
/** Sans jeton : on regarde le carnet (lecture publique) mais on n’y écrit pas. */
export const journalReadOnly = () => !journalReady();

/* —— Lecture / écriture locales —— */

export function journalDay(iso){
  return load().days[iso] || emptyDay();
}

/** Tous les jours qui ont du contenu : [[iso, jour]] triés par date. */
export function journalDays(){
  return Object.entries(load().days).filter(([, d]) => Object.keys(d.items || {}).length).sort((a, b) => a[0].localeCompare(b[0]));
}

function commit(iso, day){
  const m = load();
  m.days[iso] = day;
  if (!m.dirty.includes(iso)) m.dirty.push(iso);
  save();
  emit(JOURNAL_CHANGED);
  scheduleSync();
}

const by = () => journalConfig().author || undefined;

/** Change le statut d’une idée du programme (todo | done | skipped). */
export function setPlannedStatus(iso, title, status){
  const cur = journalDay(iso).items[plannedId(title)];
  // doneAt = instant où l’idée passe à « fait » (sert à ranger le Carnet dans l’ordre vécu ; ne bouge plus ensuite)
  const doneAt = status === "done" ? ((cur && cur.status === "done" && cur.doneAt) || Date.now()) : undefined;
  commit(iso, upsertItem(journalDay(iso), plannedId(title), { kind: "planned", title }, { status, doneAt, by: by() }));
}

/** Change n’importe quel champ d’une idée du programme (note, photos…). */
export function patchPlanned(iso, title, patch){
  commit(iso, upsertItem(journalDay(iso), plannedId(title), { kind: "planned", title, status: "todo" }, { ...patch, by: by() }));
}

/* —— Photos : réduites sur le téléphone, gardées dans le cache de l’appareil, envoyées au dépôt —— */

const PHOTO_CACHE = "japan-journal-v1";
const FULL_PX = 1600, THUMB_PX = 400;
const blobs = new Map();          // secours si le cache du navigateur est indisponible
const urls = new Map();           // clé → URL d’objet déjà créée
const photoKey = (iso, name) => `https://journal.invalid/${iso}/${name}`;

/** Type MIME d’un média du journal d’après son nom (la lecture vidéo l’exige). */
const mediaType = (name) => (/\.mp4$/.test(name) ? "video/mp4" : /\.webm$/.test(name) ? "video/webm" : "image/jpeg");

async function cachePut(iso, name, blob){
  const typed = blob.type === mediaType(name) ? blob : new Blob([blob], { type: mediaType(name) });
  blobs.set(photoKey(iso, name), typed);
  try { await (await caches.open(PHOTO_CACHE)).put(photoKey(iso, name), new Response(typed, { headers: { "Content-Type": mediaType(name) } })); } catch (_) { /* pas de cache */ }
}

async function cacheGet(iso, name){
  const k = photoKey(iso, name);
  if (blobs.has(k)) return blobs.get(k);
  try {
    const res = await (await caches.open(PHOTO_CACHE)).match(k);
    if (res) { const b = await res.blob(); blobs.set(k, b); return b; }
  } catch (_) { /* pas de cache */ }
  return null;
}

/** Dernier message d’erreur d’un ajout de vidéo ("" si tout s’est bien passé). */
let mediaNotice = "";
export const lastMediaNotice = () => mediaNotice;

/**
 * Ajoute des photos ou des vidéos à une idée du programme (`target` = { title }) ou à une activité ajoutée (`target` = { id }).
 * Retourne le nombre de photos ajoutées.
 */
export async function addPhotos(iso, target, files, onProgress){
  const names = [];
  mediaNotice = "";
  for (const file of files) {
    try {
      const stem = `${Date.now().toString(36)}${Math.floor(Math.random() * 46656).toString(36).padStart(3, "0")}`;
      let name, full, thumb;
      if (file.type && file.type.startsWith("video/")) {
        // Vidéo : relue sans le son, réduite à 720 p et 20 s au plus ; la miniature est sa première image
        const v = await compressVideo(file, onProgress);
        name = `${stem}.${v.ext}`;
        [full, thumb] = [v.blob, v.poster];
      } else {
        name = `${stem}.jpg`;
        [full, thumb] = [await resizeImage(file, FULL_PX, 0.82), await resizeImage(file, THUMB_PX, 0.7)];
      }
      await cachePut(iso, name, full);
      await cachePut(iso, thumbName(name), thumb);
      load().photos.push({ iso, name });
      names.push(name);
    } catch (e) { mediaNotice = file.type && file.type.startsWith("video/") ? `Vidéo non ajoutée : ${e.message}` : ""; /* média illisible : ignoré */ }
  }
  if (!names.length) return 0;
  const id = target.id || plannedId(target.title);
  const cur = journalDay(iso).items[id];
  const base = target.id ? {} : { kind: "planned", title: target.title, status: "todo" };
  commit(iso, upsertItem(journalDay(iso), id, base, { photos: [...((cur && cur.photos) || []), ...names], by: by() }));
  return names.length;
}

/** ❤️ sur un item (idée ou activité) pour l’auteur de ce téléphone. */
export function toggleLike(iso, id){
  const who = journalConfig().author || "Moi";
  const it = journalDay(iso).items[id];
  if (!it) return;
  commit(iso, setLike(journalDay(iso), id, who, !likedBy(it).includes(who)));
}

/** ❤️ sur une journée entière (« j'ai adoré cette journée ») pour l’auteur de ce téléphone. */
export function toggleDayLike(iso){
  const who = journalConfig().author || "Moi";
  const day = journalDay(iso);
  commit(iso, setDayLike(day, who, !dayLikedBy(day).includes(who)));
}

/** 👎 sur un item pour l’auteur de ce téléphone (retire son ❤️ s’il y en avait un). */
export function toggleDislike(iso, id){
  const who = journalConfig().author || "Moi";
  const it = journalDay(iso).items[id];
  if (!it) return;
  commit(iso, setDislike(journalDay(iso), id, who, !dislikedBy(it).includes(who)));
}

/** 👎 sur une journée entière. */
export function toggleDayDislike(iso){
  const who = journalConfig().author || "Moi";
  const day = journalDay(iso);
  commit(iso, setDayDislike(day, who, !dayDislikedBy(day).includes(who)));
}

/** Photo phare d’une activité : affichée en premier (un second appui sur la même photo l’enlève). */
export function setCoverPhoto(iso, id, name){
  const cur = journalDay(iso).items[id];
  if (!cur) return;
  commit(iso, upsertItem(journalDay(iso), id, {}, { cover: cur.cover === name ? undefined : name, by: by() }));
}

/** Couverture du carnet : la dernière photo choisie, tous jours confondus, l’emporte. */
export function setHeroPhoto(iso, id, name){
  if (!journalDay(iso).items[id]) return;
  commit(iso, upsertItem(journalDay(iso), id, {}, { hero: { name, at: Date.now() }, by: by() }));
}

/** Retire une photo (de tous les téléphones). */
export function removePhoto(iso, id, name){
  const cur = journalDay(iso).items[id];
  if (!cur) return;
  commit(iso, upsertItem(journalDay(iso), id, {}, { gone: [...(cur.gone || []), name], by: by() }));
}

function objectUrl(k, blob){
  const url = URL.createObjectURL(blob);
  urls.set(k, url);
  return url;
}

/** URL d’une photo si elle est déjà sur le téléphone (aucun appel réseau), sinon "". */
export async function cachedPhotoUrl(iso, name, thumb){
  const file = thumb ? thumbName(name) : name;
  const k = photoKey(iso, file);
  if (urls.has(k)) return urls.get(k);
  const blob = await cacheGet(iso, file);
  return blob && blob.size ? objectUrl(k, blob) : "";
}

/** Télécharge une photo du dépôt : par l’API avec le jeton, sinon par l’adresse publique (lecture seule). */
async function downloadPhoto(iso, file){
  try {
    const res = journalReady()
      ? await gh(`contents/journal/photos/${iso}/${file}?ref=${encodeURIComponent(repoCfg().branch)}`, { headers: { Accept: "application/vnd.github.raw+json" } })
      : await fetch(publicPhotoUrl(repoCfg(), iso, file));
    if (!res.ok) return null;
    const blob = await res.blob();
    return blob.size ? blob : null;
  } catch (_) { return null; }
}

/* Téléchargements : 4 à la fois au plus, le plus urgent d’abord (ce qu’on regarde passe avant le préchargement), une même
   photo jamais demandée deux fois en parallèle, et une demande devenue inutile (on a déjà tourné la page) n’est pas lancée. */
const downloads = createJobQueue(4);
const once = createDedupe();

/**
 * URL affichable d’une photo : cache de l’appareil d’abord ; sinon un seul téléchargement, puis elle y reste.
 * `opts` : { priority (0 = arrière-plan, 5 = à l’écran, 10 = en plein écran), live: () => bool (false = abandonner) }.
 * Rend "" si la photo est introuvable pour l’instant (à réessayer plus tard).
 */
export async function photoUrl(iso, name, thumb, opts = {}){
  const hit = await cachedPhotoUrl(iso, name, thumb);
  if (hit) return hit;
  if (!repoCfg().repo || navigator.onLine === false) return "";
  const file = thumb ? thumbName(name) : name;
  const start = () => once(photoKey(iso, file), () => downloads.run(async () => {
    const arrived = await cachedPhotoUrl(iso, name, thumb);   // arrivée entre-temps (autre demande)
    if (arrived) return arrived;
    const blob = await downloadPhoto(iso, file);
    if (!blob) return "";
    await cachePut(iso, file, blob);
    if (!thumb && !isVideo(name)) { fullStatus.have = Math.min(fullStatus.total, fullStatus.have + 1); emit(JOURNAL_PREFETCH); }   // une photo de plus en haute qualité sur le téléphone
    return objectUrl(photoKey(iso, file), blobs.get(photoKey(iso, file)) || blob);
  }, { prio: opts.priority || 0, live: opts.live, fallback: null }));
  let url = await start();
  if (url === null && (!opts.live || opts.live())) url = await start();   // la demande qu’on a rejointe avait été abandonnée : on relance
  return url || "";
}

const blobToB64 = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(",")[1] || "");
  r.onerror = () => reject(new Error("lecture de la photo"));
  r.readAsDataURL(blob);
});

/** Préchargement : `all` = photos du journal, `done` / `total` = téléchargements en cours (seulement les manquantes). */
export const prefetchStatus = { all: 0, done: 0, total: 0, running: false };
let prefetching = false;

/** Télécharge sur le téléphone les miniatures qui n’y sont pas encore (3 à la fois). Silencieux s’il ne manque rien. */
export async function prefetchPhotos(){
  if (prefetching || navigator.onLine === false) return;
  prefetching = true;
  try {
    const all = Object.entries(load().days).flatMap(([iso, d]) => Object.values(d.items || {}).flatMap(it => livePhotos(it).map(name => ({ iso, name }))));
    const missing = [];
    // Seules les miniatures (≈ 50 Ko) sont préchargées ; une grande photo est téléchargée la première fois qu’on la regarde, puis gardée.
    for (const p of all) {
      if (!(await cacheGet(p.iso, thumbName(p.name)))) missing.push({ ...p, thumb: true });
    }
    const changed = prefetchStatus.all !== all.length;
    prefetchStatus.all = all.length;
    if (!missing.length) { if (changed) emit(JOURNAL_PREFETCH); return; }
    Object.assign(prefetchStatus, { done: 0, total: missing.length, running: true });
    emit(JOURNAL_PREFETCH);
    const worker = async () => {
      while (missing.length) {
        const p = missing.shift();
        await photoUrl(p.iso, p.name, p.thumb).catch(() => "");
        prefetchStatus.done++;
        emit(JOURNAL_PREFETCH);
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    prefetchStatus.running = false;
    emit(JOURNAL_PREFETCH);
  } finally {
    prefetching = false;
    // Photos en haute qualité : on recompte ; si Maxime a choisi « Tout télécharger » une fois, les nouvelles arrivent toutes seules
    refreshFullStatus().then(() => { if (fullStatus.auto && fullStatus.have < fullStatus.total && !fullStatus.running && !saveData()) downloadAllFull(); });
  }
}

/* —— Photos en haute qualité : par défaut une photo n’est téléchargée en grand que la première fois qu’on la regarde ; ce bouton
   les prend toutes d’un coup (le plus récent d’abord, 2 à la fois), et les nouvelles suivent ensuite toutes seules —— */

const HQ_KEY = "japan-trip-journal-hq";
export const fullStatus = { total: 0, have: 0, running: false, auto: false };
let fullRun = 0;
const saveData = () => !!(navigator.connection && navigator.connection.saveData);

const fullImages = () => Object.entries(load().days)
  .sort(([a], [b]) => b.localeCompare(a))
  .flatMap(([iso, d]) => Object.values(d.items || {}).flatMap((it) => livePhotos(it).filter((n) => !isVideo(n)).map((name) => ({ iso, name }))));

/** Recompte les photos déjà en haute qualité sur le téléphone. */
export async function refreshFullStatus(){
  const all = fullImages();
  let have = 0;
  for (const p of all) if (await cacheGet(p.iso, p.name)) have++;
  Object.assign(fullStatus, { total: all.length, have });
  emit(JOURNAL_PREFETCH);
}

export async function downloadAllFull(){
  if (fullStatus.running || navigator.onLine === false) return;
  fullStatus.auto = true;
  try { localStorage.setItem(HQ_KEY, "on"); } catch (_) { /* pas de stockage */ }
  const run = ++fullRun;
  fullStatus.running = true;
  emit(JOURNAL_PREFETCH);
  const todo = [];
  for (const p of fullImages()) if (!(await cacheGet(p.iso, p.name))) todo.push(p);
  const worker = async () => {
    while (todo.length && run === fullRun) {
      const p = todo.shift();
      await photoUrl(p.iso, p.name, false, { priority: 0, live: () => run === fullRun }).catch(() => "");   // le compteur avance dans photoUrl
    }
  };
  await Promise.all([worker(), worker()]);
  if (run === fullRun) fullStatus.running = false;
  await refreshFullStatus();
}

/** Pause : on s’arrête là et les nouvelles photos ne se téléchargent plus toutes seules. */
export function stopFull(){
  fullRun++;
  fullStatus.running = false;
  fullStatus.auto = false;
  try { localStorage.setItem(HQ_KEY, "off"); } catch (_) { /* pas de stockage */ }
  emit(JOURNAL_PREFETCH);
}

/** Envoie les photos en attente (taille réduite : ~300 Ko chacune). */
async function uploadPhotos(){
  const m = load();
  for (const p of [...m.photos]) {
    for (const file of [p.name, thumbName(p.name)]) {
      const blob = await cacheGet(p.iso, file);
      if (!blob) continue;
      const res = await gh(`contents/journal/photos/${p.iso}/${file}`, { method: "PUT", body: JSON.stringify({
        message: `Photo ${p.iso}${by() ? " · " + by() : ""}`, content: await blobToB64(blob), branch: repoCfg().branch }) });
      if (!res.ok && res.status !== 422) throw new Error(res.status === 401 || res.status === 403 ? "jeton refusé" : `photo non envoyée (${res.status})`);
    }
    m.photos = m.photos.filter(x => x !== p);
    save();
  }
}

/** Anciennes coches « Fait » de « Et maintenant ? » (stockées par appareil) → journal partagé. */
function migrateLegacyProgress(){
  let old = null;
  try { old = JSON.parse(localStorage.getItem(DAY_PROGRESS_KEY) || "null"); } catch (_) { /* ignore */ }
  if (!old || typeof old !== "object") return;
  Object.entries(old).forEach(([iso, titles]) => (titles || []).forEach(t => {
    const id = plannedId(t);
    if (!journalDay(iso).items[id]) setPlannedStatus(iso, t, "done");
  }));
  try { localStorage.removeItem(DAY_PROGRESS_KEY); } catch (_) { /* ignore */ }
}

/* —— Réseau (API GitHub Contents) —— */

const b64 = (s) => {
  let bin = "";
  new TextEncoder().encode(s).forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin);
};
const unb64 = (s) => new TextDecoder().decode(Uint8Array.from(atob(String(s).replace(/\s/g, "")), c => c.charCodeAt(0)));

async function gh(path, init = {}){
  const { token } = journalConfig();
  const res = await fetch(`${API}/repos/${repoCfg().repo}${path ? "/" + path : ""}`, {
    cache: "no-store",
    ...init,
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}), ...(init.headers || {}) }
  });
  return res;
}

function setStatus(state, error = ""){
  syncStatus.state = state;
  syncStatus.error = error;
  if (state === "ok") syncStatus.at = Date.now();
  emit(JOURNAL_SYNC);
}

/** Crée la branche du journal (à partir de la branche par défaut) si elle n’existe pas encore. */
async function ensureBranch(){
  const br = repoCfg().branch;
  const have = await gh(`git/ref/heads/${encodeURIComponent(br)}`);
  if (have.ok) return;
  const repo = await gh("");
  if (!repo.ok) throw new Error(`dépôt inaccessible (${repo.status})`);
  const def = (await repo.json()).default_branch || "main";
  const base = await gh(`git/ref/heads/${encodeURIComponent(def)}`);
  if (!base.ok) throw new Error(`branche ${def} introuvable`);
  const sha = (await base.json()).object.sha;
  const made = await gh("git/refs", { method: "POST", body: JSON.stringify({ ref: `refs/heads/${br}`, sha }) });
  if (!made.ok && made.status !== 422) throw new Error(`création de la branche impossible (${made.status})`);
}

/** Liste des fichiers du journal sur le dépôt : { iso: sha }. */
async function remoteIndex(){
  const res = await gh(`contents/journal/days?ref=${encodeURIComponent(repoCfg().branch)}`);
  if (res.status === 404) return {};
  if (!res.ok) throw new Error(`lecture impossible (${res.status})`);
  const out = {};
  (await res.json()).forEach(f => { const m = /^(\d{4}-\d{2}-\d{2})\.json$/.exec(f.name); if (m) out[m[1]] = f.sha; });
  return out;
}

/** Fusionne le jour distant et envoie la version fusionnée si elle diffère. */
async function syncDay(iso, remoteSha){
  const m = load();
  for (let attempt = 0; attempt < 3; attempt++) {
    let remote = null, sha = remoteSha;
    if (sha || attempt > 0) {
      const res = await gh(`contents/journal/days/${iso}.json?ref=${encodeURIComponent(repoCfg().branch)}`);
      if (res.ok) {
        const j = await res.json();
        sha = j.sha;
        try { remote = sanitizeDay(JSON.parse(unb64(j.content))); } catch (_) { remote = emptyDay(); }
      } else if (res.status === 404) { sha = undefined; } else throw new Error(`lecture impossible (${res.status})`);
    }
    const local = journalDay(iso);
    const merged = remote ? mergeDay(local, remote) : local;
    const changedLocal = !sameDay(merged, local);
    const needPush = !remote ? m.dirty.includes(iso) && Object.keys(local.items).length > 0 : !sameDay(merged, remote);
    if (changedLocal) { m.days[iso] = merged; emit(JOURNAL_CHANGED); }
    if (!needPush) { if (sha) m.shas[iso] = sha; m.dirty = m.dirty.filter(d => d !== iso); save(); return; }
    const put = await gh(`contents/journal/days/${iso}.json`, { method: "PUT", body: JSON.stringify({
      message: `Journal ${iso}${by() ? " · " + by() : ""}`, content: b64(JSON.stringify(merged, null, 1)), branch: repoCfg().branch, ...(sha ? { sha } : {}) }) });
    if (put.ok) {
      m.shas[iso] = (await put.json()).content.sha;
      if (sameDay(journalDay(iso), merged)) m.dirty = m.dirty.filter(d => d !== iso);   // pas modifié pendant l’envoi
      save();
      return;
    }
    if (put.status !== 409 && put.status !== 422) throw new Error(put.status === 401 || put.status === 403 ? "jeton refusé" : `envoi impossible (${put.status})`);
    remoteSha = undefined;   // conflit : relire puis fusionner à nouveau
  }
  throw new Error("conflit répété — réessaie dans un instant");
}

/** Synchronise tout ce qui a changé (un seul appel réseau s’il n’y a rien de nouveau). */
/** Sans jeton (famille) : lecture publique du journal, fusionnée dans le journal local. Au plus toutes les 3 minutes. */
let lastPublic = 0;
async function pullPublic(){
  if (!repoCfg().repo || navigator.onLine === false || Date.now() - lastPublic < 180000) return;
  lastPublic = Date.now();
  const today = japanTodayISO();
  const days = await loadPublicJournal(repoCfg(), DAYS.map(dayToISO).filter(iso => iso && iso <= today));
  const m = load();
  let changed = false;
  days.forEach(([iso, remote]) => {
    const merged = mergeDay(journalDay(iso), remote);
    if (!sameDay(merged, journalDay(iso))) { m.days[iso] = merged; changed = true; }
  });
  if (changed) { save(); emit(JOURNAL_CHANGED); }
  setStatus("public");
  prefetchPhotos();
}

export async function syncNow(){
  if (!journalReady()) { setStatus("nocfg"); pullPublic().catch(() => {}); return; }
  if (navigator.onLine === false) { setStatus("offline"); return; }
  if (running) { again = true; return; }
  running = true;
  setStatus("syncing");
  try {
    const m = load();
    if ((m.dirty.length || m.photos.length) && !Object.keys(m.shas).length) await ensureBranch();
    await uploadPhotos();
    let index = await remoteIndex();
    const isos = new Set([...m.dirty, ...Object.keys(index).filter(iso => index[iso] !== m.shas[iso])]);
    for (const iso of [...isos].sort()) {
      try { await syncDay(iso, index[iso]); }
      catch (e) {
        if (!Object.keys(index).length && /404|422/.test(String(e.message))) { await ensureBranch(); index = await remoteIndex(); await syncDay(iso, index[iso]); }
        else throw e;
      }
    }
    setStatus("ok");
    prefetchPhotos();
  } catch (e) {
    setStatus("error", e && e.message ? e.message : "erreur réseau");
  } finally {
    running = false;
    if (again) { again = false; setTimeout(syncNow, 500); }
  }
}

function scheduleSync(){
  clearTimeout(scheduleSync.t);
  scheduleSync.t = setTimeout(syncNow, 800);
}

/** Teste le jeton : { ok, message }. */
export async function testConnection(){
  if (!journalConfig().token) return { ok: false, message: "Colle d’abord le jeton." };
  try {
    const res = await gh("");
    if (res.status === 401) return { ok: false, message: "Jeton refusé (expiré ou mal copié)." };
    if (res.status === 404) return { ok: false, message: "Dépôt introuvable avec ce jeton (accès au dépôt manquant ?)." };
    if (!res.ok) return { ok: false, message: `Erreur GitHub (${res.status}).` };
    const j = await res.json();
    if (j.permissions && j.permissions.push === false) return { ok: false, message: "Le jeton peut lire mais pas écrire : donne-lui « Contents : lecture et écriture »." };
    return { ok: true, message: "Connecté au dépôt " + j.full_name + "." };
  } catch (_) {
    return { ok: false, message: "Pas de réseau." };
  }
}

/** Démarre le journal : charge, migre les anciennes coches, synchronise et surveille le retour au premier plan. */
export function initJournalStore(){
  // Demande au navigateur de ne pas vider le stockage de l’app (photos du journal) quand l’espace manque
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { /* refusé : tant pis */ }); } catch (_) { /* ignoré */ }
  load();
  try { fullStatus.auto = localStorage.getItem(HQ_KEY) === "on"; } catch (_) { /* ignoré */ }
  refreshFullStatus();
  migrateLegacyProgress();
  document.addEventListener("visibilitychange", () => { if (!document.hidden) syncNow(); });
  window.addEventListener("online", syncNow);
  clearInterval(timer);
  timer = setInterval(() => { if (!document.hidden) syncNow(); }, SYNC_EVERY_MS);
  syncNow();
}
