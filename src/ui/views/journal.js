/* Sur place › Journal : le jour choisi (par défaut aujourd’hui) — idées faites / pas faites, notes et photos. */

import { DAYS, TRIP } from "../../core/data.js";
import { dayToISO, japanTodayISO } from "../../core/dates.js";
import { esc } from "../../core/dom.js";
import { applyJournal, dayScore } from "../../domain/journal.js";
import { ideasOf } from "../../domain/trip.js";
import { journalDay, journalReady } from "../../pwa/journal-store.js";
import { bindJournalRows, bindStatusButtons, cameraButtonHtml, fixedPillHtml, photoStripHtml, statusButtonHtml, syncLineText } from "../journal-widgets.js";

let viewN = null;

const todayN = () => {
  const iso = japanTodayISO();
  const hit = DAYS.find(d => dayToISO(d) === iso);
  if (hit) return hit.n;
  return iso < TRIP.startDate ? DAYS[0].n : DAYS[DAYS.length - 1].n;
};

/** Texte de synchro seul (mis à jour sans tout redessiner). */
export function renderJournalSync(){
  const el = document.getElementById("jr-sync-line");
  if (el) el.textContent = syncLineText(journalReady());
}

export function renderJournalView(){
  const box = document.getElementById("onsite-journal");
  if (!box) return;
  if (viewN == null || !DAYS.some(d => d.n === viewN)) viewN = todayN();
  const day = DAYS.find(d => d.n === viewN);
  const iso = dayToISO(day);
  const view = applyJournal(ideasOf(day), journalDay(iso));
  const score = dayScore(view);
  const isToday = iso === japanTodayISO();
  const long = esc(`${day.dow} ${day.date.replace(/\s\d{4}$/, "")}`);
  box.innerHTML =
    `<div class="tool-head"><h3>Journal</h3>${score.total ? `<span class="next-count">${score.done} / ${score.total}</span>` : ""}</div>` +
    `<div class="exp-day"><button type="button" class="exp-day-step" data-jday="-1" aria-label="Jour précédent"${viewN <= DAYS[0].n ? " disabled" : ""}>‹</button>` +
    `<span class="exp-day-label${isToday ? "" : " past"}">${isToday ? "Aujourd’hui · " : ""}J${day.n} · ${long}</span>` +
    `<button type="button" class="exp-day-step" data-jday="1" aria-label="Jour suivant"${viewN >= DAYS[DAYS.length - 1].n ? " disabled" : ""}>›</button></div>` +
    `<p class="jr-lead">Touche le rond : à faire → ✓ fait → ✗ pas fait. Les idées ne sont que des suggestions.</p>` +
    (view.planned.length ? `<ul class="jr-plan-list">` + view.planned.map(p =>
      `<li class="jr-plan st-row-${p.status}"><span class="jr-plan-title">${esc(p.act.title)}${fixedPillHtml(p.fixed)}</span>` +
      `${cameraButtonHtml(iso, { title: p.act.title }, "")}${statusButtonHtml(iso, p.act.title, p.status, p.fixed)}` +
      photoStripHtml(iso, p.id, p.photos) + `</li>`).join("") + `</ul>` : `<p class="jr-lead">Aucune idée au programme ce jour-là.</p>`) +
    `<p class="jr-sync" id="jr-sync-line"></p>`;
  renderJournalSync();
  bindStatusButtons(box);
  bindJournalRows(box);
  box.querySelectorAll("[data-jday]").forEach(b => b.addEventListener("click", () => {
    viewN = Math.min(DAYS[DAYS.length - 1].n, Math.max(DAYS[0].n, viewN + Number(b.dataset.jday)));
    renderJournalView();
  }));
}
