/* Gabarits HTML partagés : cartes hôtel, déplacements, idées, réservations, galeries, phrases. */

import { CITIES, CONTEXT_PHRASES, LEGS } from "../core/data.js";
import { parseHotelTimeSort } from "../core/dates.js";
import { esc } from "../core/dom.js";
import { bookingOpenStatus } from "../domain/bookings.js";
import { journeyById, legEndPoint, legVehicleKind, stopLabel } from "../domain/legs.js";
import { hotelPhotos, thumbOf } from "../domain/photos.js";
import { phraseCardHtml } from "./phrase-show.js";
import { groupMovesByJourney, isEarlyArrivalBeforeCheckIn, isFirstDayOfStay, moveSortRange, stayForDay, stopEntryOnCity } from "../domain/trip.js";
import { hotelIconSvg, mapsIconSvg, modeBadgeHtml, placeGlyphSvg } from "../shared/icons.js";

export function modeStatHtml(mode){
  return `<div class="stat mode-stat"><span>Mode</span><strong class="mode-with-badge">${modeBadgeHtml(legVehicleKind(mode))}<b class="mode-name">${esc(mode || "—")}</b></strong></div>`;
}

/** Pastille du mode d’un trajet (texte libre « Bus », « Shinkansen »…). */
export function modeBadgeFor(mode, extraClass){
  return modeBadgeHtml(legVehicleKind(mode), extraClass);
}

export function statusClass(s){
  if (s === "paid") return "paid";
  if (s === "reserved") return "reserved";
  return "placeholder";
}

export function statusLabel(s){
  if (s === "paid") return "Payé";
  if (s === "reserved") return "Réservé";
  return "À réserver";
}

export function renderHotelCard(stay){
  const h = stay.hotel || {};
  const thumbs = hotelPhotos(h);
  const onErr = `onerror="this.remove();var t=this.parentElement;if(!t)return;t.classList.remove('has-photo');var ph=t.querySelector('.ph');if(ph)ph.style.display='grid'"`;
  const thumb = thumbs[0]
    ? `<div class="thumb has-photo"><img src="${esc(thumbOf(thumbs[0]))}" alt="" loading="lazy" ${onErr}/><div class="ph" style="display:none">${hotelIconSvg()}</div></div>`
    : `<div class="thumb"><div class="ph">${hotelIconSvg()}</div></div>`;
  return `<button type="button" class="hotel-card" data-stay="${esc(stay.id)}">
    ${thumb}
    <div class="meta">
      <div class="name">${esc(h.name || "Hôtel à définir")}</div>
      <div class="row"><em>${esc(h.area || "")}</em></div>
      <div class="row">${esc(stay.nights)} · ${esc(h.checkIn || stay.from)} → ${esc(h.checkOut || stay.to)}</div>
      <div class="row" style="margin-top:6px"><span class="status ${statusClass(h.status)}">${statusLabel(h.status)}</span></div>
    </div>
  </button>`;
}

