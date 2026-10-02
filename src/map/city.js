/* Vue ville : zones de quartiers, bulles, pins (niveaux de détail selon le zoom), cadrages. */

import { DAYS, LEGS } from "../core/data.js";
import { esc } from "../core/dom.js";
import { hint, mapEl, panel } from "../core/elements.js";
import { isMobileUi } from "../core/env.js";
import { hooks } from "../core/hooks.js";
import { state } from "../core/state.js";
import { pinKind, stopPinKind } from "../domain/classify.js";
import { pointInZone, zoneCenter, zoneForPoint, zonesForCity } from "../domain/places.js";
import { countPlacesInZone, dayPinPoints, dayZoneIds, hotelsOnMap, ideasOf, placesOnMap, stayForDay, stopsOnMap } from "../domain/trip.js";
import { boundsOfCoords, smoothstep } from "./geo.js";
import { cameraForGeoBounds, cameraMove, cityCoverZoom, cityZoomInfo, map, mapMode, mapStyleReady, mapViewportInsets } from "./map-view.js";
import { iconSvg, lightenHex } from "../shared/icons.js";

let currentCityLod = -1;

export let currentMapDay = null;

let pinMarkers = [];

let hubMarkers = [];

/** Couleurs réservées — hors palette des zones (rouge, bleu, violet, or, teal, vert). */
const PIN_COLOR_HOTEL = "#c97b84";

const PIN_COLOR_HOTEL_SEL = "#e8a8b0";

const PIN_COLOR_STOP = "#6e7c85";

const PIN_COLOR_STOP_SEL = "#9aa4ad";

const PIN_COLOR_ACT_FALLBACK = "#a85a32";

function activityPinColor(cityId, lat, lng, selected){
  const z = zoneForPoint(cityId, lat, lng);
  const base = z ? z.color : PIN_COLOR_ACT_FALLBACK;
  return selected ? lightenHex(base, 0.22) : base;
}

/* Seuils LOD (rapport au zoom « cover ») : bulles → zones → pins */
function lodThresholds(){
  const mobile = isMobileUi();
  return {
    pinStart: mobile ? 3.15 : 2.28,
    zoneIn0: mobile ? 1.05 : 1.12,
    zoneIn1: mobile ? 1.32 : 1.45
  };
}

export function setZonesData(features){
  if (!map || !mapStyleReady) return;
  const src = map.getSource("zones");
  if (src) src.setData({ type: "FeatureCollection", features });
}

export function layoutCityZones(day){
  if (!state.currentCity) return;
  const zones = zonesForCity(state.currentCity);
  const onZones = dayZoneIds(state.currentCity, day);
  const filterDay = !!(day && onZones.size);
  const features = zones.filter(z => !filterDay || onZones.has(z.id)).map(z => ({
    type: "Feature",
    properties: { id: z.id, name: z.name, color: z.color, on: filterDay },
    geometry: {
      type: "Polygon",
      coordinates: [[[z.west, z.south], [z.east, z.south], [z.east, z.north], [z.west, z.north], [z.west, z.south]]]
    }
  }));
  setZonesData(features);
  if (!map || !mapStyleReady || !map.getLayer("zone-fill")) return;
  const base = cityCoverZoom();
  const t = lodThresholds();
  const zAt = r => base + Math.log2(r);
  const stops = (val) => ["interpolate", ["linear"], ["zoom"],
    zAt(t.zoneIn0), 0, zAt(t.zoneIn1), val, zAt(t.pinStart - 0.4), val, zAt(t.pinStart + 0.12), 0];
  map.setPaintProperty("zone-fill", "fill-opacity", stops(["case", ["get", "on"], 0.38, 0.24]));
  map.setPaintProperty("zone-line", "line-opacity", stops(["case", ["get", "on"], 0.9, 0.55]));
  map.setPaintProperty("zone-label", "text-opacity", stops(1));
}

export function clearCityMarkers(){
  pinMarkers.forEach(m => m.remove());
  hubMarkers.forEach(m => m.remove());
  pinMarkers = [];
  hubMarkers = [];
}

function addCityMarker(el, lat, lng, anchor, list){
  if (!map) return;
  const m = new maplibregl.Marker({ element: el, anchor }).setLngLat([lng, lat]).addTo(map);
  list.push(m);
}

