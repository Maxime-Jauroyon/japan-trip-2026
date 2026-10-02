/* Panneau ville : séjours, jours, activités ; fiches activité, hôtel, gare. */

import { CITIES } from "../../core/data.js";
import { esc } from "../../core/dom.js";
import { panel } from "../../core/elements.js";
import { hooks } from "../../core/hooks.js";
import { state } from "../../core/state.js";
import { phraseContextForAct, pinKind, stopPhraseContext } from "../../domain/classify.js";
import { hotelPhotos, photosFor } from "../../domain/photos.js";
import { cityIdForAct } from "../../domain/places.js";
import { daysForCity, ideasForCity, stayGroups, stopEntryOnCity } from "../../domain/trip.js";
import { highlightPin, scheduleCityMapRefresh } from "../../map/city.js";
import { showCity } from "../../map/controller.js";
import { clearLegEnds } from "../../map/country.js";
import { bindSheetGrab, closePanel, sheetGrabHtml, showDetailSheet } from "./panel.js";
import { actLinksHtml, contextPhraseHtml, copyFieldHtml, mapsLinkHtml, modeBadgeFor, notesListHtml, renderHotelCard, renderIdeas, renderLuggageLocker, renderMoves, renderPhotoGallery, statusClass, statusLabel } from "../templates.js";

export function openActivityDetail(act, opts){
  if (!state.panelContext || state.panelContext.type !== "city") return;
  const targetCity = cityIdForAct(act, state.currentCity);
  if (targetCity && state.currentCity && targetCity !== state.currentCity){
    showCity(targetCity, null);
  }
  const kind = pinKind(act.title);
  const gallery = renderPhotoGallery(photosFor(act), kind);
  showDetailSheet(
    `<span class="sheet-kind activity">Activité</span>` +
    `<h3>${esc(act.title)}</h3>` +
    mapsLinkHtml(act, "detail") +
    `<p class="desc">${esc(act.desc || "")}</p>` +
    notesListHtml(act.notes) +
    actLinksHtml(act.links) +
    gallery +
    contextPhraseHtml(phraseContextForAct(act))
  );
  highlightPin(act, opts);
}

export function openHotelDetail(stay){
  if (!state.panelContext || state.panelContext.type !== "city") return;
  const h = stay.hotel || {};
  const mapAct = (h.lat != null && h.lng != null) ? { lat: h.lat, lng: h.lng, title: h.name } : null;
  const photos = hotelPhotos(h);
  showDetailSheet(
    `<span class="sheet-kind hotel">Hôtel</span>` +
    `<h3>${esc(h.name || "Hôtel à définir")}</h3>` +
    (mapAct ? mapsLinkHtml(mapAct, "detail") : "") +
    `<p class="desc">${esc(h.desc || "")}</p>` +
    renderPhotoGallery(photos, "town") +
    `<div class="pill-row"><span class="status ${statusClass(h.status)}">${statusLabel(h.status)}</span></div>` +
    `<dl class="detail-kv">` +
    `<dt>Séjour</dt><dd>${esc(stay.label || "")}</dd>` +
    `<dt>Dates</dt><dd>${esc(stay.from)} → ${esc(stay.to)} · ${esc(stay.nights)}</dd>` +
    `<dt>Quartier</dt><dd>${esc(h.area || "—")}</dd>` +
    `<dt>Adresse</dt><dd>${copyFieldHtml(h.address || "—")}</dd>` +
    `<dt>Arrivée</dt><dd>${esc(h.checkIn || "—")}</dd>` +
    `<dt>Départ</dt><dd>${esc(h.checkOut || "—")}</dd>` +
    (h.phone ? `<dt>Téléphone</dt><dd>${copyFieldHtml(h.phone)}</dd>` : "") +
    `<dt>Prix</dt><dd>${esc(h.price || "—")}</dd>` +
    `</dl>` +
    notesListHtml(h.notes) +
    contextPhraseHtml("hotel")
  );
  if (mapAct) highlightPin(mapAct);
}

export function openStopDetail(stop, opts){
  if (!state.panelContext || state.panelContext.type !== "city") return;
  const mapAct = { lat: stop.lat, lng: stop.lng, title: stop.name };
  const legsHtml = (stop.legs || []).map(({ leg, role }) => {
    const roleLabel = role === "from" ? "Départ" : "Arrivée";
    return `<button type="button" class="stop-leg-link" data-leg="${esc(leg.id)}">` +
      modeBadgeFor(leg.mode, "stop-leg-badge") +
      `<span class="when">${esc(roleLabel)} · ${esc(leg.mode)}</span>` +
      `<strong>${esc(leg.title)}</strong>` +
      `<span class="dummy">${esc(leg.subtitle || "")}</span>` +
      `</button>`;
  }).join("");
  showDetailSheet(
    `<span class="sheet-kind stop">Trajet</span>` +
    `<h3>${esc(stop.name)}</h3>` +
    (stop.jp ? `<p class="jp-name">${esc(stop.jp)}</p>` : "") +
    mapsLinkHtml(mapAct, "detail") +
    `<dl class="detail-kv">` +
    `<dt>Type</dt><dd>${esc(stop.kind || "Arrêt")}</dd>` +
    `</dl>` +
    (legsHtml ? `<div class="stop-legs">${legsHtml}</div>` : "") +
    contextPhraseHtml(stopPhraseContext(stop))
  );
  const sheet = panel.querySelector(".detail-sheet");
  if (sheet) {
    sheet.querySelectorAll(".stop-leg-link[data-leg]").forEach(n => {
      n.addEventListener("click", () => hooks.openLeg(n.dataset.leg));
    });
  }
  highlightPin(mapAct, opts);
}

