/* Panneau latéral / bottom sheet : fiches détail empilées, recadrage de la carte, fermeture. */

import { DAYS } from "../../core/data.js";
import { panel } from "../../core/elements.js";
import { isMobileUi } from "../../core/env.js";
import { state } from "../../core/state.js";
import { refreshCityMapView, renderCityPins } from "../../map/city.js";
import { showCountry } from "../../map/controller.js";
import { clearLegEnds, setActiveCity, setLegMode } from "../../map/country.js";
import { resetRouteHighlight } from "../../map/routes.js";
import { bindCopyButtons } from "../templates.js";
import { bindSheet, setSheetState as setSheet, sheetGrabHtml, sheetState } from "./sheet.js";

export { sheetGrabHtml };

let listScroll = 0;

const selectedDayObj = () => (state.selectedDay != null ? DAYS.find(d => d.n === state.selectedDay) || null : null);

/** Une fiche (activité, hôtel, gare) est-elle ouverte par-dessus la liste ? */
export function detailOpen(){
  return !!panel.querySelector(".detail-sheet.show");
}

/**
 * Fiche détail : glisse par-dessus la liste (gardée en mémoire avec sa position de défilement).
 * Retour : bouton « ‹ Jour N », touche Échap, ou balayage vers la droite depuis le bord gauche.
 */
export function showDetailSheet(html){
  const listEl = panel.querySelector(".city-panel");
  const detailEl = panel.querySelector(".detail-sheet");
  const body = panel.querySelector(".overlay-body");
  if (!listEl || !detailEl || !body) return;
  if (!detailOpen()) listScroll = body.scrollTop;
  const back = state.selectedDay != null ? `Jour ${state.selectedDay}` : "Aperçu";
  detailEl.innerHTML =
    `<div class="detail-bar"><button type="button" class="detail-back" aria-label="Retour">‹ <span>${back}</span></button></div>` +
    `<div class="detail-content">${html}</div>`;
  listEl.hidden = true;
  detailEl.classList.remove("show");
  void detailEl.offsetWidth;           // relancer l’animation d’entrée
  detailEl.classList.add("show");
  panel.classList.add("has-detail");
  body.scrollTop = 0;
  // Mobile : depuis l’aperçu, remonter à mi-hauteur pour lire
  if (isMobileUi() && sheetState() === "min") setSheet("mid");
  detailEl.querySelector(".detail-back").onclick = () => closeDetailSheet();
  bindCopyButtons(detailEl);
}

/** Referme la fiche : retour à la liste, à la même position. */
export function closeDetailSheet(){
  const listEl = panel.querySelector(".city-panel");
  const detailEl = panel.querySelector(".detail-sheet");
  const body = panel.querySelector(".overlay-body");
  if (!detailEl || !detailOpen()) return false;
  detailEl.classList.remove("show");
  detailEl.innerHTML = "";
  panel.classList.remove("has-detail");
  if (listEl) listEl.hidden = false;
  if (body) body.scrollTop = listScroll;
  state.lastFocusAct = null;
  if (state.currentCity) {
    renderCityPins(state.currentCity, selectedDayObj(), null);
    syncSheetMapInset();
  }
  return true;
}

/** Balayage vers la droite depuis le bord gauche = retour. */
function bindEdgeBack(body){
  let x0 = null, y0 = 0;
  body.addEventListener("touchstart", e => {
    const p = e.touches[0];
    const left = body.getBoundingClientRect().left;
    x0 = detailOpen() && p.clientX - left < 28 ? p.clientX : null;
    y0 = p.clientY;
  }, { passive: true });
  body.addEventListener("touchend", e => {
    if (x0 == null) return;
    const p = e.changedTouches[0];
    if (p.clientX - x0 > 70 && Math.abs(p.clientY - y0) < 60) closeDetailSheet();
    x0 = null;
  });
}

export function syncSheetMapInset(){
  const app = document.querySelector(".app");
  if (!app) return;
  app.classList.remove("sheet-mid", "sheet-max", "sheet-min");
  const mobile = isMobileUi();
  if (mobile && panel.classList.contains("open") && state.currentCity) {
    app.classList.add("sheet-" + sheetState());
  }
  // Recadrer une fois le sheet posé (transition ≈ .34 s)
  clearTimeout(syncSheetMapInset.timer);
  syncSheetMapInset.timer = setTimeout(() => {
    if (state.currentCity) refreshCityMapView();
  }, mobile ? 360 : 0);
}

export function setSheetState(s){
  setSheet(s);
}

/** Branche le sheet sur le panneau qui vient d’être rendu (garde la position si déjà ouvert). */
export function bindSheetGrab(initial){
  const keep = panel.classList.contains("open") && panel.dataset.sheetBound === "1";
  panel.dataset.sheetBound = "1";
  bindSheet(() => syncSheetMapInset(), initial || (keep ? sheetState() : "mid"));
  const body = panel.querySelector(".overlay-body");
  if (body && !body.dataset.edgeBack) { body.dataset.edgeBack = "1"; bindEdgeBack(body); }
}

export function closePanel(reset){
  if (reset === undefined) reset = true;
  panel.classList.remove("open", "expanded", "minimized", "panel-city", "panel-leg", "panel-journey", "has-detail");
  panel.dataset.sheetBound = "";
  document.querySelector(".app")?.classList.remove("sheet-mid", "sheet-max", "sheet-min");
  state.lastFocusAct = null;
  state.panelContext = null;
  state.selectedDay = null;
  setLegMode(false);
  clearLegEnds();
  setActiveCity(null);
  if (reset) goOverview();
}

function goOverview(){
  resetRouteHighlight();
  showCountry(false, true);
}
