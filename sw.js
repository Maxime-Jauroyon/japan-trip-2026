/* Service worker — cache hors ligne (1re visite en Wi‑Fi, puis utilisable sans réseau dans Safari).
   - Code, styles, données : réseau d’abord (mises à jour immédiates), cache si hors ligne / lent.
   - Librairie MapLibre et images : cache d’abord.
   - Tuiles de carte : cache séparé TILE_CACHE, géré par src/map/offline-tiles.js, jamais purgé ici.
   Version : scripts/bump-version.mjs · liste ASSETS : scripts/gen-precache.mjs. */
const CACHE = "japan-trip-2026-v176";
const TILE_CACHE = "japan-tiles-v1";
const NETWORK_TIMEOUT_MS = 4000;

// <precache> — généré par scripts/gen-precache.mjs, ne pas éditer à la main
const ASSETS = [
  "./",
  "./index.html",
  "./sw.js",
  "./data/cities.json",
  "./data/days.json",
  "./data/journeys.json",
  "./data/legs.json",
  "./data/photos.json",
  "./data/phrases.json",
  "./data/places-meta.json",
  "./data/practical.json",
  "./data/prep.json",
  "./data/trip.json",
  "./img/activities/akihabara-2.jpg",
  "./img/activities/akihabara-3.jpg",
  "./img/activities/akihabara.jpg",
  "./img/activities/animate.jpg",
  "./img/activities/arashiyama-2.jpg",
  "./img/activities/arashiyama-3.jpg",
  "./img/activities/arashiyama.jpg",
  "./img/activities/character-street-2.jpg",
  "./img/activities/character-street-3.jpg",
  "./img/activities/character-street.jpg",
  "./img/activities/chureito-2.jpg",
  "./img/activities/chureito-3.jpg",
  "./img/activities/chureito.jpg",
  "./img/activities/daigo-2.jpg",
  "./img/activities/daigo-3.jpg",
  "./img/activities/daigo.jpg",
  "./img/activities/denden-2.jpg",
  "./img/activities/denden.jpg",
  "./img/activities/dotonbori-2.jpg",
  "./img/activities/dotonbori-3.jpg",
  "./img/activities/dotonbori.jpg",
  "./img/activities/fujiq-2.jpg",
  "./img/activities/fujiq-3.jpg",
  "./img/activities/fujiq.jpg",
  "./img/activities/fushimi-2.jpg",
  "./img/activities/fushimi-3.jpg",
  "./img/activities/fushimi.jpg",
  "./img/activities/ginza-2.jpg",
  "./img/activities/ginza-3.jpg",
  "./img/activities/ginza.jpg",
  "./img/activities/gold-leaf-2.jpg",
  "./img/activities/gold-leaf.jpg",
  "./img/activities/harajuku-2.jpg",
  "./img/activities/harajuku-3.jpg",
  "./img/activities/harajuku.jpg",
  "./img/activities/higashi-chaya-2.jpg",
  "./img/activities/higashi-chaya-3.jpg",
  "./img/activities/higashi-chaya.jpg",
  "./img/activities/hozenji-2.jpg",
  "./img/activities/hozenji-3.jpg",
  "./img/activities/hozenji.jpg",
  "./img/activities/imperial-2.jpg",
  "./img/activities/imperial-3.jpg",
  "./img/activities/imperial.jpg",
  "./img/activities/itchiku-2.jpg",
  "./img/activities/itchiku-3.jpg",
  "./img/activities/itchiku.jpg",
  "./img/activities/jinya-2.jpg",
  "./img/activities/jinya-3.jpg",
  "./img/activities/jinya.jpg",
  "./img/activities/kanazawa-castle-2.jpg",
  "./img/activities/kanazawa-castle-3.jpg",
  "./img/activities/kanazawa-castle.jpg",
  "./img/activities/kanazawa-museum-2.jpg",
  "./img/activities/kanazawa-museum-3.jpg",
  "./img/activities/kanazawa-museum.jpg",
  "./img/activities/kasuga-2.jpg",
  "./img/activities/kasuga-3.jpg",
  "./img/activities/kasuga.jpg",
  "./img/activities/kawaguchi-2.jpg",
  "./img/activities/kawaguchi-3.jpg",
  "./img/activities/kawaguchi.jpg",
  "./img/activities/kenrokuen-2.jpg",
  "./img/activities/kenrokuen-3.jpg",
  "./img/activities/kenrokuen.jpg",
  "./img/activities/kinkakuji-2.jpg",
  "./img/activities/kinkakuji-3.jpg",
  "./img/activities/kinkakuji.jpg",
  "./img/activities/kiyomizu-2.jpg",
  "./img/activities/kiyomizu-3.jpg",
  "./img/activities/kiyomizu.jpg",
  "./img/activities/kofukuji-2.jpg",
  "./img/activities/kofukuji-3.jpg",
  "./img/activities/kofukuji.jpg",
  "./img/activities/kuromon-2.jpg",
  "./img/activities/kuromon-3.jpg",
  "./img/activities/kuromon.jpg",
  "./img/activities/meiji-2.jpg",
  "./img/activities/meiji-3.jpg",
  "./img/activities/meiji.jpg",
  "./img/activities/miyagawa-2.jpg",
  "./img/activities/miyagawa-3.jpg",
  "./img/activities/miyagawa.jpg",
  "./img/activities/momiji.jpg",
  "./img/activities/music-forest-2.jpg",
  "./img/activities/music-forest-3.jpg",
  "./img/activities/music-forest.jpg",
  "./img/activities/myoryuji.jpg",
  "./img/activities/nagamachi-2.jpg",
  "./img/activities/nagamachi-3.jpg",
  "./img/activities/nagamachi.jpg",
  "./img/activities/namba-yasaka-2.jpg",
  "./img/activities/namba-yasaka-3.jpg",
  "./img/activities/namba-yasaka.jpg",
  "./img/activities/nara-park-2.jpg",
  "./img/activities/nara-park-3.jpg",
  "./img/activities/nara-park.jpg",
  "./img/activities/nijo-2.jpg",
  "./img/activities/nijo-3.jpg",
  "./img/activities/nijo.jpg",
  "./img/activities/nishi-chaya-2.jpg",
  "./img/activities/nishi-chaya-3.jpg",
  "./img/activities/nishi-chaya.jpg",
  "./img/activities/nishiki-2.jpg",
  "./img/activities/nishiki-3.jpg",
  "./img/activities/nishiki.jpg",
  "./img/activities/odaiba-2.jpg",
  "./img/activities/odaiba-3.jpg",
  "./img/activities/odaiba.jpg",
  "./img/activities/omicho-2.jpg",
  "./img/activities/omicho-3.jpg",
  "./img/activities/omicho.jpg",
  "./img/activities/osaka-castle-2.jpg",
  "./img/activities/osaka-castle-3.jpg",
  "./img/activities/osaka-castle.jpg",
  "./img/activities/oshino-2.jpg",
  "./img/activities/oshino-3.jpg",
  "./img/activities/oshino.jpg",
  "./img/activities/oyama-2.jpg",
  "./img/activities/oyama-3.jpg",
  "./img/activities/oyama.jpg",
  "./img/activities/philosopher-2.jpg",
  "./img/activities/philosopher-3.jpg",
  "./img/activities/philosopher.jpg",
  "./img/activities/pontocho-2.jpg",
  "./img/activities/pontocho-3.jpg",
  "./img/activities/pontocho.jpg",
  "./img/activities/ropeway-2.jpg",
  "./img/activities/ropeway-3.jpg",
  "./img/activities/ropeway.jpg",
  "./img/activities/saiko-2.jpg",
  "./img/activities/saiko-3.jpg",
  "./img/activities/saiko.jpg",
  "./img/activities/sanmachi-2.jpg",
  "./img/activities/sanmachi.jpg",
  "./img/activities/sensoji-2.jpg",
  "./img/activities/sensoji-3.jpg",
  "./img/activities/sensoji.jpg",
  "./img/activities/shibuya-2.jpg",
  "./img/activities/shibuya-3.jpg",
  "./img/activities/shibuya.jpg",
  "./img/activities/shinjuku-2.jpg",
  "./img/activities/shinjuku-3.jpg",
  "./img/activities/shinjuku.jpg",
  "./img/activities/shinsaibashi-2.jpg",
  "./img/activities/shinsaibashi-3.jpg",
  "./img/activities/shinsaibashi.jpg",
  "./img/activities/shinsekai-2.jpg",
  "./img/activities/shinsekai.jpg",
  "./img/activities/shirakawa-2.jpg",
  "./img/activities/shirakawa-3.jpg",
  "./img/activities/shirakawa.jpg",
  "./img/activities/sumida-2.jpg",
  "./img/activities/sumida-3.jpg",
  "./img/activities/sumida.jpg",
  "./img/activities/tea-2.jpg",
  "./img/activities/tea-3.jpg",
  "./img/activities/tea.jpg",
  "./img/activities/teamlab-2.jpg",
  "./img/activities/teamlab-3.jpg",
  "./img/activities/teamlab.jpg",
  "./img/activities/teramachi.jpg",
  "./img/activities/todaiji-2.jpg",
  "./img/activities/todaiji-3.jpg",
  "./img/activities/todaiji.jpg",
  "./img/activities/tokyo-tower-2.jpg",
  "./img/activities/tokyo-tower-3.jpg",
  "./img/activities/tokyo-tower.jpg",
  "./img/activities/ueno-2.jpg",
  "./img/activities/ueno-3.jpg",
  "./img/activities/ueno.jpg",
  "./img/activities/usj-2.jpg",
  "./img/activities/usj-3.jpg",
  "./img/activities/usj.jpg",
  "./img/activities/wagashi-2.jpg",
  "./img/activities/wagashi-3.jpg",
  "./img/activities/wagashi.jpg",
  "./img/activities/yanaka-2.jpg",
  "./img/activities/yanaka-3.jpg",
  "./img/activities/yanaka.jpg",
  "./img/activities/yasaka-2.jpg",
  "./img/activities/yasaka-3.jpg",
  "./img/activities/yasaka.jpg",
  "./img/hotels/agora-kyoto-2.jpg",
  "./img/hotels/agora-kyoto-3.jpg",
  "./img/hotels/agora-kyoto-4.jpg",
  "./img/hotels/agora-kyoto.jpg",
  "./img/hotels/deer-park-nara-2.jpg",
  "./img/hotels/deer-park-nara-3.jpg",
  "./img/hotels/deer-park-nara-4.jpg",
  "./img/hotels/deer-park-nara.jpg",
  "./img/hotels/garner-osaka-2.jpg",
  "./img/hotels/garner-osaka-3.jpg",
  "./img/hotels/garner-osaka-4.jpg",
  "./img/hotels/garner-osaka.jpg",
  "./img/hotels/henn-na-kanazawa-2.jpg",
  "./img/hotels/henn-na-kanazawa-3.jpg",
  "./img/hotels/henn-na-kanazawa-4.jpg",
  "./img/hotels/henn-na-kanazawa.jpg",
  "./img/hotels/homenest-akihabara-2.jpg",
  "./img/hotels/homenest-akihabara-3.jpg",
  "./img/hotels/homenest-akihabara-4.jpg",
  "./img/hotels/homenest-akihabara-5.jpg",
  "./img/hotels/homenest-akihabara-6.jpg",
  "./img/hotels/homenest-akihabara.jpg",
  "./img/hotels/kawaguchiko-2.jpg",
  "./img/hotels/kawaguchiko-3.jpg",
  "./img/hotels/kawaguchiko-4.jpg",
  "./img/hotels/kawaguchiko.jpg",
  "./img/hotels/mercure-takayama-2.jpg",
  "./img/hotels/mercure-takayama-3.jpg",
  "./img/hotels/mercure-takayama-4.jpg",
  "./img/hotels/mercure-takayama.jpg",
  "./img/hotels/royal-park-haneda-2.jpg",
  "./img/hotels/royal-park-haneda-3.jpg",
  "./img/hotels/royal-park-haneda-4.jpg",
  "./img/hotels/royal-park-haneda.jpg",
  "./img/logo.svg",
  "./lib/maplibre/maplibre-gl.css",
  "./lib/maplibre/maplibre-gl.js",
  "./src/config.js",
  "./src/core/checklist-store.js",
  "./src/core/data.js",
  "./src/core/dates.js",
  "./src/core/dom.js",
  "./src/core/elements.js",
  "./src/core/env.js",
  "./src/core/hooks.js",
  "./src/core/state.js",
  "./src/domain/bookings.js",
  "./src/domain/classify.js",
  "./src/domain/itinerary.js",
  "./src/domain/legs.js",
  "./src/domain/photos.js",
  "./src/domain/places.js",
  "./src/domain/trip.js",
  "./src/main.js",
  "./src/map/city.js",
  "./src/map/controller.js",
  "./src/map/country.js",
  "./src/map/day-route.js",
  "./src/map/geo.js",
  "./src/map/map-style.js",
  "./src/map/map-view.js",
  "./src/map/offline-tiles.js",
  "./src/map/routes.js",
  "./src/pwa/sw-register.js",
  "./src/shared/icons.js",
  "./src/ui/alerts.js",
  "./src/ui/app-shell.js",
  "./src/ui/city-list.js",
  "./src/ui/map-controls.js",
  "./src/ui/panels/city-panel.js",
  "./src/ui/panels/leg-panel.js",
  "./src/ui/panels/panel.js",
  "./src/ui/panels/sheet.js",
  "./src/ui/phrase-show.js",
  "./src/ui/tabs.js",
  "./src/ui/templates.js",
  "./src/ui/theme.js",
  "./src/ui/views/fx-converter.js",
  "./src/ui/views/onsite-view.js",
  "./src/ui/views/prep-view.js",
  "./src/ui/views/print.js",
  "./src/ui/views/settings-view.js",
  "./src/ui/views/weather.js",
  "./styles/base.css",
  "./styles/components.css",
  "./styles/map.css",
  "./styles/mobile.css",
  "./styles/panel.css",
  "./styles/print.css",
  "./styles/settings.css",
  "./styles/standalone.css",
  "./styles/theme-light.css",
  "./styles/tokens.css",
  "./styles/views.css"
];
// </precache>

