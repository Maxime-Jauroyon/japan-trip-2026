/* Panneau ville : en-tête, bande des jours, aperçu (hôtels + jours) ou programme du jour ; fiches activité, hôtel, gare. */

import { CITIES, LEGS } from "../../core/data.js";
import { dayToISO, japanTodayISO } from "../../core/dates.js";
import { esc } from "../../core/dom.js";
import { panel } from "../../core/elements.js";
import { hooks } from "../../core/hooks.js";
import { state } from "../../core/state.js";
import { phraseContextForAct, pinKind, stopPhraseContext } from "../../domain/classify.js";
import { hotelPhotos, photosFor } from "../../domain/photos.js";
import { dayItinerary, itinerarySummary, segmentEstimate } from "../../domain/itinerary.js";
import { cityIdForAct } from "../../domain/places.js";
import { cityStayDates, daysForCity, defaultCityDay, ideasForCity, ideasOf, stayGroups, stopEntryOnCity } from "../../domain/trip.js";
import { highlightPin } from "../../map/city.js";
import { showCity } from "../../map/controller.js";
import { clearLegEnds } from "../../map/country.js";
import { PLACE_COLORS, TRANSPORT_COLORS, cityIconSvg, placeGlyphSvg, transportIconSvg } from "../../shared/icons.js";
import { bindSheetGrab, closeDetailSheet, closePanel, sheetGrabHtml, showDetailSheet } from "./panel.js";
import { actLinksHtml, contextPhraseHtml, copyFieldHtml, mapsLinkHtml, modeBadgeFor, notesListHtml, renderHotelCard, renderLuggageLocker, renderMoves, renderPhotoGallery, statusClass, statusLabel } from "../templates.js";

