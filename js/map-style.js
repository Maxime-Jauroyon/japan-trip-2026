/* Styles de carte MapLibre (OpenFreeMap / OpenMapTiles) — sombre & clair.
   Pas de clé API. Relief : AWS Terrarium (gratuit). */
const MAP_TILES_URL = "https://tiles.openfreemap.org/planet";
const MAP_GLYPHS_URL = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
const MAP_DEM_TILES = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
const MAP_FONT = ["Noto Sans Regular"];
const MAP_FONT_BOLD = ["Noto Sans Bold"];
const MAP_FONT_ITALIC = ["Noto Sans Italic"];

const MAP_PALETTES = {
  dark: {
    land: "#121922",
    landHi: "#161f2a",
    water: "#0b2436",
    waterLine: "#1b4561",
    wood: "#132219",
    grass: "#14211c",
    park: "#14261d",
    sand: "#1d1d19",
    ice: "#1c2530",
    residential: "#151d27",
    industrial: "#171c24",
    building: "#1d2733",
    buildingTop: "#243140",
    road: "#26313e",
    roadMinor: "#212b36",
    roadCase: "#0c1118",
    major: "#2e3846",
    motorway: "#4a3f2f",
    motorwayCase: "#1a1510",
    rail: "#3a4656",
    boundary: "#5d6b7c",
    label: "#c9d3de",
    labelMuted: "#8794a5",
    labelHalo: "#0b1016",
    city: "#ecf1f6",
    waterLabel: "#4f7896",
    peak: "#d8c39a",
    shadow: "#000000",
    highlight: "#3b4a5c",
    accent: "#e0c99a",
    hillExag: 0.42,
    sky: "#0b1220",
    horizon: "#1c2a3d",
    fog: "#0d141d"
  },
  light: {
    land: "#f2eee4",
    landHi: "#f6f2ea",
    water: "#b4d2de",
    waterLine: "#8fb9cc",
    wood: "#d3e2c0",
    grass: "#dde8cd",
    park: "#d4e6c3",
    sand: "#efe6cf",
    ice: "#f5f8fa",
    residential: "#ece6da",
    industrial: "#e7e2d8",
    building: "#e2dacb",
    buildingTop: "#ddd3c2",
    road: "#ffffff",
    roadMinor: "#fbf9f4",
    roadCase: "#dcd3c3",
    major: "#fffaf0",
    motorway: "#f4d79e",
    motorwayCase: "#d8b06a",
    rail: "#b3aa9b",
    boundary: "#a39a8c",
    label: "#3b4552",
    labelMuted: "#6c7682",
    labelHalo: "#f7f4ee",
    city: "#1f2833",
    waterLabel: "#4c7f99",
    peak: "#7a5a2c",
    shadow: "#5a4a38",
    highlight: "#ffffff",
    accent: "#8a6a30",
    hillExag: 0.32,
    sky: "#cfe3ef",
    horizon: "#f3efe6",
    fog: "#efebe2"
  }
};

