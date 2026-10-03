/* Coquille de l’app : en-tête (sous-titre selon la date), pastille réseau, mode app iOS, classe tactile. */

import { APP_VERSION } from "../config.js";
import { CITIES, TRIP } from "../core/data.js";
import { daysUntilISO, findTripDayByISO, japanTodayISO } from "../core/dates.js";
import { isStandaloneApp } from "../core/env.js";
import { state } from "../core/state.js";
import { refreshCityMapView } from "../map/city.js";
import { fitJapanHome } from "../map/map-view.js";

/** En-tête : simple point vert en ligne, « Hors ligne » seulement sans réseau. Version : Réglages › À propos. */
export function updateOfflineStatus(){
  const online = navigator.onLine;
  const el = document.getElementById("offline-status");
  if (el) {
    el.textContent = online ? "" : "Hors ligne";
    el.title = online ? `En ligne · version ${APP_VERSION}` : "Hors ligne : l’app tourne sur son cache";
    el.setAttribute("aria-label", online ? "En ligne" : "Hors ligne");
    el.classList.toggle("online", online);
    el.classList.toggle("offline", !online);
  }
  const about = document.getElementById("about-status");
  if (about) about.textContent = `Version ${APP_VERSION} · ${online ? "en ligne" : "hors ligne (cache)"}`;
}

/** Sous-titre vivant : « 8–29 nov · J-36 », « Jour 13 · Kyoto », puis « Terminé ». */
function brandSubtitle(){
  const iso = japanTodayISO();
  const day = findTripDayByISO(iso);
  if (day) {
    const city = CITIES[day.city];
    return `Jour ${day.n} · ${city ? city.name : day.city}`;
  }
  const short = TRIP.datesLabel.replace(/\s\d{4}$/, "");
  if (iso < TRIP.startDate) return `${short} · J-${daysUntilISO(TRIP.startDate)}`;
  return `${TRIP.datesLabel} · terminé`;
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
  const aboutDates = document.getElementById("about-dates");
  if (aboutDates) aboutDates.textContent = `${TRIP.datesLabelLong} · ${(TRIP.travelers || []).join(" & ")}`;
  const syncSub = () => { if (sub) sub.textContent = brandSubtitle(); };
  syncSub();
  // L’app reste ouverte des jours sur iPhone : remettre le sous-titre à jour au retour
  document.addEventListener("visibilitychange", () => { if (!document.hidden) syncSub(); });
  updateOfflineStatus();
  markStandaloneMode();
  window.addEventListener("online", updateOfflineStatus);
  window.addEventListener("offline", updateOfflineStatus);
}
