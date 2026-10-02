/* Impression / PDF du voyage. */

import { CITIES, DAYS, TRAVELERS, TRIP } from "../../core/data.js";
import { esc } from "../../core/dom.js";
import { stayForDay } from "../../domain/trip.js";

function buildPrintHtml(){
  const who = (TRAVELERS.join(" & ") || "Voyageurs");
  let html =
    `<h1>${esc(TRIP.title)}</h1>` +
    `<p class="print-sub">${esc(TRIP.datesLabelLong)} · ${esc(who)}</p>`;
  DAYS.forEach(day => {
    const city = CITIES[day.city];
    html += `<h2>Jour ${day.n} · ${esc(day.dow)} ${esc(day.date)} · ${esc(city ? city.name : day.city)}</h2>`;
    const stay = stayForDay(day.city, day);
    const h = stay && stay.hotel;
    if (h && h.name && h.name !== "—") {
      html += `<div class="print-hotel"><strong>${esc(h.name)}</strong> · ${esc(h.area || "")}<br>` +
        `${esc(h.address || "")}<br>` +
        `Check-in ${esc(h.checkIn || "—")} · Check-out ${esc(h.checkOut || "—")}</div>`;
    }
    (day.moves || []).forEach(m => {
      html += `<h3>${esc(m.when || "Trajet")} · ${esc(m.title)}</h3>` +
        `<p>${esc(m.mode || "")} — ${esc(m.dummy || "")}</p>`;
    });
    if (day.luggageLocker) {
      const L = day.luggageLocker;
      html += `<h3>${esc(L.title || "Consigne bagages")}</h3>` +
        `<p>${esc(L.when || "")}${L.when && L.desc ? " — " : ""}${esc(L.desc || "")}</p>`;
    }
    [].concat(day.ideas || [], day.ideasAfter || []).forEach(a => {
      html += `<h3>${esc(a.title)}</h3><p>${esc(a.desc || "")}</p>`;
    });
  });
  return html;
}

export function printTrip(){
  const root = document.getElementById("print-root");
  if (!root) return;
  root.innerHTML = buildPrintHtml();
  root.hidden = false;
  window.print();
  root.hidden = true;
}
