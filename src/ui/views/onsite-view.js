/* Onglet Sur place : programme du jour, choix du jour, frise, bouton carte. */

import { CITIES, DAYS, PHRASES, TRIP } from "../../core/data.js";
import { findTripDayByISO, japanTodayISO, parseHotelTimeSort, parseWhenSort } from "../../core/dates.js";
import { esc } from "../../core/dom.js";
import { panel } from "../../core/elements.js";
import { hooks } from "../../core/hooks.js";
import { actMetaFor, daysForCity, groupMovesByJourney, isEarlyArrivalBeforeCheckIn, isFirstDayOfStay, isLastDayOfStay, luggageBeforeCheckInHint, moveSortRange, stayForDay } from "../../domain/trip.js";
import { scheduleCityMapRefresh } from "../../map/city.js";
import { showCity } from "../../map/controller.js";
import { clearLegEnds } from "../../map/country.js";
import { fillCityPanel } from "../panels/city-panel.js";
import { mapsLinkHtml } from "../templates.js";
import { initFxConverter } from "./fx-converter.js";
import { renderOnsiteWeather } from "./weather.js";

let onsiteSelectedDayN = null;

export function openMapForDay(day){
  if (!day || !CITIES[day.city]) return;
  hooks.setAppTab("map");
  const id = day.city;
  clearLegEnds();
  showCity(id, day.n);
  fillCityPanel(CITIES[id], daysForCity(id), day.n);
  requestAnimationFrame(() => {
    panel.querySelectorAll("details.day").forEach(el => {
      el.open = Number(el.dataset.dayN) === day.n;
    });
    scheduleCityMapRefresh();
  });
}

export function getOnsiteSelectedDay(){
  if (onsiteSelectedDayN != null) return DAYS.find(d => d.n === onsiteSelectedDayN) || null;
  const iso = japanTodayISO();
  return findTripDayByISO(iso);
}

function syncOnsiteMapBtn(day){
  const btn = document.getElementById("onsite-map-btn");
  if (!btn) return;
  if (day && CITIES[day.city]) {
    btn.hidden = false;
    btn.textContent = "Voir sur la carte · " + CITIES[day.city].name;
  } else btn.hidden = true;
}

