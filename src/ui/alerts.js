/* Bandeaux bas d’écran : installation iPhone, carte « À faire » (réservations ouvertes + rappels billets). */

import { IOS_INSTALL_KEY, TODO_SNOOZE_KEY } from "../config.js";
import { TODOS_CHANGED, loadDoneBookings, markBookingDone, notifyTodosChanged, prepCheckState, setCheck } from "../core/checklist-store.js";
import { todayLocalDate } from "../core/dates.js";
import { esc } from "../core/dom.js";
import { isIOSDevice, isIOSInstalledPWA } from "../core/env.js";
import { hooks } from "../core/hooks.js";
import { collectTodos, todoDueLabel } from "../domain/bookings.js";

export function initIOSInstallHint(){
  const box = document.getElementById("ios-install");
  const btn = document.getElementById("ios-install-dismiss");
  if (!box || !btn) return;
  if (!isIOSDevice() || isIOSInstalledPWA()) {
    box.hidden = true;
    return;
  }
  try {
    if (localStorage.getItem(IOS_INSTALL_KEY) === "1") {
      box.hidden = true;
      return;
    }
  } catch (_) { /* ignore */ }
  box.hidden = false;
  syncBottomBanners();
  btn.addEventListener("click", () => {
    box.hidden = true;
    try { localStorage.setItem(IOS_INSTALL_KEY, "1"); } catch (_) { /* ignore */ }
    syncBottomBanners();
  });
}

/* —— Carte « À faire » : réservations ouvertes + rappels billets ——
   Rien ne disparaît sans être fait : « Plus tard » masque la carte jusqu’au lendemain seulement. */

/** Empile les bandeaux visibles (installation iPhone, puis « À faire » au-dessus), d’après leur hauteur réelle. */
function syncBottomBanners(){
  const ios = document.getElementById("ios-install");
  const todo = document.getElementById("todo-alert");
  if (!todo) return;
  todo.style.bottom = ios && !ios.hidden
    ? `calc(${ios.offsetHeight + 20}px + var(--tabbar-h, 0px) + env(safe-area-inset-bottom))`
    : "";
}

/** Pastille d’échéance : « En retard · depuis 9 j », « À faire · aujourd’hui », « Dans 10 j · 13 oct. 2026 ». */
function pillText(t){
  if (t.urgency !== "now") return todoDueLabel(t);
  return t.days == null || t.days === 0 ? "À faire · aujourd’hui" : `À faire · depuis ${-t.days} j`;
}

function todayISO(){
  const d = todayLocalDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function snoozedToday(){
  try { return localStorage.getItem(TODO_SNOOZE_KEY) === todayISO(); } catch (_) { return false; }
}

/** Tâches en cours (en retard / à faire maintenant / bientôt). */
export function currentTodos(){
  return collectTodos(prepCheckState(), loadDoneBookings());
}

/** Marque une tâche comme faite (case cochée ou réservation faite sur l’appareil). */
export function completeTodo(todo){
  if (todo.kind === "reminder") setCheck(todo.id, true);
  else markBookingDone(todo.id);
  notifyTodosChanged();
}

export function todoItemHtml(t, opts = {}){
  const link = t.links[0];
  const open = link
    ? `<a class="todo-btn todo-open" href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(opts.full ? link.label : "Ouvrir")} ↗</a>`
    : (t.legId ? `<button type="button" class="todo-btn todo-open" data-leg="${esc(t.legId)}">Voir le trajet</button>` : "");
  const more = opts.full ? t.links.slice(1).map(l =>
    `<a class="todo-btn todo-link" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a>`).join("") : "";
  const leg = opts.full && t.legId && link ? `<button type="button" class="todo-btn todo-link" data-leg="${esc(t.legId)}">Voir le trajet</button>` : "";
  return `<li class="todo-item ${t.urgency}" data-todo="${esc(t.id)}">` +
    `<span class="todo-pill ${t.urgency}">${esc(pillText(t))}</span>` +
    `<strong class="todo-title">${esc(t.title)}</strong>` +
    (t.meta ? `<span class="todo-meta">${esc(t.meta)}</span>` : "") +
    `<span class="todo-actions">${open}${more}${leg}<button type="button" class="todo-btn todo-done" data-done="${esc(t.id)}">Fait ✓</button></span>` +
    `</li>`;
}

/** Branche « Fait » et « Voir le trajet » sur une liste rendue par todoItemHtml. */
export function bindTodoList(root, todos){
  root.querySelectorAll("[data-done]").forEach(btn => btn.addEventListener("click", e => {
    e.stopPropagation();
    const t = todos.find(x => x.id === btn.dataset.done);
    if (t) completeTodo(t);
  }));
  root.querySelectorAll("[data-leg]").forEach(btn => btn.addEventListener("click", () => {
    hooks.setAppTab("map");
    hooks.openLeg(btn.dataset.leg);
  }));
}

function renderTabBadge(todos){
  const tab = document.querySelector('#app-tabs button[data-tab="prep"]');
  if (!tab) return;
  const urgent = todos.filter(t => t.urgency !== "soon");
  let badge = tab.querySelector(".tab-badge");
  if (!urgent.length) { if (badge) badge.remove(); return; }
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "tab-badge";
    tab.appendChild(badge);
  }
  badge.textContent = String(urgent.length);
  badge.classList.toggle("late", urgent.some(t => t.urgency === "late"));
  badge.setAttribute("aria-label", `${urgent.length} chose${urgent.length > 1 ? "s" : ""} à faire`);
}

const MAX_IN_CARD = 3;

export function renderTodoAlerts(){
  const todos = currentTodos();
  renderTabBadge(todos);
  const box = document.getElementById("todo-alert");
  const list = document.getElementById("todo-alert-list");
  if (!box || !list) return;
  const urgent = todos.filter(t => t.urgency !== "soon");
  const onPrep = document.getElementById("view-prep")?.classList.contains("active");
  if (!urgent.length || snoozedToday() || onPrep) {
    box.hidden = true;
    syncBottomBanners();
    return;
  }
  document.getElementById("todo-alert-count").textContent = `· ${urgent.length}`;
  box.classList.toggle("has-late", urgent.some(t => t.urgency === "late"));
  list.innerHTML = urgent.slice(0, MAX_IN_CARD).map(t => todoItemHtml(t)).join("");
  bindTodoList(list, urgent);
  const all = document.getElementById("todo-alert-all");
  all.textContent = urgent.length > MAX_IN_CARD
    ? `+ ${urgent.length - MAX_IN_CARD} autre${urgent.length - MAX_IN_CARD > 1 ? "s" : ""} · tout voir dans Préparatifs →`
    : "Tout voir dans Préparatifs →";
  box.hidden = false;
  syncBottomBanners();
}

export function initTodoAlerts(){
  document.getElementById("todo-alert-later")?.addEventListener("click", () => {
    try { localStorage.setItem(TODO_SNOOZE_KEY, todayISO()); } catch (_) { /* ignore */ }
    renderTodoAlerts();
  });
  document.getElementById("todo-alert-all")?.addEventListener("click", () => hooks.setAppTab("prep"));
  document.addEventListener(TODOS_CHANGED, renderTodoAlerts);
  // Retour au premier plan / changement de jour : les échéances avancent
  let lastDay = todayISO();
  const refresh = () => { lastDay = todayISO(); renderTodoAlerts(); };
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
  setInterval(() => { if (todayISO() !== lastDay) refresh(); }, 60 * 1000);
  renderTodoAlerts();
}
