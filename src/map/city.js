/* Vue ville : pins des lieux (regroupés quand ils se chevauchent), étapes du jour, cadrages. */

import { DAYS } from "../core/data.js";
import { hint, mapEl, panel } from "../core/elements.js";
import { isMobileUi } from "../core/env.js";
import { hooks } from "../core/hooks.js";
import { state } from "../core/state.js";
import { pinKind, stopPinKind } from "../domain/classify.js";
import { dayItinerary } from "../domain/itinerary.js";
import { dayPinPoints, hotelsOnMap, placesOnMap, stayForDay, stopsOnMap } from "../domain/trip.js";
import { esc } from "../core/dom.js";
import { PLACE_COLORS, placeGlyphSvg } from "../shared/icons.js";
import { clearDayRoute, showDayRoute } from "./day-route.js";
import { boundsOfCoords, toWorld } from "./geo.js";
import { cameraForGeoBounds, cameraMove, cityCoverZoom, cityZoomInfo, map, mapMode, mapViewportInsets } from "./map-view.js";

export let currentMapDay = null;

/** Marqueurs des lieux : { marker, el, kind, lat, lng, x, y, clusterable, color, pinKind } */
let pinMarkers = [];
let clusterMarkers = [];
let lastClusterZoom = null;
let lastViewKey = null;

/* Couleur des pins selon le type de lieu (cf. domain/classify.js → pinKind). */
const KIND_COLORS = PLACE_COLORS;
const PIN_COLOR_HOTEL = PLACE_COLORS.hotel;
const PIN_COLOR_STOP = PLACE_COLORS.stop;

/** Pin : tête colorée (ronde = lieu, carrée = hôtel / gare) + pointe + ombre au sol, nom au survol. */
function pinBadgeHtml(kind, color, label, opts){
  const o = opts || {};
  return `<span class="badge${o.square ? " square" : ""}" style="--c:${color}">` +
    `<span class="pin-head">${placeGlyphSvg(kind)}</span><span class="pin-tail"></span></span>` +
    (o.step != null ? `<span class="pin-step">${o.step}</span>` : "") +
    `<span class="pin-label">${esc(label)}</span>`;
}
/** Deux pins plus proches que ça (px écran) sont regroupés en une pastille. */
const CLUSTER_RADIUS_PX = 46;

const keyOf = (p) => p.lat.toFixed(4) + "," + p.lng.toFixed(4);

export function clearCityMarkers(){
  pinMarkers.forEach(p => p.marker.remove());
  clusterMarkers.forEach(m => m.remove());
  pinMarkers = [];
  clusterMarkers = [];
  lastClusterZoom = null;
  lastViewKey = null;
  clearDayRoute();
}

function addPin(el, item){
  if (!map) return;
  const marker = new maplibregl.Marker({ element: el, anchor: item.ghost ? "center" : "bottom" })
    .setLngLat([item.lng, item.lat]).addTo(map);
  const w = toWorld(item);
  pinMarkers.push(Object.assign(item, { marker, el, x: w.x, y: w.y }));
}

function pinButton(cls, title, html, onClick){
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = cls;
  btn.title = title;
  btn.setAttribute("aria-label", title);
  btn.innerHTML = html;
  btn.addEventListener("click", e => {
    e.stopPropagation();
    onClick();
  });
  return btn;
}

/* —— Regroupement des pins proches (vue ville sans jour sélectionné) —— */
function clusterGroups(zoom){
  const scale = 512 * Math.pow(2, zoom);
  const items = pinMarkers.filter(p => p.clusterable);
  const used = new Set();
  const groups = [];
  items.forEach(p => {
    if (used.has(p)) return;
    const group = [p];
    used.add(p);
    items.forEach(q => {
      if (used.has(q)) return;
      if (Math.hypot((q.x - p.x) * scale, (q.y - p.y) * scale) < CLUSTER_RADIUS_PX) {
        group.push(q);
        used.add(q);
      }
    });
    groups.push(group);
  });
  return groups;
}

function clusterElement(group){
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pin-cluster";
  const names = group.map(p => p.title);
  btn.title = names.join(" · ");
  btn.setAttribute("aria-label", `${group.length} lieux : ${names.join(", ")}`);
  const dots = [...new Set(group.map(p => p.color))].slice(0, 3)
    .map(c => `<i style="background:${c}"></i>`).join("");
  btn.innerHTML = `<span class="pin-cluster-bubble"><b>${group.length}</b><span class="pin-cluster-dots">${dots}</span></span>`;
  btn.addEventListener("click", e => {
    e.stopPropagation();
    const b = boundsOfCoords(group.map(p => [p.lng, p.lat]));
    const pad = mapViewportInsets();
    const extra = { top: pad.top + 70, right: pad.right + 70, bottom: pad.bottom + 70, left: pad.left + 70 };
    const cam = cameraForGeoBounds(b, extra, 18);
    cameraMove({ center: cam.center, zoom: Math.max(cam.zoom, map.getZoom() + 1.2), padding: pad });
  });
  return btn;
}