function renderDayTimeline(day){
  if (!day) return "";
  const cityId = day.city;
  const city = CITIES[cityId];
  const items = [];
  const stay = stayForDay(cityId, day);
  const h = stay && stay.hotel;
  const moves = day.moves || [];
  const moveRange = moveSortRange(moves);
  const firstStay = h && h.name && h.name !== "—" && isFirstDayOfStay(cityId, day);
  const lastStay = h && h.name && h.name !== "—" && isLastDayOfStay(cityId, day);
  const checkInSort = firstStay ? parseHotelTimeSort(h.checkIn, 16 * 60) : null;
  const earlyArrival = firstStay && isEarlyArrivalBeforeCheckIn(moveRange, checkInSort);

  if (lastStay && !firstStay) {
    const checkOutSort = parseHotelTimeSort(h.checkOut, 10 * 60);
    const beforeDepart = moveRange.min < Infinity && moveRange.min > 60
      ? moveRange.min - 45
      : checkOutSort;
    items.push({
      sort: Math.min(checkOutSort, beforeDepart),
      cls: "tl-hotel",
      time: h.checkOut ? "Check-out · " + h.checkOut.split("·")[0].trim() : "Fin de séjour",
      title: h.name,
      desc: h.checkOut ? h.checkOut : "",
      tags: ["Valise"]
    });
  }

  groupMovesByJourney(moves).forEach(g => {
    if (g.id) {
      items.push({
        sort: parseWhenSort(g.moves[0] && g.moves[0].when),
        cls: "tl-journey",
        time: g.meta || (g.moves[0] && g.moves[0].when) || "Trajet",
        title: g.title,
        desc: g.dest ? "Destination · " + g.dest : "",
        tags: ["Trajet"],
        journeyId: g.id,
        moves: g.moves
      });
      return;
    }
    g.moves.forEach(m => {
      items.push({
        sort: parseWhenSort(m.when),
        cls: "tl-move",
        time: m.when || "Trajet",
        title: m.title,
        desc: m.dummy || "",
        tags: [m.mode || "Trajet"]
      });
    });
  });

  if (earlyArrival) {
    const locker = day.luggageLocker || {};
    const lockerAct = locker.lat != null && locker.lng != null ? locker : null;
    items.push({
      sort: moveRange.max + 10,
      cls: "tl-locker",
      time: locker.when || "Après arrivée · avant check-in",
      title: locker.title || "Consigne bagages",
      desc: locker.desc || "À renseigner quand une consigne sera trouvée.",
      tags: ["Valise"],
      act: lockerAct
    });
  }

  (day.ideas || []).forEach((a, i) => {
    const meta = actMetaFor(a);
    let sort;
    if (firstStay && checkInSort != null) {
      const gap = earlyArrival ? 40 : 25;
      const afterArrival = (moveRange.max > 0 ? moveRange.max : 8 * 60) + gap;
      sort = Math.min(afterArrival + i * 35, checkInSort - 15);
    } else {
      sort = 10 * 60 + i * 45;
    }
    items.push({
      sort,
      cls: "tl-idea",
      time: meta.duration + " · " + meta.hours,
      title: a.title,
      desc: a.desc || "",
      tags: ["Idée"],
      act: a
    });
  });

  if (firstStay) {
    const afterArrival = moveRange.max > 0 ? moveRange.max + 20 : 0;
    const sort = Math.max(checkInSort, afterArrival);
    let desc = [h.checkIn, h.area].filter(Boolean).join(" · ");
    if (earlyArrival) {
      desc = (desc ? desc + " — " : "") + luggageBeforeCheckInHint();
    }
    items.push({
      sort,
      cls: "tl-hotel",
      time: h.checkIn ? "Check-in · " + h.checkIn : "Hébergement",
      title: h.name,
      desc,
      tags: [stay.label || "Séjour"]
    });
  }

  (day.ideasAfter || []).forEach((a, i) => {
    const meta = actMetaFor(a);
    let sort;
    if (firstStay && checkInSort != null) {
      sort = Math.max(checkInSort, moveRange.max) + 50 + i * 40;
    } else {
      sort = 14 * 60 + i * 45;
    }
    items.push({
      sort,
      cls: "tl-idea",
      time: meta.duration + " · " + meta.hours,
      title: a.title,
      desc: a.desc || "",
      tags: ["Idée"],
      act: a
    });
  });

  items.sort((a, b) => a.sort - b.sort);
  if (!items.length) {
    return `<p class="lead">Rien de prévu ce jour-là${city ? " · " + esc(city.name) : ""}.</p>`;
  }

  return `<div class="day-timeline">` + items.map(it => {
    const map = it.act ? mapsLinkHtml(it.act, "detail") : "";
    const tags = (it.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join("");
    if (it.cls === "tl-journey") {
      const steps = (it.moves || []).map(m =>
        `<div class="tl-journey-step">${m.role ? `<span class="tl-step-role">${esc(m.role)}</span>` : ""}<span>${esc(m.title)}</span></div>`
      ).join("");
      return `<div class="tl-item tl-journey"${it.journeyId ? ` data-journey="${esc(it.journeyId)}"` : ""}>` +
        `<div class="tl-time">${esc(it.time)}</div>` +
        `<div class="tl-title">${esc(it.title)}</div>` +
        (tags ? `<div class="tl-tags">${tags}</div>` : "") +
        (it.desc ? `<div class="tl-desc tl-journey-dest">${esc(it.desc)}</div>` : "") +
        `<div class="tl-journey-steps">${steps}</div>` +
        `</div>`;
    }
    return `<div class="tl-item ${it.cls}">` +
      `<div class="tl-time">${esc(it.time)}</div>` +
      `<div class="tl-title">${esc(it.title)}</div>` +
      (tags ? `<div class="tl-tags">${tags}</div>` : "") +
      (it.desc ? `<div class="tl-desc">${esc(it.desc)}</div>` : "") +
      map +
      `</div>`;
  }).join("") + `</div>`;
}

function renderOnsiteDay(day){
  const body = document.getElementById("onsite-day-body");
  if (!body || !day) { if (body) body.innerHTML = ""; return; }
  body.innerHTML = renderDayTimeline(day);
  renderOnsiteWeather(day);
  syncOnsiteMapBtn(day);
}

function onsiteHotelLine(day){
  const stay = stayForDay(day.city, day);
  const h = stay && stay.hotel;
  if (!h || !h.name || h.name === "—") return "";
  return `<p class="today-hotel"><strong>${esc(h.name)}</strong>` +
    (h.checkIn ? `<br><span>${esc(h.checkIn)}</span>` : "") +
    `</p>`;
}

export function renderOnsite(){
  const todayBox = document.getElementById("onsite-today");
  const pick = document.getElementById("onsite-day-pick");
  const phrases = document.getElementById("onsite-phrases");
  if (!todayBox || !pick || !phrases) return;
  initFxConverter();
  const iso = japanTodayISO();
  const match = findTripDayByISO(iso);
  const start = TRIP.startDate, end = TRIP.endDate;
  if (match){
    onsiteSelectedDayN = match.n;
    const city = CITIES[match.city];
    todayBox.innerHTML =
      `<div class="today-card"><div class="kicker">Aujourd’hui (heure Japon)</div>` +
      `<h3>Jour ${match.n} · ${esc(match.dow)} ${esc(match.date)}</h3>` +
      `<p>${esc(city ? city.name : match.city)}${match.extraCity ? " → " + esc(CITIES[match.extraCity].name) : ""}</p>` +
      onsiteHotelLine(match) +
      `</div>`;
    renderOnsiteDay(match);
    pick.hidden = true;
  } else if (iso < start){
    onsiteSelectedDayN = null;
    const daysLeft = Math.ceil((Date.parse(start + "T00:00:00+09:00") - Date.now()) / 86400000);
    todayBox.innerHTML = `<div class="today-card"><div class="kicker">Avant le départ</div><h3>Encore ≈ ${daysLeft} jour${daysLeft > 1 ? "s" : ""}</h3><p>Le voyage commence le ${esc(TRIP.startLabel)}. Choisis un jour ci-dessous pour prévisualiser.</p></div>`;
    pick.hidden = false;
  } else if (iso > end){
    onsiteSelectedDayN = null;
    todayBox.innerHTML = `<div class="today-card"><div class="kicker">Après le voyage</div><h3>Trip terminé</h3><p>Tu peux quand même refeuilleter chaque jour.</p></div>`;
    pick.hidden = false;
  } else {
    onsiteSelectedDayN = null;
    todayBox.innerHTML = `<div class="today-card"><div class="kicker">Pendant le voyage</div><h3>Jour hors programme ?</h3><p>Choisis un jour ci-dessous.</p></div>`;
    pick.hidden = false;
  }
  pick.innerHTML = DAYS.map(d =>
    `<button type="button" data-day="${d.n}"${match && match.n === d.n ? " class=\"on\"" : ""}>J${d.n}</button>`
  ).join("");
  pick.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      pick.querySelectorAll("button").forEach(b => b.classList.remove("on"));
      btn.classList.add("on");
      const day = DAYS.find(d => d.n === Number(btn.dataset.day));
      onsiteSelectedDayN = day ? day.n : null;
      renderOnsiteDay(day);
    });
  });
  if (!match){
    const first = DAYS[0];
    onsiteSelectedDayN = first.n;
    const b0 = pick.querySelector("button");
    if (b0) b0.classList.add("on");
    renderOnsiteDay(first);
  }
  phrases.innerHTML = PHRASES.map(p =>
    `<div class="phrase"><div class="fr">${esc(p.fr)}</div><div class="jp">${esc(p.jp)}</div><div class="ro">${esc(p.ro)}</div></div>`
  ).join("");
}
