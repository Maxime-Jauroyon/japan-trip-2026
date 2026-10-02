/* Lieux : emprises des villes, ville d’un point. */

import { MAP_BOUNDS, ORDER } from "../core/data.js";

/** Ville dont l’emprise contient le lieu (sinon `fallback`). */
export function cityIdForAct(act, fallback){
  if (!act || act.lat == null) return fallback;
  for (const id of ORDER){
    if (inBounds(MAP_BOUNDS[id], act.lat, act.lng)) return id;
  }
  return fallback;
}

export function inBounds(b, lat, lng){
  return lng >= b.west && lng <= b.east && lat >= b.south && lat <= b.north;
}

export function cityIdForCoords(lat, lng){
  if (lat == null || lng == null) return null;
  for (const id of ORDER){
    if (inBounds(MAP_BOUNDS[id], lat, lng)) return id;
  }
  return null;
}
