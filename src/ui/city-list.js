/* Liste des villes au-dessus de la carte : frise du voyage (étapes, dates, nuits, ville du jour). */

import { CITIES, DAYS, ORDER } from "../core/data.js";
import { findTripDayByISO, japanTodayISO } from "../core/dates.js";
import { esc } from "../core/dom.js";
import { cityList } from "../core/elements.js";
import { cityNights, cityStayDates } from "../domain/trip.js";
import { cityIconSvg } from "../shared/icons.js";
import { openCity } from "./panels/city-panel.js";

const nightsLabel = (n) => (n ? `${n} nuit${n > 1 ? "s" : ""}` : "Étape");

/** Frise des villes (colonne sur ordinateur, pastilles sur mobile). */
export function initCityList() {
  const today = findTripDayByISO(japanTodayISO());
  const todayCity = today ? today.city : null;
  const head = document.createElement("div");
  head.className = "cl-head";
  head.innerHTML = `<span>Itinéraire</span><b>${DAYS.length} jours · ${ORDER.length} étapes</b>`;
  cityList.appendChild(head);
  ORDER.forEach((id, i) => {
    const c = CITIES[id];
    const isToday = id === todayCity;
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.city = id;
    b.className = "cl-item" + (isToday ? " is-today" : "");
    b.innerHTML =
      `<span class="ico">${cityIconSvg(id)}<i class="cl-step">${i + 1}</i></span>` +
      `<span class="cl-text"><strong>${esc(c.name)}</strong><small>${esc(cityStayDates(c))}</small></span>` +
      `<span class="cl-side">${isToday ? "Aujourd’hui" : esc(nightsLabel(cityNights(c)))}</span>`;
    if (isToday) b.setAttribute("aria-current", "date");
    b.addEventListener("click", () => openCity(id));
    cityList.appendChild(b);
  });
  // Mobile : faire défiler les pastilles jusqu’à la ville du jour
  const cur = cityList.querySelector(".is-today");
  if (cur) requestAnimationFrame(() => {
    if (cityList.scrollWidth > cityList.clientWidth) cityList.scrollLeft = Math.max(0, cur.offsetLeft - 12);
  });
}
