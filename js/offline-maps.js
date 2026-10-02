/* Cartes hors ligne : toutes les tuiles passent par le protocole « jtcache:// »
   (thread principal → Cache API). Cache d’abord, réseau ensuite ; chaque tuile vue
   est gardée. Le bouton de Réglages pré-télécharge le Japon + les 8 villes. */
const TILE_CACHE = "japan-tiles-v1";
const OFFLINE_MAPS_KEY = "japan-trip-offline-maps-v1";
const TILE_PROTOCOL = "jtcache";

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
  const cache = hasCacheApi() ? await caches.open(TILE_CACHE) : null;
  try {
    const res = await fetchWithTimeout(realUrl, navigator.onLine === false ? 1 : 6000, signal);
    if (!res.ok) throw new Error("HTTP " + res.status);
    if (cache) { try { await cache.put(key, res.clone()); } catch (_) { /* quota */ } }
    return protocolize(await res.json());
  } catch (e) {
    const hit = cache && await cache.match(key);
    if (hit) return protocolize(await hit.json());
    throw e;
  }
}

/** Tuile / glyphe / relief : cache d’abord. */
async function loadTileBytes(realUrl, signal){
  const key = tileCacheKey(realUrl);
  const cache = hasCacheApi() ? await caches.open(TILE_CACHE) : null;
  if (cache) {
    const hit = await cache.match(key);
    if (hit) return hit.arrayBuffer();
  }
  const res = await fetchWithTimeout(realUrl, 20000, signal);
  if (res.status === 404 || res.status === 204) return new ArrayBuffer(0);
  if (!res.ok) throw new Error("HTTP " + res.status);
  if (cache) { try { await cache.put(key, res.clone()); } catch (_) { /* quota */ } }
  return res.arrayBuffer();
}

if (typeof maplibregl !== "undefined" && maplibregl.addProtocol) {
  maplibregl.addProtocol(TILE_PROTOCOL, async (params, abortController) => {
    const realUrl = tileRealUrl(params.url);
    const signal = abortController && abortController.signal;
    if (isTileJsonUrl(realUrl)) return { data: await loadTileJson(realUrl, signal) };
    return { data: await loadTileBytes(realUrl, signal) };
  });
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

let offlineDownload = null;
/** Télécharge ce qui manque ; onProgress(done, total, bytes). */
async function downloadOfflineMaps(onProgress){
  if (!hasCacheApi()) throw new Error("Cache indisponible sur ce navigateur");
  if (offlineDownload) return offlineDownload.promise;
  const ctrl = new AbortController();
  const run = (async () => {
    try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (_) { /* ignore */ }
    const urls = await offlineMapUrls();
    const cache = await caches.open(TILE_CACHE);
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
function cancelOfflineMaps(){
  if (offlineDownload) offlineDownload.ctrl.abort();
}
async function clearOfflineMaps(){
  cancelOfflineMaps();
  try { localStorage.removeItem(OFFLINE_MAPS_KEY); } catch (_) { /* ignore */ }
  if (hasCacheApi()) await caches.delete(TILE_CACHE);
}
function offlineMapsInfo(){
  try { return JSON.parse(localStorage.getItem(OFFLINE_MAPS_KEY) || "null"); } catch (_) { return null; }
}
async function offlineStorageUsage(){
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const e = await navigator.storage.estimate();
      return e.usage || 0;
    }
  } catch (_) { /* ignore */ }
  return null;
}
