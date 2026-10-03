/* Générateurs SVG inline : logos des villes, pins, véhicules, icônes. Aucune dépendance. */

/* —— Illustrations des villes : un monument emblématique par étape (grille 32 px, contour encre) ——
   Tokyo Tower · Fuji et soleil · lanterne Kotoji (Kenroku-en) · maison gasshō · pont Nakabashi ·
   torii de Fushimi Inari · daim de Nara · château d’Osaka. */
const CITY_INK = "#1e2834";
const CITY_ART = (o) => ({
  tokyo:
    `<path d="M5 28.2h22" stroke="${CITY_INK}" stroke-width="1.2" stroke-linecap="round"/>` +
    `<path d="M9.4 28 14.6 11.4h2.8L22.6 28h-3.7Q16 21.4 13.1 28z" fill="#e8553f" ${o}/>` +
    `<path d="M11.2 23.4h2.4M18.4 23.4h2.4M13.6 14.6h4.8" stroke="#fff" stroke-width="1.1"/>` +
    `<path d="M12 17h8l.6 2.1h-9.2z" fill="#fff" ${o}/>` +
    `<path d="M14.1 10h3.8l.4 1.7h-4.6z" fill="#fff" ${o}/>` +
    `<path d="M15.1 10 16 2.4l.9 7.6z" fill="#e8553f" ${o}/>`,
  fuji:
    `<circle cx="23.6" cy="8.6" r="3.6" fill="#e8553f" ${o}/>` +
    `<path d="M2.8 25.6 12.4 11.4Q16 9.4 19.6 11.4L29.2 25.6z" fill="#4f7fc4" ${o}/>` +
    `<path d="M12.4 11.4Q16 9.4 19.6 11.4L22.3 15.3 19.9 14.2 18 15.9 16 14.4 14 15.9 12.1 14.2 9.7 15.3z" fill="#fff" ${o}/>` +
    `<path d="M3 25.6h26" stroke="${CITY_INK}" stroke-width="1.1"/>` +
    `<path d="M6.5 28.4q2.2-1.1 4.4 0t4.4 0 4.4 0 4.4 0" stroke="#5fa8d3" stroke-width="1.3" stroke-linecap="round"/>`,
  kanazawa:
    `<path d="M3 27.6h26" stroke="#5fa8d3" stroke-width="1.5" stroke-linecap="round"/>` +
    `<path d="M18.6 27.4q.4-3.6 3.6-4.2 3.4-.2 4.4 4.2z" fill="#8a7a66" ${o}/>` +
    `<path d="M11.4 19.6 9.4 27.4M20.8 19.6l1.6 4" stroke="#5d6a74" stroke-width="2.3" stroke-linecap="round"/>` +
    `<path d="M9 18h14v1.8H9z" fill="#8a96a0" ${o}/>` +
    `<rect x="12" y="12.8" width="8" height="5.2" fill="#cfd5da" ${o}/>` +
    `<rect x="14.4" y="14" width="3.2" height="2.6" fill="#ffd66b"/>` +
    `<path d="M4.6 12.2Q16 5.6 27.4 12.2L25.4 13.6H6.6z" fill="#6f7d88" ${o}/>` +
    `<circle cx="16" cy="6.9" r="1.5" fill="#6f7d88" ${o}/>`,
  shirakawa:
    `<path d="M3 27.6h26" stroke="${CITY_INK}" stroke-width="1.1" stroke-linecap="round"/>` +
    `<rect x="7" y="21.6" width="18" height="6" fill="#efe3cc" ${o}/>` +
    `<path d="M10 21.6v6M16 21.6v6M22 21.6v6" stroke="#6b4a2c" stroke-width=".9"/>` +
    `<path d="M16 3.6 4.4 22.2h23.2z" fill="#b38552" ${o}/>` +
    `<path d="M16 3.6 13.8 7.2h4.4z" fill="#fff" opacity=".85"/>` +
    `<path d="M10.6 15.2h10.8M8 19.2h16" stroke="#7a5532" stroke-width=".9"/>` +
    `<rect x="14.6" y="9.6" width="2.8" height="2.4" fill="#fff1cf" ${o}/>` +
    `<rect x="12.8" y="15.9" width="6.4" height="2.3" fill="#fff1cf" ${o}/>`,
  takayama:
    `<path d="M3 15.4 9.2 8.4l4.2 3.4 5-5.4 6.2 5.6 4.4 3.4z" fill="#c9d6bb" ${o}/>` +
    `<path d="M16.4 8.6l2-2.2 2.1 1.9z" fill="#fff"/>` +
    `<path d="M3.4 25.2q3.1-1.4 6.2 0t6.2 0 6.2 0 6.2 0" stroke="#5fa8d3" stroke-width="1.4" stroke-linecap="round"/>` +
    `<path d="M9.2 17.4v7M22.8 17.4v7" stroke="#6b5344" stroke-width="1.8"/>` +
    `<path d="M3 16.8Q16 10.2 29 16.8V20Q16 13.4 3 20z" fill="#d8432f" ${o}/>` +
    `<path d="M3 14.2Q16 7.6 29 14.2" stroke="#d8432f" stroke-width="1.5"/>` +
    `<path d="M7 15.6v-2.4M11.5 13.7v-2.5M16 12.9v-2.4M20.5 13.7v-2.5M25 15.6v-2.4" stroke="#d8432f" stroke-width="1.3"/>`,
  kyoto:
    `<path d="M5 28.2h22" stroke="${CITY_INK}" stroke-width="1.1" stroke-linecap="round"/>` +
    `<rect x="9" y="10.2" width="2.8" height="17.6" fill="#e0472f" ${o}/>` +
    `<rect x="20.2" y="10.2" width="2.8" height="17.6" fill="#e0472f" ${o}/>` +
    `<rect x="8.8" y="25.8" width="3.2" height="2.2" fill="${CITY_INK}"/>` +
    `<rect x="20" y="25.8" width="3.2" height="2.2" fill="${CITY_INK}"/>` +
    `<rect x="6.6" y="14.2" width="18.8" height="2.2" fill="#e0472f" ${o}/>` +
    `<rect x="14.8" y="10.4" width="2.4" height="3.8" fill="#2c2c2c"/>` +
    `<path d="M3.6 8.6Q16 5.8 28.4 8.6L27.6 11.2Q16 8.8 4.4 11.2z" fill="#e0472f" ${o}/>` +
    `<path d="M3.6 8.6Q16 5.8 28.4 8.6L28.1 9.6Q16 6.9 3.9 9.6z" fill="${CITY_INK}"/>`,
  nara:
    `<path d="M12.2 9.6 9.6 4.6M10.8 7l-2.6-.5M19.8 9.6l2.6-5M21.2 7l2.6-.5" stroke="#8a6a4a" stroke-width="1.6" stroke-linecap="round"/>` +
    `<path d="M10.8 12.2Q5.6 10.6 6.3 13.8 8.6 15.2 11.6 14.2z" fill="#c98b52" ${o}/>` +
    `<path d="M21.2 12.2Q26.4 10.6 25.7 13.8 23.4 15.2 20.4 14.2z" fill="#c98b52" ${o}/>` +
    `<path d="M11 10.4Q16 7.8 21 10.4 21.9 16.6 18.6 23.2 16 25.8 13.4 23.2 10.1 16.6 11 10.4z" fill="#c98b52" ${o}/>` +
    `<ellipse cx="16" cy="22.6" rx="2.7" ry="2" fill="#f3e3cc" ${o}/>` +
    `<ellipse cx="16" cy="21.7" rx="1.2" ry=".85" fill="${CITY_INK}"/>` +
    `<circle cx="13.6" cy="15.6" r=".95" fill="${CITY_INK}"/><circle cx="18.4" cy="15.6" r=".95" fill="${CITY_INK}"/>` +
    `<circle cx="14.6" cy="12" r=".6" fill="#f3e3cc"/><circle cx="17.5" cy="12.6" r=".6" fill="#f3e3cc"/>`,
  osaka:
    `<path d="M5.6 28.2 7.4 22h17.2l1.8 6.2z" fill="#8a929a" ${o}/>` +
    `<path d="M8.4 25.2h15.2" stroke="#6c747c" stroke-width=".8"/>` +
    `<rect x="9" y="17" width="14" height="5" fill="#f5f7fa" ${o}/>` +
    `<path d="M9.4 19.4h13.2" stroke="#e3b23c" stroke-width=".9"/>` +
    `<path d="M11.4 20.4h1.6M15.2 20.4h1.6M19 20.4h1.6" stroke="${CITY_INK}" stroke-width="1"/>` +
    `<path d="M6.8 17.6Q16 15.6 25.2 17.6L22.8 15.2H9.2z" fill="#3f8f7a" ${o}/>` +
    `<rect x="11" y="11.6" width="10" height="3.6" fill="#f5f7fa" ${o}/>` +
    `<path d="M9 12.2Q16 10.4 23 12.2L21 10.2H11z" fill="#3f8f7a" ${o}/>` +
    `<rect x="13" y="7.4" width="6" height="2.8" fill="#f5f7fa" ${o}/>` +
    `<path d="M11.2 8Q16 6.4 20.8 8L19.2 5.8h-6.4z" fill="#3f8f7a" ${o}/>` +
    `<circle cx="12.6" cy="5.7" r=".9" fill="#e3b23c"/><circle cx="19.4" cy="5.7" r=".9" fill="#e3b23c"/>`
});

