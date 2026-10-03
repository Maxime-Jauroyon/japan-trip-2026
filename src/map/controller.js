/* Japon : 3D (relief + inclinaison). Villes : 2D, verrouillée nord.
   Une seule instance de carte : vol fluide Japon → ville.
   Contrôleur de la carte (API publique pour l’UI) : création, thème, relief,
   passage Japon 3D ↔ ville 2D, cadrage des trajets. Seul module à piloter les autres modules carte. */

import { APP_VERSION, MAP_RELIEF_KEY } from "../config.js";
import { CITIES, DAYS, LEGS } from "../core/data.js";
import { hint, mapEl, panel, stageEl } from "../core/elements.js";
import { isMobileUi } from "../core/env.js";
import { hooks } from "../core/hooks.js";
import { state } from "../core/state.js";
import { legEndPoint } from "../domain/legs.js";
import { clearCityMarkers, refreshCityMapView, renderCityPins, scheduleCityMapRefresh, updateClusters } from "./city.js";
import { addDayRouteLayers, updateDayRouteChips } from "./day-route.js";
import { buildCountry, setActiveCity, syncCountryLabels } from "./country.js";
import { boundsOfCoords } from "./geo.js";
import { buildMapStyle } from "./map-style.js";
import { warmJapanTiles } from "./offline-tiles.js";
import { COUNTRY_PITCH, JAPAN_MAX_BOUNDS, cameraMove, fitGeoBounds, fitJapanHome, map, mapMode, mapReliefEnabled, mapStyleReady, mapStyleTheme, mapViewportInsets, resolvedTheme, setMapInstance, setMapModeValue, setMapStyleReady, setMapStyleTheme, showMapFallback, syncMapControls } from "./map-view.js";
import { addTripLayers, applyRouteHighlight, legGeoCoords, setRouteHover, setRoutesVisible, hideRouteBadges, showRouteBadges } from "./routes.js";

function onMapStyleLoad(){
  setMapStyleReady(true);
  try {
    addTripLayers();
    addDayRouteLayers();
  } catch (e) { console.warn("trip layers", e); }
  applyMapModeToStyle();
  applyRouteHighlight();
}

function applyTerrain(){
  if (!map || !mapStyleReady) return;
  const want = mapMode === "country" && mapReliefEnabled();
  try {
    if (want) map.setTerrain({ source: "dem", exaggeration: 1.7 });
    else map.setTerrain(null);
  } catch (_) { /* ignore */ }
}

function applyMapModeToStyle(){
  setRoutesVisible(mapMode === "country");
  applyTerrain();
}

function setMapMode(mode){
  setMapModeValue(mode);
  stageEl.classList.toggle("mode-city", mode === "city");
  stageEl.classList.toggle("mode-country", mode === "country");
  if (!map) return;
  const country = mode === "country";
  if (country) {
    clearCityMarkers();
    map.setMaxBounds(JAPAN_MAX_BOUNDS);
    map.setMinZoom(3.6);
    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation();
    map.touchPitch.enable();
    map.keyboard.enableRotation();
    showRouteBadges();
  } else {
    map.setMaxBounds(null);
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.touchPitch.disable();
    map.keyboard.disableRotation();
    hideRouteBadges();
  }
  applyMapModeToStyle();
  syncMapControls();
  syncCountryLabels();
}

/** fitHome : recadrer sur tout le voyage (bouton ⌂, fermeture du panneau). */
export function showCountry(instant, fitHome){
  state.currentCity = null;
  document.querySelector(".app").classList.remove("city-mode");
  const banner = document.getElementById("city-banner");
  if (banner) { banner.hidden = true; banner.textContent = ""; }
  hint.textContent = "Glisser · pincer pour zoomer · 2 doigts pour incliner · toucher une ville";
  setActiveCity(null);
  const wasCity = mapMode === "city";
  setMapMode("country");
  if (wasCity || instant || fitHome) fitJapanHome(instant);
}

export function showCity(id, dayN){
  const enteringCity = state.currentCity !== id || mapMode !== "city";
  state.currentCity = id;
  if (enteringCity) state.lastFocusAct = null;
  document.querySelector(".app").classList.add("city-mode");
  const banner = document.getElementById("city-banner");
  if (banner) {
    banner.hidden = false;
    banner.textContent = CITIES[id].name;
  }
  hint.textContent = CITIES[id].name + " · pastilles = activités · train/avion = gares · valise = hôtel";
  setActiveCity(id);
  setMapMode("city");
  const day = dayN != null ? DAYS.find(d => d.n === dayN) : null;
  renderCityPins(id, day || null);
  scheduleCityMapRefresh();
}

export function focusLegEnd(leg, role, pulse){
  const end = legEndPoint(leg, role);
  if (!end) return;
  if (state.currentCity) showCountry();
  requestAnimationFrame(() => {
    cameraMove({ center: [end.lng, end.lat], zoom: Math.max(map ? map.getZoom() : 8, 9), padding: mapViewportInsets() });
    if (pulse) {
      hint.textContent = (role === "from" ? "Départ" : "Arrivée") + " · " + end.name + (end.cityId && CITIES[end.cityId] ? " · " + CITIES[end.cityId].name : "");
    }
  });
}

