/* Recherche (loupe de l’en-tête) : villes, lieux du programme, hôtels, gares et phrases.
   Toucher un résultat ouvre la carte au bon endroit ; une phrase s’affiche en grand (mode Montrer). */

import { CITIES, CONTEXT_PHRASES, DAYS, ONSITE_PHRASES, ORDER } from "../core/data.js";
import { esc } from "../core/dom.js";
import { hooks } from "../core/hooks.js";
import { pinKind } from "../domain/classify.js";
import { cityIdForAct } from "../domain/places.js";
import { searchIndex } from "../domain/search.js";
import { cityStayDates, daysForCity, ideasOf, stopsOnMap } from "../domain/trip.js";
import { clearLegEnds } from "../map/country.js";
import { cityIconSvg, placeGlyphSvg } from "../shared/icons.js";
import { fillCityPanel, openActivityDetail, openCity, openHotelDetail, openStopDetail } from "./panels/city-panel.js";
import { phraseCardHtml } from "./phrase-show.js";

const GROUPS = [
  { type: "city", label: "Villes" },
  { type: "place", label: "Lieux du programme" },
  { type: "hotel", label: "Hôtels" },
  { type: "stop", label: "Gares et arrêts" },
  { type: "phrase", label: "Phrases" }
];
const PER_GROUP = 8;

let index = null;
let box = null;
let lastFocus = null;

function buildIndex(){
  const items = [];
  ORDER.forEach(id => {
    const c = CITIES[id];
    items.push({ type: "city", title: c.name, sub: cityStayDates(c), keywords: c.jp, city: id });
  });
  DAYS.forEach(d => ideasOf(d).forEach(a => {
    const city = cityIdForAct(a, d.city) || d.city;
    items.push({ type: "place", title: a.title, sub: `Jour ${d.n} · ${d.dow} ${d.date.replace(/\s\d{4}$/, "")} · ${CITIES[city] ? CITIES[city].name : city}`,
      keywords: a.desc, city, day: d, act: a });
  }));
  ORDER.forEach(id => (CITIES[id].stays || []).forEach(st => {
    const h = st.hotel || {};
    if (!h.name || h.name === "—") return;
    items.push({ type: "hotel", title: h.name, sub: `${CITIES[id].name} · ${st.from} → ${st.to}`, keywords: `${h.area || ""} hotel hôtel`, city: id, stay: st });
  }));
  const seenStop = new Set();
  ORDER.forEach(id => stopsOnMap(id).forEach(s => {
    const k = s.name + id;
    if (seenStop.has(k)) return;
    seenStop.add(k);
    items.push({ type: "stop", title: s.name, sub: `${s.kind || "Arrêt"} · ${CITIES[id].name}`, keywords: s.jp, city: id, stop: s });
  }));
  const seenPhrase = new Set();
  const addPhrase = (p, group) => {
    if (!p || seenPhrase.has(p.fr)) return;
    seenPhrase.add(p.fr);
    items.push({ type: "phrase", title: p.fr, sub: group, keywords: `${p.ro} ${p.note || ""}`, phrase: p });
  };
  ONSITE_PHRASES.forEach(g => g.phrases.forEach(p => addPhrase(p, g.title)));
  Object.values(CONTEXT_PHRASES || {}).forEach(g => g.phrases.forEach(p => addPhrase(p, g.label)));
  return items;
}

function itemHtml(it, i){
  if (it.type === "phrase") return phraseCardHtml(it.phrase, true);
  const ico = it.type === "city" ? cityIconSvg(it.city)
    : placeGlyphSvg(it.type === "hotel" ? "hotel" : it.type === "stop" ? "train" : pinKind(it.title));
  return `<button type="button" class="sr-item sr-${it.type}" data-i="${i}">` +
    `<span class="sr-ico" aria-hidden="true">${ico}</span>` +
    `<span class="sr-text"><strong>${esc(it.title)}</strong><small>${esc(it.sub || "")}</small></span></button>`;
}

let results = [];

function render(q){
  const list = box.querySelector(".sr-results");
  if (!q.trim()) {
    results = [];
    list.innerHTML = `<p class="sr-empty">Un lieu, un hôtel, une gare, une phrase…<br><small>ex. « ramen », « Nishiki », « toilettes », « Shinjuku »</small></p>`;
    return;
  }
  results = searchIndex(index, q, 200);
  if (!results.length) { list.innerHTML = `<p class="sr-empty">Aucun résultat pour « ${esc(q)} ».</p>`; return; }
  list.innerHTML = GROUPS.map(g => {
    const its = results.filter(r => r.type === g.type).slice(0, PER_GROUP);
    if (!its.length) return "";
    return `<section class="sr-group"><h3>${esc(g.label)}</h3>` +
      `<div class="${g.type === "phrase" ? "phrase-grid sm" : "sr-list"}">${its.map(it => itemHtml(it, results.indexOf(it))).join("")}</div></section>`;
  }).join("");
}

function go(it){
  closeSearch();
  hooks.setAppTab("map");
  clearLegEnds();
  if (it.type === "city") { openCity(it.city); return; }
  const city = CITIES[it.city];
  if (!city) return;
  fillCityPanel(city, daysForCity(it.city), it.type === "place" ? it.day.n : null);
  // Laisser le panneau se poser avant d’ouvrir la fiche
  setTimeout(() => {
    if (it.type === "place") openActivityDetail(it.act, { zoom: true });
    else if (it.type === "hotel") openHotelDetail(it.stay);
    else if (it.type === "stop") openStopDetail(it.stop, { zoom: true });
  }, 60);
}

function ensureBox(){
  if (box) return;
  box = document.createElement("div");
  box.className = "search-sheet";
  box.id = "search-sheet";
  box.hidden = true;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-label", "Rechercher");
  box.innerHTML =
    `<div class="sr-bar"><label class="sr-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m15.5 15.5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>` +
    `<input type="search" id="search-input" placeholder="Rechercher" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" /></label>` +
    `<button type="button" class="sr-cancel">Fermer</button></div>` +
    `<div class="sr-results"></div>`;
  document.body.appendChild(box);
  const input = box.querySelector("input");
  input.addEventListener("input", () => render(input.value));
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const first = results.find(r => r.type !== "phrase");
      if (first) go(first);
    }
  });
  box.querySelector(".sr-cancel").addEventListener("click", closeSearch);
  box.querySelector(".sr-results").addEventListener("click", e => {
    const b = e.target.closest("[data-i]");
    if (b) go(results[Number(b.dataset.i)]);
  });
}

export function openSearch(){
  if (!index) index = buildIndex();
  ensureBox();
  lastFocus = document.activeElement;
  box.hidden = false;
  document.documentElement.classList.add("search-open");
  const input = box.querySelector("input");
  render(input.value);
  input.focus();
  input.select();
}

export function closeSearch(){
  if (!box || box.hidden) return;
  box.hidden = true;
  document.documentElement.classList.remove("search-open");
  const input = box.querySelector("input");
  input.blur();
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

export function initSearch(){
  document.getElementById("search-open")?.addEventListener("click", openSearch);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && box && !box.hidden) { e.stopImmediatePropagation(); closeSearch(); }
    // Ordinateur : « / » ou Ctrl/⌘+K ouvre la recherche
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || "");
    if (!typing && (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"))) {
      e.preventDefault();
      openSearch();
    }
  }, true);
}
