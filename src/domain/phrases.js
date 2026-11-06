/* Phrases du quotidien : choix de la période de la journée (fonctions pures). */

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + (m || 0);
};

/**
 * Période en cours pour `hhmm` (« 14:05 ») parmi `periods` ({ from: "HH:MM", … }, triées par heure croissante).
 * Avant la première heure, on est encore dans la dernière période (la nuit se prolonge après minuit).
 */
export function periodAt(periods, hhmm){
  if (!periods || !periods.length) return null;
  const t = toMinutes(hhmm);
  let cur = periods[periods.length - 1];
  periods.forEach((p) => { if (toMinutes(p.from) <= t) cur = p; });
  return cur;
}
