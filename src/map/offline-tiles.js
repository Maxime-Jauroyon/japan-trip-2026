/* Cartes hors ligne : toutes les tuiles passent par le protocole « jtcache:// »
   (thread principal → Cache API). Cache d’abord, réseau ensuite ; chaque tuile vue
   est gardée. Le bouton de Réglages pré-télécharge le Japon + les 8 villes. */

import { OFFLINE_MAPS_KEY, TILE_CACHE, TILE_PROTOCOL, TILES_WARM_KEY as WARM_KEY } from "../config.js";
import { JAPAN_BOUNDS, MAP_BOUNDS, ORDER } from "../core/data.js";
import { MAP_DEM_TILES, MAP_FONT, MAP_FONT_BOLD, MAP_FONT_ITALIC, MAP_GLYPHS_URL, MAP_TILES_URL } from "./map-style.js";

function tileRealUrl(url){
  return url.replace(TILE_PROTOCOL + "://", "https://");
}

/** Clé de cache stable : OpenFreeMap change le dossier de version chaque semaine. */
function tileCacheKey(realUrl){
  return realUrl.replace(/(tiles\.openfreemap\.org\/planet)\/[^/]+\/(\d+\/\d+\/\d+\.pbf)$/, "$1/_/$2");
}

function isTileJsonUrl(realUrl){
  return /tiles\.openfreemap\.org\/planet\/?$/.test(realUrl);
}

function hasCacheApi(){
  try { return typeof caches !== "undefined" && !!caches.open; } catch (_) { return false; }
}

/** Cache des tuiles, ouvert une seule fois (et non à chaque tuile). */
let cachePromise = null;
function tileCache(){
  if (!hasCacheApi()) return Promise.resolve(null);
  if (!cachePromise) cachePromise = caches.open(TILE_CACHE).catch(() => null);
  return cachePromise;
}

/** Écriture en cache en arrière-plan : la tuile s’affiche sans attendre le disque. */
function putLater(cache, key, res){
  if (cache) cache.put(key, res).catch(() => { /* quota */ });
}

/** Lecture du cache bornée : au-delà de `ms`, on n’attend plus (le réseau prend le relais). */
function matchWithin(cache, key, ms){
  if (!cache) return Promise.resolve(null);
  return Promise.race([
    cache.match(key).catch(() => null),
    new Promise(r => setTimeout(() => r(undefined), ms))
  ]);
}

function fetchWithTimeout(url, ms, signal){
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  if (signal) signal.addEventListener("abort", () => ctrl.abort());
  return fetch(url, { signal: ctrl.signal, mode: "cors", credentials: "omit" }).finally(() => clearTimeout(t));
}

function protocolize(json){
  const out = Object.assign({}, json);
  if (Array.isArray(out.tiles)) out.tiles = out.tiles.map(u => u.replace(/^https:\/\//, TILE_PROTOCOL + "://"));
  return out;
}

/** TileJSON : réseau d’abord (version fraîche), cache sinon. */
async function loadTileJson(realUrl, signal){
  const key = tileCacheKey(realUrl);
  const cache = await tileCache();
  try {
    const res = await fetchWithTimeout(realUrl, navigator.onLine === false ? 1 : 6000, signal);
    if (!res.ok) throw new Error("HTTP " + res.status);
    putLater(cache, key, res.clone());
    return protocolize(await res.json());
  } catch (e) {
    const hit = cache && await cache.match(key);
    if (hit) return protocolize(await hit.json());
    throw e;
  }
}

/** Tuile / glyphe / relief : cache d’abord (attente bornée), réseau sinon ; mise en cache sans bloquer. */
async function loadTileBytes(realUrl, signal){
  const key = tileCacheKey(realUrl);
  const cache = await tileCache();
  const pending = cache ? cache.match(key).catch(() => null) : null;
  const hit = await matchWithin(cache, key, 150);
  if (hit) return hit.arrayBuffer();
  try {
    const res = await fetchWithTimeout(realUrl, 20000, signal);
    if (res.status === 404 || res.status === 204) return new ArrayBuffer(0);
    if (!res.ok) throw new Error("HTTP " + res.status);
    putLater(cache, key, res.clone());
    return await res.arrayBuffer();
  } catch (e) {
    // Hors ligne : le cache lent finira peut-être par répondre
    const late = pending && await pending;
    if (late) return late.arrayBuffer();
    throw e;
  }
}

/* —— Pré-téléchargement —— */
function lngToTileX(lng, z){ return Math.floor((lng + 180) / 360 * Math.pow(2, z)); }

function latToTileY(lat, z){
  const r = lat * Math.PI / 180;
  return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z));
}