function mapsDirectionsUrl(act){
  if (!act || act.lat == null || act.lng == null) return null;
  const dest = `${act.lat},${act.lng}`;
  // origin omis → Google Maps utilise la position actuelle sur le téléphone
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=walking`;
}

export function mapsLinkHtml(act, kind){
  const url = mapsDirectionsUrl(act);
  if (!url) return "";
  if (kind === "detail") {
    return `<a class="detail-maps" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><span>${mapsIconSvg()}</span><span>Itinéraire Google Maps</span></a>`;
  }
  return `<a class="act-maps" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="Itinéraire depuis ma position" aria-label="Ouvrir l’itinéraire Google Maps">${mapsIconSvg()}</a>`;
}

export function notesListHtml(notes){
  const list = notes || [];
  if (!list.length) return "";
  return `<ul class="detail-notes">${list.map(n => `<li>${esc(n)}</li>`).join("")}</ul>`;
}

export function actLinksHtml(links){
  const list = links || [];
  if (!list.length) return "";
  return `<div class="act-links">` + list.map(l =>
    `<a class="act-link" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label || l.url)}</a>`
  ).join("") + `</div>`;
}

export function renderLuggageLocker(day){
  if (!day) return "";
  const stay = stayForDay(day.city, day);
  const h = stay && stay.hotel;
  const firstStay = h && h.name && h.name !== "—" && isFirstDayOfStay(day.city, day);
  const checkInSort = firstStay ? parseHotelTimeSort(h.checkIn, 16 * 60) : null;
  const moveRange = moveSortRange(day.moves || []);
  const early = firstStay && isEarlyArrivalBeforeCheckIn(moveRange, checkInSort);
  if (!day.luggageLocker && !early) return "";
  const locker = day.luggageLocker || {};
  const title = locker.title || "Consigne bagages";
  const when = locker.when || (early ? "Après arrivée · avant check-in" : "");
  const desc = locker.desc || (early ? "À renseigner quand une consigne sera trouvée." : "");
  // Pas de pin / pas de Maps tant qu’il n’y a pas de coords
  return `<div class="act act-locker" role="note">` +
    `<span class="dot"></span>` +
    `<div>` +
    `<div class="act-title">${esc(title)}</div>` +
    (when ? `<div class="when">${esc(when)}</div>` : "") +
    (desc ? `<div class="dummy">${esc(desc)}</div>` : "") +
    `</div>` +
    `</div>`;
}

function moveStationBtnHtml(cityId, stop, role){
  const entry = stopEntryOnCity(cityId, stop);
  if (!entry) return "";
  const label = role === "from" ? "Départ" : "Arrivée";
  return `<button type="button" class="move-station-btn" data-stop-lat="${entry.lat}" data-stop-lng="${entry.lng}">` +
    `<span class="move-station-role">${esc(label)}</span>` +
    `<span class="move-station-name">${esc(entry.name)}</span>` +
    `</button>`;
}

export function renderMoveCard(m, cityId){
  const leg = m.leg ? LEGS.find(l => l.id === m.leg) : null;
  const mode = (leg && leg.mode) || m.mode || "";
  const when = leg
    ? `${leg.depart || "—"} → ${leg.arrive || "—"}`
    : (m.when || "");
  const ticket = leg
    ? `${statusLabel(leg.status)} · ${leg.payment || ""}`
    : (m.dummy || "");
  const role = m.role ? `<span class="badge-tag" style="margin-bottom:6px">${esc(m.role)}</span>` : "";
  const stops = leg && (leg.fromStop || leg.toStop)
    ? `<div class="dummy stops">${esc(stopLabel(leg.fromStop))} → ${esc(stopLabel(leg.toStop))}</div>`
    : "";
  const stationBtns = leg
    ? [moveStationBtnHtml(cityId, leg.fromStop, "from"), moveStationBtnHtml(cityId, leg.toStop, "to")].filter(Boolean).join("")
    : "";
  const stationActions = stationBtns
    ? `<div class="move-station-actions">${stationBtns}</div>`
    : "";
  const kind = m.transfer ? "transfer" : legVehicleKind(mode);
  const cls = m.transfer ? "move move-transfer" : "move";
  const duration = leg && leg.duration ? ` · ${esc(leg.duration)}` : "";
  return `<div class="${cls}"${m.leg ? ` data-leg="${m.leg}"` : ""}>` +
    modeBadgeHtml(kind, "move-badge") +
    `<div class="move-body">${role}<div class="when">${esc(mode)} · ${esc(when)}${duration}</div><div class="title">${esc(m.title)}</div>${stops}<div class="dummy">${esc(ticket)}</div>${stationActions}</div>` +
    `</div>`;
}

export function renderMoves(list, cityId){
  return groupMovesByJourney(list).map(g => {
    const inner = g.moves.map(m => renderMoveCard(m, cityId)).join("");
    if (!g.id) return inner;
    const j = journeyById(g.id);
    const destLine = g.dest
      ? `<p class="journey-dest">Destination · <strong>${esc(g.dest)}</strong>${j && j.destJp ? ` <span class="jp-name">${esc(j.destJp)}</span>` : ""}</p>`
      : "";
    return `<section class="journey-block" data-journey="${esc(g.id)}">` +
      `<div class="journey-head">` +
      `<div class="journey-head-text">` +
      (j && j.subtitle ? `<span class="journey-label">${esc(j.subtitle)}</span>` : "") +
      `<h3>${esc(g.title || "Trajet")}</h3>` +
      `</div>` +
      (g.meta ? `<span class="journey-meta">${esc(g.meta)}</span>` : "") +
      `</div>` +
      destLine +
      `<div class="journey-steps">${inner}</div>` +
      `</section>`;
  }).join("");
}

export function stopBlockHtml(leg){
  if (!leg.fromStop && !leg.toStop) return "";
  const row = (label, s, role) => {
    if (!s) return "";
    const title = s.jp ? `${s.name} · ${s.jp}` : (s.name || "—");
    const hasGeo = s.lat != null && s.lng != null;
    if (!hasGeo) {
      return `<div class="stat wide"><span>${esc(label)} · ${esc(s.kind || "Arrêt")}</span><strong>${esc(title)}</strong></div>`;
    }
    return `<button type="button" class="stat wide stop-jump" data-end="${esc(role)}">` +
      `<span>${esc(label)} · ${esc(s.kind || "Arrêt")}</span>` +
      `<strong>${esc(title)}</strong>` +
      `<em class="jump-hint">Voir sur la carte</em>` +
      `</button>`;
  };
  return row("Départ", leg.fromStop, "from") + row("Arrivée", leg.toStop, "to");
}

export function legBookingsHtml(leg){
  const b = leg.bookings;
  if (!b || !b.links || !b.links.length) return "";
  const statuses = b.links.map(l => bookingOpenStatus(l, leg));
  const required = statuses.filter(s => s.key !== "optional");
  const pool = required.length ? required : statuses;
  const hasReserved = pool.some(s => s.key === "reserved");
  const hasBookable = pool.some(s => s.key === "bookable");
  const hasWait = pool.some(s => s.key === "wait");
  const allReserved = pool.length && pool.every(s => s.key === "reserved");
  const summaryKey = allReserved ? "reserved"
    : hasReserved && (hasBookable || hasWait) ? "bookable"
    : hasBookable ? "bookable"
    : hasWait ? "wait"
    : "optional";
  const summaryLabel =
    summaryKey === "reserved" ? "Déjà réservé" :
    summaryKey === "bookable" && hasWait ? "Partiellement réservable" :
    summaryKey === "bookable" ? "Réservable — action requise" :
    summaryKey === "wait" ? "Pas encore réservable" :
    "Réservation optionnelle";
  const summary =
    `<div class="booking-summary status-${esc(summaryKey)}">` +
    `<span class="booking-dot" aria-hidden="true"></span>` +
    `<span>${esc(summaryLabel)}</span></div>`;
  const note = b.note ? `<p class="note booking-note">${esc(b.note)}</p>` : "";
  const links = b.links.map((l, i) => {
    const st = statuses[i];
    return `<a class="booking-link status-${esc(st.key)}" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">` +
      `<span class="booking-status"><span class="booking-dot" aria-hidden="true"></span>${esc(st.label)}</span>` +
      `<span class="booking-site">${esc(l.site || "Book")}</span>` +
      `<strong>${esc(l.label)}</strong>` +
      `</a>`;
  }).join("");
  return `<div class="leg-bookings"><h4>Réservation en ligne (EN)</h4>${summary}<div class="booking-links">${links}</div>${note}</div>`;
}

