/* Géométrie Web Mercator : projections, courbes des trajets, emprises. Fonctions pures. */

import { arcControlGeo } from "../domain/legs.js";

/* —— Géométrie (Web Mercator, unités « monde » 0..1) —— */
export function mercX(lng){ return (lng + 180) / 360; }

export function mercY(lat){
  const s = Math.sin(lat * Math.PI / 180);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
}

export function unmercY(y){
  return Math.atan(Math.sinh((0.5 - y) * 2 * Math.PI)) * 180 / Math.PI;
}

export function toWorld(p){ return { x: mercX(p.lng), y: mercY(p.lat) }; }

function fromWorld(p){ return [p.x * 360 - 180, unmercY(p.y)]; }

function sampleQuad(a, c, b, n){
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push({ x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y });
  }
  return out;
}

function sampleCubic(p0, c1, c2, p1, n, skipFirst){
  const out = [];
  for (let i = skipFirst ? 1 : 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push({
      x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p1.x,
      y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p1.y
    });
  }
  return out;
}

/** Même tracé que l’ancienne carte (arc / Catmull-Rom), en coordonnées géographiques. */
export function routePartCoords(spec){
  const a = spec.from, b = spec.to;
  if (!a || !b || a.lat == null || b.lat == null) return [];
  if (spec.curveSide) {
    const amt = spec.curveAmt != null ? spec.curveAmt : 0.085;
    const peak = arcControlGeo(a, b, spec.curveSide, amt);
    return sampleQuad(toWorld(a), toWorld(peak), toWorld(b), 48).map(fromWorld);
  }
  const pts = [a, ...(spec.via || []), b].filter(p => p && p.lat != null).map(toWorld);
  if (pts.length < 2) return [];
  if (pts.length === 2) {
    const [p, q] = pts;
    const dx = q.x - p.x, dy = q.y - p.y;
    const len = Math.hypot(dx, dy) || 1e-9;
    const unit = 1 / 2600; /* ≈ 1 px de l’ancienne carte PNG */
    const bulge = Math.min(90 * unit, Math.max(18 * unit, len * 0.1));
    const c = { x: (p.x + q.x) / 2 + (-dy / len) * bulge, y: (p.y + q.y) / 2 + (dx / len) * bulge };
    return sampleQuad(p, c, q, 40).map(fromWorld);
  }
  const k = 6 / 0.42;
  let out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / k, y: p1.y + (p2.y - p0.y) / k };
    const c2 = { x: p2.x - (p3.x - p1.x) / k, y: p2.y - (p3.y - p1.y) / k };
    out = out.concat(sampleCubic(p1, c1, c2, p2, 18, i > 0));
  }
  return out.map(fromWorld);
}

export function boundsOfCoords(coords){
  if (!coords.length) return null;
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  coords.forEach(([lng, lat]) => {
    w = Math.min(w, lng); e = Math.max(e, lng);
    s = Math.min(s, lat); n = Math.max(n, lat);
  });
  return [[w, s], [e, n]];
}

export function smoothstep(edge0, edge1, x){
  if (edge1 === edge0) return x >= edge1 ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
