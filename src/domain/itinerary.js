/* Itinéraire d’une journée dans une ville : ordre de passage (hôtel / gare → activités → hôtel / gare)
   et estimation des temps de trajet entre deux étapes. Fonctions pures. */

import { LEGS, MAP_BOUNDS } from "../core/data.js";
import { legCityId } from "./legs.js";
import { inBounds } from "./places.js";
import { ideasOf, stayForDay } from "./trip.js";

/** Au-delà, on suppose métro / train / bus plutôt qu’à pied. */
const WALK_MAX_KM = 2.2;
/** Les rues ne sont pas en ligne droite : distance réelle ≈ distance à vol d’oiseau × 1,3. */
const DETOUR = 1.3;
const WALK_KMH = 4.5;
const TRANSIT_KMH = 24;
const TRANSIT_OVERHEAD_MIN = 10;

const isAirport = (s) => /aéroport|aeroport|airport|\bhnd\b|\bcdg\b/i.test(`${s.kind || ""} ${s.name || ""}`);

/** Distance à vol d’oiseau en km (haversine). */
export function distanceKm(a, b) {
  const R = 6371;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Estimation d’un trajet entre deux étapes : { mode: "walk" | "transit", km, minutes }. */
export function segmentEstimate(a, b) {
  const km = distanceKm(a, b) * DETOUR;
  const round5 = (m) => Math.max(5, Math.round(m / 5) * 5);
  if (km <= WALK_MAX_KM) return { mode: "walk", km, minutes: round5(km / WALK_KMH * 60) };
  return { mode: "transit", km, minutes: round5(TRANSIT_OVERHEAD_MIN + km / TRANSIT_KMH * 60) };
}

/**
 * Étapes de la journée dans la ville, dans l’ordre :
 *   départ  = gare d’arrivée (jour d’arrivée) sinon l’hôtel du jour,
 *   milieu  = idées du jour situées dans la ville (ordre du programme),
 *   arrivée = gare de départ (jour de départ) sinon l’hôtel.
 * Chaque étape : { kind: "hotel" | "station" | "activity", lat, lng, title, ref, step? }.
 * Les aéroports sont ignorés quand la journée a des activités (trajet lointain, hors balade).
 */
export function dayItinerary(cityId, day) {
  const b = MAP_BOUNDS[cityId];
  if (!b || !day) return [];
  const inCity = (p) => p && p.lat != null && p.lng != null && inBounds(b, p.lat, p.lng);

  const activities = ideasOf(day).filter(inCity);
  const usable = (s) => inCity(s) && !(activities.length && isAirport(s));
  let arrival = null, departure = null;
  (day.moves || []).forEach((m) => {
    const leg = m.leg && LEGS.find((l) => l.id === m.leg);
    if (!leg) return;
    if (legCityId(leg.to) === cityId && usable(leg.toStop)) arrival = leg.toStop;
    if (legCityId(leg.from) === cityId && usable(leg.fromStop)) departure = leg.fromStop;
  });

  const stay = stayForDay(cityId, day);
  const h = stay && stay.hotel;
  const hotel = h && h.name && h.name !== "—" && inCity(h) ? h : null;

  const station = (s) => ({ kind: "station", lat: s.lat, lng: s.lng, title: s.name, ref: s });
  const hotelStop = () => ({ kind: "hotel", lat: hotel.lat, lng: hotel.lng, title: hotel.name, ref: stay });

  const out = [];
  if (arrival) out.push(station(arrival));
  else if (hotel) out.push(hotelStop());
  activities.forEach((a, i) => out.push({ kind: "activity", lat: a.lat, lng: a.lng, title: a.title, ref: a, step: i + 1 }));
  if (departure) out.push(station(departure));
  else if (hotel) out.push(hotelStop());

  // Deux étapes au même endroit (ex. hôtel → hôtel sans activité) : on n’en garde qu’une
  return out.filter((p, i) => i === 0 || Math.abs(p.lat - out[i - 1].lat) > 1e-5 || Math.abs(p.lng - out[i - 1].lng) > 1e-5);
}

/** Résumé : nombre d’activités, distance totale estimée (km), temps de déplacement (min). */
export function itinerarySummary(stops) {
  let km = 0, minutes = 0;
  for (let i = 1; i < stops.length; i++) {
    const e = segmentEstimate(stops[i - 1], stops[i]);
    km += e.km;
    minutes += e.minutes;
  }
  return { activities: stops.filter((s) => s.kind === "activity").length, km, minutes };
}

/** « 25 min », « 1 h 05 ». */
export function formatMinutes(m) {
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? " " + String(m % 60).padStart(2, "0") : ""}`;
}

/** « 2,3 km », « 12 km ». */
export function formatKm(km) {
  return (km < 10 ? km.toFixed(1).replace(".", ",") : String(Math.round(km))) + " km";
}

/** Distance courte lisible : « 850 m », « 3,2 km ». */
export function formatDistance(km) {
  return km < 1 ? `${Math.max(50, Math.round(km * 1000 / 50) * 50)} m` : formatKm(km);
}

/**
 * Prochaine étape du jour : première activité pas encore faite (titres dans `done`).
 * Retourne { index, stop, from } — `from` = étape précédente (point de départ par défaut) — ou null si tout est fait.
 */
export function nextStop(stops, done) {
  const isDone = (s) => done && done.has(s.title);
  const i = stops.findIndex((s) => s.kind === "activity" && !isDone(s));
  if (i < 0) return null;
  const prevDone = stops.slice(0, i).reverse().find((s) => s.kind !== "activity" || isDone(s));
  return { index: i, stop: stops[i], from: prevDone || stops[i - 1] || null };
}
