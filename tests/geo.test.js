import { test } from "node:test";
import assert from "node:assert/strict";
import { boundsOfCoords, mercX, mercY, routePartCoords, smoothstep, toWorld, unmercY } from "../src/map/geo.js";

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test("Mercator : aller-retour latitude", () => {
  for (const lat of [-60, 0, 34.69, 35.68, 70]) close(unmercY(mercY(lat)), lat);
  close(mercX(-180), 0);
  close(mercX(180), 1);
  const w = toWorld({ lat: 35.0116, lng: 135.7681 });
  close(w.x * 360 - 180, 135.7681);
  close(unmercY(w.y), 35.0116);
});

test("un trajet commence et finit sur ses extrémités", () => {
  const from = { lat: 35.6915, lng: 139.6995 }, to = { lat: 35.4983, lng: 138.7685 };
  for (const spec of [
    { from, to },
    { from, to, curveSide: "south", curveAmt: 0.085 },
    { from, to, via: [{ lat: 35.6, lng: 139.2 }, { lat: 35.55, lng: 139.0 }] }
  ]) {
    const pts = routePartCoords(spec);
    assert.ok(pts.length > 10);
    close(pts[0][0], from.lng, 1e-6); close(pts[0][1], from.lat, 1e-6);
    close(pts.at(-1)[0], to.lng, 1e-6); close(pts.at(-1)[1], to.lat, 1e-6);
  }
  assert.deepEqual(routePartCoords({ from, to: null }), []);
});

test("emprise et smoothstep", () => {
  assert.deepEqual(boundsOfCoords([[1, 2], [3, -1], [0, 5]]), [[0, -1], [3, 5]]);
  assert.equal(boundsOfCoords([]), null);
  assert.equal(smoothstep(0, 1, -1), 0);
  assert.equal(smoothstep(0, 1, 2), 1);
  close(smoothstep(0, 1, 0.5), 0.5);
});
