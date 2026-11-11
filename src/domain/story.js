/* Règles de la story du Carnet (pures) : durées, navigation sans sortir des bornes, nouvelles tentatives de chargement. */

export const SLIDE_MS = 3000;          // une photo
export const VIDEO_MIN_MS = 3000;      // une vidéo : sa durée réelle, entre 3 s…
export const VIDEO_MAX_MS = 8000;      // … et 8 s

/** Durée d’affichage d’une diapositive : 3 s pour une photo, durée réelle (bornée) pour une vidéo dont on connaît la durée. */
export function slideDuration(video, seconds){
  if (!video || !Number.isFinite(seconds) || seconds <= 0) return SLIDE_MS;
  return Math.min(VIDEO_MAX_MS, Math.max(VIDEO_MIN_MS, Math.round(seconds * 1000)));
}

/**
 * Où aller depuis `idx` pour un déplacement `step` (+1 / −1) dans `len` diapositives :
 * { idx } (borné à la première), ou { close: true } en passant la dernière.
 */
export function stepSlide(idx, step, len){
  const next = idx + step;
  if (next >= len) return { close: true };
  return { idx: Math.max(0, next) };
}

/** Un toucher à gauche du tiers de l’écran revient en arrière, ailleurs il avance. */
export const tapStep = (x, width) => (x < width * 0.33 ? -1 : 1);

/** Un appui long (> 260 ms) est une pause, pas un changement de diapositive. */
export const isLongPress = (heldMs) => heldMs > 260;

const RETRY_MS = [1500, 4000, 9000];

/** Délai avant la nouvelle tentative n° `attempt` (0, 1, 2…) de téléchargement d’une photo, ou null quand on abandonne. */
export const retryDelay = (attempt) => (attempt >= 0 && attempt < RETRY_MS.length ? RETRY_MS[attempt] : null);
