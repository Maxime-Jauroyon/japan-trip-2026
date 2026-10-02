/* Coquille de l’app : pastille en ligne / hors ligne, mode app iOS, classe tactile. */

import { APP_VERSION } from "../config.js";
import { TRIP } from "../core/data.js";
import { isStandaloneApp } from "../core/env.js";
import { state } from "../core/state.js";
import { refreshCityMapView } from "../map/city.js";
import { fitJapanHome } from "../map/map-view.js";

export function updateOfflineStatus(){
  const el = document.getElementById("offline-status");
  if (!el) return;
  const online = navigator.onLine;
  el.textContent = (online ? "En ligne" : "Hors ligne") + " · cache " + APP_VERSION;
  el.classList.toggle("online", online);
  el.classList.toggle("offline", !online);
}

function markStandaloneMode(){
  const on = isStandaloneApp();
  document.documentElement.classList.toggle("standalone", on);
  document.querySelector(".app")?.classList.toggle("standalone", on);
  if (!on) return;
  /* Recadrer la carte une fois le layout fixed/inset stabilisé
     (les redimensionnements suivants sont gérés par ui/map-controls.js) */
  requestAnimationFrame(() => {
    if (state.currentCity) refreshCityMapView();
    else fitJapanHome();
  });
}

/** Classe .touch-ui (≤ 900 px) sur <html>, mise à jour au redimensionnement. */
export function initTouchUi() {
  const q = "(max-width: 900px)";
  const apply = () => {
    document.documentElement.classList.toggle("touch-ui", window.matchMedia(q).matches);
  };
  apply();
  try { window.matchMedia(q).addEventListener("change", apply); } catch (_) {
    window.addEventListener("resize", apply);
  }
}

/** Titre, dates (data/trip.json), pastille en ligne / hors ligne, mode app (iOS). */
export function initAppShell() {
  document.title = `${TRIP.shortTitle} · ${TRIP.datesLabelLong}`;
  const title = document.querySelector(".brand-title");
  const sub = document.querySelector(".brand-sub");
  if (title) title.textContent = TRIP.title;
  if (sub) sub.textContent = TRIP.datesLabel;
  updateOfflineStatus();
  markStandaloneMode();
  window.addEventListener("online", updateOfflineStatus);
  window.addEventListener("offline", updateOfflineStatus);
}
