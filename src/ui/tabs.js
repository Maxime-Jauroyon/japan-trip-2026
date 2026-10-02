/* Onglets de l’app (Carte, Préparatifs, Sur place, Réglages). */

import { state } from "../core/state.js";
import { map } from "../map/map-view.js";
import { syncSheetMapInset } from "./panels/panel.js";
import { getOnsiteSelectedDay, openMapForDay, renderOnsite } from "./views/onsite-view.js";
import { renderPrep } from "./views/prep-view.js";
import { printTrip } from "./views/print.js";
import { renderSettings } from "./views/settings-view.js";

export function setAppTab(tab){
  const app = document.querySelector(".app");
  const tabs = document.querySelectorAll("#app-tabs button");
  if (!app) return;
  app.classList.remove("tab-map", "tab-prep", "tab-onsite", "tab-settings");
  app.classList.add("tab-" + tab);
  tabs.forEach(b => {
    const on = b.dataset.tab === tab;
    b.classList.toggle("active", on);
    b.setAttribute("aria-current", on ? "page" : "false");
  });
  ["prep", "onsite", "settings"].forEach(t => {
    const view = document.getElementById("view-" + t);
    if (view) view.classList.toggle("active", tab === t);
  });
  if (tab === "prep") renderPrep();
  if (tab === "onsite") renderOnsite();
  if (tab === "settings") renderSettings();
  if (tab === "map") {
    requestAnimationFrame(() => {
      if (!map) return;
      map.resize();
      if (state.currentCity) syncSheetMapInset();
    });
  }
}

/** Onglets + boutons transverses (impression, « Voir sur la carte »). */
export function initTabs() {
  document.getElementById("app-tabs")?.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => setAppTab(btn.dataset.tab));
  });
  document.getElementById("print-trip")?.addEventListener("click", printTrip);
  document.getElementById("onsite-map-btn")?.addEventListener("click", () => {
    const day = getOnsiteSelectedDay();
    if (day) openMapForDay(day);
  });
}
