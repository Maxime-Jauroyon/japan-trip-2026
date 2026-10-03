/* Bouton 📍 « Ma position » : suit le GPS, affiche le point bleu, prévient le reste de l’interface
   (distances du programme, carte « Et maintenant ? ») par l’évènement USER_POS_CHANGED.
   Rien n’est gardé : la position ne quitte jamais le téléphone. */

import { hooks } from "../core/hooks.js";
import { state } from "../core/state.js";
import { distanceKm, formatDistance, formatMinutes, segmentEstimate } from "../domain/itinerary.js";
import { cityIdForCoords } from "../domain/places.js";
import { JAPAN_MAX_BOUNDS, map } from "../map/map-view.js";
import { flyToUser, hideUserPosition, showUserPosition } from "../map/user-pos.js";

export const USER_POS_CHANGED = "japan-trip:userpos";
/** Au-delà, la distance « depuis ma position » n’a pas de sens (autre ville). */
const NEAR_KM = 40;

let watchId = null;
let centerNext = false;

const inJapan = (p) => p.lng >= JAPAN_MAX_BOUNDS[0][0] && p.lng <= JAPAN_MAX_BOUNDS[1][0] &&
  p.lat >= JAPAN_MAX_BOUNDS[0][1] && p.lat <= JAPAN_MAX_BOUNDS[1][1];

function toast(msg){
  const host = document.getElementById("view-map") || document.body;
  let el = document.getElementById("pos-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "pos-toast";
    el.className = "pos-toast";
    el.setAttribute("role", "status");
    host.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove("show"), 3200);
}

function setButton(on, busy){
  const b = document.getElementById("z-locate");
  if (!b) return;
  b.classList.toggle("on", !!on);
  b.classList.toggle("busy", !!busy);
  b.setAttribute("aria-pressed", on ? "true" : "false");
}

/** Centre sur moi : dans une ville du voyage, ouvre d’abord cette ville (la carte Japon ne zoome pas si près). */
function centerOnMe(p){
  const city = cityIdForCoords(p.lat, p.lng);
  // Les recadrages de la vue ville (sheet qui bouge…) gardent alors la caméra sur moi
  const focus = () => { state.lastFocusAct = { lat: p.lat, lng: p.lng, title: "Ma position" }; flyToUser(p.lng, p.lat); };
  if (city && state.currentCity !== city) {
    hooks.openCity(city);
    setTimeout(focus, 900);
  } else if (city) {
    focus();
  } else {
    flyToUser(p.lng, p.lat, 10);
  }
}

function onPosition(pos){
  const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy, at: Date.now() };
  const first = !state.userPos;
  state.userPos = p;
  setButton(true, false);
  if (inJapan(p)) {
    showUserPosition(p.lng, p.lat, p.acc);
    if (centerNext) centerOnMe(p);
  } else if (first || centerNext) {
    toast("Position hors du Japon : le point bleu apparaîtra sur place.");
  }
  centerNext = false;
  document.dispatchEvent(new CustomEvent(USER_POS_CHANGED));
}

function onError(err){
  stopWatching();
  toast(err && err.code === 1
    ? "Localisation refusée : autorise-la dans Réglages › Safari (ou l’app) › Position."
    : "Position introuvable pour le moment.");
}

export function stopWatching(){
  if (watchId != null && navigator.geolocation) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  state.userPos = null;
  hideUserPosition();
  setButton(false, false);
  document.dispatchEvent(new CustomEvent(USER_POS_CHANGED));
}

/** Démarre le suivi (ou recentre si déjà actif). */
export function startWatching(center = true){
  if (!navigator.geolocation) { toast("Géolocalisation indisponible sur cet appareil."); return; }
  centerNext = center;
  if (watchId != null) {
    if (state.userPos && inJapan(state.userPos)) { centerOnMe(state.userPos); centerNext = false; }
    return;
  }
  setButton(true, true);
  watchId = navigator.geolocation.watchPosition(onPosition, onError,
    { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 });
}

export const isWatching = () => watchId != null;

/** « à 850 m · 11 min » depuis ma position, ou "" si inconnue / trop loin. */
export function distanceFromMe(place){
  const me = state.userPos;
  if (!me || !place || place.lat == null || place.lng == null) return "";
  const km = distanceKm(me, place);
  if (km > NEAR_KM) return "";
  const e = segmentEstimate(me, place);
  return `à ${formatDistance(km)} · ${formatMinutes(e.minutes)}${e.mode === "walk" ? " à pied" : ""}`;
}

/** Remplit les emplacements [data-dist-lat][data-dist-lng] d’un conteneur. */
export function fillDistances(root){
  if (!root) return;
  root.querySelectorAll("[data-dist-lat]").forEach(el => {
    const txt = distanceFromMe({ lat: Number(el.dataset.distLat), lng: Number(el.dataset.distLng) });
    el.textContent = txt;
    el.hidden = !txt;
  });
}

/** Bouton 📍 : 1er appui = suivre + centrer ; puis recentrer ; déjà centré = arrêter. */
export function initMyPosition(){
  const b = document.getElementById("z-locate");
  if (!b) return;
  b.addEventListener("click", () => {
    const me = state.userPos;
    if (isWatching() && me && inJapan(me) && map) {
      const c = map.getCenter();
      if (distanceKm(me, { lat: c.lat, lng: c.lng }) < 0.15) { stopWatching(); toast("Position masquée."); return; }
    } else if (isWatching() && me && !inJapan(me)) { stopWatching(); return; }
    startWatching(true);
  });
}