function bindPanel(days, cityId){
  days = days || [];
  cityId = cityId || (state.panelContext && state.panelContext.city && state.panelContext.city.id);
  panel.querySelector(".close").onclick = () => closePanel(true);
  panel.querySelectorAll(".move-station-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const lat = Number(btn.dataset.stopLat);
      const lng = Number(btn.dataset.stopLng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const stop = stopEntryOnCity(cityId, { lat, lng });
      if (stop) openStopDetail(stop, { zoom: true });
      else highlightPin({ lat, lng, title: btn.querySelector(".move-station-name")?.textContent || "Gare" }, { zoom: true });
    });
  });
  panel.querySelectorAll(".journey-block[data-journey]").forEach(block => {
    block.querySelector(".journey-head")?.addEventListener("click", () => {
      hooks.openJourney(block.dataset.journey);
    });
  });
  panel.querySelectorAll(".move[data-leg]").forEach(n =>
    n.addEventListener("click", () => hooks.openLeg(n.dataset.leg))
  );
  panel.querySelectorAll(".hotel-card[data-stay]").forEach(n => {
    n.addEventListener("click", () => {
      const stay = (state.panelContext.city.stays || []).find(s => s.id === n.dataset.stay);
      if (stay) openHotelDetail(stay);
    });
  });
  panel.querySelectorAll("details.day").forEach((el) => {
    const dayN = Number(el.dataset.dayN);
    const day = days.find(d => d.n === dayN) || days[0];
    const filtered = [].concat(
      ideasForCity(day && day.ideas, cityId),
      ideasForCity(day && day.ideasAfter, cityId)
    );
    el.querySelectorAll(".act").forEach(node => {
      const idx = Number(node.dataset.actIdx);
      const act = filtered[idx];
      if (!act) return;
      const open = () => openActivityDetail(act, { zoom: true });
      node.addEventListener("click", (e) => {
        if (e.target.closest && e.target.closest("a.act-maps")) return;
        open();
      });
      node.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
      const mapBtn = node.querySelector("a.act-maps");
      if (mapBtn) mapBtn.addEventListener("click", e => e.stopPropagation());
    });
    el.addEventListener("toggle", () => {
      if (!state.currentCity) return;
      if (el.open && day){
        showCity(state.currentCity, day.n);
        panel.querySelectorAll("details.day").forEach(o => { if (o !== el) o.open = false; });
        scheduleCityMapRefresh();
      } else if (![...panel.querySelectorAll("details.day")].some(d => d.open)){
        showCity(state.currentCity, null);
        scheduleCityMapRefresh();
      }
    });
  });
}

export function fillCityPanel(c, days, openN){
  state.panelContext = { type:"city", city:c, days };
  const groups = stayGroups(c, days);
  const staysHtml = groups.map(({ stay, days: stayDays }) => {
    const cards = stayDays.map(d => {
      const moves = d.moves || [];
      const ideas = ideasForCity(d.ideas, c.id);
      const ideasAfter = ideasForCity(d.ideasAfter, c.id);
      const lockerHtml = renderLuggageLocker(d);
      let body = "";
      if (moves.length) body += renderMoves(moves, c.id);
      if (lockerHtml) body += `<h4>Bagages</h4>${lockerHtml}`;
      if (ideas.length) body += `<h4>Idées</h4>${renderIdeas(ideas, 0)}`;
      if (ideasAfter.length) body += `<h4>Après l’arrivée</h4>${renderIdeas(ideasAfter, ideas.length)}`;
      if (!body) body = `<p class="note">Rien de prévu ce jour-là pour cette ville.</p>`;
      return `<details class="day" data-day-n="${d.n}"${d.n === openN ? " open" : ""}><summary><span class="day-title">Jour ${d.n} · ${esc(d.dow)}</span><span class="day-date">${esc(d.date)}</span></summary><div class="slot">${body}</div></details>`;
    }).join("");
    return `<section class="stay-block">
      <div class="stay-head"><h3>${esc(stay.label)}</h3><span class="stay-dates">${esc(stay.from)} → ${esc(stay.to)}</span></div>
      ${renderHotelCard(stay)}
      ${cards}
    </section>`;
  }).join("");

  panel.classList.remove("panel-leg");
  panel.classList.add("panel-city");
  panel.innerHTML =
    sheetGrabHtml() +
    `<div class="overlay-head"><div class="head-text"><h2>${esc(c.name)}</h2><span class="jp-name">${esc(c.jp)} · ville verrouillée</span></div><button class="close" type="button" aria-label="Fermer">×</button></div>` +
    `<div class="overlay-body"><div class="city-panel">${staysHtml}</div><div class="detail-sheet"></div></div>`;
  panel.classList.add("open");
  bindSheetGrab();
  bindPanel(days, c.id);
}

export function openCity(id){
  clearLegEnds();
  showCity(id, null);
  fillCityPanel(CITIES[id], daysForCity(id), null);
}
