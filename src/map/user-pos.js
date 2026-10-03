/* Ma position sur la carte : point bleu + halo de précision (bouton 📍, géré par ui/my-position.js). */

import { cameraMove, map, mapViewportInsets } from "./map-view.js";

let marker = null;
let halo = null;

/** Rayon du halo (px) pour une précision `acc` (m) au zoom courant. */
function haloPx(lat, acc){
  if (!map) return 0;
  const mPerPx = 156543.03 * Math.cos(lat * Math.PI / 180) / Math.pow(2, map.getZoom());
  return Math.min(160, Math.max(14, acc / mPerPx));
}

function syncHalo(){
  if (!marker || !halo) return;
  const { lat } = marker.getLngLat();
  const d = 2 * haloPx(lat, Number(halo.dataset.acc) || 30);
  halo.style.width = halo.style.height = `${Math.round(d)}px`;
}

/** Affiche (ou déplace) le point bleu. */
export function showUserPosition(lng, lat, acc){
  if (!map || typeof maplibregl === "undefined") return;
  if (!marker) {
    const el = document.createElement("div");
    el.className = "user-pos";
    el.innerHTML = `<span class="user-pos-halo"></span><span class="user-pos-dot"></span>`;
    halo = el.querySelector(".user-pos-halo");
    marker = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([lng, lat]).addTo(map);
    map.on("zoom", syncHalo);
  } else {
    marker.setLngLat([lng, lat]);
  }
  halo.dataset.acc = String(acc || 30);
  syncHalo();
}

export function hideUserPosition(){
  if (marker) marker.remove();
  if (map) map.off("zoom", syncHalo);
  marker = null;
  halo = null;
}

/** Centre la carte sur ma position, dans la zone visible (hors panneau). */
export function flyToUser(lng, lat, zoom){
  if (!map) return;
  cameraMove({ center: [lng, lat], zoom: zoom || Math.max(map.getZoom(), 14.5), pitch: 0, bearing: 0, padding: mapViewportInsets() });
}
