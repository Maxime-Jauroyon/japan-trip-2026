/* Lecture du journal SANS jeton (page famille) : le dépôt est public, on lit les fichiers bruts de la branche du journal. */

import { sanitizeDay } from "../domain/journal.js";

const RAW = "https://raw.githubusercontent.com";

/** Journal d’un jour : le jour, `null` s’il n’existe pas encore (404), `undefined` si la lecture a échoué (réseau, serveur). */
async function fetchDay(cfg, iso){
  try {
    const res = await fetch(`${RAW}/${cfg.repo}/${cfg.branch}/journal/days/${iso}.json`, { cache: "no-cache" });
    if (res.status === 404) return null;
    if (!res.ok) return undefined;
    return sanitizeDay(await res.json());
  } catch (_) { return undefined; }
}

/** Les jours `isos` qui ont un journal : { days: [[iso, jour]], ok } — `ok` faux si aucune lecture n’a abouti (pas de réseau). */
export async function loadPublicJournal(cfg, isos){
  const all = await Promise.all(isos.map(async (iso) => [iso, await fetchDay(cfg, iso)]));
  return { days: all.filter(([, d]) => d && Object.keys(d.items).length), ok: !isos.length || all.some(([, d]) => d !== undefined) };
}

/** Adresse d’une photo du dépôt (miniature ou taille réduite). */
export const publicPhotoUrl = (cfg, iso, name) => `${RAW}/${cfg.repo}/${cfg.branch}/journal/photos/${iso}/${name}`;