function cityArt(id){
  const art = CITY_ART(`stroke="${CITY_INK}" stroke-width=".9" stroke-linejoin="round"`);
  return `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${art[id] || art.tokyo}</svg>`;
}

/** Illustration de la ville dans le pin de la carte Japon. */
export function cityMapLogoSvg(id){
  return cityArt(id);
}

/** Même illustration dans la liste des villes (cohérence carte ↔ liste). */
export function cityIconSvg(id){
  return cityArt(id);
}

/* Couleur des pins selon le type de lieu (cf. domain/classify.js → pinKind) — carte et panneau. */
export const PLACE_COLORS = {
  torii: "#e0483a", castle: "#7c5cc4", play: "#f08a24", nature: "#2f9e6a", market: "#d19a1f",
  food: "#e46a35", town: "#9a6b4a", gundam: "#3f6fd0", pin: "#b0603a",
  hotel: "#d0587e", stop: "#4f6b86"
};

/* Glyphes des lieux : traits blancs (currentColor) sur la tête colorée des pins, grille 24 px. */
const PLACE_GLYPHS = {
  torii: `<path d="M3 6.5c3 .8 6 1.2 9 1.2s6-.4 9-1.2M5 10.5h14M7 7.8V20M17 7.8V20M12 8v2.5"/>`,
  castle: `<path d="M4 20h16M6 20v-5.5h12V20M8 14.5v-3h8v3M10 11.5V8.5h4v3M4 14.5l2-2h12l2 2M7 11.5l1.5-1.5h7l1.5 1.5M12 5.5v3M10.5 20v-2.5h3V20"/>`,
  play: `<path d="M12 3.5l2.4 5 5.4.6-4 3.8 1.1 5.4L12 15.6l-4.9 2.7 1.1-5.4-4-3.8 5.4-.6z"/>`,
  nature: `<path d="M12 21v-5M12 3.5c-3.3 0-5.6 2.6-5.6 5.6 0 1.2.4 2.3 1 3.1-.6.5-1 1.2-1 2 0 1.6 1.4 2.6 3.2 2.6h4.8c1.8 0 3.2-1 3.2-2.6 0-.8-.4-1.5-1-2 .6-.8 1-1.9 1-3.1 0-3-2.3-5.6-5.6-5.6z"/>`,
  market: `<path d="M4 9.5 5.6 4h12.8L20 9.5M4 9.5c0 1.4 1.1 2.5 2.7 2.5s2.6-1.1 2.6-2.5c0 1.4 1.2 2.5 2.7 2.5s2.7-1.1 2.7-2.5c0 1.4 1.1 2.5 2.6 2.5S20 10.9 20 9.5M5.6 12v8h12.8v-8M10 20v-4.5h4V20"/>`,
  food: `<path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0zM8.5 20.5h7M13.5 3.5l4.5 6M17 3l3 5.5"/>`,
  town: `<path d="M3 20h18M4.5 20v-7.5L10 8l5.5 4.5V20M15.5 13l2.8-2.2 2.7 2.2V20M8.5 20v-4h3v4"/>`,
  gundam: `<rect x="6" y="8.5" width="12" height="9.5" rx="2"/><path d="M12 4.5v4M9.5 13h.01M14.5 13h.01M9.5 15.8h5M4 12v3M20 12v3M8 4.5l4 2 4-2"/>`,
  hotel: `<path d="M3 18.5V6.5M3 13.5h18v5M21 18.5v-2M6.5 13.5V11a1.5 1.5 0 0 1 1.5-1.5h2.5v4M12 13.5v-4h5.5a3.5 3.5 0 0 1 3.5 3.5v.5"/>`,
  train: `<rect x="5.5" y="3" width="13" height="14" rx="3"/><path d="M5.5 10h13M8.5 20.5l2-3.5M15.5 20.5l-2-3.5M9 13.5h.01M15 13.5h.01"/>`,
  plane: `<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>`,
  bus: `<rect x="4.5" y="3.5" width="15" height="14" rx="3"/><path d="M4.5 10.5h15M8 17.5v2.5M16 17.5v2.5M8 14h.01M16 14h.01"/>`,
  pin: `<circle cx="12" cy="11" r="3.5"/>`
};

