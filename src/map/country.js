/* Vue Japon : marqueurs des villes, noms, mise en avant des villes d’un trajet. */

import { CITIES, MARK_LABELS, ORDER } from "../core/data.js";
import { esc } from "../core/dom.js";
import { isMobileUi } from "../core/env.js";
import { hooks } from "../core/hooks.js";
import { legEndPoint } from "../domain/legs.js";
import { map } from "./map-view.js";
import { buildRouteBadges, renderRouteLegend } from "./routes.js";
import { cityMapLogoSvg } from "../shared/icons.js";

let countryMarks = [];

/* —— Marqueurs villes (vue Japon) —— */
export function buildCountry(){
  countryMarks.forEach(m => m.remove());
  countryMarks = [];
  ORDER.forEach((id, i) => {
    const c = CITIES[id];
    const btn = document.createElement("button");
    btn.type = "button";
    const side = MARK_LABELS[id] && MARK_LABELS[id].side;
    btn.className = "city-mark" + (side === "left" ? " label-left" : "");
    btn.style.setProperty("--mark-i", String(i));
    btn.dataset.city = id;
    btn.title = c.name;
    btn.setAttribute("aria-label", c.name);
    btn.innerHTML =
      `<span class="mark-float"><span class="mark-halo" aria-hidden="true"></span>` +
      `<span class="map-logo">${cityMapLogoSvg(id)}</span>` +
      `<span class="label">${esc(c.name)}<small>${esc(c.jp)}</small></span></span>`;
    btn.addEventListener("click", e => { e.stopPropagation(); hooks.openCity(id); });
    const marker = new maplibregl.Marker({ element: btn, anchor: "center" }).setLngLat([c.lng, c.lat]).addTo(map);
    countryMarks.push(marker);
  });
  buildRouteBadges();
  renderRouteLegend();
}

export function syncCountryLabels(){
  if (!map) return;
  const z = map.getZoom();
  const base = isMobileUi() ? 6.6 : 0;
  document.querySelectorAll(".city-mark").forEach(el => {
    const cfg = MARK_LABELS[el.dataset.city] || { zoom: 0 };
    el.classList.toggle("label-on", z >= Math.max(base, cfg.zoom));
  });
}

export function setActiveCity(id){
  document.querySelectorAll("#city-list button").forEach(b => b.classList.toggle("active", b.dataset.city === id));
  document.querySelectorAll(".city-mark").forEach(b => b.classList.toggle("active", b.dataset.city === id));
}

export function setLegMode(on){
  document.querySelector(".app")?.classList.toggle("leg-mode", !!on);
}

export function clearLegEnds(){
  document.querySelectorAll(".city-mark").forEach(b => {
    b.classList.remove("leg-from", "leg-to", "leg-via", "leg-related");
  });
}

export function renderLegEnds(leg){
  [legEndPoint(leg, "from"), legEndPoint(leg, "to")].filter(Boolean).forEach(end => {
    if (!end.cityId) return;
    const mark = document.querySelector(`.city-mark[data-city="${end.cityId}"]`);
    if (mark) mark.classList.add("leg-related", end.role === "from" ? "leg-from" : "leg-to");
  });
  (leg.viaCities || []).forEach(id => {
    const mark = document.querySelector(`.city-mark[data-city="${id}"]`);
    if (mark) mark.classList.add("leg-related", "leg-via");
  });
}

export function renderJourneyEnds(journey, legs){
  clearLegEnds();
  if (!legs.length) return;
  const first = legs[0];
  const last = legs[legs.length - 1];
  [legEndPoint(first, "from"), legEndPoint(last, "to")].forEach(end => {
    if (!end || !end.cityId) return;
    const mark = document.querySelector(`.city-mark[data-city="${end.cityId}"]`);
    if (mark) mark.classList.add("leg-related", end.role === "from" ? "leg-from" : "leg-to");
  });
  const viaIds = new Set();
  legs.forEach((leg, i) => {
    if (i > 0) {
      const from = legEndPoint(leg, "from");
      if (from && from.cityId) viaIds.add(from.cityId);
    }
    if (i < legs.length - 1) {
      const to = legEndPoint(leg, "to");
      if (to && to.cityId) viaIds.add(to.cityId);
    }
  });
  viaIds.forEach(id => {
    const firstLeg = legs[0];
    const lastLeg = legs[legs.length - 1];
    const fromId = legEndPoint(firstLeg, "from")?.cityId;
    const toId = legEndPoint(lastLeg, "to")?.cityId;
    if (id === fromId || id === toId) return;
    const mark = document.querySelector(`.city-mark[data-city="${id}"]`);
    if (mark) mark.classList.add("leg-related", "leg-via");
  });
}
