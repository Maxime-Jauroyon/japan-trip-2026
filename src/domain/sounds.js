/* Ambiance sonore d’une activité (story du Carnet) : la famille se déduit du titre (règles de data/sounds.json). */

import { SOUNDS } from "../core/data.js";

/** Identifiant de la famille d’ambiance d’un titre d’activité (règle correspondante, sinon la famille par défaut), ou null. */
export function soundFamily(title){
  const t = String(title || "").toLowerCase();
  const rule = SOUNDS.rules.find(r => r.re.test(t));
  const id = rule ? rule.family : SOUNDS.fallback;
  return id && SOUNDS.families[id] ? id : null;
}

/** Ambiance d’une activité : { id, label, file, volume, author, license } ou null. */
export function soundFor(title){
  const id = soundFamily(title);
  if (!id) return null;
  const f = SOUNDS.families[id];
  return { id, label: f.label, file: "./audio/" + f.file, volume: f.volume == null ? 0.5 : f.volume, author: f.author, license: f.license };
}
