/* Trajets sur la carte Japon : couches GeoJSON, surbrillance, véhicules animés. */

import { LEGS } from "../core/data.js";
import { prefersReducedMotion } from "../core/env.js";
import { legRouteParts, legVehicleKind } from "../domain/legs.js";
import { routePartCoords, toWorld } from "./geo.js";
import { map, mapMode, mapStyleReady, mapStyleTheme } from "./map-view.js";
import { TRANSPORT_COLORS as ROUTE_COLORS, TRANSPORT_LABELS, transportIconSvg } from "../shared/icons.js";
import { mapEl } from "../core/elements.js";

let vehicleAnims = [];

let vehicleRaf = 0;

let routeHighlight = null;

let routeHoverId = null;

const routeCoords = new Map();

/* —— Données routes —— */
function buildRouteData(){
  routeCoords.clear();
  const features = [];
  let fid = 1;
  LEGS.forEach(leg => {
    if (leg.skipMap) return;
    legRouteParts(leg).forEach(part => {
      const coords = routePartCoords(part);
      if (coords.length < 2) return;
      routeCoords.set(part.pathId, coords);
      features.push({
        type: "Feature",
        id: fid++,
        properties: {
          segment: part.pathId,
          leg: part.legId,
          journey: leg.journey || "",
          vehicle: legVehicleKind(part.mode)
        },
        geometry: { type: "LineString", coordinates: coords }
      });
    });
  });
  return { type: "FeatureCollection", features };
}

export let ROUTE_DATA = null;

function routeColorExpr(){
  return ["match", ["get", "vehicle"],
    "shinkansen", ROUTE_COLORS.shinkansen,
    "bus", ROUTE_COLORS.bus,
    "plane", ROUTE_COLORS.plane,
    ROUTE_COLORS.train];
}

const FS_ACTIVE = ["boolean", ["feature-state", "active"], false];

const FS_DIM = ["boolean", ["feature-state", "dim"], false];

const FS_HOVER = ["boolean", ["feature-state", "hover"], false];

export function addTripLayers(){
  if (!map) return;
  const theme = mapStyleTheme;
  if (!ROUTE_DATA) ROUTE_DATA = buildRouteData();
  map.addSource("routes", { type: "geojson", data: ROUTE_DATA });
  const lineW = (base) => ["interpolate", ["linear"], ["zoom"], 4, base, 8, base * 1.6, 12, base * 2.2];
  /* Une seule interpolation de zoom par expression : l’état (actif / survol) va dans les sorties */
  const lineWState = (base, on) => ["interpolate", ["linear"], ["zoom"],
    4, ["case", ["any", FS_ACTIVE, FS_HOVER], on, base],
    8, ["case", ["any", FS_ACTIVE, FS_HOVER], on * 1.6, base * 1.6],
    12, ["case", ["any", FS_ACTIVE, FS_HOVER], on * 2.2, base * 2.2]];
  map.addLayer({
    id: "route-casing", type: "line", source: "routes",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": theme === "light" ? "#fffaf3" : "#06090d",
      "line-width": lineW(5),
      "line-opacity": ["case", FS_DIM, 0.12, 0.85]
    }
  });
  map.addLayer({
    id: "route-glow", type: "line", source: "routes",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": routeColorExpr(),
      "line-width": lineW(9),
      "line-blur": 6,
      "line-opacity": ["case", FS_DIM, 0, FS_ACTIVE, 0.6, FS_HOVER, 0.5, theme === "light" ? 0.18 : 0.3]
    }
  });
  map.addLayer({
    id: "route-line", type: "line", source: "routes",
    filter: ["!=", ["get", "vehicle"], "plane"],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": routeColorExpr(),
      "line-width": lineWState(2.4, 3.4),
      "line-opacity": ["case", FS_DIM, 0.22, 1]
    }
  });
  map.addLayer({
    id: "route-line-dashed", type: "line", source: "routes",
    filter: ["==", ["get", "vehicle"], "plane"],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": routeColorExpr(),
      "line-width": lineWState(2.2, 3),
      "line-dasharray": [1.2, 1.6],
      "line-opacity": ["case", FS_DIM, 0.22, 1]
    }
  });
  map.addLayer({
    id: "route-hit", type: "line", source: "routes",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#000", "line-width": 26, "line-opacity": 0.001 }
  });
}

export function setRoutesVisible(on){
  if (!map || !mapStyleReady) return;
  ["route-casing", "route-glow", "route-line", "route-line-dashed", "route-hit"].forEach(id => {
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", on ? "visible" : "none");
  });
}

/* —— Véhicules animés le long des trajets —— */
/** Trajet trop court à l’écran : la pastille recouvrirait les villes → masquée. */
function syncVehicleVisibility(v){
  const a = map.project(v.coords[0]), b = map.project(v.coords[v.coords.length - 1]);
  v.el.classList.toggle("is-hidden", Math.hypot(b.x - a.x, b.y - a.y) < 90);
}

