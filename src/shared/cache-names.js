/* Noms des caches du navigateur : ce que « Rafraîchir l’application » peut vider, et ce qu’il doit garder. */

/** Préfixe des caches du CODE de l’app (un par version, ex. japan-trip-2026-v249) : les seuls à jeter pour récupérer une version propre. */
export const APP_CACHE_PREFIX = "japan-trip-2026-";

/**
 * Caches à supprimer pour rafraîchir l’app. Tout le reste est gardé : photos et vidéos du journal (japan-journal-v1), images du
 * site (japan-img-v1, remises à jour par empreinte), musiques (japan-audio-v1) et cartes hors ligne (japan-tiles-v1) — sinon
 * tout se retélécharge, ce qui est long et coûte des données en voyage.
 */
export const cachesToClear = (keys) => (keys || []).filter((k) => String(k).startsWith(APP_CACHE_PREFIX));
