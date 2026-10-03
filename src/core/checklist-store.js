/* Cases cochées des préparatifs (localStorage, par appareil). */

import { CHECK_KEY, TODO_DONE_KEY } from "../config.js";
import { PREP_CHECKS } from "./data.js";

export function loadChecks(){
  try { return JSON.parse(localStorage.getItem(CHECK_KEY) || "{}"); } catch (_) { return {}; }
}

export function saveChecks(obj){
  try { localStorage.setItem(CHECK_KEY, JSON.stringify(obj)); } catch (_) {}
}

export function prepCheckState(){
  const st = loadChecks();
  let changed = false;
  PREP_CHECKS.forEach(item => {
    if (item.done && !(item.id in st)) {
      st[item.id] = true;
      changed = true;
    }
  });
  if (changed) saveChecks(st);
  return st;
}

/** Réservations de trajets marquées faites sur cet appareil (Set d’ids « trajet:lien »). */
export function loadDoneBookings(){
  try {
    const arr = JSON.parse(localStorage.getItem(TODO_DONE_KEY) || "[]");
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (_) { return new Set(); }
}

export function markBookingDone(id){
  const set = loadDoneBookings();
  set.add(id);
  try { localStorage.setItem(TODO_DONE_KEY, JSON.stringify([...set])); } catch (_) {}
}

/** Coche (ou décoche) une case de la checklist. */
export function setCheck(id, on){
  const st = loadChecks();
  st[id] = !!on;
  saveChecks(st);
}

/** Événement émis sur `document` quand une case ou une réservation change (carte « À faire », Préparatifs). */
export const TODOS_CHANGED = "japan-trip:todos-changed";

export function notifyTodosChanged(){
  document.dispatchEvent(new CustomEvent(TODOS_CHANGED));
}
