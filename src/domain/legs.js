/* Trajets : découpage en segments carte, type de véhicule, extrémités, trajets groupés (journeys). */

import { CITIES, DAYS, JOURNEYS, LEGS } from "../core/data.js";
import { cityIdForCoords } from "./places.js";

export function legVehicleKind(mode){
  const m = (mode || "").toLowerCase();
  if (/avion|flight|plane|^air\b/.test(m)) return "plane";
  if (/shinkansen/.test(m)) return "shinkansen";
  if (/bus/.test(m)) return "bus";
  if (/train|hida|kintetsu|rail/.test(m)) return "train";
  return "train";
}

export function legRouteParts(leg){
  if (leg.mapSegments && leg.mapSegments.length) {
    return leg.mapSegments.map((seg, i) => ({
      pathId: leg.id + "-" + (seg.key || i),
      legId: leg.id,
      mode: seg.mode || leg.mode,
      from: seg.from,
      to: seg.to,
      via: seg.via || [],
      curveSide: seg.curveSide || "",
      curveAmt: seg.curveAmt
    }));
  }
  return [{
    pathId: leg.id,
    legId: leg.id,
    mode: leg.mode,
    from: leg.from,
    to: leg.to,
    via: leg.via || [],
    curveSide: leg.curveSide || "",
    curveAmt: leg.curveAmt
  }];
}

/** Map-fixed bow: north = higher lat, south = lower lat (same side both travel directions). */
export function arcControlGeo(a, b, side, amount){
  const midLat = (a.lat + b.lat) / 2;
  const midLng = (a.lng + b.lng) / 2;
  if (side === "north") return { lat: midLat + amount, lng: midLng };
  if (side === "south") return { lat: midLat - amount, lng: midLng };
  return { lat: midLat, lng: midLng };
}

export function journeyById(id){
  return JOURNEYS[id] || null;
}

export function legsInJourney(journeyId){
  const j = journeyById(journeyId);
  if (j && j.legs && j.legs.length) {
    return j.legs.map(lid => LEGS.find(l => l.id === lid)).filter(Boolean);
  }
  return LEGS.filter(l => l.journey === journeyId);
}

export function dayMovesForJourney(journeyId){
  const j = journeyById(journeyId);
  const day = j && j.day != null ? DAYS.find(d => d.n === j.day) : null;
  if (!day) return [];
  return (day.moves || []).filter(m => m.journey === journeyId);
}

export function legCityId(point){
  if (!point) return null;
  if (point.id) return point.id;
  // Flights use raw lat/lng for airports — treat as no city
  return null;
}

export function stopLabel(s){
  if (!s) return "—";
  return s.name || "—";
}

export function legEndPoint(leg, role){
  if (!leg) return null;
  const stop = role === "from" ? leg.fromStop : leg.toStop;
  const fallback = role === "from" ? leg.from : leg.to;
  const lat = (stop && stop.lat != null) ? stop.lat : (fallback && fallback.lat);
  const lng = (stop && stop.lng != null) ? stop.lng : (fallback && fallback.lng);
  if (lat == null || lng == null) return null;
  const cityId = (fallback && fallback.id) || cityIdForCoords(lat, lng);
  return {
    role,
    lat,
    lng,
    name: (stop && stop.name) || (cityId && CITIES[cityId] ? CITIES[cityId].name : "Point"),
    jp: (stop && stop.jp) || "",
    kind: (stop && stop.kind) || "",
    cityId
  };
}
