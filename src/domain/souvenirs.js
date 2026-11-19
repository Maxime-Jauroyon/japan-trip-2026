/* Souvenirs : franchise douanière (par porteur) et seuil de détaxe Japon (par magasin et par jour). Pur : pas de DOM, pas de stockage. */

/** Nombre saisi (virgule ou point décimal) → nombre ≥ 0, ou null si invalide / vide. */
export function parseAmount(text){
  const n = Number(String(text == null ? "" : text).trim().replace(/\s/g, "").replace(",", "."));
  return String(text == null ? "" : text).trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
}

/** Montant saisi en ¥ ou en € → { eur, yen } (taux = ¥ pour 1 €) ; la devise saisie reste exacte, l’autre est arrondie. */
export function toBoth(value, currency, rate){
  if (!Number.isFinite(value) || !(rate > 0)) return null;
  if (currency === "yen") return { yen: Math.round(value), eur: Math.round(value / rate * 100) / 100 };
  return { eur: Math.round(value * 100) / 100, yen: Math.round(value * rate) };
}

/** Ajoute un achat (liste immuable). `item` : { id, label, store, day, who, carrier, eur, yen, entered }. */
export function addItem(items, item){
  return [item, ...items];
}

export function removeItem(items, id){
  return items.filter((it) => it.id !== id);
}

/** Change qui rapporte l’achat en France (seul le porteur compte pour sa franchise). */
export function setCarrier(items, id, person){
  return items.map((it) => (it.id === id ? { ...it, carrier: person } : it));
}

/** Clé magasin + jour d’un achat (sans magasin : null), la même que pour la détaxe. */
export function groupKey(it){
  const store = (it.store || "").trim();
  return store ? `${it.day}|${store.toLowerCase()}` : null;
}

/** Répartit les remboursements de détaxe reçus (¥ par clé magasin/jour) entre les achats détaxables du groupe, au prorata de leur prix en ¥ ; plafonné au total du groupe. Retourne { idAchat: ¥ remboursés }. */
export function allocateRefunds(items, refundsYen){
  const out = {};
  const groups = new Map();
  items.forEach((it) => {
    const k = groupKey(it);
    if (!k || it.noTax) return;
    const g = groups.get(k) || { yen: 0, its: [] };
    g.yen += it.yen; g.its.push(it); groups.set(k, g);
  });
  groups.forEach((g, k) => {
    const r = Math.min(Math.max(Number(refundsYen && refundsYen[k]) || 0, 0), g.yen);
    if (!r || !(g.yen > 0)) return;
    g.its.forEach((it) => { out[it.id] = r * it.yen / g.yen; });
  });
  return out;
}

/** Achats avec la détaxe déduite : refundYen, refundEur (au taux de l’achat) et netEur = valeur à déclarer. */
export function netItems(items, refundsYen){
  const alloc = allocateRefunds(items, refundsYen);
  return items.map((it) => {
    const refundYen = alloc[it.id] || 0;
    const refundEur = it.yen > 0 ? it.eur * refundYen / it.yen : 0;
    return { ...it, refundYen, refundEur, netEur: it.eur - refundEur };
  });
}

/** Totaux par porteur : `eur` = valeur à déclarer (après détaxe reçue), `gross` = prix payé, `refund` = détaxe reçue (€), plus le nombre d’achats « dans la valise de l’autre ». */
export function totalsByPerson(items, personnes, refundsYen = {}){
  const out = {};
  personnes.forEach((p) => { out[p] = { eur: 0, gross: 0, refund: 0, count: 0, away: 0 }; });
  netItems(items, refundsYen).forEach((it) => {
    const c = out[it.carrier];
    if (c) { c.eur += it.netEur; c.gross += it.eur; c.refund += it.refundEur; c.count += 1; }
    const b = out[it.who];
    if (b && it.carrier !== it.who) b.away += 1;
  });
  const r2 = (n) => Math.round(n * 100) / 100;
  personnes.forEach((p) => { out[p].eur = r2(out[p].eur); out[p].gross = r2(out[p].gross); out[p].refund = r2(out[p].refund); });
  return out;
}

/** Ce qu’il reste avant la franchise (négatif = dépassement). */
export function remaining(total, franchise){
  return Math.round((franchise - total) * 100) / 100;
}

/** ok < 80 % · warn de 80 % à 100 % · over au-delà de la franchise. */
export function level(total, franchise){
  if (total > franchise) return "over";
  return total >= franchise * 0.8 ? "warn" : "ok";
}

/** Retire (on = true) ou rétablit la détaxe des achats `ids` (magasin qui n’a pas fait la démarche) ; la franchise n’est pas touchée. */
export function setNoTax(items, ids, on){
  const set = new Set(ids);
  return items.map((it) => {
    if (!set.has(it.id)) return it;
    const { noTax, ...rest } = it;
    return on ? { ...rest, noTax: true } : rest;
  });
}

/** Achats regroupés par magasin et par jour (sans magasin : pas de regroupement) : total en ¥ des achats détaxables, écart au minimum, `removed` si la détaxe est retirée pour tout le groupe. */
export function detaxeByStore(items, minYen){
  const groups = new Map();
  items.forEach((it) => {
    const store = (it.store || "").trim();
    if (!store) return;
    const key = groupKey(it);
    const g = groups.get(key) || { key, store, day: it.day, yen: 0, count: 0, ids: [], active: 0 };
    if (!it.noTax) { g.yen += it.yen; g.active += 1; }
    g.count += 1;
    g.ids.push(it.id);
    groups.set(key, g);
  });
  return [...groups.values()]
    .map((g) => ({ ...g, removed: g.active === 0, ok: g.active > 0 && g.yen >= minYen, missing: Math.max(0, minYen - g.yen) }))
    .sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : a.store.localeCompare(b.store, "fr")));
}
