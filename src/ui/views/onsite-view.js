/* Onglet Sur place : boîte à outils du jour — carte « Aujourd’hui » (hôtel, programme, adresse),
   convertisseur ¥/€, phrases utiles, numéros d’urgence. Le programme détaillé est dans la carte. */

import { CITIES, DAYS, ONSITE_PHRASES, TRIP } from "../../core/data.js";
import { findTripDayByISO, japanTodayISO } from "../../core/dates.js";
import { esc } from "../../core/dom.js";
import { hooks } from "../../core/hooks.js";
import { daysForCity, stayForDay } from "../../domain/trip.js";
import { clearLegEnds } from "../../map/country.js";
import { fillCityPanel } from "../panels/city-panel.js";
import { phraseCardHtml } from "../phrase-show.js";
import { mapsDirectionsUrl } from "../templates.js";
import { initFxConverter } from "./fx-converter.js";
import { renderOnsiteWeather } from "./weather.js";

/** Ouvre la carte de la ville du jour, panneau sur ce jour. */
export function openMapForDay(day){
  if (!day || !CITIES[day.city]) return;
  hooks.setAppTab("map");
  clearLegEnds();
  fillCityPanel(CITIES[day.city], daysForCity(day.city), day.n);
}

const daysUntil = (iso) => Math.ceil((Date.parse(iso + "T00:00:00+09:00") - Date.now()) / 86400000);

/** Bouton « Montrer l’adresse » : la carte de phrase (mode Montrer) avec l’adresse de l’hôtel. */
function showAddressBtn(h){
  return `<button type="button" class="today-act" data-phrase>` +
    `<span class="jp" hidden>${esc(h.address)}</span><span class="ro" hidden>${esc(h.name)}</span>` +
    `<span class="fr" hidden>À montrer au chauffeur de taxi</span>` +
    `<span aria-hidden="true">🪪</span> Montrer l’adresse</button>`;
}

function todayCardHtml(){
  const iso = japanTodayISO();
  const day = findTripDayByISO(iso);
  if (day) {
    const city = CITIES[day.city];
    const stay = stayForDay(day.city, day);
    const h = stay && stay.hotel && stay.hotel.name && stay.hotel.name !== "—" ? stay.hotel : null;
    const maps = h ? mapsDirectionsUrl(h) : null;
    return `<div class="today-card live">` +
      `<div class="kicker">Aujourd’hui · Jour ${day.n}</div>` +
      `<h3>${esc(day.dow)} ${esc(day.date.replace(/\s\d{4}$/, ""))} · ${esc(city ? city.name : day.city)}</h3>` +
      (h ? `<p class="today-hotel"><span>Ce soir</span> <strong>${esc(h.name)}</strong></p>` : "") +
      `<div id="onsite-weather" class="weather-line" hidden></div>` +
      `<div class="today-actions">` +
      `<button type="button" class="today-act primary" id="onsite-open-day">Voir le programme</button>` +
      (maps ? `<a class="today-act" href="${esc(maps)}" target="_blank" rel="noopener noreferrer">Aller à l’hôtel ↗</a>` : "") +
      (h && h.address ? showAddressBtn(h) : "") +
      `</div></div>`;
  }
  if (iso < TRIP.startDate) {
    const n = daysUntil(TRIP.startDate);
    return `<div class="today-card"><div class="kicker">Avant le départ</div>` +
      `<h3>J-${n}</h3><p>Départ le ${esc(TRIP.startLabel)} · ${esc(TRIP.datesLabel)}</p>` +
      `<div id="onsite-weather" class="weather-line" hidden></div>` +
      `<div class="today-actions"><button type="button" class="today-act primary" id="onsite-open-day">Voir le jour 1</button></div></div>`;
  }
  return `<div class="today-card"><div class="kicker">Après le voyage</div><h3>お疲れさまでした !</h3>` +
    `<p>Le voyage est terminé — la carte garde tout le programme.</p></div>`;
}

function sosHtml(){
  return (TRIP.emergency || []).map(e =>
    `<a class="sos" href="tel:${esc(e.number)}"><strong>${esc(e.display || e.number)}</strong>` +
    `<span>${esc(e.label)}</span>${e.note ? `<small>${esc(e.note)}</small>` : ""}</a>`
  ).join("");
}

function renderPhrases(){
  const box = document.getElementById("onsite-phrases");
  const jump = document.getElementById("phrase-jump");
  if (!box) return;
  // Groupes par situation : le premier (au restaurant) ouvert, les autres repliés
  box.innerHTML = ONSITE_PHRASES.map((g, i) =>
    `<details class="phrase-group" id="phrase-group-${i}"${i === 0 ? " open" : ""}><summary>${esc(g.title)}<span>${g.phrases.length}</span></summary>` +
    `<div class="phrase-grid">${g.phrases.map(p => phraseCardHtml(p)).join("")}</div></details>`
  ).join("");
  if (jump) {
    jump.innerHTML = ONSITE_PHRASES.map((g, i) =>
      `<button type="button" data-group="${i}">${esc(g.title.split(" — ")[0])}</button>`).join("");
    jump.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      const d = document.getElementById("phrase-group-" + b.dataset.group);
      if (!d) return;
      box.querySelectorAll("details").forEach(x => { x.open = x === d; });
      d.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
  }
}

export function renderOnsite(){
  const today = document.getElementById("onsite-today");
  if (!today) return;
  initFxConverter();
  today.innerHTML = todayCardHtml();
  const day = findTripDayByISO(japanTodayISO()) || (japanTodayISO() < TRIP.startDate ? DAYS[0] : null);
  if (day) renderOnsiteWeather(day);
  document.getElementById("onsite-open-day")?.addEventListener("click", () => openMapForDay(day));
  const sos = document.getElementById("onsite-sos");
  if (sos) sos.innerHTML = sosHtml();
  renderPhrases();
}
