/* Données « en direct » (taux de change, météo) : lecture des réponses et fraîcheur. Pur : pas de réseau, pas de DOM. */

/** Taux « yens pour 1 euro » d’après la réponse d’une API de change (Frankfurter ou open.er-api), ou null. */
export function parseFxRate(json){
  const rate = Number(json && json.rates && json.rates.JPY);
  if (json && json.result && json.result !== "success") return null;
  return Number.isFinite(rate) && rate >= 50 && rate <= 400 ? Math.round(rate * 100) / 100 : null;
}

/** Vrai si une donnée prise à l’instant `at` (ms) a moins de `maxAgeMs` à l’instant `now`. */
export function isFresh(at, now, maxAgeMs){
  return Number.isFinite(at) && at > 0 && now - at >= 0 && now - at < maxAgeMs;
}

/** « il y a 5 min », « il y a 2 h », « à l’instant » : ancienneté lisible d’une donnée. */
export function agoLabel(at, now){
  const min = Math.max(0, Math.round((now - at) / 60000));
  if (min < 2) return "à l’instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `il y a ${h} h` : `il y a ${Math.round(h / 24)} j`;
}
