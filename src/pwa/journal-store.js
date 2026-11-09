/* Journal de voyage partagé : stockage local (marche hors ligne) + synchro avec le dépôt GitHub.
   - Les modifications sont enregistrées tout de suite sur le téléphone, puis envoyées dès que possible.
   - Un fichier par jour (journal/days/AAAA-MM-JJ.json) sur la branche `journal` ; fusion par item (domain/journal.js).
   - Le jeton GitHub (limité à ce dépôt) est saisi dans Réglages et reste sur l’appareil. */

import { DAY_PROGRESS_KEY, JOURNAL_CFG_KEY, JOURNAL_KEY } from "../config.js";
import { TRIP } from "../core/data.js";
import { emptyDay, livePhotos, mergeDay, newExtraId, plannedId, sameDay, sanitizeDay, setLike, likedBy, thumbName, upsertItem } from "../domain/journal.js";
import { resizeImage } from "./photo-resize.js";

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

/** Ajoute une activité non prévue ; retourne son id. */
export function addExtra(iso, fields){
  const id = newExtraId();
  commit(iso, upsertItem(journalDay(iso), id, { kind: "extra", title: fields.title, status: "done" }, { ...fields, by: by() }));
  return id;
}

export function patchItem(iso, id, patch){
  commit(iso, upsertItem(journalDay(iso), id, {}, { ...patch, by: by() }));
}

export function removeItem(iso, id){
  commit(iso, upsertItem(journalDay(iso), id, {}, { deleted: true, by: by() }));
}

/* —— Photos : réduites sur le téléphone, gardées dans le cache de l’appareil, envoyées au dépôt —— */

const PHOTO_CACHE = "japan-journal-v1";
const FULL_PX = 1600, THUMB_PX = 400;
const blobs = new Map();          // secours si le cache du navigateur est indisponible
const urls = new Map();           // clé → URL d’objet déjà créée
const photoKey = (iso, name) => `https://journal.invalid/${iso}/${name}`;

async function cachePut(iso, name, blob){
  blobs.set(photoKey(iso, name), blob);
  try { await (await caches.open(PHOTO_CACHE)).put(photoKey(iso, name), new Response(blob, { headers: { "Content-Type": "image/jpeg" } })); } catch (_) { /* pas de cache */ }
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

/**
 * Ajoute des photos à une idée du programme (`target` = { title }) ou à une activité ajoutée (`target` = { id }).
 * Retourne le nombre de photos ajoutées.
 */
export async function addPhotos(iso, target, files){
  const names = [];
  for (const file of files) {
    try {
      const [full, thumb] = [await resizeImage(file, FULL_PX, 0.82), await resizeImage(file, THUMB_PX, 0.7)];
      const name = `${Date.now().toString(36)}${Math.floor(Math.random() * 46656).toString(36).padStart(3, "0")}.jpg`;
      await cachePut(iso, name, full);
      await cachePut(iso, thumbName(name), thumb);
      load().photos.push({ iso, name });
      names.push(name);
    } catch (_) { /* photo illisible : ignorée */ }
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

/** Retire une photo (de tous les téléphones). */
export function removePhoto(iso, id, name){
  const cur = journalDay(iso).items[id];
  if (!cur) return;
  commit(iso, upsertItem(journalDay(iso), id, {}, { gone: [...(cur.gone || []), name], by: by() }));
}

/** URL affichable d’une photo : cache de l’appareil, sinon téléchargement depuis le dépôt (puis mise en cache). */
export async function photoUrl(iso, name, thumb){
  const file = thumb ? thumbName(name) : name;
  const k = photoKey(iso, file);
  if (urls.has(k)) return urls.get(k);
  let blob = await cacheGet(iso, file);
  if (!blob && journalReady() && navigator.onLine !== false) {
    try {
      const res = await gh(`contents/journal/photos/${iso}/${file}?ref=${encodeURIComponent(repoCfg().branch)}`, { headers: { Accept: "application/vnd.github.raw+json" } });
      if (res.ok) { blob = await res.blob(); if (blob.size) await cachePut(iso, file, blob); }
    } catch (_) { /* réseau */ }
  }
  if (!blob || !blob.size) return "";
  const url = URL.createObjectURL(blob);
  urls.set(k, url);
  return url;
}

const blobToB64 = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(",")[1] || "");
  r.onerror = () => reject(new Error("lecture de la photo"));
  r.readAsDataURL(blob);
});

/** Préchargement : { done, total } des photos du journal déjà gardées sur ce téléphone (pour la barre « prêtes hors ligne »). */
export const prefetchStatus = { done: 0, total: 0, running: false };
let prefetching = false;

/** Télécharge sur le téléphone toutes les photos du journal (miniature + taille réduite), 3 à la fois. */
export async function prefetchPhotos(){
  if (prefetching || navigator.onLine === false) return;
  prefetching = true;
  const all = Object.entries(load().days).flatMap(([iso, d]) => Object.values(d.items || {}).flatMap(it => livePhotos(it).map(name => ({ iso, name }))));
  prefetchStatus.total = all.length;
  prefetchStatus.done = 0;
  prefetchStatus.running = true;
  emit(JOURNAL_PREFETCH);
  const queue = all.slice();
  const worker = async () => {
    while (queue.length) {
      const p = queue.shift();
      await photoUrl(p.iso, thumbName(p.name), false).catch(() => "");
      await photoUrl(p.iso, p.name, false).catch(() => "");
      prefetchStatus.done++;
      emit(JOURNAL_PREFETCH);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  prefetchStatus.running = false;
  prefetching = false;
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
export async function syncNow(){
  if (!journalReady()) { setStatus("nocfg"); return; }
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
  load();
  migrateLegacyProgress();
  document.addEventListener("visibilitychange", () => { if (!document.hidden) syncNow(); });
  window.addEventListener("online", syncNow);
  clearInterval(timer);
  timer = setInterval(() => { if (!document.hidden) syncNow(); }, SYNC_EVERY_MS);
  syncNow();
}