/** Glyphe d’un type de lieu (cf. domain/classify.js) — `bag` = hôtel. */
export function placeGlyphSvg(kind){
  const g = PLACE_GLYPHS[kind === "bag" ? "hotel" : kind] || PLACE_GLYPHS.pin;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${g}</svg>`;
}

export function hotelIconSvg(){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-6h6v6"/><path d="M3 12h18"/></svg>`;
}

export function mapsIconSvg(){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>`;
}

/* —— Transports : un pictogramme + une couleur par mode, partout (carte, panneaux, pastilles) —— */
export const TRANSPORT_COLORS = {
  plane: "#c4a574", shinkansen: "#3f9fdc", train: "#e2583e", bus: "#f0a830",
  metro: "#8a6fd1", walk: "#4f9a72", transfer: "#6e7c85"
};
export const TRANSPORT_LABELS = {
  plane: "Avion", shinkansen: "Shinkansen", train: "Train", bus: "Bus",
  metro: "Métro", walk: "À pied", transfer: "Correspondance"
};
const TRANSPORT_GLYPHS = {
  plane: PLACE_GLYPHS.plane,
  shinkansen: `<path d="M2.5 16.5h16.8c1.5 0 2.4-1.6 1.6-2.9C19 10.5 15.6 7.5 10.5 7.5h-6a2 2 0 0 0-2 2z"/><path d="M2.5 12.5h14.8M7 7.5v5M11.5 7.6v4.9M4 20.5h16"/>`,
  train: PLACE_GLYPHS.train,
  bus: PLACE_GLYPHS.bus,
  metro: `<rect x="5" y="3" width="14" height="14" rx="6"/><path d="M5 10h14M8.5 20.5l2-3.5M15.5 20.5l-2-3.5M9 13.5h.01M15 13.5h.01M10 6h4"/>`,
  walk: `<circle cx="13" cy="4.5" r="1.8"/><path d="M10.5 21l2-6 2.5 2.5V21M7 13l2.5-5 3 1 2.5 3.5 2.5 1M12.5 9l-1.5 5"/>`,
  transfer: `<path d="M4 8h15M15.5 4.5 19 8l-3.5 3.5M20 16H5M8.5 12.5 5 16l3.5 3.5"/>`
};

/** Pictogramme d’un mode de transport (traits currentColor, grille 24 px). */
export function transportIconSvg(kind){
  const g = TRANSPORT_GLYPHS[kind] || TRANSPORT_GLYPHS.train;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${g}</svg>`;
}

/** Pastille ronde colorée du mode (cf. styles .mode-badge). */
export function modeBadgeHtml(kind, extraClass = ""){
  const k = TRANSPORT_GLYPHS[kind] ? kind : "train";
  return `<i class="mode-badge mode-${k}${extraClass ? " " + extraClass : ""}" style="--mode-c:${TRANSPORT_COLORS[k]}" title="${TRANSPORT_LABELS[k]}">${transportIconSvg(k)}</i>`;
}
