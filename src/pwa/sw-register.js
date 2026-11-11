/* Service worker : cache le site pour Safari hors ligne (après une 1re ouverture en Wi‑Fi),
   applique les mises à jour sans recharger la page pour rien, et bouton « Rafraîchir l’application ». */
import { APP_VERSION } from "../config.js";
import { cachesToClear } from "../shared/cache-names.js";

const UPDATE_CHECK_MS = 10 * 60 * 1000;
/** En dessous, la page vient de s’ouvrir : un rechargement silencieux ne dérange personne. */
const QUIET_RELOAD_MS = 3000;

/** Version (nom du cache) du service worker aux commandes, ou null s’il ne répond pas. */
function controllerVersion(){
  return new Promise((resolve) => {
    const ctrl = navigator.serviceWorker.controller;
    if (!ctrl) { resolve(null); return; }
    const ch = new MessageChannel();
    const timer = setTimeout(() => resolve(null), 2000);
    ch.port1.onmessage = (e) => { clearTimeout(timer); resolve(e.data && e.data.version ? String(e.data.version) : null); };
    try { ctrl.postMessage({ type: "GET_VERSION" }, [ch.port2]); } catch (_) { clearTimeout(timer); resolve(null); }
  });
}

/** Bandeau discret « Nouvelle version prête » : un appui recharge, sinon elle s’appliquera au prochain lancement. */
function showUpdateBanner(){
  if (document.getElementById("update-banner")) return;
  const el = document.createElement("div");
  el.id = "update-banner";
  el.className = "update-banner";
  el.setAttribute("role", "status");
  el.innerHTML = `<span>Nouvelle version prête</span><button type="button" class="ub-go">Mettre à jour</button><button type="button" class="ub-close" aria-label="Plus tard">×</button>`;
  el.querySelector(".ub-go").addEventListener("click", () => location.reload());
  el.querySelector(".ub-close").addEventListener("click", () => el.remove());
  document.body.appendChild(el);
}

/**
 * Enregistre sw.js. Quand un nouveau service worker prend la main, la page ne se recharge PAS si elle est déjà
 * à la même version (cas normal : le code est servi « réseau d’abord »). Si elle est plus ancienne (ouverte hors
 * ligne, ou restée en arrière-plan), on propose la mise à jour par un bandeau au lieu d’interrompre.
 */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const openedAt = Date.now();
  let touched = false;
  ["pointerdown", "keydown", "touchstart"].forEach(t => window.addEventListener(t, () => { touched = true; }, { once: true, passive: true, capture: true }));
  let handling = false;
  navigator.serviceWorker.addEventListener("controllerchange", async () => {
    if (handling) return;
    handling = true;
    const version = await controllerVersion();
    handling = false;
    if (!version || version.endsWith("-" + APP_VERSION)) return;   // déjà à jour (ou version inconnue) : ne rien interrompre
    if (!touched && Date.now() - openedAt < QUIET_RELOAD_MS) location.reload();
    else showUpdateBanner();
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
      // App restée ouverte : au retour au premier plan, regarder s’il y a une nouvelle version (au plus toutes les 10 min)
      let lastCheck = Date.now();
      document.addEventListener("visibilitychange", () => {
        if (document.hidden || Date.now() - lastCheck < UPDATE_CHECK_MS) return;
        lastCheck = Date.now();
        reg.update().catch(() => {});
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

/**
 * Demande au service worker de précharger les photos complètes en tâche de fond
 * (à appeler quand la page est au repos). Sans effet si aucun service worker ne contrôle la page.
 */
export function requestPhotoPrecache(){
  const sw = navigator.serviceWorker;
  const conn = navigator.connection;
  if (!sw || (conn && conn.saveData)) return;
  const send = () => sw.controller && sw.controller.postMessage({ type: "PRECACHE_IMAGES" });
  if (sw.controller) send();
  else sw.addEventListener("controllerchange", send, { once: true });
}

/** Vide les caches du code de l’app puis recharge ; les photos du journal, les images, les musiques et les cartes sont gardées. */
async function forceRefreshApp() {
  try {
    await withTimeout((async () => {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(cachesToClear(keys).map((k) => caches.delete(k)));
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
