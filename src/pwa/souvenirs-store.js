/* Souvenirs : achats, devise saisie et dernier acheteur, gardés sur cet appareil (localStorage). Rien n’est envoyé nulle part. */

import { SOUVENIRS_KEY } from "../config.js";

let state = null;

const fresh = () => ({ items: [], currency: "yen", who: "", refunds: {} });

function sane(it){
  return it && typeof it.id === "string" && Number.isFinite(it.eur) && Number.isFinite(it.yen) && typeof it.carrier === "string";
}

/** Remboursements de détaxe reçus : { clé magasin|jour: ¥ } ; les valeurs invalides sont ignorées. */
function cleanRefunds(r){
  const out = {};
  if (r && typeof r === "object") Object.keys(r).forEach((k) => { const n = Number(r[k]); if (Number.isFinite(n) && n > 0) out[k] = Math.round(n); });
  return out;
}

export function loadSouvenirs(){
  if (state) return state;
  state = fresh();
  try {
    const raw = JSON.parse(localStorage.getItem(SOUVENIRS_KEY) || "null");
    if (raw && Array.isArray(raw.items)) {
      state = { items: raw.items.filter(sane), currency: raw.currency === "eur" ? "eur" : "yen", who: typeof raw.who === "string" ? raw.who : "", refunds: cleanRefunds(raw.refunds) };
    }
  } catch (_) { /* stockage illisible : on repart de zéro */ }
  return state;
}

/** Remplace l’état (setter du module propriétaire) et l’enregistre. */
export function saveSouvenirs(next){
  state = { ...loadSouvenirs(), ...next };
  try { localStorage.setItem(SOUVENIRS_KEY, JSON.stringify(state)); } catch (_) { /* pas de stockage */ }
  return state;
}
