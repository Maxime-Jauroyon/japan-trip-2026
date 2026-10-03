/* Programme du voyage : jours par ville, déplacements, idées, hôtels, arrêts, points du jour. Fonctions pures. */

import { ACT_META, CITIES, DAYS, LEGS, MAP_BOUNDS } from "../core/data.js";
import { dayToISO, parseWhenSort } from "../core/dates.js";
import { journeyById, legCityId } from "./legs.js";
import { photoSlug } from "./photos.js";
import { inBounds } from "./places.js";

export function daysForCity(id){
  // Include any day that belongs to the city OR has an arrive/depart leg for it
  const map = new Map();
  DAYS.forEach(d => {
    const cityDay = d.city === id || d.extraCity === id;
    const moves = movesForCityDay(d.moves, id, cityDay);
    if (!cityDay && !moves.length) return;
    map.set(d.n, Object.assign({}, d, {
      moves,
      // Ideas only when this is actually a stay/visit day for the city
      ideas: cityDay ? d.ideas : [],
      ideasAfter: cityDay ? d.ideasAfter : []
    }));
  });
  return [...map.values()].sort((a, b) => a.n - b.n);
}

function withMoveRoles(moves, cityId){
  return (moves || []).map(m => {
    if (m.role) return Object.assign({}, m);
    const leg = m.leg ? LEGS.find(l => l.id === m.leg) : null;
    let role = "";
    if (leg){
      const toHere = legCityId(leg.to) === cityId, fromHere = legCityId(leg.from) === cityId;
      // Vol international (ex. Tokyo ↔ Paris) : les deux extrémités pointent la ville ; l’arrêt à l’étranger
      // (sans coordonnées, ex. CDG) dit si l’on part ou si l’on arrive.
      const abroad = (s) => s && (s.lat == null || s.lng == null);
      if (toHere && fromHere) role = abroad(leg.toStop) ? "départ" : "arrivée";
      else if (toHere) role = "arrivée";
      else if (fromHere) role = "départ";
    }
    return Object.assign({}, m, { role });
  });
}

function touchesCityMove(m, cityId){
  // Sans trajet (ex. correspondance dans un voyage) : ne rattache le jour à aucune ville
  if (!m.leg) return false;
  const leg = LEGS.find(l => l.id === m.leg);
  if (!leg) return false;
  return legCityId(leg.from) === cityId || legCityId(leg.to) === cityId;
}

function movesForCityDay(rawMoves, cityId, cityDay){
  rawMoves = rawMoves || [];
  if (cityDay) return withMoveRoles(rawMoves, cityId);

  const activeJourneys = new Set(
    rawMoves.filter(m => m.journey && touchesCityMove(m, cityId)).map(m => m.journey)
  );
  const out = [];
  const doneJourney = new Set();
  rawMoves.forEach(m => {
    if (m.journey && activeJourneys.has(m.journey)) {
      if (!doneJourney.has(m.journey)) {
        doneJourney.add(m.journey);
        out.push(...withMoveRoles(rawMoves.filter(x => x.journey === m.journey), cityId));
      }
    } else if (touchesCityMove(m, cityId)) {
      out.push(...withMoveRoles([m], cityId));
    }
  });
  return out;
}

export function ideasOf(d){ return [].concat(d.ideas || [], d.ideasAfter || []); }

export function ideasForCity(list, cityId){
  const b = MAP_BOUNDS[cityId];
  return (list || []).filter(a => {
    if (a.lat == null || a.lng == null) return true;
    return inBounds(b, a.lat, a.lng);
  });
}

export function placesOnMap(cityId){
  const b = MAP_BOUNDS[cityId];
  const pts = [], seen = new Set();
  DAYS.forEach(d => {
    ideasOf(d).forEach(a => {
      if (a.lat == null || a.lng == null) return;
      if (!inBounds(b, a.lat, a.lng)) return;
      const key = a.lat.toFixed(4) + "," + a.lng.toFixed(4);
      if (seen.has(key)) return;
      seen.add(key);
      pts.push(a);
    });
  });
  return pts;
}

