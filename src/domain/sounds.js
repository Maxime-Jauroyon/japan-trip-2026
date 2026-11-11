/* Musique d’une activité (story du Carnet) : la famille se déduit du titre (règles de data/sounds.json) ;
   chaque famille a une playlist de morceaux (fichiers de audio/, avec crédit). */

import { SOUNDS } from "../core/data.js";

/** Identifiant de la famille de musique d’un titre d’activité (règle correspondante, sinon la famille par défaut), ou null. */
export function soundFamily(title){
  const t = String(title || "").toLowerCase();
  const rule = SOUNDS.rules.find(r => r.re.test(t));
  const id = rule ? rule.family : SOUNDS.fallback;
  return id && SOUNDS.families[id] ? id : null;
}

/** Famille de musique d’une activité : { id, label, volume, tracks: [{ file, title, author, license, licenseUrl, source, seconds }] } ou null. */
export function soundFor(title){
  const id = soundFamily(title);
  if (!id) return null;
  const f = SOUNDS.families[id];
  return { id, label: f.label, volume: f.volume == null ? 0.5 : f.volume, tracks: f.tracks.map(t => ({ ...t, file: "./audio/" + t.file })) };
}
