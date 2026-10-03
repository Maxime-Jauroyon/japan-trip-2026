/* Trajets sur la carte Japon : couches GeoJSON, surbrillance, pastilles de mode. */

import { LEGS } from "../core/data.js";
import { legRouteParts, legVehicleKind } from "../domain/legs.js";
import { routePartCoords, toWorld } from "./geo.js";
import { map, mapMode, mapStyleReady, mapStyleTheme } from "./map-view.js";
import { TRANSPORT_COLORS as ROUTE_COLORS, transportIconSvg } from "../shared/icons.js";

let routeBadges = [];
let badgeZoomBound = false;


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

/* —— Pastilles de mode, fixes au milieu de chaque trajet —— */
/** Trajet trop court à l’écran : la pastille recouvrirait les villes → masquée. */
function syncBadgeVisibility(v){
  const a = map.project(v.coords[0]), b = map.project(v.coords[v.coords.length - 1]);
  v.el.classList.toggle("is-hidden", Math.hypot(b.x - a.x, b.y - a.y) < 90);
}

function syncRouteBadges(){
  if (map && mapMode === "country") routeBadges.forEach(syncBadgeVisibility);
}

/** Point situé à mi-parcours (en distance projetée) le long du tracé. */
function routeMidpoint(coords){
  const cum = [0];
  for (let i = 1; i < coords.length; i++) {
    const a = toWorld({ lat: coords[i - 1][1], lng: coords[i - 1][0] });
    const b = toWorld({ lat: coords[i][1], lng: coords[i][0] });
    cum.push(cum[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
  }
  const target = cum[cum.length - 1] / 2;
  let i = 1;
  while (i < cum.length - 1 && cum[i] < target) i++;
  const a = coords[i - 1], b = coords[i];
  const k = Math.max(0, Math.min(1, (target - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1e-9)));
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
}

export function buildRouteBadges(){
  routeBadges.forEach(v => v.marker.remove());
  routeBadges = [];
  if (!map) return;
  // Construit avant le chargement du style (buildCountry) : les données ne dépendent pas de la carte
  if (!ROUTE_DATA) ROUTE_DATA = buildRouteData();
  ROUTE_DATA.features.forEach(f => {
    const coords = f.geometry.coordinates;
    const kind = f.properties.vehicle;
    const el = document.createElement("div");
    el.className = "route-vehicle vehicle-" + kind;
    el.dataset.leg = f.properties.leg;
    el.dataset.journey = f.properties.journey;
    el.style.setProperty("--mode-c", ROUTE_COLORS[kind] || ROUTE_COLORS.train);
    el.innerHTML = `<span class="vehicle-badge">${transportIconSvg(kind)}</span>`;
    const marker = new maplibregl.Marker({ element: el }).setLngLat(routeMidpoint(coords));
    routeBadges.push({ marker, el, coords, feature: f });
  });
  if (!badgeZoomBound) {
    badgeZoomBound = true;
    map.on("move", syncRouteBadges);
    map.on("idle", syncRouteBadges);
  }
}

export function showRouteBadges(){
  if (!map) return;
  routeBadges.forEach(v => { if (!v.marker._map) v.marker.addTo(map); });
  syncRouteBadges();
}

export function hideRouteBadges(){
  routeBadges.forEach(v => v.marker.remove());
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
  routeBadges.forEach(v => {
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
