/* Règles pures de la musique de la story : fondus enchaînés à puissance égale, enchaînement des morceaux d’une famille,
   familles à précharger. Aucune dépendance au navigateur (testé dans tests/music.test.js). */

export const FADE_FAMILY_S = 2.5;   // changement d’activité (autre famille de musique)
export const FADE_TRACK_S = 4;      // d’un morceau au suivant dans une même famille
export const FADE_SKIP_S = 1.5;     // bouton « morceau suivant »
export const FADE_STOP_S = 0.6;     // coupure (🔇, fermeture)

const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** Gains d’un fondu enchaîné à puissance égale à l’avancement `t` (0..1) : sortant cos, entrant sin (somme des carrés = 1). */
export function equalPowerGains(t){
  const x = clamp01(t) * Math.PI / 2;
  return { out: Math.cos(x), in: Math.sin(x) };
}

/** Gain d’une rampe { from, to, t0, dur } à l’instant `t` (secondes) : montée en sin, descente en cos ; avant le début `from`, après la fin `to`. */
export function gainAt(ramp, t){
  if (!ramp) return 0;
  const p = ramp.dur > 0 ? clamp01((t - ramp.t0) / ramp.dur) : 1;
  const x = p * Math.PI / 2;
  return ramp.to >= ramp.from ? ramp.from + (ramp.to - ramp.from) * Math.sin(x) : ramp.to + (ramp.from - ramp.to) * Math.cos(x);
}

/** Courbe de `n` points (≥ 2) pour `setValueCurveAtTime` : de `from` à `to` à puissance égale. */
export function rampCurve(from, to, n = 64){
  const len = Math.max(2, Math.floor(n));
  return Array.from({ length: len }, (_, i) => gainAt({ from, to, t0: 0, dur: 1 }, i / (len - 1)));
}

/** Morceau suivant d’une playlist de `len` morceaux (circulaire). */
export const nextTrackIndex = (i, len) => (len > 0 ? (i + 1) % len : 0);

/** Moment (secondes depuis le début du morceau) où lancer le suivant pour qu’il recouvre les `fade` dernières secondes. */
export const crossfadeStart = (duration, fade) => Math.max(0, duration - fade);

/** Faut-il un fondu enchaîné pour passer de la famille `current` à `next` ? (même famille : la musique continue). */
export const shouldCrossfade = (current, next) => !!next && current !== next;

/** Les `count` prochaines familles de musique (sans doublon, hors celle en cours) à partir de la diapositive `idx` : à précharger. */
export function familiesAhead(slides, idx, familyOf, count = 2){
  const out = [];
  const current = slides[idx] ? familyOf(slides[idx].title) : null;
  for (let k = idx + 1; k < slides.length && out.length < count; k++) {
    const f = familyOf(slides[k].title);
    if (f && f !== current && !out.includes(f)) out.push(f);
  }
  return out;
}

/** Garde au plus `max` entrées dans une table de mémoire (Map) en retirant les plus anciennes (hors `keep`). Rend les clés retirées. */
export function trimCache(map, max, keep = []){
  const dropped = [];
  for (const key of map.keys()) {
    if (map.size - dropped.length <= max) break;
    if (!keep.includes(key)) dropped.push(key);
  }
  dropped.forEach((k) => map.delete(k));
  return dropped;
}
