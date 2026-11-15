/* Convertisseur ¥ ↔ € (taux mémorisé, montants rapides). */

import { FX_KEY, FX_LIVE_KEY, FX_MANUAL_KEY } from "../../config.js";
import { FX_DEFAULT } from "../../core/data.js";
import { agoLabel, isFresh, parseFxRate } from "../../domain/live-data.js";

/** Taux du jour : deux sources gratuites sans clé (BCE via Frankfurter, puis open.er-api) ; rafraîchi au plus toutes les 3 h. */
const FX_SOURCES = ["https://api.frankfurter.dev/v1/latest?base=EUR&symbols=JPY", "https://open.er-api.com/v6/latest/EUR"];
const FX_MAX_AGE_MS = 3 * 3600000;

const readJson = (key) => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (_) { return null; } };
const isManual = () => { try { return localStorage.getItem(FX_MANUAL_KEY) === "1"; } catch (_) { return false; } };

async function fetchLiveRate(){
  for (const url of FX_SOURCES) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const rate = parseFxRate(await res.json());
      if (rate) return { rate, at: Date.now() };
    } catch (_) { /* source suivante */ }
  }
  return null;
}

/** Montants proposés en un toucher (prix courants : distributeur, repas, ticket…). */
const QUICK_YEN = [500, 1000, 3000, 5000, 10000];

export function loadFxRate(){
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
  const noteEl = document.getElementById("fx-note");
  rateEl.value = String(loadFxRate());
  function note(){
    if (!noteEl) return;
    const live = readJson(FX_LIVE_KEY);
    if (isManual()) {
      noteEl.innerHTML = `Taux saisi à la main.${live ? ` <button type="button" data-fx-live>Utiliser le taux du jour (${String(live.rate).replace(".", ",")})</button>` : ""}`;
      noteEl.querySelector("[data-fx-live]")?.addEventListener("click", () => { try { localStorage.removeItem(FX_MANUAL_KEY); } catch (_) {} applyLive(live.rate); note(); });
    } else if (live) noteEl.textContent = `Taux du jour (BCE) · mis à jour ${agoLabel(live.at, Date.now())}`;
    else noteEl.textContent = navigator.onLine ? "Taux du jour en cours de chargement…" : "Hors ligne : dernier taux connu.";
  }
  function applyLive(r){
    rateEl.value = String(r);
    saveFxRate(r);
    if (last === "eur") syncFromEur(); else syncFromYen();
  }
  async function refreshLive(force){
    const live = readJson(FX_LIVE_KEY);
    if (!force && live && isFresh(live.at, Date.now(), FX_MAX_AGE_MS)) { if (!isManual()) applyLive(live.rate); note(); return; }
    if (!navigator.onLine) { note(); return; }
    const got = await fetchLiveRate();
    if (got) {
      try { localStorage.setItem(FX_LIVE_KEY, JSON.stringify(got)); } catch (_) { /* pas de stockage */ }
      if (!isManual()) applyLive(got.rate);
    }
    note();
  }
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
    if (Number.isFinite(n) && n > 0) { saveFxRate(n); try { localStorage.setItem(FX_MANUAL_KEY, "1"); } catch (_) {} note(); }
    if (last === "eur") syncFromEur();
    else syncFromYen();
  });
  yenEl.addEventListener("input", () => { last = "yen"; syncFromYen(); });
  // Montants rapides : un toucher = prix courant converti
  const quick = document.getElementById("fx-quick");
  if (quick) {
    quick.innerHTML = QUICK_YEN.map(y => `<button type="button" data-yen="${y}">${y.toLocaleString("fr-FR")} ¥</button>`).join("");
    quick.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      yenEl.value = b.dataset.yen;
      last = "yen";
      syncFromYen();
      quick.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
    }));
  }
  eurEl.addEventListener("input", () => { last = "eur"; syncFromEur(); });
  // Taux du jour : au chargement, au retour dans l’app et quand le réseau revient
  note();
  refreshLive(false);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshLive(false); });
  window.addEventListener("online", () => refreshLive(false));
}
