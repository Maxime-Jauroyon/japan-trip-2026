/* Lieux : emprises des villes, quartiers (zones), ville d’un point. */

import { CITY_ZONES, MAP_BOUNDS, ORDER } from "../core/data.js";

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

/* —— Zones de quartier —— */
export function pointInZone(lat, lng, z){
  return lng >= z.west && lng <= z.east && lat >= z.south && lat <= z.north;
}

export function zonesForCity(id){
  return CITY_ZONES[id] || [];
}

export function zoneForPoint(cityId, lat, lng){
  return zonesForCity(cityId).find(z => pointInZone(lat, lng, z)) || null;
}

export function zoneCenter(z){
  return { lat: (z.south + z.north) / 2, lng: (z.west + z.east) / 2 };
}

export function cityIdForCoords(lat, lng){
  if (lat == null || lng == null) return null;
  for (const id of ORDER){
    if (inBounds(MAP_BOUNDS[id], lat, lng)) return id;
  }
  return null;
}
