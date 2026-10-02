/* Panneaux trajet (étape) et trajet groupé (journey). */

import { CITIES, LEGS } from "../../core/data.js";
import { esc } from "../../core/dom.js";
import { hint, panel } from "../../core/elements.js";
import { hooks } from "../../core/hooks.js";
import { state } from "../../core/state.js";
import { legPhraseContext } from "../../domain/classify.js";
import { dayMovesForJourney, journeyById, legEndPoint, legsInJourney } from "../../domain/legs.js";
import { stopsOnMap } from "../../domain/trip.js";
import { highlightPin } from "../../map/city.js";
import { focusJourneyOverview, focusLegEnd, focusLegOverview, showCountry } from "../../map/controller.js";
import { renderJourneyEnds, renderLegEnds, setActiveCity, setLegMode } from "../../map/country.js";
import { setJourneyHighlight, setRouteHighlight } from "../../map/routes.js";
import { bindSheetGrab, closePanel, setSheetState, sheetGrabHtml } from "./panel.js";
import { bindCopyButtons, contextPhraseHtml, legBookingsHtml, legEndsToolbarHtml, modeStatHtml, renderMoveCard, statusClass, statusLabel, stopBlockHtml } from "../templates.js";

export function openJourney(journeyId, focusLegId){
  const j = journeyById(journeyId);
  const legs = legsInJourney(journeyId);
  if (!j || !legs.length) {
    if (focusLegId) openLeg(focusLegId, { forceSingle: true });
    return;
  }
  const moves = dayMovesForJourney(journeyId);
  state.panelContext = { type: "journey", journey: j, legs };
  showCountry();
  setLegMode(true);
  setJourneyHighlight(journeyId);
  setActiveCity(null);
  renderJourneyEnds(j, legs);
  const destLine = j.dest
    ? `<p class="journey-dest panel-journey-dest">Destination · <strong>${esc(j.dest)}</strong>${j.destJp ? ` <span class="jp-name">${esc(j.destJp)}</span>` : ""}</p>`
    : "";
  panel.classList.remove("panel-city");
  panel.classList.add("panel-leg", "panel-journey");
  panel.innerHTML =
    sheetGrabHtml() +
    `<div class="overlay-head"><div class="head-text"><h2>${esc(j.title)}</h2><span class="jp-name">${esc(j.subtitle || "")}${j.meta ? " · " + esc(j.meta) : ""}</span></div><button class="close" type="button" aria-label="Fermer">×</button></div>` +
    `<div class="overlay-body">` +
    `<span class="sheet-kind trajet">Trajet · ${legs.length} étapes</span>` +
    destLine +
    `<div class="journey-panel-steps">${moves.map(m => renderMoveCard(m, null)).join("")}</div>` +
    `<p class="note">Cliquer une étape pour les détails et réservations.</p>` +
    `</div>`;
  panel.classList.add("open");
  bindSheetGrab();
  panel.querySelector(".close").onclick = () => closePanel(true);
  panel.querySelectorAll(".move[data-leg]").forEach(n => {
    n.addEventListener("click", e => {
      e.stopPropagation();
      openLeg(n.dataset.leg, { fromJourney: true });
    });
  });
  if (window.matchMedia("(max-width: 900px)").matches) {
    setSheetState("mid");
  }
  hint.textContent = "Trajet · " + j.title;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => focusJourneyOverview(legs));
  });
}

function openCityAtLegEnd(leg, role){
  const end = legEndPoint(leg, role);
  if (!end || !end.cityId || !CITIES[end.cityId]) {
    focusLegEnd(leg, role, true);
    return;
  }
  hooks.openCity(end.cityId);
  // After city map loads, highlight the stop pin
  const tryFocus = () => {
    if (state.currentCity !== end.cityId) {
      setTimeout(tryFocus, 80);
      return;
    }
    const stop = stopsOnMap(end.cityId).find(s =>
      Math.abs(s.lat - end.lat) < 0.0008 && Math.abs(s.lng - end.lng) < 0.0008
    );
    if (stop) hooks.openStopDetail(stop);
    else highlightPin({ lat: end.lat, lng: end.lng, title: end.name });
  };
  setTimeout(tryFocus, 120);
}