async function putFresh(cache, url) {
  const res = await fetch(url, { cache: "reload" });
  if (res && res.ok) await cache.put(url, res.clone());
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const url of ASSETS) {
      try { await putFresh(cache, url); } catch (_) { /* un échec isolé n’empêche pas l’installation */ }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== TILE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

function fetchWithTimeout(req, ms) {
  return Promise.race([
    fetch(req, { cache: "no-store" }),
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))
  ]);
}

async function fallbackPage() {
  return (await caches.match("./index.html")) || (await caches.match("./")) || Response.error();
}

/** Réseau d’abord (avec délai max), copie en cache, sinon version en cache. */
async function networkFirst(req, isPage) {
  try {
    const res = await fetchWithTimeout(req, NETWORK_TIMEOUT_MS);
    if (res && res.ok) {
      const cache = await caches.open(CACHE);
      try { await cache.put(req, res.clone()); } catch (_) { /* quota */ }
    }
    return res;
  } catch (_) {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
    return isPage ? fallbackPage() : Response.error();
  }
}

/** Cache d’abord, réseau sinon (et mise en cache). */
async function cacheFirst(req) {
  const cached = await caches.match(req, { ignoreSearch: true });
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch (_) {
    return fallbackPage();
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;
  const isPage = req.mode === "navigate" || path.endsWith("/") || path.endsWith("/index.html");
  const isLib = path.includes("/lib/");
  const isApp = !isLib && (
    path.endsWith("sw.js") ||
    path.includes("/src/") ||
    path.includes("/styles/") ||
    path.includes("/data/"));

  event.respondWith(isPage || isApp ? networkFirst(req, isPage) : cacheFirst(req));
});
