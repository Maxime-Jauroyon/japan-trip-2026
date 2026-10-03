/* Dépenses sur place : totaux (fonctions pures). Une dépense = { id, iso, yen, cat, note? }. */

/**
 * Totaux pour le jour `todayIso` et pour tout le voyage.
 * Retourne { todayYen, todayList, totalYen, byCat: { cat: yen }, days, avgYen }.
 */
export function expenseTotals(list, todayIso){
  const items = (list || []).filter((e) => e && Number.isFinite(e.yen) && e.yen > 0);
  const byCat = {};
  const days = new Set();
  let totalYen = 0;
  items.forEach((e) => {
    totalYen += e.yen;
    byCat[e.cat] = (byCat[e.cat] || 0) + e.yen;
    days.add(e.iso);
  });
  const todayList = items.filter((e) => e.iso === todayIso);
  const todayYen = todayList.reduce((s, e) => s + e.yen, 0);
  return { todayYen, todayList, totalYen, byCat, days: days.size, avgYen: days.size ? Math.round(totalYen / days.size) : 0 };
}

/** « 12 300 ¥ » (espaces fines insécables). */
export function formatYen(n){
  return Math.round(n).toLocaleString("fr-FR").replace(/\s/g, " ") + " ¥";
}

/** « 66,49 € ». */
export function formatEur(yen, fx){
  const eur = fx > 0 ? yen / fx : 0;
  return eur.toLocaleString("fr-FR", { minimumFractionDigits: eur < 100 ? 2 : 0, maximumFractionDigits: eur < 100 ? 2 : 0 }) + " €";
}
