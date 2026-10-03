/* Vue Japon : pins des villes (n° d’étape, nom + dates, désencombrement), mise en avant des villes d’un trajet. */

import { CITIES, MARK_LABELS, ORDER } from "../core/data.js";
import { findTripDayByISO, japanTodayISO } from "../core/dates.js";
import { esc } from "../core/dom.js";
import { isMobileUi } from "../core/env.js";
import { hooks } from "../core/hooks.js";
import { legEndPoint } from "../domain/legs.js";
import { cityStayDates } from "../domain/trip.js";
import { map } from "./map-view.js";
import { buildRouteBadges, renderRouteLegend } from "./routes.js";
import { cityMapLogoSvg } from "../shared/icons.js";

let countryMarks = [];   // { id, marker, el, label, nights, side, minZoom }

const nightsOf = (c) => (c.stays || []).reduce((n, st) => n + (parseInt(st.nights, 10) || 0), 0);

/** Ville du jour pendant le voyage (heure du Japon), sinon null. */
function todayCityId(){
  const d = findTripDayByISO(japanTodayISO());
  return d ? d.city : null;
}

/* —— Pins des villes (vue Japon) : pointe sur la ville, n° d’étape, nom + dates —— */
export function buildCountry(){
  countryMarks.forEach(m => m.marker.remove());
  countryMarks = [];
  const today = todayCityId();
  ORDER.forEach((id, i) => {
    const c = CITIES[id];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "city-mark" + (id === today ? " is-today" : "");
    btn.style.setProperty("--mark-i", String(i));
    btn.dataset.city = id;
    btn.setAttribute("aria-label", `Étape ${i + 1} · ${c.name}`);
    const dates = cityStayDates(c);
    btn.innerHTML =
      `<span class="cm-pin" aria-hidden="true">` +
      `<span class="cm-head">${cityMapLogoSvg(id)}</span>` +
      `<span class="cm-step">${i + 1}</span><span class="cm-tail"></span></span>` +
      `<span class="cm-dot" aria-hidden="true">${i + 1}</span>` +
      `<span class="label"><b>${esc(c.name)}</b><small>${id === today ? "Aujourd’hui · " : ""}${esc(dates || c.jp)}</small></span>`;
    btn.addEventListener("click", e => { e.stopPropagation(); hooks.openCity(id); });
    const marker = new maplibregl.Marker({ element: btn, anchor: "bottom" }).setLngLat([c.lng, c.lat]).addTo(map);
    const cfg = MARK_LABELS[id] || {};
    countryMarks.push({
      id, marker, el: btn, label: btn.querySelector(".label"), order: i,
      nights: nightsOf(c), side: cfg.side === "left" ? "left" : "right", minZoom: cfg.zoom || 0
    });
  });
  buildRouteBadges();
  renderRouteLegend();
  syncCountryLabels();
}

const overlaps = (a, b) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;

/**
 * Désencombrement à l’écran : les villes les plus importantes (nuits, ordre du voyage, trajet affiché)
 * gardent un pin complet ; une ville qui chevaucherait passe en point numéroté. Une étiquette
 * qui chevaucherait un pin ou une autre étiquette essaie l’autre côté, sinon se cache.
 */
export function syncCountryLabels(){
  if (!map || !countryMarks.length) return;
  const z = map.getZoom();
  const mobile = isMobileUi();
  const head = mobile ? 34 : 42, gap = 6;
  const legMode = document.querySelector(".app")?.classList.contains("leg-mode");
  const rank = (m) => (m.el.classList.contains("leg-related") ? 1000 : 0) + (m.el.classList.contains("active") ? 500 : 0) + m.nights * 10 - m.order;
  const placed = [];
  const order = [...countryMarks].sort((a, b) => rank(b) - rank(a));
  // 1) Pins : complet si la place est libre, sinon point numéroté
  order.forEach(m => {
    const p = m.p = map.project(m.marker.getLngLat());
    const box = { x1: p.x - head / 2 - gap, x2: p.x + head / 2 + gap, y1: p.y - head - 12 - gap, y2: p.y + gap };
    m.compact = z < m.minZoom || placed.some(o => overlaps(box, o));
    m.el.classList.toggle("is-compact", m.compact);
    placed.push(m.compact ? { x1: p.x - 10, x2: p.x + 10, y1: p.y - 10, y2: p.y + 10 } : box);
  });
  // 2) Étiquettes : côté préféré, sinon l’autre, sinon cachée (jamais hors de l’écran)
  const cv = map.getCanvas();
  const view = { x1: 4, y1: 4, x2: cv.clientWidth - 4, y2: cv.clientHeight - 4 };
  const inView = (r) => r.x1 >= view.x1 && r.x2 <= view.x2 && r.y1 >= view.y1 && r.y2 <= view.y2;
  order.forEach(m => {
    const hide = m.compact || (legMode && !m.el.classList.contains("leg-related"));
    if (hide) { m.el.classList.remove("label-on"); return; }
    const p = m.p;
    const w = m.label.offsetWidth || 90, h = m.label.offsetHeight || 34;
    const cy = p.y - 12 - head / 2;
    const sideBox = (side) => side === "left"
      ? { x1: p.x - head / 2 - 6 - w, x2: p.x - head / 2 - 6, y1: cy - h / 2, y2: cy + h / 2 }
      : { x1: p.x + head / 2 + 6, x2: p.x + head / 2 + 6 + w, y1: cy - h / 2, y2: cy + h / 2 };
    const sides = m.side === "left" ? ["left", "right"] : ["right", "left"];
    const side = sides.find(sd => inView(sideBox(sd)) && !placed.some(o => overlaps(sideBox(sd), o)));
    m.el.classList.toggle("label-on", !!side);
    m.el.classList.toggle("label-left", side === "left");
    if (side) placed.push(sideBox(side));
  });
}

export function setActiveCity(id){
  document.querySelectorAll("#city-list button").forEach(b => b.classList.toggle("active", b.dataset.city === id));
  document.querySelectorAll(".city-mark").forEach(b => b.classList.toggle("active", b.dataset.city === id));
  syncCountryLabels();
}

export function setLegMode(on){
  document.querySelector(".app")?.classList.toggle("leg-mode", !!on);
  syncCountryLabels();
}

export function clearLegEnds(){
  document.querySelectorAll(".city-mark").forEach(b => {
    b.classList.remove("leg-from", "leg-to", "leg-via", "leg-related");
  });
  syncCountryLabels();
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
  syncCountryLabels();
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
  syncCountryLabels();
}