/** Recalcule les regroupements (seulement si le zoom a changé : le déplacement ne change rien). */
export function updateClusters(force){
  if (!map || !state.currentCity || mapMode !== "city") return;
  const zoom = map.getZoom();
  if (!force && lastClusterZoom != null && Math.abs(zoom - lastClusterZoom) < 0.08) return;
  lastClusterZoom = zoom;
  clusterMarkers.forEach(m => m.remove());
  clusterMarkers = [];
  pinMarkers.forEach(p => p.el.classList.remove("clustered"));
  if (currentMapDay) return;
  clusterGroups(zoom).forEach(group => {
    if (group.length < 2) return;
    group.forEach(p => p.el.classList.add("clustered"));
    const lng = group.reduce((s, p) => s + p.lng, 0) / group.length;
    const lat = group.reduce((s, p) => s + p.lat, 0) / group.length;
    clusterMarkers.push(new maplibregl.Marker({ element: clusterElement(group), anchor: "center" }).setLngLat([lng, lat]).addTo(map));
  });
}

/**
 * Pins de la ville. Sans jour : tous les lieux, regroupés quand ils se chevauchent.
 * Avec un jour : étapes numérotées + itinéraire animé ; les autres lieux deviennent de petits points.
 * `selected` : lieu mis en avant (fiche ouverte).
 */
export function renderCityPins(id, day, selected){
  /* Même ville + même jour (ex. clic sur un pin) : pas de nouvelle animation d’apparition */
  const viewKey = id + ":" + (day ? day.n : "");
  mapEl.classList.toggle("pins-static", viewKey === lastViewKey);
  lastViewKey = viewKey;
  currentMapDay = day || null;
  pinMarkers.forEach(p => p.marker.remove());
  pinMarkers = [];
  const itinerary = day ? dayItinerary(id, day) : [];
  const stepOf = new Map(itinerary.filter(s => s.kind === "activity").map(s => [keyOf(s), s.step]));
  const routeKeys = new Set(itinerary.map(keyOf));
  const selKey = selected && selected.lat != null ? keyOf(selected) : null;

  placesOnMap(id).forEach(a => {
    const key = keyOf(a);
    const isSel = selKey === key;
    const step = stepOf.get(key);
    const ghost = !!day && step == null && !isSel;
    const kind = pinKind(a.title);
    const color = KIND_COLORS[kind] || KIND_COLORS.pin;
    let cls = "pin pin-activity";
    if (ghost) cls += " ghost";
    if (step != null) cls += " on";
    if (isSel) cls += " selected";
    const html = ghost
      ? `<span class="pin-dot" style="--c:${color}"></span>`
      : pinBadgeHtml(kind, color, a.title, { step });
    const el = pinButton(cls, a.title, html, () => hooks.openActivityDetail(a));
    if (step != null) el.style.setProperty("--step-i", String(step));
    addPin(el, { kind: "activity", lat: a.lat, lng: a.lng, title: a.title, color, ghost, clusterable: !day && !isSel });
  });

  stopsOnMap(id).forEach(stop => {
    const key = keyOf(stop);
    const isSel = selKey === key;
    const ghost = !!day && !routeKeys.has(key) && !isSel;
    let cls = "pin pin-stop";
    if (ghost) cls += " ghost";
    else if (day) cls += " on";
    if (isSel) cls += " selected";
    const label = stop.name + " (" + stop.kind + ")";
    const html = ghost
      ? `<span class="pin-dot" style="--c:${PIN_COLOR_STOP}"></span>`
      : pinBadgeHtml(stopPinKind(stop), PIN_COLOR_STOP, stop.name, { square: true });
    addPin(pinButton(cls, label, html, () => hooks.openStopDetail(stop)),
      { kind: "stop", lat: stop.lat, lng: stop.lng, title: stop.name, color: PIN_COLOR_STOP, ghost, clusterable: !day && !isSel });
  });

  const activeStay = day ? stayForDay(id, day) : null;
  hotelsOnMap(id).forEach(stay => {
    const h = stay.hotel;
    const isSel = selKey === keyOf(h);
    const ghost = !!day && !(activeStay && activeStay.id === stay.id) && !isSel;
    let cls = "pin pin-hotel";
    if (ghost) cls += " ghost";
    else if (day) cls += " on";
    if (isSel) cls += " selected";
    const html = ghost
      ? `<span class="pin-dot" style="--c:${PIN_COLOR_HOTEL}"></span>`
      : pinBadgeHtml("hotel", PIN_COLOR_HOTEL, h.name, { square: true });
    const el = pinButton(cls, h.name + " (hôtel)", html, () => hooks.openHotelDetail(stay));
    el.dataset.stay = stay.id;
    addPin(el, { kind: "hotel", lat: h.lat, lng: h.lng, title: h.name, color: PIN_COLOR_HOTEL, ghost, clusterable: false });
  });

  mapEl.classList.toggle("day-mode", !!day);
  showDayRoute(id, day, itinerary);
  updateClusters(true);
  if (hint) {
    hint.textContent = day
      ? "Jour " + day.n + " · étapes numérotées dans l’ordre · toucher un pin pour le détail"
      : "Toucher un pin · les pastilles regroupent les lieux proches";
  }
}

