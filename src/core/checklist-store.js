/* Cases cochées des préparatifs (localStorage, par appareil). */

import { CHECK_KEY } from "../config.js";
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