export function legEndsToolbarHtml(leg){
  const a = legEndPoint(leg, "from");
  const b = legEndPoint(leg, "to");
  const btn = (end, role) => {
    if (!end) return "";
    const tag = role === "from" ? "Départ" : "Arrivée";
    const city = end.cityId && CITIES[end.cityId] ? CITIES[end.cityId].name : "";
    return `<div class="leg-end-actions">` +
      `<button type="button" class="leg-focus-btn ${role}" data-end="${role}">` +
      `<span class="ab">${role === "from" ? "A" : "B"}</span>` +
      `<span class="txt"><em>${esc(tag)}</em><strong>${esc(end.name)}</strong>${city ? `<small>${esc(city)}</small>` : ""}</span>` +
      `</button>` +
      (end.cityId
        ? `<button type="button" class="leg-city-btn" data-end-city="${role}" title="Ouvrir la carte ville">Ville</button>`
        : "") +
      `</div>`;
  };
  return `<div class="leg-ends-bar">${btn(a, "from")}${btn(b, "to")}</div>`;
}

/** Mention de l’auteur et de la licence (obligatoire pour les photos Creative Commons). */
function photoCreditHtml(credit){
  if (!credit || !credit.author) return "";
  const lic = credit.licenseUrl
    ? `<a href="${esc(credit.licenseUrl)}" target="_blank" rel="noopener">${esc(credit.license)}</a>`
    : esc(credit.license || "");
  const who = credit.source
    ? `<a href="${esc(credit.source)}" target="_blank" rel="noopener">${esc(credit.author)}</a>`
    : esc(credit.author);
  return `<span class="photo-credit">© ${who}${lic ? " · " + lic : ""}</span>`;
}