export function hotelsOnMap(cityId){
  const c = CITIES[cityId];
  const b = MAP_BOUNDS[cityId];
  if (!c || !b) return [];
  return (c.stays || []).filter(s => {
    const h = s.hotel;
    return h && h.name && h.name !== "—" && h.lat != null && h.lng != null && inBounds(b, h.lat, h.lng);
  });
}

/** Gares / aéroports / arrêts des trajets visibles sur la carte ville */
export function stopsOnMap(cityId){
  const b = MAP_BOUNDS[cityId];
  if (!b) return [];
  const byKey = new Map();
  LEGS.forEach(leg => {
    [["from", leg.fromStop], ["to", leg.toStop]].forEach(([role, stop]) => {
      if (!stop || stop.lat == null || stop.lng == null) return;
      if (!inBounds(b, stop.lat, stop.lng)) return;
      const key = stop.lat.toFixed(4) + "," + stop.lng.toFixed(4);
      let entry = byKey.get(key);
      if (!entry) {
        entry = {
          lat: stop.lat,
          lng: stop.lng,
          name: stop.name,
          jp: stop.jp || "",
          kind: stop.kind || "Arrêt",
          title: stop.name,
          legs: []
        };
        byKey.set(key, entry);
      }
      entry.legs.push({ leg, role });
    });
  });
  return [...byKey.values()];
}

/** Jours rattachés à chaque séjour. Une ville à plusieurs séjours donne leurs plages de jours
    dans data/cities.json (`"days": { "from": 1, "to": 5 }`) ; sinon tous les jours vont au 1er séjour. */
export function stayGroups(c, days){
  const ranged = c.stays.filter(s => s.days);
  if (ranged.length){
    return ranged.map(stay => ({
      stay,
      days: days.filter(d => d.n >= (stay.days.from ?? 1) && d.n <= (stay.days.to ?? Infinity))
    }));
  }
  return [{ stay: c.stays[0], days }];
}

/** Hôtel du séjour correspondant au jour ouvert (Tokyo a 2 séjours). */
export function stayForDay(cityId, day){
  const c = CITIES[cityId];
  if (!c || !day) return null;
  const groups = stayGroups(c, daysForCity(cityId));
  for (const g of groups){
    if ((g.days || []).some(d => d.n === day.n)) return g.stay;
  }
  return (c.stays && c.stays[0]) || null;
}

export function dayPinPoints(cityId, day){
  const b = MAP_BOUNDS[cityId];
  if (!b) return [];
  const inMap = p => p && p.lat != null && inBounds(b, p.lat, p.lng);
  const isAirport = s => /aéroport|aeroport|airport|\bhnd\b|\bcdg\b/i.test(`${s.kind || ""} ${s.name || ""}`);

  const activities = [];
  ideasOf(day).forEach(a => { if (inMap(a)) activities.push(a); });

  const stops = [];
  (day.moves || []).forEach(m => {
    const leg = LEGS.find(l => l.id === m.leg);
    if (!leg) return;
    [leg.fromStop, leg.toStop].forEach(s => {
      if (!inMap(s)) return;
      if (activities.length && isAirport(s)) return;
      stops.push(s);
    });
  });

  const stay = stayForDay(cityId, day);
  const h = stay && stay.hotel;
  const hotel = inMap(h) ? [h] : [];

  // Cadrer sur le programme du jour, pas les transferts lointains (ex. Haneda le jour 1).
  if (activities.length) return [...activities, ...hotel];
  if (stops.length) return [...stops, ...hotel];
  return hotel;
}

export function stopEntryOnCity(cityId, stopRef){
  if (!cityId || !stopRef || stopRef.lat == null || stopRef.lng == null) return null;
  const b = MAP_BOUNDS[cityId];
  if (!b || !inBounds(b, stopRef.lat, stopRef.lng)) return null;
  const key = stopRef.lat.toFixed(4) + "," + stopRef.lng.toFixed(4);
  return stopsOnMap(cityId).find(s =>
    s.lat.toFixed(4) + "," + s.lng.toFixed(4) === key
  ) || null;
}

