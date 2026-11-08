/* Lecture du journal SANS jeton (page famille) : le dépôt est public, on lit les fichiers bruts de la branche du journal. */

import { sanitizeDay } from "../domain/journal.js";

const RAW = "https://raw.githubusercontent.com";

/** Journal d’un jour (null s’il n’existe pas encore). */
async function fetchDay(cfg, iso){
  try {
    const res = await fetch(`${RAW}/${cfg.repo}/${cfg.branch}/journal/days/${iso}.json`, { cache: "no-cache" });
    if (!res.ok) return null;
    return sanitizeDay(await res.json());
  } catch (_) { return null; }
}

/** Les jours `isos` qui ont un journal : [[iso, jour]]. */
export async function loadPublicJournal(cfg, isos){
  const days = await Promise.all(isos.map(async (iso) => [iso, await fetchDay(cfg, iso)]));
  return days.filter(([, d]) => d && Object.keys(d.items).length);
}

/** Adresse d’une photo du dépôt (miniature ou taille réduite). */
export const publicPhotoUrl = (cfg, iso, name) => `${RAW}/${cfg.repo}/${cfg.branch}/journal/photos/${iso}/${name}`;
