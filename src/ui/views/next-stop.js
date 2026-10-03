/* Carte « Et maintenant ? » (Sur place, pendant le voyage) : prochaine étape du jour, temps estimé
   depuis ma position (ou l’étape précédente), itinéraire en un geste, « Fait ✓ » pour passer à la suite. */

import { DAY_PROGRESS_KEY } from "../../config.js";
import { findTripDayByISO, japanTodayISO } from "../../core/dates.js";
import { esc } from "../../core/dom.js";
import { state } from "../../core/state.js";
import { pinKind } from "../../domain/classify.js";
import { dayItinerary, formatMinutes, nextStop, segmentEstimate } from "../../domain/itinerary.js";
import { PLACE_COLORS } from "../../shared/icons.js";
import { USER_POS_CHANGED, distanceFromMe } from "../my-position.js";
import { mapsDirectionsUrl } from "../templates.js";

let bound = false;

function loadProgress(){
  try { return JSON.parse(localStorage.getItem(DAY_PROGRESS_KEY) || "{}") || {}; } catch (_) { return {}; }
}

function saveDone(iso, done){
  const all = loadProgress();
  // On ne garde que les 3 derniers jours renseignés
  all[iso] = [...done];
  const keep = Object.keys(all).sort().slice(-3);
  const next = {};
  keep.forEach(k => { next[k] = all[k]; });
  try { localStorage.setItem(DAY_PROGRESS_KEY, JSON.stringify(next)); } catch (_) { /* quota */ }
}

/** Étapes du jour : ville principale (avec hôtel / gare) + activités de la ville secondaire. */
function stopsOfDay(day){
  const main = dayItinerary(day.city, day);
  const extra = day.extraCity ? dayItinerary(day.extraCity, day).filter(s => s.kind === "activity") : [];
  return main.concat(extra);
}

function howHtml(next){
  const fromMe = distanceFromMe(next.stop);
  if (fromMe) return `<span class="next-how">${esc(fromMe)} depuis ma position</span>`;
  if (!next.from) return "";
  const e = segmentEstimate(next.from, next.stop);
  const label = next.from.kind === "hotel" ? "l’hôtel" : next.from.kind === "station" ? "la gare" : next.from.title;
  return `<span class="next-how">≈ ${formatMinutes(e.minutes)} ${e.mode === "walk" ? "à pied" : "en transports"} depuis ${esc(label)}</span>`;
}

export function renderNextStop(){
  const box = document.getElementById("onsite-next");
  if (!box) return;
  const iso = japanTodayISO();
  const day = findTripDayByISO(iso);
  const stops = day ? stopsOfDay(day) : [];
  const acts = stops.filter(s => s.kind === "activity");
  if (!acts.length) { box.hidden = true; box.innerHTML = ""; return; }
  const done = new Set(loadProgress()[iso] || []);
  const next = nextStop(stops, done);
  const nDone = acts.filter(s => done.has(s.title)).length;
  let main;
  if (next) {
    const s = next.stop;
    const near = state.userPos && distanceFromMe(s);
    const e = segmentEstimate(near ? state.userPos : (next.from || s), s);
    const url = mapsDirectionsUrl(s, e.mode === "walk" ? "walking" : "transit");
    main = `<div class="next-main">` +
      `<span class="itin-mark" style="--c:${PLACE_COLORS[pinKind(s.title)] || PLACE_COLORS.pin}">${s.step}</span>` +
      `<div class="next-text"><span class="kicker">Prochaine étape</span><strong>${esc(s.title)}</strong>${howHtml(next)}</div></div>` +
      `<div class="today-actions">` +
      (url ? `<a class="today-act primary" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Itinéraire ↗</a>` : "") +
      `<button type="button" class="today-act" data-done="${esc(s.title)}">Fait ✓</button></div>`;
  } else {
    main = `<p class="next-finished">Programme du jour terminé — お疲れさま ! 🎉</p>`;
  }
  box.hidden = false;
  box.innerHTML = `<div class="tool-head"><h3>Et maintenant ?</h3><span class="next-count">${nDone} / ${acts.length} fait${nDone > 1 ? "s" : ""}</span></div>` +
    main +
    `<div class="next-steps" aria-label="Étapes du jour">` + acts.map(s =>
      `<button type="button" class="next-step${done.has(s.title) ? " done" : ""}${next && next.stop === s ? " current" : ""}" data-toggle="${esc(s.title)}" aria-pressed="${done.has(s.title)}">` +
      `<b>${s.step}</b>${esc(s.title)}</button>`).join("") + `</div>`;
  const toggle = (title) => {
    if (done.has(title)) done.delete(title); else done.add(title);
    saveDone(iso, done);
    renderNextStop();
  };
  box.querySelector("[data-done]")?.addEventListener("click", e => toggle(e.currentTarget.dataset.done));
  box.querySelectorAll("[data-toggle]").forEach(b => b.addEventListener("click", () => toggle(b.dataset.toggle)));
  if (!bound) {
    bound = true;
    document.addEventListener(USER_POS_CHANGED, renderNextStop);
  }
}