function tilesInBounds(b, z){
  const out = [];
  const x0 = lngToTileX(b.west, z), x1 = lngToTileX(b.east, z);
  const y0 = latToTileY(b.north, z), y1 = latToTileY(b.south, z);
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push([z, x, y]);
  return out;
}

function padBounds(b, k){
  const dx = (b.east - b.west) * k, dy = (b.north - b.south) * k;
  return { west: b.west - dx, east: b.east + dx, south: b.south - dy, north: b.north + dy };
}

const OFFLINE_GLYPH_RANGES = ["0-255", "256-511", "8192-8447", "9472-9727"];

/** Liste des URL à télécharger (Japon en 3D + villes jusqu’au z14, relief, polices). */
async function offlineMapUrls(){
  const tj = await loadTileJson(MAP_TILES_URL);
  const tpl = tileRealUrl((tj.tiles || [])[0] || "");
  if (!tpl) throw new Error("TileJSON sans tuiles");
  const maxz = Math.min(14, tj.maxzoom || 14);
  const vec = (z, x, y) => tpl.replace("{z}", z).replace("{x}", x).replace("{y}", y);
  const dem = (z, x, y) => MAP_DEM_TILES.replace("{z}", z).replace("{x}", x).replace("{y}", y);
  const urls = new Set();
  const japanWide = { west: 128.5, east: 146, south: 30.5, north: 42 };
  for (let z = 4; z <= 6; z++) tilesInBounds(japanWide, z).forEach(t => { urls.add(vec(...t)); urls.add(dem(...t)); });
  const trip = padBounds(JAPAN_BOUNDS, 0.08);
  for (let z = 7; z <= 9; z++) tilesInBounds(trip, z).forEach(t => { urls.add(vec(...t)); urls.add(dem(...t)); });
  ORDER.forEach(id => {
    const b = padBounds(MAP_BOUNDS[id], 0.12);
    for (let z = 10; z <= maxz; z++) tilesInBounds(b, z).forEach(t => urls.add(vec(...t)));
    for (let z = 10; z <= 11; z++) tilesInBounds(b, z).forEach(t => urls.add(dem(...t)));
  });
  [MAP_FONT, MAP_FONT_BOLD, MAP_FONT_ITALIC].forEach(stack => {
    OFFLINE_GLYPH_RANGES.forEach(r => {
      urls.add(MAP_GLYPHS_URL.replace("{fontstack}", encodeURIComponent(stack.join(","))).replace("{range}", r));
    });
  });
  return [...urls];
}

/** Tuiles de la vue Japon (z4–z8, carte + relief) : celles du premier écran. */
async function japanViewUrls(){
  const tj = await loadTileJson(MAP_TILES_URL);
  const tpl = tileRealUrl((tj.tiles || [])[0] || "");
  if (!tpl) return [];
  const vec = (z, x, y) => tpl.replace("{z}", z).replace("{x}", x).replace("{y}", y);
  const dem = (z, x, y) => MAP_DEM_TILES.replace("{z}", z).replace("{x}", x).replace("{y}", y);
  const urls = new Set();
  const trip = padBounds(JAPAN_BOUNDS, 0.1);
  for (let z = 4; z <= 8; z++) tilesInBounds(trip, z).forEach(t => { urls.add(vec(...t)); urls.add(dem(...t)); });
  return [...urls];
}

/**
 * Pré-chargement discret (ordinateur, connexion non limitée) : met en cache la vue Japon en tâche
 * de fond, 2 requêtes à la fois, une fois par version — les visites suivantes sont instantanées.
 */
