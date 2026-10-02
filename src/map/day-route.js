/* Itinéraire du jour sur la carte ville : tracé animé (hôtel → activités → hôtel),
   flèches de sens, pastilles « à pied / transports » par tronçon, résumé de la journée. */

import { mapEl } from "../core/elements.js";
import { prefersReducedMotion } from "../core/env.js";
import { itinerarySummary, segmentEstimate } from "../domain/itinerary.js";
import { TRANSPORT_COLORS, transportIconSvg } from "../shared/icons.js";
import { bowedSegment } from "./geo.js";
import { map, mapStyleReady, mapStyleTheme } from "./map-view.js";

const SOURCE = "day-route";
const LAYERS = ["day-route-casing", "day-route-line", "day-route-flow", "day-route-arrows"];
/* Pas de l’animation « fourmis » (cf. exemple MapLibre « animate a line ») */
const DASH_SEQUENCE = [
  [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
  [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5]
];

let current = null;      // { key, stops, coords, segments }
let chipMarkers = [];
let drawRaf = 0;
let flowTimer = 0;

const emptyData = () => ({ type: "FeatureCollection", features: [] });
const lineData = (coords) => ({
  type: "FeatureCollection",
  features: coords.length > 1 ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } }] : []
});

/** Couches de l’itinéraire (à rappeler après chaque changement de style / thème). */
export function addDayRouteLayers() {
  if (!map || map.getSource(SOURCE)) return;
  const light = mapStyleTheme === "light";
  map.addSource(SOURCE, { type: "geojson", data: emptyData(), lineMetrics: true });
  const before = map.getLayer("poi-station") ? "poi-station" : undefined;
  const w = (base) => ["interpolate", ["linear"], ["zoom"], 11, base * 0.7, 14, base, 17, base * 1.5];
  map.addLayer({
    id: "day-route-casing", type: "line", source: SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": light ? "#fffaf3" : "#081018", "line-width": w(10), "line-opacity": light ? 0.95 : 0.85 }
  }, before);
  map.addLayer({
    id: "day-route-line", type: "line", source: SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-width": w(5),
      "line-gradient": ["interpolate", ["linear"], ["line-progress"],
        0, light ? "#b8862f" : "#e0c99a", 0.5, light ? "#c9692c" : "#eb9a52", 1, "#e2583e"]
    }
  }, before);
  map.addLayer({
    id: "day-route-flow", type: "line", source: SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#ffffff", "line-width": w(2), "line-opacity": light ? 0.75 : 0.55, "line-dasharray": DASH_SEQUENCE[0] }
  }, before);
  map.addLayer({
    id: "day-route-arrows", type: "symbol", source: SOURCE,
    layout: {
      "symbol-placement": "line", "symbol-spacing": 90,
      "text-field": "›", "text-font": ["Noto Sans Bold"], "text-size": w(20),
      "text-keep-upright": false, "text-allow-overlap": true, "text-rotation-alignment": "map",
      "text-offset": [0, -0.08]
    },
    paint: { "text-color": light ? "#7a3b1c" : "#fff4e6", "text-opacity": 0.9 }
  }, before);
  if (current) setSource(current.coords);
}

function setSource(coords) {
  const src = map && mapStyleReady && map.getSource(SOURCE);
  if (src) src.setData(lineData(coords));
}

function formatDuration(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}
const formatKm = (km) => (km < 10 ? km.toFixed(1).replace(".", ",") : String(Math.round(km))) + " km";


function renderChips(segments) {
  chipMarkers.forEach((m) => m.remove());
  chipMarkers = [];
  if (!map) return;
  segments.forEach((seg, i) => {
    const el = document.createElement("div");
    el.className = "route-chip " + seg.estimate.mode;
    el.style.setProperty("--chip-i", String(i));
    el.title = (seg.estimate.mode === "walk" ? "À pied" : "Transports") + " · ≈ " + formatKm(seg.estimate.km);
    const kind = seg.estimate.mode === "walk" ? "walk" : "metro";
    el.style.setProperty("--mode-c", TRANSPORT_COLORS[kind]);
    el.innerHTML = `<i class="chip-icon">${transportIconSvg(kind)}</i><span>${formatDuration(seg.estimate.minutes)}</span>`;
    chipMarkers.push(new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(seg.mid).addTo(map));
  });
  updateDayRouteChips();
}

