/* Sur place › Dépenses : saisie rapide en ¥ par catégorie, total du jour (¥ / €), budget quotidien,
   récapitulatif du voyage. Tout reste sur le téléphone (localStorage). */

import { EXPENSE_BUDGET_KEY, EXPENSES_KEY } from "../../config.js";
import { japanTodayISO } from "../../core/dates.js";
import { esc } from "../../core/dom.js";
import { expenseTotals, formatEur, formatYen } from "../../domain/expenses.js";
import { loadFxRate } from "./fx-converter.js";

export const EXPENSE_CATS = [
  { id: "food", label: "Repas", icon: "🍜" },
  { id: "transport", label: "Transport", icon: "🚃" },
  { id: "activity", label: "Visites", icon: "🎟️" },
  { id: "shop", label: "Shopping", icon: "🛍️" },
  { id: "other", label: "Autre", icon: "💴" }
];
const catOf = (id) => EXPENSE_CATS.find(c => c.id === id) || EXPENSE_CATS[EXPENSE_CATS.length - 1];

let currentCat = "food";

export function loadExpenses(){
  try { const v = JSON.parse(localStorage.getItem(EXPENSES_KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (_) { return []; }
}

function saveExpenses(list){
  try { localStorage.setItem(EXPENSES_KEY, JSON.stringify(list)); } catch (_) { /* quota */ }
}

function loadBudget(){
  try { const n = Number(localStorage.getItem(EXPENSE_BUDGET_KEY)); return Number.isFinite(n) && n > 0 ? n : null; } catch (_) { return null; }
}

function saveBudget(n){
  try {
    if (n) localStorage.setItem(EXPENSE_BUDGET_KEY, String(n));
    else localStorage.removeItem(EXPENSE_BUDGET_KEY);
  } catch (_) { /* quota */ }
}

/** Récapitulatif pour l’impression / PDF ("" s’il n’y a rien). */
export function expensesPrintHtml(){
  const t = expenseTotals(loadExpenses(), japanTodayISO());
  if (!t.totalYen) return "";
  const fx = loadFxRate();
  return `<h2>Dépenses sur place</h2><p>Total ${formatYen(t.totalYen)} (≈ ${formatEur(t.totalYen, fx)}) · ` +
    `${t.days} jour${t.days > 1 ? "s" : ""} · moyenne ${formatYen(t.avgYen)} / jour</p><ul>` +
    EXPENSE_CATS.filter(c => t.byCat[c.id]).map(c => `<li>${esc(c.label)} : ${formatYen(t.byCat[c.id])}</li>`).join("") + `</ul>`;
}

function render(){
  const body = document.getElementById("exp-body");
  if (!body) return;
  const fx = loadFxRate();
  const t = expenseTotals(loadExpenses(), japanTodayISO());
  const budget = loadBudget();
  const pct = budget ? Math.min(100, Math.round(100 * t.todayYen / budget)) : 0;
  const over = budget && t.todayYen > budget;
  let html = `<div class="exp-today">` +
    `<div class="exp-today-num"><strong>${formatYen(t.todayYen)}</strong><span>≈ ${formatEur(t.todayYen, fx)} aujourd’hui</span></div>` +
    (budget
      ? `<div class="exp-budget${over ? " over" : ""}"><div class="pp-bar"><i style="width:${pct}%"></i></div>` +
        `<button type="button" class="exp-budget-btn" id="exp-budget-btn">${over ? "Budget dépassé" : `Reste ${formatYen(budget - t.todayYen)}`} · budget ${formatYen(budget)} / jour</button></div>`
      : `<button type="button" class="exp-budget-btn" id="exp-budget-btn">＋ Définir un budget par jour</button>`) +
    `</div>`;
  if (t.todayList.length) {
    html += `<ul class="exp-list">` + t.todayList.slice().reverse().map(e => {
      const c = catOf(e.cat);
      return `<li><span class="exp-ico" aria-hidden="true">${c.icon}</span>` +
        `<span class="exp-what"><strong>${esc(e.note || c.label)}</strong>${e.note ? `<small>${esc(c.label)}</small>` : ""}</span>` +
        `<span class="exp-amt">${formatYen(e.yen)}</span>` +
        `<button type="button" class="exp-del" data-del="${esc(String(e.id))}" aria-label="Supprimer">×</button></li>`;
    }).join("") + `</ul>`;
  }
  if (t.totalYen) {
    const max = Math.max(...EXPENSE_CATS.map(c => t.byCat[c.id] || 0));
    html += `<details class="exp-trip"><summary>Tout le voyage · <strong>${formatYen(t.totalYen)}</strong> <span>≈ ${formatEur(t.totalYen, fx)}</span></summary>` +
      `<p class="exp-avg">${t.days} jour${t.days > 1 ? "s" : ""} · moyenne ${formatYen(t.avgYen)} / jour (≈ ${formatEur(t.avgYen, fx)})</p>` +
      `<div class="exp-cats-sum">` + EXPENSE_CATS.filter(c => t.byCat[c.id]).map(c =>
        `<div class="exp-row"><span>${c.icon} ${esc(c.label)}</span><div class="exp-bar"><i style="width:${Math.round(100 * t.byCat[c.id] / max)}%"></i></div><b>${formatYen(t.byCat[c.id])}</b></div>`
      ).join("") + `</div></details>`;
  }
  body.innerHTML = html;
  body.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => {
    saveExpenses(loadExpenses().filter(e => String(e.id) !== b.dataset.del));
    render();
  }));
  document.getElementById("exp-budget-btn")?.addEventListener("click", () => {
    const v = prompt("Budget par jour en yens (vide = aucun) :", budget ? String(budget) : "10000");
    if (v == null) return;
    const n = Math.round(Number(String(v).replace(/[^\d]/g, "")));
    saveBudget(n > 0 ? n : null);
    render();
  });
}

/** Branche le formulaire (une seule fois) et affiche les totaux. */
export function renderExpenses(){
  const form = document.getElementById("exp-form");
  if (form && !form.dataset.bound) {
    form.dataset.bound = "1";
    const cats = document.getElementById("exp-cats");
    if (cats) {
      cats.innerHTML = EXPENSE_CATS.map(c =>
        `<button type="button" role="radio" data-cat="${c.id}" aria-checked="${c.id === currentCat}"><span aria-hidden="true">${c.icon}</span>${esc(c.label)}</button>`).join("");
      cats.querySelectorAll("[data-cat]").forEach(b => b.addEventListener("click", () => {
        currentCat = b.dataset.cat;
        cats.querySelectorAll("[data-cat]").forEach(x => x.setAttribute("aria-checked", String(x === b)));
      }));
    }
    form.addEventListener("submit", e => {
      e.preventDefault();
      const amount = document.getElementById("exp-amount");
      const note = document.getElementById("exp-note");
      const yen = Math.round(Number(amount.value));
      if (!Number.isFinite(yen) || yen <= 0) { amount.focus(); return; }
      const list = loadExpenses();
      list.push({ id: Date.now(), iso: japanTodayISO(), yen, cat: currentCat, note: (note.value || "").trim().slice(0, 40) || undefined });
      saveExpenses(list);
      amount.value = "";
      note.value = "";
      amount.blur();
      render();
    });
  }
  render();
}