/** URL servie via le cache hors ligne (protocole jtcache://, cf. offline-maps.js). */
function viaTileCache(url){
  return typeof TILE_PROTOCOL !== "undefined" ? url.replace(/^https:\/\//, TILE_PROTOCOL + "://") : url;
}

function mapPalette(theme){
  return MAP_PALETTES[theme === "light" ? "light" : "dark"];
}

const MAP_NAME = ["coalesce", ["get", "name:fr"], ["get", "name:latin"], ["get", "name_en"], ["get", "name"]];

/** Style complet construit localement : seules les tuiles viennent du réseau (ou du cache hors ligne). */
function buildMapStyle(theme){
  const p = mapPalette(theme);
  const z = (stops) => ["interpolate", ["exponential", 1.5], ["zoom"]].concat(stops);
  return {
    version: 8,
    name: "japon-" + theme,
    glyphs: viaTileCache(MAP_GLYPHS_URL),
    sources: {
      openmaptiles: { type: "vector", url: viaTileCache(MAP_TILES_URL) },
      dem: { type: "raster-dem", tiles: [viaTileCache(MAP_DEM_TILES)], encoding: "terrarium", tileSize: 256, maxzoom: 12 },
      hills: { type: "raster-dem", tiles: [viaTileCache(MAP_DEM_TILES)], encoding: "terrarium", tileSize: 256, maxzoom: 12 }
    },
    sky: {
      "sky-color": p.sky,
      "horizon-color": p.horizon,
      "fog-color": p.fog,
      "sky-horizon-blend": 0.6,
      "horizon-fog-blend": 0.6,
      "fog-ground-blend": 0.35,
      "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 4, 0.9, 9, 0.3, 12, 0]
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": p.land } },
      { id: "landcover-wood", type: "fill", source: "openmaptiles", "source-layer": "landcover",
        filter: ["==", ["get", "class"], "wood"],
        paint: { "fill-color": p.wood, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.5, 12, 0.85] } },
      { id: "landcover-grass", type: "fill", source: "openmaptiles", "source-layer": "landcover",
        filter: ["match", ["get", "class"], ["grass", "farmland", "wetland"], true, false],
        paint: { "fill-color": p.grass, "fill-opacity": 0.6 } },
      { id: "landcover-sand", type: "fill", source: "openmaptiles", "source-layer": "landcover",
        filter: ["match", ["get", "class"], ["sand", "rock"], true, false],
        paint: { "fill-color": p.sand, "fill-opacity": 0.6 } },
      { id: "landcover-ice", type: "fill", source: "openmaptiles", "source-layer": "landcover",
        filter: ["==", ["get", "class"], "ice"],
        paint: { "fill-color": p.ice, "fill-opacity": 0.8 } },
      { id: "landuse-residential", type: "fill", source: "openmaptiles", "source-layer": "landuse", minzoom: 9,
        filter: ["match", ["get", "class"], ["residential", "suburb", "neighbourhood", "commercial", "retail"], true, false],
        paint: { "fill-color": p.residential, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 9, 0, 11, 0.8] } },
      { id: "landuse-industrial", type: "fill", source: "openmaptiles", "source-layer": "landuse", minzoom: 11,
        filter: ["match", ["get", "class"], ["industrial", "railway", "garages"], true, false],
        paint: { "fill-color": p.industrial, "fill-opacity": 0.7 } },
      { id: "park", type: "fill", source: "openmaptiles", "source-layer": "park",
        paint: { "fill-color": p.park, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0.4, 12, 0.9] } },
      { id: "landuse-green", type: "fill", source: "openmaptiles", "source-layer": "landuse", minzoom: 11,
        filter: ["match", ["get", "class"], ["cemetery", "pitch", "stadium", "playground"], true, false],
        paint: { "fill-color": p.park, "fill-opacity": 0.6 } },
      { id: "hillshade", type: "hillshade", source: "hills", maxzoom: 15,
        paint: {
          "hillshade-exaggeration": ["interpolate", ["linear"], ["zoom"], 4, p.hillExag + 0.15, 10, p.hillExag, 14, p.hillExag * 0.4],
          "hillshade-shadow-color": p.shadow,
          "hillshade-highlight-color": p.highlight,
          "hillshade-accent-color": p.shadow,
          "hillshade-illumination-direction": 315
        } },
      { id: "waterway", type: "line", source: "openmaptiles", "source-layer": "waterway", minzoom: 8,
        paint: { "line-color": p.waterLine, "line-width": z([8, 0.5, 14, 2, 18, 6]) } },
      { id: "water", type: "fill", source: "openmaptiles", "source-layer": "water",
        filter: ["!=", ["get", "brunnel"], "tunnel"],
        paint: { "fill-color": p.water, "fill-antialias": true } },
      { id: "water-edge", type: "line", source: "openmaptiles", "source-layer": "water", minzoom: 4,
        paint: { "line-color": p.waterLine, "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.6, 12, 1.2], "line-opacity": 0.7 } },
      { id: "aeroway", type: "fill", source: "openmaptiles", "source-layer": "aeroway", minzoom: 11,
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "fill-color": p.industrial, "fill-opacity": 0.8 } },
      { id: "runway", type: "line", source: "openmaptiles", "source-layer": "aeroway", minzoom: 11,
        filter: ["match", ["get", "class"], ["runway", "taxiway"], true, false],
        paint: { "line-color": p.road, "line-width": z([11, 1, 16, 18]) } },
      { id: "building", type: "fill", source: "openmaptiles", "source-layer": "building", minzoom: 13,
        paint: {
          "fill-color": p.building,
          "fill-outline-color": p.buildingTop,
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0, 14.5, 0.9]
        } },
      { id: "road-minor", type: "line", source: "openmaptiles", "source-layer": "transportation", minzoom: 12,
        filter: ["match", ["get", "class"], ["minor", "service", "track"], true, false],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": p.roadMinor, "line-width": z([12, 0.5, 14, 2, 18, 12]) } },
      { id: "road-path", type: "line", source: "openmaptiles", "source-layer": "transportation", minzoom: 14,
        filter: ["match", ["get", "class"], ["path", "pedestrian"], true, false],
        paint: { "line-color": p.roadMinor, "line-width": z([14, 0.8, 18, 3]), "line-dasharray": [2, 1.5] } },
      { id: "road-major-case", type: "line", source: "openmaptiles", "source-layer": "transportation", minzoom: 10,
        filter: ["match", ["get", "class"], ["primary", "secondary", "tertiary", "trunk"], true, false],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": p.roadCase, "line-width": z([10, 1, 14, 5, 18, 22]), "line-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0, 12, 1] } },
      { id: "road-major", type: "line", source: "openmaptiles", "source-layer": "transportation", minzoom: 7,
        filter: ["match", ["get", "class"], ["primary", "secondary", "tertiary", "trunk"], true, false],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": p.major, "line-width": z([7, 0.4, 10, 0.9, 14, 3.5, 18, 18]) } },
      { id: "road-motorway-case", type: "line", source: "openmaptiles", "source-layer": "transportation", minzoom: 9,
        filter: ["==", ["get", "class"], "motorway"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": p.motorwayCase, "line-width": z([9, 1.5, 14, 6, 18, 26]), "line-opacity": ["interpolate", ["linear"], ["zoom"], 9, 0, 11, 0.9] } },
      { id: "road-motorway", type: "line", source: "openmaptiles", "source-layer": "transportation", minzoom: 5,
        filter: ["==", ["get", "class"], "motorway"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": p.motorway, "line-width": z([5, 0.4, 9, 1.1, 14, 4, 18, 20]), "line-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.5, 8, 1] } },
      { id: "rail", type: "line", source: "openmaptiles", "source-layer": "transportation", minzoom: 8,
        filter: ["all", ["match", ["get", "class"], ["rail", "transit"], true, false], ["!=", ["get", "brunnel"], "tunnel"]],
        paint: { "line-color": p.rail, "line-width": z([8, 0.5, 14, 1.6, 18, 3]), "line-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.5, 12, 0.9] } },
      { id: "rail-hatch", type: "line", source: "openmaptiles", "source-layer": "transportation", minzoom: 14,
        filter: ["all", ["==", ["get", "class"], "rail"], ["!=", ["get", "brunnel"], "tunnel"]],
        paint: { "line-color": p.rail, "line-width": z([14, 4, 18, 8]), "line-dasharray": [0.15, 2.5] } },
      { id: "boundary-state", type: "line", source: "openmaptiles", "source-layer": "boundary", minzoom: 5,
        filter: ["all", ["==", ["get", "admin_level"], 4], ["!=", ["get", "maritime"], 1]],
        paint: { "line-color": p.boundary, "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.4, 10, 1.2], "line-dasharray": [3, 2], "line-opacity": 0.45 } },
      { id: "water-name", type: "symbol", source: "openmaptiles", "source-layer": "water_name",
        filter: ["==", ["geometry-type"], "Point"],
        layout: {
          "text-field": MAP_NAME, "text-font": MAP_FONT_ITALIC,
          "text-size": ["interpolate", ["linear"], ["zoom"], 4, 11, 12, 13],
          "text-letter-spacing": 0.12, "text-max-width": 8
        },
        paint: { "text-color": p.waterLabel, "text-halo-color": p.labelHalo, "text-halo-width": 1 } },
      { id: "water-name-line", type: "symbol", source: "openmaptiles", "source-layer": "water_name",
        filter: ["==", ["geometry-type"], "LineString"],
        layout: {
          "text-field": MAP_NAME, "text-font": MAP_FONT_ITALIC, "symbol-placement": "line",
          "text-size": 12, "text-letter-spacing": 0.12
        },
        paint: { "text-color": p.waterLabel, "text-halo-color": p.labelHalo, "text-halo-width": 1 } },
      { id: "road-label", type: "symbol", source: "openmaptiles", "source-layer": "transportation_name", minzoom: 14,
        filter: ["match", ["get", "class"], ["primary", "secondary", "tertiary", "trunk", "minor"], true, false],
        layout: {
          "symbol-placement": "line", "text-field": MAP_NAME, "text-font": MAP_FONT,
          "text-size": ["interpolate", ["linear"], ["zoom"], 14, 10, 18, 13], "text-rotation-alignment": "map"
        },
        paint: { "text-color": p.labelMuted, "text-halo-color": p.labelHalo, "text-halo-width": 1.2 } },
      { id: "poi-station", type: "symbol", source: "openmaptiles", "source-layer": "poi", minzoom: 13,
        filter: ["all", ["==", ["get", "class"], "railway"], ["match", ["get", "subclass"], ["station", "halt"], true, false]],
        layout: {
          "text-field": MAP_NAME, "text-font": MAP_FONT_BOLD,
          "text-size": 11, "text-max-width": 8, "text-anchor": "top", "text-offset": [0, 0.4]
        },
        paint: { "text-color": p.labelMuted, "text-halo-color": p.labelHalo, "text-halo-width": 1.4 } },
      { id: "poi-landmark", type: "symbol", source: "openmaptiles", "source-layer": "poi", minzoom: 15,
        filter: ["all", ["<=", ["get", "rank"], 8], ["match", ["get", "class"], ["place_of_worship", "attraction", "museum", "castle", "park", "monument"], true, false]],
        layout: { "text-field": MAP_NAME, "text-font": MAP_FONT_ITALIC, "text-size": 11, "text-max-width": 8 },
        paint: { "text-color": p.labelMuted, "text-halo-color": p.labelHalo, "text-halo-width": 1.2 } },
      { id: "mountain-peak", type: "symbol", source: "openmaptiles", "source-layer": "mountain_peak", minzoom: 7,
        filter: ["all", ["has", "ele"], [">=", ["to-number", ["get", "ele"]], 2000]],
        layout: {
          "text-field": ["format", MAP_NAME, {}, ["concat", "\n", ["to-string", ["get", "ele"]], " m"], { "font-scale": 0.8 }],
          "text-font": MAP_FONT_ITALIC, "text-size": 11, "text-max-width": 10, "symbol-sort-key": ["-", 0, ["to-number", ["get", "ele"]]]
        },
        paint: { "text-color": p.peak, "text-halo-color": p.labelHalo, "text-halo-width": 1.2 } },
      { id: "place-minor", type: "symbol", source: "openmaptiles", "source-layer": "place", minzoom: 12,
        filter: ["match", ["get", "class"], ["suburb", "quarter", "neighbourhood"], true, false],
        layout: {
          "text-field": MAP_NAME, "text-font": MAP_FONT,
          "text-size": ["interpolate", ["linear"], ["zoom"], 12, 10, 16, 13],
          "text-transform": "uppercase", "text-letter-spacing": 0.08, "text-max-width": 7
        },
        paint: { "text-color": p.labelMuted, "text-halo-color": p.labelHalo, "text-halo-width": 1.2 } },
      { id: "place-town", type: "symbol", source: "openmaptiles", "source-layer": "place", minzoom: 9,
        filter: ["match", ["get", "class"], ["town", "village"], true, false],
        layout: {
          "text-field": MAP_NAME, "text-font": MAP_FONT,
          "text-size": ["interpolate", ["linear"], ["zoom"], 9, 10, 14, 14], "text-max-width": 8
        },
        paint: { "text-color": p.label, "text-halo-color": p.labelHalo, "text-halo-width": 1.3 } },
      { id: "place-city", type: "symbol", source: "openmaptiles", "source-layer": "place", minzoom: 5,
        filter: ["==", ["get", "class"], "city"],
        layout: {
          "text-field": MAP_NAME, "text-font": MAP_FONT_BOLD,
          "text-size": ["interpolate", ["linear"], ["zoom"], 5, 11, 8, 13, 12, 17],
          "text-max-width": 8, "symbol-sort-key": ["get", "rank"]
        },
        paint: { "text-color": p.city, "text-halo-color": p.labelHalo, "text-halo-width": 1.6 } }
    ]
  };
}
