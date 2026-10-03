/* Commandes de la carte (zoom, nord, 2D/3D, accueil), clavier, redimensionnement. */

import { onMapContainerResize } from "../map/controller.js";
import { COUNTRY_PITCH, map, mapMode } from "../map/map-view.js";
import { closeDetailSheet, closePanel } from "./panels/panel.js";

/** Boutons flottants de la carte, Échap, redimensionnement, reprise d’animation. */
export function initMapControls() {
  document.getElementById("z-home").onclick = () => closePanel(true);
  document.getElementById("z-in").onclick = () => { if (map) map.zoomIn(); };
  document.getElementById("z-out").onclick = () => { if (map) map.zoomOut(); };
  document.getElementById("z-north").onclick = () => {
    if (!map) return;
    map.easeTo({ bearing: 0, duration: 500 });
  };
  document.getElementById("z-3d").onclick = () => {
    if (!map || mapMode !== "country") return;
    const flat = map.getPitch() < 10;
    map.easeTo({ pitch: flat ? COUNTRY_PITCH : 0, bearing: flat ? map.getBearing() : 0, duration: 700 });
  };
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !closeDetailSheet()) closePanel(true);
  });
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(onMapContainerResize, 120);
  });
}