/** Masque la durée d’un tronçon trop court à l’écran (elle recouvrirait les pins). */
export function updateDayRouteChips() {
  if (!map || !current) return;
  const minPx = window.matchMedia("(max-width: 900px)").matches ? 96 : 120;
  current.segments.forEach((seg, i) => {
    const el = chipMarkers[i] && chipMarkers[i].getElement();
    if (!el) return;
    const a = map.project([seg.from.lng, seg.from.lat]), b = map.project([seg.to.lng, seg.to.lat]);
    el.classList.toggle("is-hidden", Math.hypot(b.x - a.x, b.y - a.y) < minPx);
  });
}

function renderSummary(day, stops) {
  let el = document.getElementById("day-summary");
  if (!day || stops.length < 2) {
    if (el) el.hidden = true;
    return;
  }
  if (!el) {
    el = document.createElement("div");
    el.id = "day-summary";
    el.className = "day-summary";
    el.setAttribute("aria-live", "polite");
    mapEl.parentElement.appendChild(el);
  }
  const s = itinerarySummary(stops);
  const steps = s.activities ? `${s.activities} étape${s.activities > 1 ? "s" : ""}` : "Trajet";
  el.innerHTML =
    `<strong>Jour ${day.n}</strong><span class="sep">·</span>${steps}` +
    `<span class="sep">·</span>≈ ${formatKm(s.km)}<span class="sep">·</span>${formatDuration(s.minutes)} de trajets`;
  el.hidden = false;
}

function stopAnimations() {
  if (drawRaf) cancelAnimationFrame(drawRaf);
  drawRaf = 0;
  clearInterval(flowTimer);
  flowTimer = 0;
}

function startFlow() {
  if (prefersReducedMotion() || flowTimer) return;
  let step = 0;
  flowTimer = setInterval(() => {
    if (!map || !map.getLayer("day-route-flow") || document.hidden) return;
    step = (step + 1) % DASH_SEQUENCE.length;
    map.setPaintProperty("day-route-flow", "line-dasharray", DASH_SEQUENCE[step]);
  }, 70);
}

/** Dessine le tracé progressivement (≈ 1 s), puis lance le défilement. */
function drawIn(coords) {
  if (prefersReducedMotion() || coords.length < 3) {
    setSource(coords);
    startFlow();
    return;
  }
  const t0 = performance.now(), duration = Math.min(1600, 500 + coords.length * 6);
  const frame = (now) => {
    const t = Math.min(1, (now - t0) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    setSource(coords.slice(0, Math.max(2, Math.ceil(eased * coords.length))));
    if (t < 1) drawRaf = requestAnimationFrame(frame);
    else { drawRaf = 0; startFlow(); }
  };
  drawRaf = requestAnimationFrame(frame);
}

/**
 * Affiche l’itinéraire `stops` (cf. domain/itinerary.js) du jour `day`, ou l’efface (stops vide).
 * Même jour déjà affiché → rien ne bouge (pas de ré-animation à chaque clic sur un pin).
 */
export function showDayRoute(cityId, day, stops) {
  const key = day && stops.length > 1 ? `${cityId}:${day.n}` : null;
  if (current && current.key === key) return;
  stopAnimations();
  if (!key) {
    current = null;
    setSource([]);
    renderChips([]);
    renderSummary(null, []);
    return;
  }
  const segments = [];
  let coords = [];
  for (let i = 1; i < stops.length; i++) {
    const seg = bowedSegment(stops[i - 1], stops[i]);
    coords = coords.concat(i > 1 ? seg.coords.slice(1) : seg.coords);
    segments.push({ from: stops[i - 1], to: stops[i], mid: seg.mid, estimate: segmentEstimate(stops[i - 1], stops[i]) });
  }
  current = { key, stops, coords, segments };
  setSource([]);
  drawIn(coords);
  renderChips(segments);
  renderSummary(day, stops);
}

export function clearDayRoute() {
  showDayRoute(null, null, []);
}
