/* Onglet Préparatifs : progression + une section à la fois — à faire, checklist, budget, infos pratiques. */

import { TODOS_CHANGED, loadChecks, notifyTodosChanged, prepCheckState, saveChecks } from "../../core/checklist-store.js";
import { PREP_PANE_KEY } from "../../config.js";
import { PRACTICAL_INFO, PREP_BUDGET, PREP_BUDGET_TOTAL, PREP_CHECKS, TRAVELERS, TRIP } from "../../core/data.js";
import { formatBookingDateFr, japanTodayISO } from "../../core/dates.js";
import { esc } from "../../core/dom.js";
import { collectPrepReminders } from "../../domain/bookings.js";
import { bindTodoList, currentTodos, todoItemHtml } from "../alerts.js";

const PANES = ["todo", "checklist", "budget", "infos"];
let pane = null;

const isOn = (state, item) => (Object.prototype.hasOwnProperty.call(state, item.id) ? !!state[item.id] : !!item.done);

/** Onglet affiché : mémorisé, sinon « À faire » s’il y a de l’urgent, sinon la checklist. */
function initialPane(hasUrgent){
  try {
    const saved = localStorage.getItem(PREP_PANE_KEY);
    if (PANES.includes(saved)) return saved;
  } catch (_) { /* ignore */ }
  return hasUrgent ? "todo" : "checklist";
}

function showPane(name, save){
  pane = name;
  document.querySelectorAll("#view-prep .prep-pane").forEach(p => { p.hidden = p.dataset.pane !== name; });
  document.querySelectorAll("#prep-tabs [data-pane]").forEach(b => {
    const on = b.dataset.pane === name;
    b.classList.toggle("on", on);
    b.setAttribute("aria-selected", String(on));
  });
  if (save) { try { localStorage.setItem(PREP_PANE_KEY, name); } catch (_) { /* ignore */ } }
}

function checkItemHtml(item, on){
  return `<li class="${on ? "done" : ""}"><label class="check-row">` +
    `<input type="checkbox" data-check="${esc(item.id)}"${on ? " checked" : ""}/><span class="check-box" aria-hidden="true"></span>` +
    `<span class="check-text"><strong>${esc(item.label)}</strong>${item.meta ? `<span class="meta">${esc(item.meta)}</span>` : ""}</span>` +
    `</label></li>`;
}

function renderProgress(done, total){
  const box = document.getElementById("prep-progress");
  if (!box) return;
  const iso = japanTodayISO();
  const left = Math.ceil((Date.parse(TRIP.startDate + "T00:00:00+09:00") - Date.now()) / 86400000);
  const when = iso < TRIP.startDate ? `J-${left}` : iso <= TRIP.endDate ? "En voyage" : "Terminé";
  const pct = total ? Math.round(done / total * 100) : 0;
  box.innerHTML = `<span class="pp-when">${when}</span>` +
    `<span class="pp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><i style="width:${pct}%"></i></span>` +
    `<span class="pp-count">${done} / ${total} faits</span>`;
}

function renderChecklist(){
  const box = document.getElementById("prep-checklist");
  const doneBox = document.getElementById("prep-checklist-done");
  if (!box || !doneBox) return;
  const state = prepCheckState();
  const todo = PREP_CHECKS.filter(i => !isOn(state, i)), done = PREP_CHECKS.filter(i => isOn(state, i));
  box.innerHTML = todo.length ? todo.map(i => checkItemHtml(i, false)).join("") : `<li class="check-all">Tout est prêt ✓</li>`;
  doneBox.innerHTML = done.map(i => checkItemHtml(i, true)).join("");
  document.getElementById("prep-done-count").textContent = `(${done.length})`;
  document.getElementById("prep-checklist-done-box").hidden = !done.length;
  document.getElementById("prep-count-checklist").textContent = todo.length ? String(todo.length) : "✓";
  renderProgress(done.length, PREP_CHECKS.length);
  document.querySelectorAll("#view-prep input[data-check]").forEach(inp => {
    inp.addEventListener("change", () => {
      const li = inp.closest("li");
      if (li) li.classList.add("ticking");
      const st = loadChecks();
      st[inp.dataset.check] = inp.checked;
      saveChecks(st);
      // petite pause pour voir la case se cocher, puis la ligne change de groupe
      setTimeout(() => { renderChecklist(); notifyTodosChanged(); }, 260);
    });
  });
}

function renderBudget(){
  const hero = document.getElementById("prep-budget-hero");
  const list = document.getElementById("prep-budget");
  const who = document.getElementById("prep-travelers");
  if (!hero || !list) return;
  const tot = PREP_BUDGET_TOTAL || { label: "Total / pers.", amount: "—" };
  hero.innerHTML = `<span class="bh-label">${esc(tot.label)}</span><strong>${esc(tot.amount)}</strong>` +
    (tot.note ? `<span class="bh-note">${esc(tot.note)}</span>` : "");
  list.innerHTML = PREP_BUDGET.map(b =>
    `<div class="budget-row${b.done ? " paid" : ""}"><div class="br-main"><strong>${esc(b.label)}</strong>` +
    (b.note ? `<span>${esc(b.note)}</span>` : "") + `</div><div class="br-amt">${esc(b.amount)}</div></div>`
  ).join("");
  if (who && TRAVELERS.length) who.textContent = "Voyageurs : " + TRAVELERS.join(" & ");
}

export function renderPrep(){
  if (!document.getElementById("prep-checklist")) return;
  renderChecklist();
  renderBudget();
  const urgent = renderPrepTodos();
  renderPracticalInfo();
  const tabs = document.getElementById("prep-tabs");
  if (tabs && !tabs.dataset.bound) {
    tabs.dataset.bound = "1";
    tabs.querySelectorAll("[data-pane]").forEach(b => b.addEventListener("click", () => showPane(b.dataset.pane, true)));
  }
  showPane(pane || initialPane(urgent > 0), false);
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
  const count = document.getElementById("prep-count-todo");
  if (count) {
    count.textContent = urgent ? String(urgent) : "";
    count.classList.toggle("late", todos.some(t => t.urgency === "late"));
  }
  return urgent;
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
  // Cartes repliables : on ouvre celle dont on a besoin
  box.innerHTML = PRACTICAL_INFO.map(sec =>
    `<details class="practical-card"><summary><h4>${esc(sec.title)}</h4><span>${sec.items.length}</span></summary><ul>` +
    sec.items.map(it => `<li>${esc(it)}</li>`).join("") +
    `</ul></details>`
  ).join("");
}
