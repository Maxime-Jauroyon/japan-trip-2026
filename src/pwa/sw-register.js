/* Service worker : cache le site pour Safari hors ligne (après une 1re ouverture en Wi‑Fi),
   applique les mises à jour, et bouton « Rafraîchir l’application ». */
import { APP_VERSION, TILE_CACHE } from "../config.js";

/** Enregistre sw.js ; une nouvelle version prend la main puis recharge la page. */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    location.reload();
  });
  const register = () => {
    navigator.serviceWorker.register("./sw.js?v=" + APP_VERSION.replace(/^v/, "")).then((reg) => {
      reg.update();
      if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            sw.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    }).catch(() => {});
  };
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register);
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(resolve, ms))
  ]);
}

/** Vide les caches de l’app (sauf les cartes hors ligne) puis recharge. */
async function forceRefreshApp() {
  try {
    await withTimeout((async () => {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k !== TILE_CACHE).map((k) => caches.delete(k)));
      }
    })(), 2500);
  } catch (_) { /* ignore */ }
  const url = new URL(location.href);
  url.searchParams.set("refresh", String(Date.now()));
  location.replace(url.pathname + url.search + url.hash);
}

/** Bouton « Rafraîchir l’application » (Réglages) — robuste au double tap iOS. */
export function bindForceRefresh(btn) {
  if (!btn) return;
  let busy = false;
  let lastTouch = 0;
  const label = btn.textContent;
  const run = async (e) => {
    if (busy) return;
    busy = true;
    if (e && e.cancelable) e.preventDefault();
    btn.blur();
    btn.disabled = true;
    btn.textContent = "…";
    try {
      await forceRefreshApp();
    } catch (_) {
      /* la navigation aurait dû avoir lieu */
    }
    // Si le rechargement n’a pas eu lieu (blocage iOS), on restaure le bouton
    setTimeout(() => {
      busy = false;
      btn.disabled = false;
      btn.textContent = label;
    }, 3000);
  };
  btn.addEventListener("touchend", (e) => {
    lastTouch = Date.now();
    run(e);
  }, { passive: false });
  btn.addEventListener("click", (e) => {
    if (Date.now() - lastTouch < 700) return;
    run(e);
  });
}