function renderCityHubs(id, day){
  hubMarkers.forEach(m => m.remove());
  hubMarkers = [];
  const onZones = dayZoneIds(id, day);
  const filterDay = !!(day && onZones.size);
  zonesForCity(id).forEach(z => {
    const n = countPlacesInZone(id, z);
    if (!n && !z.alwaysShowHub) return;
    const c = zoneCenter(z);
    const on = !filterDay || onZones.has(z.id);
    const btn = document.createElement("button");
    btn.type = "button";
    let cls = "zone-hub";
    if (filterDay) cls += on ? " on" : " dim";
    btn.className = cls;
    btn.dataset.zone = z.id;
    btn.title = z.name;
    btn.setAttribute("aria-label", z.name);
    const dayCount = filterDay && on
      ? ideasOf(day).filter(a => a.lat != null && pointInZone(a.lat, a.lng, z)).length
      : n;
    btn.innerHTML =
      `<span class="zone-hub-chip">` +
      `<span class="zone-hub-dot" style="background:${esc(z.color)}"></span>` +
      `<span class="zone-hub-label">${esc(z.name)}</span>` +
      (dayCount ? `<span class="zone-hub-count">${dayCount}</span>` : "") +
      `</span>`;
    btn.addEventListener("click", e => {
      e.stopPropagation();
      cameraMove({ center: [c.lng, c.lat], zoom: cityCoverZoom() + Math.log2(2.7), padding: mapViewportInsets() });
    });
    addCityMarker(btn, c.lat, c.lng, "center", hubMarkers);
  });
}

/** Force le recalcul du niveau de détail (changement de ville). */
export function resetCityLod(){ currentCityLod = -1; }

export function updateCityLod(force){
  if (!map || !state.currentCity || mapMode !== "city") return;
  const base = cityCoverZoom();
  const ratio = Math.max(1, Math.pow(2, map.getZoom() - base));
  const t = lodThresholds();
  /* Taille bonne à l’apparition ; en zoomant plus, le scale baisse pour que
     la taille à l’écran reste lisible sans masquer la carte. */
  const pinScale = Math.max(0.82, Math.min(1, Math.pow(ratio / t.pinStart, -0.15)));
  const hubScale = Math.max(0.88, Math.min(1.12, 1.12 / Math.pow(ratio, 0.4)));
  const hubOp = 1 - smoothstep(t.zoneIn0, t.zoneIn1, ratio);
  const zoneFade = smoothstep(t.pinStart - 0.4, t.pinStart + 0.12, ratio);
  const zoneOp = smoothstep(t.zoneIn0, t.zoneIn1, ratio) * (1 - zoneFade);
  let pinOp = ratio >= t.pinStart ? 1 : 0;
  if (hubOp < 0.12 && zoneOp < 0.12) pinOp = 1;
  mapEl.style.setProperty("--pin-scale", pinScale.toFixed(3));
  mapEl.style.setProperty("--hub-scale", hubScale.toFixed(3));
  mapEl.style.setProperty("--hub-opacity", hubOp.toFixed(3));
  mapEl.style.setProperty("--pin-opacity", String(pinOp));
  mapEl.classList.toggle("day-filter", !!(currentMapDay && dayZoneIds(state.currentCity, currentMapDay).size));
  mapEl.classList.toggle("pins-live", pinOp >= 1);
  mapEl.classList.toggle("hubs-live", hubOp >= 0.35);

  const lod = pinOp >= 1 ? 2 : zoneOp >= 0.4 ? 1 : 0;
  if (!force && lod === currentCityLod) return;
  currentCityLod = lod;
  mapEl.classList.remove("lod-0", "lod-1", "lod-2");
  mapEl.classList.add("lod-" + lod);
  if (hint) {
    hint.textContent = lod === 0
      ? "Quartiers · zoomer pour les détails"
      : lod === 1
        ? "Quartiers · zoomer pour les pins"
        : "Glisser · pincer · toucher un pin";
  }
}

