/* Instance MapLibre et caméra : état de la carte (lecture seule hors setters), cadrages, marges utiles, boutons. */

import { MAP_RELIEF_KEY } from "../config.js";
import { CITIES, MAP_BOUNDS, ORDER } from "../core/data.js";
import { mapEl, panel } from "../core/elements.js";
import { isMobileUi, prefersReducedMotion } from "../core/env.js";
import { state } from "../core/state.js";
import { boundsOfCoords, mercX, mercY, unmercY } from "./geo.js";

export const COUNTRY_PITCH = 48;

export const JAPAN_MAX_BOUNDS = [[121, 22], [157, 48]];

export let map = null;

export let mapStyleTheme = null;

export let mapMode = "country";

export let mapStyleReady = false;

/* État de la carte : lecture via les exports, écriture via ces setters uniquement. */
export function setMapInstance(m){ map = m; }

export function setMapModeValue(mode){ mapMode = mode; }

export function setMapStyleReady(ready){ mapStyleReady = ready; }

export function setMapStyleTheme(theme){ mapStyleTheme = theme; }

export function mapReliefEnabled(){
  try { return localStorage.getItem(MAP_RELIEF_KEY) !== "0"; } catch (_) { return true; }
}

export function resolvedTheme(){
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** Cadrage d’une emprise [[w,s],[e,n]] dans la zone utile (hors marges `pad`).
    Calcul direct (cameraForBounds cumule le padding déjà appliqué à la carte). */
export function cameraForGeoBounds(b, pad, maxZoom){
  const W = Math.max(64, mapEl.clientWidth), H = Math.max(64, mapEl.clientHeight);
  const availW = Math.max(80, W - pad.left - pad.right);
  const availH = Math.max(80, H - pad.top - pad.bottom);
  const bw = Math.max(1e-9, (mercX(b[1][0]) - mercX(b[0][0])) * 512);
  const bh = Math.max(1e-9, (mercY(b[0][1]) - mercY(b[1][1])) * 512);
  let zoom = Math.log2(Math.min(availW / bw, availH / bh));
  if (maxZoom != null) zoom = Math.min(zoom, maxZoom);
  const cy = unmercY((mercY(b[0][1]) + mercY(b[1][1])) / 2);
  return { center: [(b[0][0] + b[1][0]) / 2, cy], zoom };
}

/** Zoom « cover » (ancienne carte remplie) et « contain » pour une ville. */
export function cityZoomInfo(id){
  const b = MAP_BOUNDS[id];
  const W = Math.max(64, mapEl.clientWidth), H = Math.max(64, mapEl.clientHeight);
  const bw = (mercX(b.east) - mercX(b.west)) * 512;
  const bh = (mercY(b.south) - mercY(b.north)) * 512;
  return {
    cover: Math.log2(Math.max(W / bw, H / bh)),
    contain: Math.log2(Math.min(W / bw, H / bh)),
    center: [(b.west + b.east) / 2, (b.south + b.north) / 2]
  };
}

export function cityCoverZoom(){
  return state.currentCity ? cityZoomInfo(state.currentCity).cover : 12;
}

export function cameraMove(cam, instant){
  if (!map) return;
  const opts = Object.assign({ essential: true }, cam);
  if (instant || prefersReducedMotion()) {
    map.jumpTo(opts);
    return;
  }
  const from = map.getCenter();
  const far = !cam.center || Math.abs(from.lng - (cam.center.lng != null ? cam.center.lng : cam.center[0])) > 0.6 ||
    Math.abs(from.lat - (cam.center.lat != null ? cam.center.lat : cam.center[1])) > 0.6 ||
    (cam.zoom != null && Math.abs(map.getZoom() - cam.zoom) > 2.5);
  if (far) map.flyTo(Object.assign({ duration: 1600, curve: 1.3 }, opts));
  else map.easeTo(Object.assign({ duration: 650 }, opts));
}

/** Cadre de départ : toutes les villes du voyage, carte inclinée. */
export function fitJapanHome(instant){
  if (!map || !mapEl.clientWidth) return;
  const pts = ORDER.map(id => [CITIES[id].lng, CITIES[id].lat]);
  const b = boundsOfCoords(pts);
  const mobile = isMobileUi();
  const padX = mobile ? 0.45 : 0.6, padY = mobile ? 0.25 : 0.45;
  const bounds = [[b[0][0] - padX, b[0][1] - padY], [b[1][0] + padX, b[1][1] + padY]];
  const pitch = mapReliefEnabled() ? COUNTRY_PITCH : 30;
  const pad = mapViewportInsets();
  const cam = cameraForGeoBounds(bounds, pad);
  /* inclinaison : le haut de la carte s’éloigne → on peut zoomer un peu */
  const bonus = mobile ? 0 : pitch / 220;
  cameraMove({ center: cam.center, zoom: cam.zoom + bonus, pitch: mobile ? Math.min(pitch, 42) : pitch, bearing: 0, padding: pad }, instant);
}

export function mapViewportInsets(){
  const mobile = isMobileUi();
  const open = panel && panel.classList.contains("open");
  const H = mapEl.clientHeight || window.innerHeight;
  const W = mapEl.clientWidth || window.innerWidth;
  const clampPad = (p) => ({
    top: Math.min(p.top, H * 0.4), bottom: Math.min(p.bottom, H * 0.85),
    left: Math.min(p.left, W * 0.3), right: Math.min(p.right, W * 0.7)
  });
  if (mobile) {
    const top = state.currentCity ? 64 : 72;
    if (!open) return clampPad({ top, right: 24, bottom: 36, left: 24 });
    const h = panel.offsetHeight || Math.round(H * 0.55);
    return clampPad({ top, right: 18, bottom: h + 18, left: 18 });
  }
  const left = 214;
  if (open) {
    const pw = panel.offsetWidth || 400;
    return clampPad({ top: 56, right: pw + 36, bottom: 44, left });
  }
  return clampPad({ top: 56, right: 72, bottom: 56, left });
}

export function fitGeoBounds(b, maxZoom){
  if (!map || !b) return;
  const pad = mapViewportInsets();
  const extra = { top: pad.top + 40, right: pad.right + 40, bottom: pad.bottom + 40, left: pad.left + 40 };
  const cam = cameraForGeoBounds(b, extra, maxZoom || 9.5);
  cameraMove({ center: cam.center, zoom: cam.zoom - map.getPitch() / 400, padding: pad });
}

export function syncMapControls(){
  const app = document.querySelector(".app");
  if (!map || !app) return;
  const bearing = map.getBearing();
  const needle = document.querySelector("#z-north .compass-needle");
  if (needle) needle.style.transform = `rotate(${-bearing}deg)`;
  const north = document.getElementById("z-north");
  if (north) north.classList.toggle("rotated", Math.abs(bearing) > 0.5);
  const btn3d = document.getElementById("z-3d");
  if (btn3d) {
    const tilted = map.getPitch() >= 10;
    btn3d.textContent = tilted ? "2D" : "3D";
    btn3d.title = tilted ? "Vue à plat" : "Vue inclinée (relief)";
    btn3d.hidden = mapMode !== "country";
  }
}

export function showMapFallback(msg){
  const fb = document.getElementById("map-fallback");
  if (fb) {
    fb.hidden = false;
    fb.querySelector("p").textContent = msg;
  }
}