export async function warmJapanTiles(version){
  const conn = navigator.connection;
  if (!hasCacheApi() || offlineDownload || (conn && (conn.saveData || /2g/.test(conn.effectiveType || "")))) return;
  try { if (localStorage.getItem(WARM_KEY) === version) return; } catch (_) { return; }
  try {
    const cache = await tileCache();
    const urls = await japanViewUrls();
    let i = 0;
    const worker = async () => {
      while (i < urls.length) {
        if (offlineDownload) return;   // le téléchargement complet prend le relais
        const url = urls[i++], key = tileCacheKey(url);
        try {
          if (await cache.match(key)) continue;
          const res = await fetchWithTimeout(url, 20000);
          if (res.ok) await cache.put(key, res);
        } catch (_) { /* tuile suivante */ }
      }
    };
    await Promise.all([worker(), worker()]);
    localStorage.setItem(WARM_KEY, version);
  } catch (_) { /* hors ligne : on réessaiera */ }
}

export let offlineDownload = null;

/** Télécharge ce qui manque ; onProgress(done, total, bytes). */
export async function downloadOfflineMaps(onProgress){
  if (!hasCacheApi()) throw new Error("Cache indisponible sur ce navigateur");
  if (offlineDownload) return offlineDownload.promise;
  const ctrl = new AbortController();
  const run = (async () => {
    try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (_) { /* ignore */ }
    const urls = await offlineMapUrls();
    const cache = await tileCache();
    let done = 0, bytes = 0, failed = 0, i = 0;
    const total = urls.length;
    const worker = async () => {
      while (i < urls.length) {
        if (ctrl.signal.aborted) return;
        const url = urls[i++];
        const key = tileCacheKey(url);
        try {
          const hit = await cache.match(key);
          if (!hit) {
            const res = await fetchWithTimeout(url, 25000, ctrl.signal);
            if (res.ok) {
              const buf = await res.clone().arrayBuffer();
              bytes += buf.byteLength;
              await cache.put(key, res);
            } else if (res.status !== 404 && res.status !== 204) failed++;
          }
        } catch (e) {
          if (ctrl.signal.aborted) return;
          failed++;
        }
        done++;
        if (onProgress) onProgress(done, total, bytes);
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    if (ctrl.signal.aborted) throw new Error("Téléchargement annulé");
    const info = { at: new Date().toISOString(), total, failed };
    try { localStorage.setItem(OFFLINE_MAPS_KEY, JSON.stringify(info)); } catch (_) { /* ignore */ }
    return info;
  })();
  offlineDownload = { promise: run, ctrl };
  try { return await run; } finally { offlineDownload = null; }
}

export function cancelOfflineMaps(){
  if (offlineDownload) offlineDownload.ctrl.abort();
}

export async function clearOfflineMaps(){
  cancelOfflineMaps();
  try { localStorage.removeItem(OFFLINE_MAPS_KEY); } catch (_) { /* ignore */ }
  cachePromise = null;
  if (hasCacheApi()) await caches.delete(TILE_CACHE);
}

export function offlineMapsInfo(){
  try { return JSON.parse(localStorage.getItem(OFFLINE_MAPS_KEY) || "null"); } catch (_) { return null; }
}

export async function offlineStorageUsage(){
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const e = await navigator.storage.estimate();
      return e.usage || 0;
    }
  } catch (_) { /* ignore */ }
  return null;
}

/** Branche le protocole jtcache:// sur MapLibre (à appeler avant la création de la carte). */
export function registerTileProtocol() {
  if (typeof maplibregl === "undefined" || !maplibregl.addProtocol) return;
  maplibregl.addProtocol(TILE_PROTOCOL, async (params, abortController) => {
    const realUrl = tileRealUrl(params.url);
    const signal = abortController && abortController.signal;
    if (isTileJsonUrl(realUrl)) return { data: await loadTileJson(realUrl, signal) };
    return { data: await loadTileBytes(realUrl, signal) };
  });
}
