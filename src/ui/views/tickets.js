/* Sur place › Mes billets : pour chaque transport, comment prendre / montrer le billet, dans l’ordre du voyage.
   Le prochain trajet est déplié ; un toucher sur « Voir le trajet » ouvre sa fiche sur la carte. */

import { DAYS, LEGS } from "../../core/data.js";
import { dayToISO, japanTodayISO } from "../../core/dates.js";
import { esc } from "../../core/dom.js";
import { hooks } from "../../core/hooks.js";
import { TICKET_KINDS, ticketTimeline } from "../../domain/tickets.js";
import { ticketPillHtml } from "../templates.js";

const shortDate = (day) => `${String(day.date).replace(/\s\d{4}$/, "")}`;

export function renderTickets(){
  const box = document.getElementById("onsite-tickets");
  if (!box) return;
  const list = ticketTimeline(DAYS, LEGS);
  if (!list.length) { box.hidden = true; return; }
  const today = japanTodayISO();
  const isPast = (x) => dayToISO(x.day) < today;
  const next = list.find(x => dayToISO(x.day) >= today) || null;
  const upcoming = list.filter(x => !isPast(x)).length;
  box.hidden = false;
  box.innerHTML = `<div class="tool-head"><h3>Mes billets</h3><span class="tk-count">${upcoming} trajet${upcoming > 1 ? "s" : ""} à venir</span></div>` +
    `<p class="tk-lead">Comment prendre ou montrer le billet de chaque transport.</p>` +
    `<div class="tk-list">` + list.map(x => {
      const t = x.ticket, k = TICKET_KINDS[t.kind];
      const cls = `tk-item ${t.kind}${isPast(x) ? " past" : ""}${x === next ? " next" : ""}`;
      return `<details class="${cls}"${x === next ? " open" : ""}>` +
        `<summary><span class="tk-when"><b>${esc(shortDate(x.day))}</b><small>${esc(x.when)}</small></span>` +
        `<span class="tk-main"><strong>${esc(x.leg.title)}</strong>${ticketPillHtml(x.leg)}</span></summary>` +
        `<div class="tk-body"><p class="tk-head"><span aria-hidden="true">${k.icon}</span> ${esc(t.headline)}</p>` +
        `<ol class="tc-steps">${t.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>` +
        `<button type="button" class="today-act" data-leg="${esc(x.leg.id)}">Voir le trajet</button></div></details>`;
    }).join("") + `</div>`;
  box.querySelectorAll("[data-leg]").forEach(b => b.addEventListener("click", () => {
    hooks.setAppTab("map");
    hooks.openLeg(b.dataset.leg);
  }));
}