export function groupMovesByJourney(list){
  const groups = [];
  let current = null;
  (list || []).forEach(m => {
    if (m.journey) {
      if (!current || current.id !== m.journey) {
        current = { id: m.journey, title: "", meta: "", dest: "", moves: [] };
        groups.push(current);
      }
      const j = journeyById(m.journey);
      if (m.journeyTitle) current.title = m.journeyTitle;
      else if (j && j.title) current.title = j.title;
      if (m.journeyMeta) current.meta = m.journeyMeta;
      else if (j && j.meta) current.meta = j.meta;
      if (j && j.dest) current.dest = j.dest;
      current.moves.push(m);
      return;
    }
    current = null;
    groups.push({ id: null, moves: [m] });
  });
  return groups;
}

export function moveSortRange(moves){
  let min = Infinity, max = 0;
  (moves || []).forEach(m => {
    const t = parseWhenSort(m.when);
    min = Math.min(min, t);
    max = Math.max(max, t);
  });
  if (!isFinite(min)) min = 0;
  return { min, max };
}

export function luggageBeforeCheckInHint(){
  return "Demander aussi à l’hôtel s’il accepte les bagages avant le check-in.";
}

export function isEarlyArrivalBeforeCheckIn(moveRange, checkInSort){
  return moveRange.max > 0 && checkInSort != null && checkInSort > moveRange.max + 45;
}

export function isFirstDayOfStay(cityId, day){
  const stay = stayForDay(cityId, day);
  if (!stay) return false;
  const groups = stayGroups(CITIES[cityId], daysForCity(cityId));
  for (const g of groups){
    if (g.stay.id !== stay.id) continue;
    return (g.days || []).some(d => d.n === day.n) && g.days[0].n === day.n;
  }
  return false;
}

export function isLastDayOfStay(cityId, day){
  const stay = stayForDay(cityId, day);
  if (!stay) return false;
  const groups = stayGroups(CITIES[cityId], daysForCity(cityId));
  for (const g of groups){
    if (g.stay.id !== stay.id) continue;
    const ds = g.days || [];
    return ds.some(d => d.n === day.n) && ds[ds.length - 1].n === day.n;
  }
  return false;
}

export function actMetaFor(act){
  const slug = photoSlug(act);
  return (slug && ACT_META[slug]) || { hours: "Horaires variables", duration: "1–2 h" };
}

/** Dates des séjours d’une ville, pour l’étiquette de la carte : « 18–22 nov », « 8–12 nov · 27–29 nov », « 17 nov ». */
export function cityStayDates(city){
  const parse = (s) => {
    const m = String(s || "").match(/^(\d{1,2})\s+(.+)$/);
    return m ? { d: m[1], mo: m[2].trim() } : null;
  };
  return ((city && city.stays) || []).map(st => {
    const a = parse(st.from), b = parse(st.to);
    if (!a) return "";
    if (!b || (a.d === b.d && a.mo === b.mo)) return `${a.d} ${a.mo}`;
    return a.mo === b.mo ? `${a.d}–${b.d} ${b.mo}` : `${a.d} ${a.mo}–${b.d} ${b.mo}`;
  }).filter(Boolean).join(" · ");
}

/** Nombre total de nuits dans une ville (somme des séjours ; « Sans nuit » = 0). */
export function cityNights(city){
  return ((city && city.stays) || []).reduce((n, st) => {
    const m = String(st.nights || "").match(/\d+/);
    return n + (m ? Number(m[0]) : 0);
  }, 0);
}

/**
 * Jour à afficher en ouvrant le panneau d’une ville : le jour demandé s’il est dans la ville,
 * sinon aujourd’hui (pendant le voyage), sinon null (aperçu).
 */
export function defaultCityDay(days, todayISO, requestedN){
  const list = days || [];
  if (requestedN != null && list.some(d => d.n === requestedN)) return requestedN;
  const today = list.find(d => dayToISO(d) === todayISO);
  return today ? today.n : null;
}