export function openActivityDetail(act, opts){
  if (!state.panelContext || state.panelContext.type !== "city") return;
  const targetCity = cityIdForAct(act, state.currentCity);
  if (targetCity && state.currentCity && targetCity !== state.currentCity){
    showCity(targetCity, null);
  }
  const kind = pinKind(act.title);
  const gallery = renderPhotoGallery(photosFor(act), kind);
  showDetailSheet(
    gallery +
    `<span class="sheet-kind activity">Activité</span>` +
    `<h3>${esc(act.title)}</h3>` +
    mapsLinkHtml(act, "detail") +
    `<p class="desc">${esc(act.desc || "")}</p>` +
    notesListHtml(act.notes) +
    actLinksHtml(act.links) +
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
    renderPhotoGallery(photos, "town") +
    `<span class="sheet-kind hotel">Hôtel</span>` +
    `<h3>${esc(h.name || "Hôtel à définir")}</h3>` +
    (mapAct ? mapsLinkHtml(mapAct, "detail") : "") +
    `<p class="desc">${esc(h.desc || "")}</p>` +
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
    contextPhraseHtml(stay.phrases || "hotel")
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

/* —— Panneau ville : en-tête, bande des jours, vue « Aperçu » ou vue « Jour » —— */

let view = null;   // { city, days }

const shortDow = (d) => (d.dow || "").slice(0, 3).toLowerCase();
const dayNum = (d) => (String(d.date || "").match(/^\d+/) || [""])[0];
const monthOf = (d) => (String(d.date || "").match(/^\d+\s+(\S+)/) || ["", ""])[1];
const fmtMin = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? " " + String(m % 60).padStart(2, "0") : ""}`);
const fmtKm = (km) => (km < 10 ? km.toFixed(1).replace(".", ",") : String(Math.round(km))) + " km";
const isToday = (d) => dayToISO(d) === japanTodayISO();

function dayStripHtml(days, sel){
  const chip = (n, top, bottom, extra) =>
    `<button type="button" class="day-chip${sel === n ? " on" : ""}${extra || ""}" data-day="${n == null ? "" : n}" role="tab" aria-selected="${sel === n}">` +
    `<b>${top}</b><span>${bottom}</span></button>`;
  return `<div class="day-strip" role="tablist" aria-label="Jours">` +
    chip(null, "Aperçu", "séjour", " overview") +
    days.map(d => chip(d.n, `J${d.n}`, `${esc(shortDow(d))} ${esc(dayNum(d))}`, isToday(d) ? " today" : "")).join("") +
    `</div>`;
}

/** Étapes de la journée (ordre de passage), avec le temps de trajet entre deux étapes. */
function itineraryHtml(stops){
  return `<ol class="itin">` + stops.map((s, i) => {
    let seg = "";
    if (i > 0) {
      const e = segmentEstimate(stops[i - 1], s);
      const k = e.mode === "walk" ? "walk" : "metro";
      seg = `<li class="itin-seg ${k}" aria-hidden="true"><i style="--mode-c:${TRANSPORT_COLORS[k]}">${transportIconSvg(k)}</i>` +
        `<span>${e.mode === "walk" ? "À pied" : "Transports"} · ${fmtMin(e.minutes)} · ${fmtKm(e.km)}</span></li>`;
    }
    if (s.kind === "activity") {
      const a = s.ref;
      const kind = pinKind(a.title);
      const photo = photosFor(a)[0];
      const thumb = photo
        ? `<span class="itin-thumb"><img src="${esc(photo.src)}" alt="" loading="lazy" onerror="this.parentNode.remove()"/></span>`
        : "";
      return seg + `<li class="itin-stop is-act" data-stop="${i}" role="button" tabindex="0">` +
        `<span class="itin-mark" style="--c:${PLACE_COLORS[kind] || PLACE_COLORS.pin}">${s.step}</span>` +
        `<span class="itin-main"><strong>${esc(a.title)}</strong>` +
        (a.desc ? `<span class="itin-desc">${esc(a.desc)}</span>` : "") + `</span>` +
        thumb + mapsLinkHtml(a, "list") + `</li>`;
    }
    const hotel = s.kind === "hotel";
    const role = i === 0 ? "Départ" : "Arrivée";
    return seg + `<li class="itin-stop ${s.kind}" data-stop="${i}" role="button" tabindex="0">` +
      `<span class="itin-mark square" style="--c:${hotel ? PLACE_COLORS.hotel : PLACE_COLORS.stop}">${placeGlyphSvg(hotel ? "hotel" : "train")}</span>` +
      `<span class="itin-main"><em>${role} · ${hotel ? "hôtel" : "gare"}</em><strong>${esc(s.title)}</strong></span></li>`;
  }).join("") + `</ol>`;
}

function dayViewHtml(c, d){
  const stops = dayItinerary(c.id, d);
  const sum = itinerarySummary(stops);
  const inRoute = new Set(stops.filter(s => s.kind === "activity").map(s => s.ref));
  const others = ideasForCity(ideasOf(d), c.id).filter(a => !inRoute.has(a));
  const moves = d.moves || [];
  const locker = renderLuggageLocker(d);
  const facts = [];
  if (sum.activities) facts.push(`${sum.activities} étape${sum.activities > 1 ? "s" : ""}`);
  if (stops.length > 1) facts.push(`≈ ${fmtKm(sum.km)}`, `${fmtMin(sum.minutes)} de trajets`);
  let body = `<div class="day-head"><h3>${esc(d.dow)} ${esc(dayNum(d))} ${esc(monthOf(d))}` +
    `${isToday(d) ? ` <span class="today-pill">Aujourd’hui</span>` : ""}</h3>` +
    `<p>Jour ${d.n}${facts.length ? " · " + facts.join(" · ") : ""}</p></div>`;
  (d.reminders || []).forEach(r => {
    body += `<div class="day-reminder" role="note"><strong>⚠︎ ${esc(r.title)}</strong>${r.desc ? `<p>${esc(r.desc)}</p>` : ""}</div>`;
  });
  if (moves.length) body += `<h4 class="sec-title">Trajets</h4>${renderMoves(moves, c.id)}`;
  if (locker) body += `<h4 class="sec-title">Bagages</h4>${locker}`;
  if (stops.length > 1 || sum.activities) body += `<h4 class="sec-title">Programme</h4>${itineraryHtml(stops)}`;
  if (others.length) {
    body += `<h4 class="sec-title">Autres idées</h4><div class="idea-list">` + others.map((a, i) =>
      `<div class="idea" data-other="${i}" role="button" tabindex="0"><span class="idea-dot"></span><span>${esc(a.title)}</span>${mapsLinkHtml(a, "list")}</div>`
    ).join("") + `</div>`;
  }
  if (!moves.length && !locker && stops.length <= 1 && !others.length && !(d.reminders || []).length) {
    body += `<p class="empty-day">Rien de prévu ce jour-là pour ${esc(c.name)}.</p>`;
  }
  return { html: body, stops, others };
}

function overviewHtml(c, days){
  const groups = stayGroups(c, days);
  const stays = groups.map(({ stay }) =>
    `<section class="stay-block"><div class="stay-head"><h3>${esc(stay.label)}</h3>` +
    `<span class="stay-dates">${esc(stay.from)} → ${esc(stay.to)}</span></div>${renderHotelCard(stay)}</section>`
  ).join("");
  const cards = days.map(d => {
    const acts = dayItinerary(c.id, d).filter(s => s.kind === "activity");
    const ideas = acts.length ? acts.map(s => s.title) : ideasForCity(ideasOf(d), c.id).map(a => a.title);
    const moves = d.moves || [];
    const first = moves.find(m => m.leg || m.mode);
    const line = ideas.length
      ? `${ideas.length} étape${ideas.length > 1 ? "s" : ""} · ${ideas.slice(0, 2).join(", ")}${ideas.length > 2 ? "…" : ""}`
      : (first ? first.title : "Journée libre");
    return `<button type="button" class="day-card${isToday(d) ? " today" : ""}" data-day="${d.n}">` +
      `<span class="dc-num"><b>J${d.n}</b><span>${esc(shortDow(d))}</span></span>` +
      `<span class="dc-main"><strong>${esc(d.dow)} ${esc(dayNum(d))} ${esc(monthOf(d))}${isToday(d) ? ` <span class="today-pill">Aujourd’hui</span>` : ""}</strong>` +
      `<span>${esc(line)}</span></span>` +
      (first ? modeBadgeFor(first.transfer ? "Correspondance" : (LEGS.find(l => l.id === first.leg)?.mode || first.mode), "dc-badge") : "") +
      `<span class="dc-go" aria-hidden="true">›</span></button>`;
  }).join("");
  return `${stays}<h4 class="sec-title">Les jours</h4><div class="day-cards">${cards}</div>`;
}

function bindMoves(root, cityId){
  root.querySelectorAll(".move-station-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const lat = Number(btn.dataset.stopLat), lng = Number(btn.dataset.stopLng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const stop = stopEntryOnCity(cityId, { lat, lng });
      if (stop) openStopDetail(stop, { zoom: true });
      else highlightPin({ lat, lng, title: btn.querySelector(".move-station-name")?.textContent || "Gare" }, { zoom: true });
    });
  });
  root.querySelectorAll(".journey-block[data-journey] .journey-head").forEach(h =>
    h.addEventListener("click", () => hooks.openJourney(h.closest(".journey-block").dataset.journey)));
  root.querySelectorAll(".move[data-leg]").forEach(n =>
    n.addEventListener("click", () => hooks.openLeg(n.dataset.leg)));
}

function activate(el, fn){
  el.addEventListener("click", e => {
    if (e.target.closest("a")) return;
    fn();
  });
  el.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); }
  });
}

/** Affiche l’aperçu (n = null) ou un jour ; `dir` = sens du glissement (-1 / 1). */
function renderView(dir){
  if (!view) return;
  const { city: c, days } = view;
  const listEl = panel.querySelector(".city-panel");
  if (!listEl) return;
  const d = state.selectedDay != null ? days.find(x => x.n === state.selectedDay) : null;
  let refs = null;
  if (d) {
    const v = dayViewHtml(c, d);
    listEl.innerHTML = v.html;
    refs = v;
  } else {
    listEl.innerHTML = overviewHtml(c, days);
  }
  listEl.classList.remove("slide-l", "slide-r");
  if (dir) { void listEl.offsetWidth; listEl.classList.add(dir > 0 ? "slide-l" : "slide-r"); }
  const body = panel.querySelector(".overlay-body");
  if (body) body.scrollTop = 0;

  bindMoves(listEl, c.id);
  listEl.querySelectorAll(".hotel-card[data-stay]").forEach(n => n.addEventListener("click", () => {
    const stay = (c.stays || []).find(s => s.id === n.dataset.stay);
    if (stay) openHotelDetail(stay);
  }));
  listEl.querySelectorAll(".day-card[data-day]").forEach(n =>
    n.addEventListener("click", () => selectDay(Number(n.dataset.day))));
  listEl.querySelectorAll("a.act-maps").forEach(a => a.addEventListener("click", e => e.stopPropagation()));
  if (refs) {
    listEl.querySelectorAll(".itin-stop[data-stop]").forEach(n => {
      const s = refs.stops[Number(n.dataset.stop)];
      if (!s) return;
      activate(n, () => {
        if (s.kind === "activity") openActivityDetail(s.ref, { zoom: true });
        else if (s.kind === "hotel") openHotelDetail(s.ref);
        else {
          const stop = stopEntryOnCity(c.id, s.ref);
          if (stop) openStopDetail(stop, { zoom: true });
          else highlightPin({ lat: s.lat, lng: s.lng, title: s.title }, { zoom: true });
        }
      });
    });
    listEl.querySelectorAll(".idea[data-other]").forEach(n => {
      const a = refs.others[Number(n.dataset.other)];
      if (a) activate(n, () => openActivityDetail(a, { zoom: a.lat != null }));
    });
  }
}

function syncStrip(){
  const strip = panel.querySelector(".day-strip");
  if (!strip) return;
  strip.querySelectorAll(".day-chip").forEach(ch => {
    const n = ch.dataset.day === "" ? null : Number(ch.dataset.day);
    const on = n === state.selectedDay;
    ch.classList.toggle("on", on);
    ch.setAttribute("aria-selected", String(on));
    if (on) {
      const r = ch.offsetLeft - (strip.clientWidth - ch.offsetWidth) / 2;
      strip.scrollTo({ left: Math.max(0, r), behavior: "smooth" });
    }
  });
}

/** Sélectionne un jour (ou l’aperçu) : panneau, bande des jours et carte suivent. */
export function selectDay(n, dir){
  if (!view) return;
  if (panel.querySelector(".detail-sheet.show")) closeDetailSheet();
  const order = [null, ...view.days.map(d => d.n)];
  if (dir == null) dir = Math.sign(order.indexOf(n) - order.indexOf(state.selectedDay));
  state.selectedDay = n;
  state.lastFocusAct = null;
  renderView(dir);
  syncStrip();
  if (state.currentCity) showCity(state.currentCity, n);
}

/** Balayage horizontal sur le contenu : jour précédent / suivant. */
function bindDaySwipe(body){
  let x0 = null, y0 = 0;
  body.addEventListener("touchstart", e => {
    if (e.touches.length !== 1 || panel.querySelector(".detail-sheet.show")) { x0 = null; return; }
    const p = e.touches[0];
    if (p.clientX - body.getBoundingClientRect().left < 28) { x0 = null; return; }  // bord gauche = retour
    x0 = p.clientX; y0 = p.clientY;
  }, { passive: true });
  body.addEventListener("touchend", e => {
    if (x0 == null || !view) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - x0, dy = p.clientY - y0;
    x0 = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    const order = [null, ...view.days.map(d => d.n)];
    const i = order.indexOf(state.selectedDay) + (dx < 0 ? 1 : -1);
    if (i >= 0 && i < order.length) selectDay(order[i], dx < 0 ? 1 : -1);
  });
}

export function fillCityPanel(c, days, openN){
  state.panelContext = { type: "city", city: c, days };
  view = { city: c, days };
  state.selectedDay = defaultCityDay(days, japanTodayISO(), openN);
  const dates = cityStayDates(c);
  panel.classList.remove("panel-leg", "panel-journey", "has-detail");
  panel.classList.add("panel-city");
  panel.innerHTML =
    sheetGrabHtml() +
    `<div class="panel-top">` +
    `<div class="overlay-head city-head"><span class="city-ico">${cityIconSvg(c.id)}</span>` +
    `<div class="head-text"><h2>${esc(c.name)}</h2><span class="jp-name">${esc(c.jp)}${dates ? " · " + esc(dates) : ""}</span></div>` +
    `<button class="close" type="button" aria-label="Fermer">×</button></div>` +
    dayStripHtml(days, state.selectedDay) +
    `</div>` +
    `<div class="overlay-body"><div class="city-panel"></div><div class="detail-sheet"></div></div>`;
  panel.classList.add("open");
  panel.querySelector(".close").onclick = () => closePanel(true);
  panel.querySelectorAll(".day-chip").forEach(ch => ch.addEventListener("click", () =>
    selectDay(ch.dataset.day === "" ? null : Number(ch.dataset.day))));
  renderView(0);
  bindSheetGrab();
  bindDaySwipe(panel.querySelector(".overlay-body"));
  requestAnimationFrame(syncStrip);
  showCity(c.id, state.selectedDay);
}

export function openCity(id){
  clearLegEnds();
  fillCityPanel(CITIES[id], daysForCity(id), null);
}
