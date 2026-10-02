/* Panneau latéral / bottom sheet : états (mi, max, min), fermeture, fiche détail. */

import { DAYS } from "../../core/data.js";
import { panel } from "../../core/elements.js";
import { state } from "../../core/state.js";
import { refreshCityMapView, renderCityPins } from "../../map/city.js";
import { showCountry } from "../../map/controller.js";
import { clearLegEnds, setActiveCity, setLegMode } from "../../map/country.js";
import { resetRouteHighlight } from "../../map/routes.js";
import { bindCopyButtons } from "../templates.js";

export function showDetailSheet(html){
  const cityEl = panel.querySelector(".city-panel");
  const detailEl = panel.querySelector(".detail-sheet");
  if (!cityEl || !detailEl) return;
  detailEl.innerHTML =
    `<button type="button" class="detail-back">← Retour aux jours</button>${html}`;
  cityEl.style.display = "none";
  detailEl.classList.add("show");
  // Revenir en haut du panneau (titre / description, pas les photos)
  const body = panel.querySelector(".overlay-body");
  if (body) body.scrollTop = 0;
  requestAnimationFrame(() => { if (body) body.scrollTop = 0; });
  // Mobile : garder la hauteur actuelle (si réduit → moyen pour lire)
  if (window.matchMedia("(max-width: 900px)").matches) {
    if (sheetState() === "min") setSheetState("mid");
  }
  detailEl.querySelector(".detail-back").onclick = () => {
    detailEl.classList.remove("show");
    detailEl.innerHTML = "";
    cityEl.style.display = "";
    state.lastFocusAct = null;
    if (body) body.scrollTop = 0;
    if (state.currentCity){
      const dayEl = panel.querySelector("details.day[open]");
      const dayN = dayEl ? Number(dayEl.dataset.dayN) : null;
      const day = dayN != null ? DAYS.find(d => d.n === dayN) : null;
      renderCityPins(state.currentCity, day || null, null);
      syncSheetMapInset();
    }
  };
  bindCopyButtons(detailEl);
}

export function sheetGrabHtml(){
  return `<button type="button" class="sheet-grab" aria-label="Glisser ou toucher pour agrandir / réduire" aria-expanded="false"><span class="sheet-bar"></span><span class="sheet-chevron">▴</span></button>`;
}

function sheetState(){
  if (panel.classList.contains("minimized")) return "min";
  if (panel.classList.contains("expanded")) return "max";
  return "mid";
}

export function syncSheetMapInset(){
  const app = document.querySelector(".app");
  if (!app) return;
  app.classList.remove("sheet-mid", "sheet-max", "sheet-min");
  const mobile = window.matchMedia("(max-width: 900px)").matches;
  if (mobile && panel.classList.contains("open") && state.currentCity) {
    const s = sheetState();
    app.classList.add(s === "max" ? "sheet-max" : s === "min" ? "sheet-min" : "sheet-mid");
  }
  // Recadrer une fois la transition du sheet terminée
  clearTimeout(syncSheetMapInset.timer);
  syncSheetMapInset.timer = setTimeout(() => {
    if (state.currentCity) refreshCityMapView();
  }, mobile ? 300 : 0);
}

export function setSheetState(s){
  panel.classList.remove("expanded", "minimized");
  if (s === "max") panel.classList.add("expanded");
  if (s === "min") panel.classList.add("minimized");
  const grab = panel.querySelector(".sheet-grab");
  if (grab){
    grab.setAttribute("aria-expanded", s === "max" ? "true" : "false");
    const ch = grab.querySelector(".sheet-chevron");
    if (ch) ch.textContent = s === "max" ? "▾" : "▴";
  }
  syncSheetMapInset();
}

function cycleSheet(){
  const s = sheetState();
  if (s === "mid") setSheetState("max");
  else if (s === "max") setSheetState("min");
  else setSheetState("mid");
}

export function bindSheetGrab(){
  panel.classList.remove("expanded", "minimized");
  const grab = panel.querySelector(".sheet-grab");
  if (!grab) return;
  grab.setAttribute("aria-expanded", "false");
  const ch = grab.querySelector(".sheet-chevron");
  if (ch) ch.textContent = "▴";
  syncSheetMapInset();

  let drag = null;
  const onDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag = { y: e.clientY, state: sheetState(), moved: false, id: e.pointerId };
    try { grab.setPointerCapture(e.pointerId); } catch (_) {}
  };
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (Math.abs(e.clientY - drag.y) > 10) drag.moved = true;
  };
  const onUp = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dy = e.clientY - drag.y;
    if (drag.moved && Math.abs(dy) > 36) {
      if (dy > 0) {
        // vers le bas = réduire
        if (drag.state === "max") setSheetState("mid");
        else setSheetState("min");
      } else {
        // vers le haut = agrandir
        if (drag.state === "min") setSheetState("mid");
        else setSheetState("max");
      }
    } else if (!drag.moved) {
      cycleSheet();
    }
    drag = null;
  };
  grab.addEventListener("pointerdown", onDown);
  grab.addEventListener("pointermove", onMove);
  grab.addEventListener("pointerup", onUp);
  grab.addEventListener("pointercancel", () => { drag = null; });
}

export function closePanel(reset){
  if (reset === undefined) reset = true;
  panel.classList.remove("open", "expanded", "minimized", "panel-city", "panel-leg", "panel-journey");
  document.querySelector(".app")?.classList.remove("sheet-mid", "sheet-max", "sheet-min");
  state.lastFocusAct = null;
  state.panelContext = null;
  setLegMode(false);
  clearLegEnds();
  setActiveCity(null);
  if (reset) goOverview();
}

function goOverview(){
  panel.classList.remove("open", "expanded", "minimized", "panel-city", "panel-leg", "panel-journey");
  document.querySelector(".app")?.classList.remove("sheet-mid", "sheet-max", "sheet-min");
  state.lastFocusAct = null;
  state.panelContext = null;
  setLegMode(false);
  clearLegEnds();
  resetRouteHighlight();
  showCountry(false, true);
}
