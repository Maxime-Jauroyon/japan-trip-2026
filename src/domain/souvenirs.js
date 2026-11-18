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

/** Total (€) des achats portés par chaque personne, plus le nombre d’achats « dans la valise de l’autre » (achetés par elle, portés par un autre). */
export function totalsByPerson(items, personnes){
  const out = {};
  personnes.forEach((p) => { out[p] = { eur: 0, count: 0, away: 0 }; });
  items.forEach((it) => {
    const c = out[it.carrier];
    if (c) { c.eur += it.eur; c.count += 1; }
    const b = out[it.who];
    if (b && it.carrier !== it.who) b.away += 1;
  });
  personnes.forEach((p) => { out[p].eur = Math.round(out[p].eur * 100) / 100; });
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
    const key = `${it.day}|${store.toLowerCase()}`;
    const g = groups.get(key) || { store, day: it.day, yen: 0, count: 0, ids: [], active: 0 };
    if (!it.noTax) { g.yen += it.yen; g.active += 1; }
    g.count += 1;
    g.ids.push(it.id);
    groups.set(key, g);
  });
  return [...groups.values()]
    .map((g) => ({ ...g, removed: g.active === 0, ok: g.active > 0 && g.yen >= minYen, missing: Math.max(0, minYen - g.yen) }))
    .sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : a.store.localeCompare(b.store, "fr")));
}