export function renderCityPins(id, day, selected){
  currentMapDay = day || null;
  pinMarkers.forEach(m => m.remove());
  pinMarkers = [];
  const places = placesOnMap(id);
  const hotels = hotelsOnMap(id);
  const stops = stopsOnMap(id);
  const dayKeys = new Set();
  const dayStopKeys = new Set();
  if (day){
    ideasOf(day).forEach(a => {
      if (a.lat == null) return;
      dayKeys.add(a.lat.toFixed(4) + "," + a.lng.toFixed(4));
    });
    (day.moves || []).forEach(m => {
      if (!m.leg) return;
      const leg = LEGS.find(l => l.id === m.leg);
      if (!leg) return;
      [leg.fromStop, leg.toStop].forEach(s => {
        if (s && s.lat != null) dayStopKeys.add(s.lat.toFixed(4) + "," + s.lng.toFixed(4));
      });
    });
  }
  const selKey = selected && selected.lat != null
    ? selected.lat.toFixed(4) + "," + selected.lng.toFixed(4)
    : null;
  places.forEach(a => {
    const key = a.lat.toFixed(4) + "," + a.lng.toFixed(4);
    const onDay = !day || dayKeys.has(key);
    const isSel = selKey === key;
    const kind = pinKind(a.title);
    const accent = activityPinColor(id, a.lat, a.lng, isSel);
    const btn = document.createElement("button");
    btn.type = "button";
    let cls = "pin";
    if (day) cls += onDay ? " on" : " dim";
    if (isSel) cls += " selected";
    // Autres activités du même jour : visibles, sans surbrillance
    else if (selKey && !isSel && (!day || !onDay)) cls += " dim";
    btn.className = cls;
    btn.title = a.title;
    btn.setAttribute("aria-label", a.title);
    btn.innerHTML = `<span class="badge">${iconSvg(kind, accent)}</span>`;
    btn.addEventListener("click", e => {
      e.stopPropagation();
      hooks.openActivityDetail(a);
    });
    addCityMarker(btn, a.lat, a.lng, "bottom", pinMarkers);
  });
  stops.forEach(stop => {
    const key = stop.lat.toFixed(4) + "," + stop.lng.toFixed(4);
    const onDay = !day || dayStopKeys.has(key);
    const isSel = selKey === key;
    const accent = isSel ? PIN_COLOR_STOP_SEL : PIN_COLOR_STOP;
    const btn = document.createElement("button");
    btn.type = "button";
    let cls = "pin pin-stop";
    if (day) cls += onDay ? " on" : " dim";
    if (isSel) cls += " selected";
    else if (selKey && !isSel && day && !onDay) cls += " dim";
    btn.className = cls;
    btn.title = stop.name + " (" + stop.kind + ")";
    btn.setAttribute("aria-label", stop.kind + " · " + stop.name);
    btn.innerHTML = `<span class="badge">${iconSvg(stopPinKind(stop), accent)}</span>`;
    btn.addEventListener("click", e => {
      e.stopPropagation();
      hooks.openStopDetail(stop);
    });
    addCityMarker(btn, stop.lat, stop.lng, "bottom", pinMarkers);
  });
  hotels.forEach(stay => {
    const h = stay.hotel;
    const key = h.lat.toFixed(4) + "," + h.lng.toFixed(4);
    const isSel = selKey === key;
    const activeStay = day ? stayForDay(id, day) : null;
    const onStay = !day || (activeStay && activeStay.id === stay.id);
    const accent = isSel ? PIN_COLOR_HOTEL_SEL : PIN_COLOR_HOTEL;
    const btn = document.createElement("button");
    btn.type = "button";
    let cls = "pin pin-hotel";
    if (day) cls += onStay ? " on" : " dim";
    if (isSel) cls += " selected";
    btn.className = cls;
    btn.dataset.stay = stay.id;
    btn.title = h.name + " (hôtel)";
    btn.setAttribute("aria-label", "Hôtel · " + h.name);
    btn.innerHTML = `<span class="badge">${iconSvg("bag", accent)}</span>`;
    btn.addEventListener("click", e => {
      e.stopPropagation();
      hooks.openHotelDetail(stay);
    });
    addCityMarker(btn, h.lat, h.lng, "bottom", pinMarkers);
  });
  renderCityHubs(id, day || null);
  layoutCityZones(day || null);
  updateCityLod(true);
}

export function highlightPin(act, opts){
  if (!state.currentCity || !act || act.lat == null) return;
  state.lastFocusAct = act;
  const dayEl = panel.querySelector("details.day[open]");
  const dayN = dayEl ? Number(dayEl.dataset.dayN) : null;
  const day = dayN != null ? DAYS.find(d => d.n === dayN) : null;
  renderCityPins(state.currentCity, day || null, act);
  if (opts && opts.zoom) {
    const zoom = cityCoverZoom() + Math.log2(isMobileUi() ? 3.3 : 2.8);
    cameraMove({ center: [act.lng, act.lat], zoom: Math.max(map.getZoom(), zoom), padding: mapViewportInsets() });
  }
}

function openDayInPanel(){
  const dayEl = panel.querySelector("details.day[open]");
  if (!dayEl) return null;
  const dayN = Number(dayEl.dataset.dayN);
  return DAYS.find(d => d.n === dayN) || null;
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
  updateCityLod(true);
  layoutCityZones(currentMapDay);
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
  const pts = dayPinPoints(cityId, day);
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
  return Object.assign(base, { center: cam.center, zoom: Math.max(cam.zoom, info.cover + Math.log2(1.2)) });
}

function focusDayMap(cityId, day){
  if (!map || state.currentCity !== cityId) return;
  cameraMove(dayCamera(cityId, day));
}