/** Galerie : grande photo puis vignettes. `photos` : chemins ou { src, credit }. */
export function renderPhotoGallery(photos, kind){
  const list = photos.map(p => (typeof p === "string" ? { src: p } : p));
  if (!list.length){
    return `<div class="detail-hero"><div class="ph">${placeGlyphSvg(kind)}</div></div>`;
  }
  const onErr = `onerror="var box=this.closest('.shot,.detail-hero');if(!box)return;this.remove();if(!box.querySelector('img'))box.style.display='none'"`;
  const hero = `<div class="detail-hero"><img src="${esc(list[0].src)}" alt="" loading="lazy" ${onErr}/>` +
    `<div class="ph" style="display:none">${placeGlyphSvg(kind)}</div>${photoCreditHtml(list[0].credit)}</div>`;
  const rest = list.slice(1);
  if (!rest.length) return hero;
  const shots = rest.map((p, i) =>
    `<div class="shot${rest.length === 1 || (rest.length === 3 && i === 0) ? " wide" : ""}"><img src="${esc(p.src)}" alt="" loading="lazy" ${onErr}/>${photoCreditHtml(p.credit)}</div>`
  ).join("");
  return hero + `<div class="photo-gallery">${shots}</div>`;
}

export function copyFieldHtml(text){
  if (!text || text === "—") return esc(text || "—");
  return `<span class="copy-field"><span class="copy-text">${esc(text)}</span>` +
    `<button type="button" class="copy-btn" data-copy-text="${esc(text)}">Copier</button></span>`;
}

export function bindCopyButtons(root){
  (root || document).querySelectorAll(".copy-btn[data-copy-text]").forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", async () => {
      const t = btn.getAttribute("data-copy-text");
      if (!t) return;
      try {
        await navigator.clipboard.writeText(t);
        const prev = btn.textContent;
        btn.textContent = "Copié !";
        setTimeout(() => { btn.textContent = prev; }, 1600);
      } catch (_) { /* ignore */ }
    });
  });
}

/** Phrases utiles d’un type de lieu (cf. data/phrases.json → context), tappables pour les montrer. */
export function contextPhraseHtml(key){
  const ctx = CONTEXT_PHRASES[key];
  if (!ctx || !ctx.phrases || !ctx.phrases.length) return "";
  return `<div class="context-phrases"><h4>Phrases utiles · ${esc(ctx.label)}</h4>` +
    `<p class="phrase-tip">Touchez une phrase pour la montrer en grand.</p>` +
    ctx.phrases.map(p => phraseCardHtml(p, true)).join("") + `</div>`;
}
