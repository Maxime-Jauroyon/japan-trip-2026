/* Onglet Préparatifs : à faire (réservations, billets), checklist, budget, infos pratiques. */

import { TODOS_CHANGED, loadChecks, notifyTodosChanged, prepCheckState, saveChecks } from "../../core/checklist-store.js";
import { PRACTICAL_INFO, PREP_BUDGET, PREP_BUDGET_TOTAL, PREP_CHECKS, TRAVELERS } from "../../core/data.js";
import { formatBookingDateFr } from "../../core/dates.js";
import { esc } from "../../core/dom.js";
import { collectPrepReminders } from "../../domain/bookings.js";
import { bindTodoList, currentTodos, todoItemHtml } from "../alerts.js";

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
      notifyTodosChanged();
    });
  });
  const rows = PREP_BUDGET.map(b =>
    `<div class="${b.done ? "" : "muted"}">${esc(b.label)}<span class="meta" style="display:block;font-size:12px;font-weight:400">${esc(b.note)}</span></div><div class="amt">${esc(b.amount)}</div>`
  ).join("");
  const tot = PREP_BUDGET_TOTAL
    ? PREP_BUDGET_TOTAL
    : { label:"Total / pers.", amount:"—" };
  bud.innerHTML = rows + `<div class="total"><span>${esc(tot.label)}</span><span>${esc(tot.amount)}</span></div>`;
  renderPrepTodos();
  renderPracticalInfo();
}

const TODO_GROUPS = [
  ["late", "En retard"],
  ["now", "À faire maintenant"],
  ["soon", "Dans les 14 prochains jours"]
];

/** Section « À faire » : groupée par urgence ; les rappels plus lointains restent discrets en dessous. */
function renderPrepTodos(){
  const box = document.getElementById("prep-todo");
  const lead = document.getElementById("prep-todo-lead");
  const sec = document.getElementById("prep-todo-sec");
  if (!box || !sec) return;
  const todos = currentTodos();
  const urgent = todos.filter(t => t.urgency !== "soon").length;
  sec.classList.toggle("has-urgent", urgent > 0);
  sec.classList.toggle("has-late", todos.some(t => t.urgency === "late"));
  if (lead) {
    lead.textContent = urgent
      ? `${urgent} chose${urgent > 1 ? "s" : ""} à faire maintenant — « Fait ✓ » quand c’est réservé.`
      : "Rien d’urgent. Les réservations et billets apparaîtront ici dès qu’ils ouvrent.";
  }
  const groups = TODO_GROUPS.map(([key, title]) => {
    const items = todos.filter(t => t.urgency === key);
    return items.length
      ? `<h4 class="todo-group ${key}">${title}</h4><ul class="todo-list">${items.map(t => todoItemHtml(t, { full: true })).join("")}</ul>`
      : "";
  }).join("");
  const later = collectPrepReminders(prepCheckState()).filter(r => r.days != null && r.days > 14);
  const laterHtml = later.length
    ? `<h4 class="todo-group later">Plus tard</h4><ul class="todo-later-list">` +
      later.map(r => `<li><span>${esc(r.label)}</span><span class="meta">${esc(formatBookingDateFr(r.due))}</span></li>`).join("") +
      `</ul>`
    : "";
  box.innerHTML = (groups || `<p class="prep-bookings-empty">Tout est à jour ✓</p>`) + laterHtml;
  bindTodoList(box, todos);
}

/** Re-rendu de l’onglet quand une tâche change ailleurs (carte « À faire »). */
export function initPrepView(){
  document.addEventListener(TODOS_CHANGED, () => {
    if (document.getElementById("view-prep")?.classList.contains("active")) renderPrep();
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
