/* Convertisseur ¥ ↔ € (taux mémorisé). */

import { FX_KEY } from "../../config.js";
import { FX_DEFAULT } from "../../core/data.js";

function loadFxRate(){
  try {
    const n = Number(localStorage.getItem(FX_KEY));
    if (Number.isFinite(n) && n > 0) return n;
  } catch (_) {}
  return FX_DEFAULT;
}

function saveFxRate(n){
  try { localStorage.setItem(FX_KEY, String(n)); } catch (_) {}
}

function formatFxYen(n){
  if (!Number.isFinite(n)) return "";
  return String(Math.round(n));
}

function formatFxEur(n){
  if (!Number.isFinite(n)) return "";
  return (Math.round(n * 100) / 100).toFixed(2);
}

export function initFxConverter(){
  const rateEl = document.getElementById("fx-rate");
  const yenEl = document.getElementById("fx-yen");
  const eurEl = document.getElementById("fx-eur");
  if (!rateEl || !yenEl || !eurEl || rateEl.dataset.bound) return;
  rateEl.dataset.bound = "1";
  let last = "yen";
  rateEl.value = String(loadFxRate());
  function rate(){
    const n = Number(rateEl.value);
    return Number.isFinite(n) && n > 0 ? n : FX_DEFAULT;
  }
  function syncFromYen(){
    const y = Number(yenEl.value);
    if (yenEl.value === "" || !Number.isFinite(y)) { eurEl.value = ""; return; }
    eurEl.value = formatFxEur(y / rate());
  }
  function syncFromEur(){
    const e = Number(eurEl.value);
    if (eurEl.value === "" || !Number.isFinite(e)) { yenEl.value = ""; return; }
    yenEl.value = formatFxYen(e * rate());
  }
  rateEl.addEventListener("input", () => {
    const n = Number(rateEl.value);
    if (Number.isFinite(n) && n > 0) saveFxRate(n);
    if (last === "eur") syncFromEur();
    else syncFromYen();
  });
  yenEl.addEventListener("input", () => { last = "yen"; syncFromYen(); });
  eurEl.addEventListener("input", () => { last = "eur"; syncFromEur(); });
}