export function focusLegOverview(leg){
  requestAnimationFrame(() => fitGeoBounds(boundsOfCoords(legGeoCoords(leg)), 9.5));
}

export function focusJourneyOverview(legs){
  requestAnimationFrame(() => {
    let coords = [];
    legs.forEach(leg => { coords = coords.concat(legGeoCoords(leg)); });
    fitGeoBounds(boundsOfCoords(coords), 9);
  });
}

let lastMapSize = "";

export function initMap(){
  if (typeof maplibregl === "undefined" || !mapEl) {
    showMapFallback("La carte n’a pas pu se charger. Vérifie la connexion puis touche « Rafraîchir » dans Réglages.");
    return;
  }
  if (typeof maplibregl.supported === "function" && !maplibregl.supported({ failIfMajorPerformanceCaveat: false })) {
    showMapFallback("Ce navigateur ne prend pas en charge WebGL : carte interactive indisponible.");
    return;
  }
  setMapStyleTheme(resolvedTheme());
  try {
    setMapInstance(new maplibregl.Map({
      container: mapEl,
      style: buildMapStyle(mapStyleTheme),
      center: [137.6, 35.6],
      zoom: 5.2,
      pitch: 0,
      minZoom: 3.6,
      maxZoom: 18.5,
      maxPitch: 70,
      maxBounds: JAPAN_MAX_BOUNDS,
      attributionControl: false,
      dragRotate: true,
      touchPitch: true,
      fadeDuration: 180,
      localIdeographFontFamily: "'Hiragino Sans', 'Yu Gothic', 'Noto Sans JP', sans-serif",
      maxTileCacheZoomLevels: 4
    }));
  } catch (e) {
    console.warn("map init", e);
    showMapFallback("La carte interactive n’a pas pu démarrer sur cet appareil.");
    return;
  }
  map.addControl(new maplibregl.AttributionControl({
    compact: true,
    customAttribution: '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> · Relief <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">Terrain Tiles</a>'
  }), "bottom-left");
  map.on("style.load", onMapStyleLoad);
  // Ordinateur : une fois la carte affichée, mettre la vue Japon en cache en tâche de fond
  map.once("idle", () => setTimeout(() => { if (!isMobileUi()) warmJapanTiles(APP_VERSION); }, 2000));
  map.on("move", () => {
    if (mapMode === "city") {
      updateClusters();
      updateDayRouteChips();
    }
    else syncCountryLabels();
  });
  map.on("rotate", syncMapControls);
  map.on("pitch", syncMapControls);
  map.on("click", "route-hit", e => {
    const f = e.features && e.features[0];
    if (!f || mapMode !== "country") return;
    const hitLeg = LEGS.find(l => l.id === f.properties.leg);
    if (hitLeg && hitLeg.journey) hooks.openJourney(hitLeg.journey, hitLeg.id);
    else if (hitLeg) hooks.openLeg(hitLeg.id);
  });
  map.on("mousemove", "route-hit", e => {
    const f = e.features && e.features[0];
    map.getCanvas().style.cursor = "pointer";
    if (f) setRouteHover(f.id);
  });
  map.on("mouseleave", "route-hit", () => {
    map.getCanvas().style.cursor = "";
    setRouteHover(null);
  });
  map.on("error", e => {
    /* Tuiles manquantes hors ligne : ignorées (fond de carte uni). */
    if (e && e.error && !/Failed to fetch|NetworkError|AJAXError|Load failed/i.test(String(e.error.message || e.error))) {
      console.warn("map", e.error);
    }
  });
  buildCountry();
  setMapMode("country");
  lastMapSize = mapEl.clientWidth + "x" + mapEl.clientHeight;
  fitJapanHome(true);
}

/** Thème appliqué à la carte (style complet reconstruit, couches du voyage rajoutées). */
export function applyMapTheme(){
  if (!map) return;
  const t = resolvedTheme();
  if (t === mapStyleTheme) return;
  setMapStyleTheme(t);
  setMapStyleReady(false);
  map.setStyle(buildMapStyle(t), { diff: false });
}

export function setMapRelief(on){
  try { localStorage.setItem(MAP_RELIEF_KEY, on ? "1" : "0"); } catch (_) { /* ignore */ }
  applyTerrain();
  if (map && mapMode === "country") map.easeTo({ pitch: on ? COUNTRY_PITCH : 30, duration: 600 });
}

/** Taille du conteneur changée : recadrer (ville courante ou vue Japon). */
export function onMapContainerResize() {
  if (!map) return;
  map.resize();
  const size = mapEl.clientWidth + "x" + mapEl.clientHeight;
  if (size === lastMapSize) return;
  lastMapSize = size;
  if (state.currentCity) refreshCityMapView({ instant: true });
  else if (!panel.classList.contains("open")) fitJapanHome(true);
}
