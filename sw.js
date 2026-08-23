/* Offline cache — 1ère visite en Wi‑Fi, puis utilisable sans réseau dans Safari */
const CACHE = "japan-trip-2026-v113";

const ASSETS = [
  "./",
  "./index.html",
  "./sw.js",
  "./css/app.css",
  "./js/data.js",
  "./js/app.js",
  "./js/sw-register.js",
  "./maps/bounds.json",
  "./maps/fuji.png",
  "./maps/japan.png",
  "./maps/kanazawa.png",
  "./maps/kyoto.png",
  "./maps/nara.png",
  "./maps/osaka.png",
  "./maps/shirakawa.png",
  "./maps/takayama.png",
  "./maps/tokyo.png",
  "./img/logo.svg",
  "./img/hotels/agora-kyoto.jpg",
  "./img/hotels/agora-kyoto-2.jpg",
  "./img/hotels/agora-kyoto-3.jpg",
  "./img/hotels/agora-kyoto-4.jpg",
  "./img/hotels/deer-park-nara.jpg",
  "./img/hotels/deer-park-nara-2.jpg",
  "./img/hotels/deer-park-nara-3.jpg",
  "./img/hotels/deer-park-nara-4.jpg",
  "./img/hotels/garner-osaka.jpg",
  "./img/hotels/garner-osaka-2.jpg",
  "./img/hotels/garner-osaka-3.jpg",
  "./img/hotels/garner-osaka-4.jpg",
  "./img/hotels/henn-na-kanazawa.jpg",
  "./img/hotels/henn-na-kanazawa-2.jpg",
  "./img/hotels/henn-na-kanazawa-3.jpg",
  "./img/hotels/henn-na-kanazawa-4.jpg",
  "./img/hotels/homenest-akihabara.jpg",
  "./img/hotels/homenest-akihabara-3.jpg",
  "./img/hotels/homenest-akihabara-4.jpg",
  "./img/hotels/homenest-akihabara-5.jpg",
  "./img/hotels/homenest-akihabara-6.jpg",
  "./img/hotels/kawaguchiko.jpg",
  "./img/hotels/kawaguchiko-2.jpg",
  "./img/hotels/kawaguchiko-3.jpg",
  "./img/hotels/kawaguchiko-4.jpg",
  "./img/hotels/mercure-takayama.jpg",
  "./img/hotels/mercure-takayama-2.jpg",
  "./img/hotels/mercure-takayama-3.jpg",
  "./img/hotels/mercure-takayama-4.jpg",
  "./img/hotels/royal-park-haneda.jpg",
  "./img/hotels/royal-park-haneda-2.jpg",
  "./img/hotels/royal-park-haneda-3.jpg",
  "./img/hotels/royal-park-haneda-4.jpg",
  "./img/activities/akihabara-2.jpg",
  "./img/activities/akihabara.jpg",
  "./img/activities/animate.jpg",
  "./img/activities/arashiyama-2.jpg",
  "./img/activities/arashiyama.jpg",
  "./img/activities/character-street.jpg",
  "./img/activities/chureito-2.jpg",
  "./img/activities/chureito.jpg",
  "./img/activities/daigo.jpg",
  "./img/activities/denden.jpg",
  "./img/activities/dotonbori-2.jpg",
  "./img/activities/dotonbori.jpg",
  "./img/activities/fushimi-2.jpg",
  "./img/activities/fushimi.jpg",
  "./img/activities/ginza.jpg",
  "./img/activities/gold-leaf.jpg",
  "./img/activities/harajuku-2.jpg",
  "./img/activities/harajuku.jpg",
  "./img/activities/higashi-chaya.jpg",
  "./img/activities/hozenji.jpg",
  "./img/activities/imperial.jpg",
  "./img/activities/itchiku.jpg",
  "./img/activities/jinya.jpg",
  "./img/activities/kanazawa-castle-2.jpg",
  "./img/activities/kanazawa-castle.jpg",
  "./img/activities/kanazawa-museum.jpg",
  "./img/activities/kasuga.jpg",
  "./img/activities/kawaguchi-2.jpg",
  "./img/activities/kawaguchi.jpg",
  "./img/activities/kenrokuen-2.jpg",
  "./img/activities/kenrokuen.jpg",
  "./img/activities/kinkakuji-2.jpg",
  "./img/activities/kinkakuji.jpg",
  "./img/activities/kiyomizu-2.jpg",
  "./img/activities/kiyomizu.jpg",
  "./img/activities/kofukuji.jpg",
  "./img/activities/kuromon-2.jpg",
  "./img/activities/kuromon.jpg",
  "./img/activities/manifest.json",
  "./img/activities/meiji-2.jpg",
  "./img/activities/meiji.jpg",
  "./img/activities/miyagawa.jpg",
  "./img/activities/momiji.jpg",
  "./img/activities/music-forest.jpg",
  "./img/activities/myoryuji.jpg",
  "./img/activities/nagamachi.jpg",
  "./img/activities/namba-yasaka.jpg",
  "./img/activities/nara-park-2.jpg",
  "./img/activities/nara-park.jpg",
  "./img/activities/nijo-2.jpg",
  "./img/activities/nijo.jpg",
  "./img/activities/nishi-chaya.jpg",
  "./img/activities/nishiki-2.jpg",
  "./img/activities/nishiki.jpg",
  "./img/activities/odaiba-2.jpg",
  "./img/activities/odaiba.jpg",
  "./img/activities/omicho.jpg",
  "./img/activities/osaka-castle-2.jpg",
  "./img/activities/osaka-castle.jpg",
  "./img/activities/oshino.jpg",
  "./img/activities/oyama.jpg",
  "./img/activities/philosopher.jpg",
  "./img/activities/pontocho.jpg",
  "./img/activities/ropeway.jpg",
  "./img/activities/saiko.jpg",
  "./img/activities/sanmachi-2.jpg",
  "./img/activities/sanmachi.jpg",
  "./img/activities/sensoji-2.jpg",
  "./img/activities/sensoji.jpg",
  "./img/activities/shibuya-2.jpg",
  "./img/activities/shibuya.jpg",
  "./img/activities/shinjuku-2.jpg",
  "./img/activities/shinjuku.jpg",
  "./img/activities/shinsaibashi.jpg",
  "./img/activities/shinsekai.jpg",
  "./img/activities/shirakawa-2.jpg",
  "./img/activities/shirakawa.jpg",
  "./img/activities/sumida.jpg",
  "./img/activities/tea.jpg",
  "./img/activities/teamlab-2.jpg",
  "./img/activities/teamlab.jpg",
  "./img/activities/teramachi.jpg",
  "./img/activities/todaiji-2.jpg",
  "./img/activities/todaiji.jpg",
  "./img/activities/tokyo-tower-2.jpg",
  "./img/activities/tokyo-tower.jpg",
  "./img/activities/ueno-2.jpg",
  "./img/activities/ueno.jpg",
  "./img/activities/usj-2.jpg",
  "./img/activities/usj.jpg",
  "./img/activities/wagashi.jpg",
  "./img/activities/yanaka.jpg",
  "./img/activities/yasaka.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      for (const url of ASSETS) {
        try {
          await cache.add(url);
        } catch (e) {
          /* ignore single failures */
        }
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;
  const isDoc =
    req.mode === "navigate" ||
    path.endsWith("/") ||
    path.endsWith("/index.html") ||
    path.endsWith("sw.js");
  const isAppCode =
    path.includes("/js/") ||
    path.includes("/css/") ||
    path.endsWith(".js") ||
    path.endsWith(".css");

  // HTML / SW / JS / CSS : réseau d’abord pour les mises à jour
  if (isDoc || isAppCode) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          if (res && res.ok) {
            const cache = await caches.open(CACHE);
            cache.put(req, res.clone());
          }
          return res;
        } catch (e) {
          return (
            (await caches.match(req, { ignoreSearch: true })) ||
            (await caches.match("./index.html")) ||
            (await caches.match("./")) ||
            Response.error()
          );
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.ok) {
          const cache = await caches.open(CACHE);
          cache.put(req, res.clone());
        }
        return res;
      } catch (e) {
        return (
          (await caches.match("./index.html")) ||
          (await caches.match("./")) ||
          Response.error()
        );
      }
    })()
  );
});