function placeVehicle(v, t){
  const target = t * v.total;
  let i = 1;
  while (i < v.cum.length - 1 && v.cum[i] < target) i++;
  const a = v.coords[i - 1], b = v.coords[i];
  const seg = (v.cum[i] - v.cum[i - 1]) || 1e-9;
  const k = Math.max(0, Math.min(1, (target - v.cum[i - 1]) / seg));
  v.marker.setLngLat([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
  syncVehicleVisibility(v);
}

export function buildVehicles(){
  vehicleAnims.forEach(v => v.marker.remove());
  vehicleAnims = [];
  if (!map) return;
  // Construit avant le chargement du style (buildCountry) : les données ne dépendent pas de la carte
  if (!ROUTE_DATA) ROUTE_DATA = buildRouteData();
  ROUTE_DATA.features.forEach(f => {
    const coords = f.geometry.coordinates;
    const cum = [0];
    for (let i = 1; i < coords.length; i++) {
      const a = toWorld({ lat: coords[i - 1][1], lng: coords[i - 1][0] });
      const b = toWorld({ lat: coords[i][1], lng: coords[i][0] });
      cum.push(cum[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
    }
    const total = cum[cum.length - 1] || 1e-9;
    const kind = f.properties.vehicle;
    const el = document.createElement("div");
    el.className = "route-vehicle vehicle-" + kind;
    el.dataset.leg = f.properties.leg;
    el.dataset.journey = f.properties.journey;
    el.style.setProperty("--mode-c", ROUTE_COLORS[kind] || ROUTE_COLORS.train);
    el.innerHTML = `<span class="vehicle-badge">${transportIconSvg(kind)}</span>`;
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat(coords[0]);
    /* durée ≈ ancienne carte : longueur / vitesse, bornée 5–22 s */
    const px = total * 2600;
    const dur = Math.max(5, Math.min(22, px / (kind === "bus" ? 55 : 75)));
    const v = { marker, el, coords, cum, total, dur, offset: Math.random() * 8, feature: f };
    placeVehicle(v, 0.38);
    vehicleAnims.push(v);
  });
}

function vehiclesLoop(now){
  vehicleRaf = 0;
  if (!map || mapMode !== "country" || document.hidden) return;
  vehicleAnims.forEach(v => {
    const t = (((now / 1000) + v.offset) % v.dur) / v.dur;
    placeVehicle(v, t);
  });
  vehicleRaf = requestAnimationFrame(vehiclesLoop);
}

export function startVehicles(){
  if (!map) return;
  vehicleAnims.forEach(v => { if (!v.marker._map) v.marker.addTo(map); });
  if (prefersReducedMotion()) {
    vehicleAnims.forEach(v => placeVehicle(v, 0.5));
    return;
  }
  if (!vehicleRaf) vehicleRaf = requestAnimationFrame(vehiclesLoop);
}

export function stopVehicles(){
  if (vehicleRaf) cancelAnimationFrame(vehicleRaf);
  vehicleRaf = 0;
  vehicleAnims.forEach(v => v.marker.remove());
}

/* —— Surbrillance trajets (feature-state) —— */
export function applyRouteHighlight(){
  if (!map || !mapStyleReady || !ROUTE_DATA || !map.getSource("routes")) return;
  const h = routeHighlight;
  ROUTE_DATA.features.forEach(f => {
    let on = false;
    if (h) on = h.journey ? f.properties.journey === h.journey : f.properties.leg === h.leg;
    map.setFeatureState({ source: "routes", id: f.id }, { active: !!h && on, dim: !!h && !on, hover: f.id === routeHoverId });
  });
  vehicleAnims.forEach(v => {
    const p = v.feature.properties;
    let on = false;
    if (h) on = h.journey ? p.journey === h.journey : p.leg === h.leg;
    v.el.classList.toggle("route-active", !!h && on);
    v.el.classList.toggle("route-dim", !!h && !on);
  });
}

/** Trajet survolé (souris) — id de feature ou null. */
export function setRouteHover(id){
  if (routeHoverId === id) return;
  routeHoverId = id;
  applyRouteHighlight();
}

export function resetRouteHighlight(){
  routeHighlight = null;
  applyRouteHighlight();
}

export function setRouteHighlight(id){
  const leg = LEGS.find(l => l.id === id);
  routeHighlight = leg && leg.journey ? { journey: leg.journey } : { leg: id };
  applyRouteHighlight();
}

export function setJourneyHighlight(journeyId){
  routeHighlight = { journey: journeyId };
  applyRouteHighlight();
}

export function legGeoCoords(leg){
  let coords = [];
  legRouteParts(leg).forEach(part => {
    coords = coords.concat(routeCoords.get(part.pathId) || routePartCoords(part));
  });
  if (!coords.length) {
    [leg.from, ...(leg.via || []), leg.to].forEach(p => {
      if (p && p.lat != null) coords.push([p.lng, p.lat]);
    });
  }
  return coords;
}

export function stopVehiclesLoopOnly(){
  if (vehicleRaf) cancelAnimationFrame(vehicleRaf);
  vehicleRaf = 0;
}

/** Légende des couleurs de trajets (vue Japon), limitée aux modes présents dans le voyage. */
export function renderRouteLegend(){
  if (!mapEl) return;
  if (!ROUTE_DATA) ROUTE_DATA = buildRouteData();
  let el = document.getElementById("route-legend");
  if (!el) {
    el = document.createElement("div");
    el.id = "route-legend";
    el.className = "route-legend";
    el.setAttribute("aria-label", "Légende des trajets");
    mapEl.parentElement.appendChild(el);
  }
  const kinds = ["plane", "shinkansen", "train", "bus"]
    .filter(k => ROUTE_DATA.features.some(f => f.properties.vehicle === k));
  el.innerHTML = kinds.map(k =>
    `<span class="route-legend-item" style="--mode-c:${ROUTE_COLORS[k]}"><i class="vehicle-badge">${transportIconSvg(k)}</i>${TRANSPORT_LABELS[k]}</span>`
  ).join("");
}