export function openLeg(id, opts){
  opts = opts || {};
  const leg = LEGS.find(l => l.id === id);
  if (!leg) return;
  if (leg.journey && !opts.fromJourney && !opts.forceSingle) {
    openJourney(leg.journey, id);
    return;
  }
  state.panelContext = { type:"leg", leg, journey: leg.journey || null };
  showCountry();
  setLegMode(true);
  if (leg.journey) setJourneyHighlight(leg.journey);
  else setRouteHighlight(id);
  setActiveCity(null);
  renderLegEnds(leg);
  const tips = leg.tips ? `<p class="note" style="color:var(--gold-2)">${esc(leg.tips)}</p>` : "";
  const details = (leg.details || []).map(d => `<li>${esc(d)}</li>`).join("");
  const j = leg.journey ? journeyById(leg.journey) : null;
  const journeyBack = leg.journey
    ? `<button type="button" class="journey-back" data-journey="${esc(leg.journey)}">← ${esc(j && j.title ? j.title : "Trajet complet")}</button>`
    : "";
  panel.classList.remove("panel-city", "panel-journey");
  panel.classList.add("panel-leg");
  panel.innerHTML =
    sheetGrabHtml() +
    `<div class="overlay-head"><div class="head-text"><h2>${esc(leg.title)}</h2><span class="jp-name">${esc(leg.subtitle)}</span></div><button class="close" type="button" aria-label="Fermer">×</button></div>` +
    `<div class="overlay-body">` +
    journeyBack +
    `<span class="sheet-kind trajet">Étape</span>` +
    legEndsToolbarHtml(leg) +
    `<div class="pill-row"><span class="status ${statusClass(leg.status)}">${statusLabel(leg.status)}</span></div>` +
    `<div class="trajet-grid">` +
    `<div class="stat"><span>Départ</span><strong>${esc(leg.depart || "—")}</strong></div>` +
    `<div class="stat"><span>Arrivée</span><strong>${esc(leg.arrive || "—")}</strong></div>` +
    modeStatHtml(leg.mode) +
    `<div class="stat"><span>Durée</span><strong>${esc(leg.duration || "—")}</strong></div>` +
    `<div class="stat wide"><span>Compagnie</span><strong>${esc(leg.operator || "—")}</strong></div>` +
    stopBlockHtml(leg) +
    `</div>` +
    `<dl class="detail-kv">` +
    `<dt>Place</dt><dd>${esc(leg.seat || "—")}</dd>` +
    `<dt>Réf. résa</dt><dd>${esc(leg.ref || "—")}</dd>` +
    `<dt>Paiement</dt><dd>${esc(leg.payment || "—")}</dd>` +
    `<dt>Prix</dt><dd>${esc(leg.price || "—")}</dd>` +
    `</dl>` +
    (details ? `<ul class="detail-notes">${details}</ul>` : "") +
    legBookingsHtml(leg) +
    tips +
    contextPhraseHtml(legPhraseContext(leg.mode)) +
    `</div>`;
  panel.classList.add("open");
  bindSheetGrab();
  bindCopyButtons(panel);
  panel.querySelector(".close").onclick = () => closePanel(true);
  panel.querySelectorAll(".journey-back[data-journey]").forEach(n => {
    n.addEventListener("click", () => openJourney(n.dataset.journey));
  });
  panel.querySelectorAll("[data-end]").forEach(n => {
    n.addEventListener("click", () => focusLegEnd(leg, n.dataset.end, true));
  });
  panel.querySelectorAll("[data-end-city]").forEach(n => {
    n.addEventListener("click", () => openCityAtLegEnd(leg, n.dataset.endCity));
  });
  if (window.matchMedia("(max-width: 900px)").matches) {
    setSheetState("mid");
  }
  hint.textContent = "Trajet · détails et arrêts dans le panneau";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => focusLegOverview(leg));
  });
}
