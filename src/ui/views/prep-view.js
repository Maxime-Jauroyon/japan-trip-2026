/* Onglet Préparatifs : réservations ouvertes, rappels, checklist, budget, infos pratiques. */

import { loadChecks, prepCheckState, saveChecks } from "../../core/checklist-store.js";
import { PRACTICAL_INFO, PREP_BUDGET, PREP_BUDGET_TOTAL, PREP_CHECKS, TRAVELERS } from "../../core/data.js";
import { formatBookingDateFr } from "../../core/dates.js";
import { esc } from "../../core/dom.js";
import { collectBookableAlerts, collectPrepReminders } from "../../domain/bookings.js";
import { renderReminderAlert } from "../alerts.js";

export function renderPrep(){
  const box = document.getElementById("prep-checklist");
  const bud = document.getElementById("prep-budget");
  const who = document.getElementById("prep-travelers");
  if (!box || !bud) return;
  if (who && TRAVELERS.length) {
    who.textContent = "Voyageurs : " + TRAVELERS.join(" & ");
  }
  const state = prepCheckState();
  box.innerHTML = PREP_CHECKS.map(item => {
    const on = Object.prototype.hasOwnProperty.call(state, item.id) ? !!state[item.id] : !!item.done;
    return `<li><input type="checkbox" id="ck-${item.id}" data-check="${item.id}"${on ? " checked" : ""}/><label for="ck-${item.id}" class="${on ? "done" : ""}">${esc(item.label)}<span class="meta">${esc(item.meta)}</span></label></li>`;
  }).join("");
  box.querySelectorAll("input[data-check]").forEach(inp => {
    inp.addEventListener("change", () => {
      const st = loadChecks();
      st[inp.dataset.check] = inp.checked;
      saveChecks(st);
      const lab = box.querySelector(`label[for="${inp.id}"]`);
      if (lab) lab.classList.toggle("done", inp.checked);
    });
  });
  const rows = PREP_BUDGET.map(b =>
    `<div class="${b.done ? "" : "muted"}">${esc(b.label)}<span class="meta" style="display:block;font-size:12px;font-weight:400">${esc(b.note)}</span></div><div class="amt">${esc(b.amount)}</div>`
  ).join("");
  const tot = PREP_BUDGET_TOTAL
    ? PREP_BUDGET_TOTAL
    : { label:"Total / pers.", amount:"—" };
  bud.innerHTML = rows + `<div class="total"><span>${esc(tot.label)}</span><span>${esc(tot.amount)}</span></div>`;
  renderPrepBookings();
  renderPrepReminders();
  renderPracticalInfo();
}

function renderPrepBookings(){
  const box = document.getElementById("prep-bookings");
  const lead = document.getElementById("prep-bookings-lead");
  const sec = document.getElementById("prep-bookings-sec");
  if (!box || !sec) return;
  const alerts = collectBookableAlerts();
  sec.classList.toggle("has-bookable", alerts.length > 0);
  if (!alerts.length) {
    if (lead) lead.textContent = "Rien d’ouvert pour l’instant — cette section s’allumera dès qu’un trajet devient réservable.";
    box.innerHTML = `<p class="prep-bookings-empty">Aucun trajet à réserver maintenant.</p>`;
    return;
  }
  if (lead) {
    lead.textContent = alerts.length === 1
      ? "1 trajet est réservable — à faire avant d’oublier."
      : alerts.length + " trajets sont réservables — à faire avant d’oublier.";
  }
  box.innerHTML = alerts.map(a =>
    `<a class="prep-booking-card" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">` +
    `<span class="prep-booking-status"><span class="booking-dot" aria-hidden="true"></span>Réservable</span>` +
    `<strong>${esc(a.legTitle)}</strong>` +
    `<span class="prep-booking-meta">${esc(a.label)} · ${esc(a.site)}</span>` +
    `<span class="prep-booking-go">Ouvrir le site →</span></a>`
  ).join("");
}

function renderPrepReminders(){
  const box = document.getElementById("prep-reminders");
  const sec = document.getElementById("prep-reminders-sec");
  if (!box || !sec) return;
  const list = collectPrepReminders(prepCheckState());
  if (!list.length) {
    sec.hidden = true;
    return;
  }
  sec.hidden = false;
  const anyActive = list.some(r => r.active);
  sec.classList.toggle("has-due", anyActive);
  box.innerHTML = list.map(r => {
    const when = r.due ? formatBookingDateFr(r.due) : "";
    const badge = r.active
      ? `<span class="prep-reminder-badge due">À faire maintenant</span>`
      : r.days != null
        ? `<span class="prep-reminder-badge">Dans ${r.days} j · ${esc(when)}</span>`
        : "";
    const linkList = (r.links && r.links.length)
      ? r.links
      : (r.url ? [{ label: r.urlLabel || "Ouvrir le guide →", url: r.url }] : []);
    const linksHtml = linkList.map(l =>
      `<a class="prep-reminder-link" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a>`
    ).join("");
    return `<div class="prep-reminder-card${r.active ? " due" : ""}">` +
      `${badge}<strong>${esc(r.label)}</strong>` +
      `<span class="prep-booking-meta">${esc(r.meta)}</span>` +
      (linksHtml ? `<div class="prep-reminder-links">${linksHtml}</div>` : "") +
      `<label class="prep-reminder-check"><input type="checkbox" data-check="${esc(r.id)}"/> Marquer comme fait</label>` +
      `</div>`;
  }).join("");
  box.querySelectorAll("input[data-check]").forEach(inp => {
    inp.addEventListener("change", () => {
      const st = loadChecks();
      st[inp.dataset.check] = inp.checked;
      saveChecks(st);
      renderPrep();
      renderReminderAlert();
    });
  });
}

function renderPracticalInfo(){
  const box = document.getElementById("prep-practical");
  if (!box) return;
  box.innerHTML = PRACTICAL_INFO.map(sec =>
    `<article class="practical-card"><h4>${esc(sec.title)}</h4><ul>` +
    sec.items.map(it => `<li>${esc(it)}</li>`).join("") +
    `</ul></article>`
  ).join("");
}
