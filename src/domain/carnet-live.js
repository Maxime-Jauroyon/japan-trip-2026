/* Carnet « pour la famille » : où en est le voyage, dernier moment, nouveautés depuis la dernière visite. Pur : pas de DOM. */

const DAY_MS = 86400000;
const dayNumber = (iso) => Math.floor(Date.parse(iso + "T12:00:00Z") / DAY_MS);

/**
 * Avancement du voyage. `days` = [{ n, iso, city }] dans l’ordre ; `todayISO` = date du jour au Japon.
 * → { status: "before" | "during" | "after", n, total, pct, cityId, until }  (n = jour en cours, borné aux jours du voyage)
 */
export function tripProgress(days, todayISO){
  const list = (days || []).filter((d) => d && d.iso);
  const total = list.length;
  if (!total) return { status: "before", n: 0, total: 0, pct: 0, cityId: null, until: 0 };
  if (todayISO < list[0].iso) return { status: "before", n: 0, total, pct: 0, cityId: list[0].city, until: dayNumber(list[0].iso) - dayNumber(todayISO) };
  const last = list[total - 1];
  if (todayISO > last.iso) return { status: "after", n: last.n, total, pct: 100, cityId: last.city, until: 0 };
  const cur = list.find((d) => d.iso === todayISO) || list.filter((d) => d.iso <= todayISO).pop();
  return { status: "during", n: cur.n, total, pct: Math.round((100 * cur.n) / total), cityId: cur.city, until: 0 };
}

/** Étapes (villes) du voyage dans l’ordre : [{ cityId, first, state: "done" | "now" | "next" }] ; `todayN` = jour en cours (0 = pas commencé). */
export function routeSteps(days, todayN){
  const out = [];
  (days || []).forEach((d) => { if (!out.length || out[out.length - 1].cityId !== d.city) out.push({ cityId: d.city, first: d.n, last: d.n }); else out[out.length - 1].last = d.n; });
  return out.map((s) => ({ cityId: s.cityId, first: s.first, state: todayN > s.last ? "done" : todayN >= s.first ? "now" : "next" }));
}

/** Dernier moment vécu : { iso, id, title, when } parmi les jours du Carnet (`days` = [{ iso, items: [{ id, title, when }] }]), ou null. */
export function lastMoment(days){
  let best = null;
  (days || []).forEach((x) => (x.items || []).forEach((it) => {
    if (!best || it.when > best.when || (it.when === best.when && x.iso > best.iso)) best = { iso: x.iso, id: it.id, title: it.title, when: it.when };
  }));
  return best;
}

/** Moments ajoutés ou modifiés depuis `seenAt` (ms) : { moments, photos, first: « iso|id » du plus ancien nouveau, keys }. `seenAt` vide = rien de nouveau. */
export function newSince(days, seenAt){
  const out = { moments: 0, photos: 0, first: null, keys: new Set() };
  if (!Number.isFinite(seenAt) || seenAt <= 0) return out;
  const news = [];
  (days || []).forEach((x) => (x.items || []).forEach((it) => { if ((it.at || 0) > seenAt) news.push({ key: x.iso + "|" + it.id, iso: x.iso, when: it.when || 0, n: (it.photos || []).length }); }));
  news.sort((a, b) => a.iso.localeCompare(b.iso) || a.when - b.when);
  news.forEach((n) => { out.moments++; out.photos += n.n; out.keys.add(n.key); });
  out.first = news.length ? news[0].key : null;
  return out;
}

/** Repère de lecture d’un jour : « Aujourd’hui », « Hier » ou « ». */
export function dayTag(iso, todayISO){
  const d = dayNumber(todayISO) - dayNumber(iso);
  return d === 0 ? "Aujourd’hui" : d === 1 ? "Hier" : "";
}