export function highlightPin(act, opts){
  if (!state.currentCity || !act || act.lat == null) return;
  state.lastFocusAct = act;
  renderCityPins(state.currentCity, openDayInPanel(), act);
  if (opts && opts.zoom) {
    const zoom = cityCoverZoom() + Math.log2(isMobileUi() ? 3.3 : 2.8);
    cameraMove({ center: [act.lng, act.lat], zoom: Math.max(map.getZoom(), zoom), padding: mapViewportInsets() });
  }
}

/** Jour affiché dans le panneau ville (state.selectedDay), sinon null. */
function openDayInPanel(){
  return state.selectedDay != null ? DAYS.find(d => d.n === state.selectedDay) || null : null;
}

/** Vue d’ensemble de la ville, ajustée à la zone visible (hors panneau / liste). */
function cityHomeCamera(id){
  const info = cityZoomInfo(id);
  const pad = mapViewportInsets();
  const W = Math.max(64, mapEl.clientWidth), H = Math.max(64, mapEl.clientHeight);
  const vis = Math.min((W - pad.left - pad.right) / W, (H - pad.top - pad.bottom) / H);
  const zoom = info.cover + Math.log2(Math.max(0.55, Math.min(1, vis)) * (isMobileUi() ? 1.1 : 1.02));
  return { center: info.center, zoom, pitch: 0, bearing: 0, padding: pad };
}

export function refreshCityMapView(opts){
  if (!map || !state.currentCity || !mapEl.clientWidth) return;
  opts = opts || {};
  const info = cityZoomInfo(state.currentCity);
  map.setMinZoom(Math.max(3.6, info.contain - 0.4));
  updateClusters(true);
  if (state.lastFocusAct && state.lastFocusAct.lat != null) {
    cameraMove({ center: [state.lastFocusAct.lng, state.lastFocusAct.lat], padding: mapViewportInsets(), pitch: 0, bearing: 0 }, opts.instant);
    return;
  }
  const day = openDayInPanel();
  const cam = day ? dayCamera(state.currentCity, day) : cityHomeCamera(state.currentCity);
  cameraMove(cam, opts.instant);
}

let cityRefreshTimer = 0;

export function scheduleCityMapRefresh(){
  // Mobile : laisser le sheet se poser avant de recadrer
  const mobile = isMobileUi();
  if (mobile) {
    const app = document.querySelector(".app");
    if (app && panel.classList.contains("open") && state.currentCity &&
        !app.classList.contains("sheet-mid") &&
        !app.classList.contains("sheet-max") &&
        !app.classList.contains("sheet-min")) {
      app.classList.add("sheet-mid");
    }
  }
  clearTimeout(cityRefreshTimer);
  cityRefreshTimer = setTimeout(() => refreshCityMapView(), mobile ? 60 : 0);
}

/** Caméra cadrée sur le programme du jour (activités + hôtel). */
function dayCamera(cityId, day){
  const route = dayItinerary(cityId, day);
  const pts = route.length ? route : dayPinPoints(cityId, day);
  const info = cityZoomInfo(cityId);
  const mobile = isMobileUi();
  const pad = mapViewportInsets();
  const base = { pitch: 0, bearing: 0, padding: pad };
  if (!pts.length) {
    return Object.assign(base, { center: info.center, zoom: info.cover + Math.log2(mobile ? 1.55 : 1.38) });
  }
  if (pts.length === 1) {
    return Object.assign(base, { center: [pts[0].lng, pts[0].lat], zoom: info.cover + Math.log2(mobile ? 3.3 : 2.6) });
  }
  const b = boundsOfCoords(pts.map(p => [p.lng, p.lat]));
  const maxZoom = info.cover + Math.log2(mobile ? 3.4 : 2.7);
  const extra = { top: pad.top + 40, right: pad.right + 40, bottom: pad.bottom + 40, left: pad.left + 40 };
  const cam = cameraForGeoBounds(b, extra, maxZoom);
  return Object.assign(base, { center: cam.center, zoom: Math.max(cam.zoom, info.cover - 0.6) /* journée étendue (ex. tour des lacs) : tout doit tenir */ });
}

function focusDayMap(cityId, day){
  if (!map || state.currentCity !== cityId) return;
  cameraMove(dayCamera(cityId, day));
}
