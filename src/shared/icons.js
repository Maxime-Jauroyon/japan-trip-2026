/* Générateurs SVG inline : logos des villes, pins, véhicules, icônes. Aucune dépendance. */

export function cityMapLogoSvg(id){
  const ink = "#1e2834";
  const o = `stroke="${ink}" stroke-width=".9" stroke-linejoin="round"`;
  const icons = {
    tokyo: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 3 17 7h-2L16 3z" fill="#e85d4a" ${o}/><path d="M13.2 7h5.6v2.4h-5.6z" fill="#e85d4a" ${o}/><path d="M14 9.4h4v8.6h-4z" fill="#d44a38" ${o}/><rect x="13.8" y="11.2" width="4.4" height="1.3" fill="#fff" opacity=".85"/><rect x="13.8" y="14.2" width="4.4" height="1.3" fill="#fff" opacity=".85"/><path d="M12.2 18h7.6v1.8H12.2z" fill="#e85d4a" ${o}/><path d="M10.5 19.8h10.8L23 26H9l1.5-6.2z" fill="#c94a38" ${o}/></svg>`,
    fuji: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 5 5 26.5h22L16 5z" fill="#5b8fd4" ${o}/><path d="M16 5 10.4 16h11.2L16 5z" fill="#f4f8fc" ${o}/></svg>`,
    kanazawa: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 26.5V17.5l9-6.5 9 6.5V26.5H7z" fill="#8a98a6" ${o}/><path d="M8.5 25V18.5l7.5-5.2 7.5 5.2V25H8.5z" fill="#f5f7fa" ${o}/><path d="M6.5 17.8 16 10.5 25.5 17.8" fill="#6b5344" ${o}/><path d="M8 17.2 16 11.2l8 6" fill="#9a7a52" ${o}/><path d="M12.5 25v-4.5h7V25h-7z" fill="#6b5344" ${o}/></svg>`,
    shirakawa: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 3.5 2.5 17.5h27L16 3.5z" fill="#6b5344" ${o}/><path d="M16 5.5 5.5 16h21L16 5.5z" fill="#9a7a52" ${o}/><path d="M8.5 17v9.5h15V17" fill="#ebe0cc" ${o}/><path d="M8.5 17h15" stroke="${ink}" stroke-width=".65" opacity=".35"/><rect x="11.5" y="20" width="3" height="3" fill="#5a4638" ${o}/><rect x="17.5" y="20" width="3" height="3" fill="#5a4638" ${o}/></svg>`,
    takayama: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 26.5V16.5L16 8.5 27.5 16.5v10H4.5z" fill="#6b5344" ${o}/><path d="M6 25V17.5l10-6.5 10 6.5V25H6z" fill="#e8dcc8" ${o}/><path d="M5 16.5 16 9.5 27 16.5" fill="#8a6a4a" ${o}/><path d="M9.5 25v-5h4v5h-4zm9 0v-5h4v5h-4z" fill="#5a4638" ${o}/><rect x="14.2" y="13.5" width="3.6" height="4.8" rx=".3" fill="#e85d4a" ${o}/></svg>`,
    kyoto: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 26.5V20.5l6-3.5 6 3.5v6H10z" fill="#c49a20" ${o}/><path d="M11.5 20.5V16l4.5-2.5 4.5 2.5v4.5H11.5z" fill="#e8c547" ${o}/><path d="M13 16V12.5l3-1.8 3 1.8V16H13z" fill="#ffe890" ${o}/><path d="M15.2 10.8 16 9l.8 1.8H15.2z" fill="#c49a20" ${o}/><path d="M7 26.8h18" stroke="#5b8fd4" stroke-width="1.8" stroke-linecap="round" opacity=".45"/></svg>`,
    nara: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 26.5V20.5c0-1.2 5.2-2.2 11.5-2.2s11.5 1 11.5 2.2v6H4.5z" fill="#8a6a4a" ${o}/><path d="M6 25.5V21c0-.8 4.5-1.5 10-1.5s10 .7 10 1.5v4.5H6z" fill="#c45c26" ${o}/><path d="M8 21.2c2.5-.6 5.2-.9 8-.9s5.5.3 8 .9" stroke="${ink}" stroke-width=".65" opacity=".3"/><path d="M13.5 14.5V21M18.5 14.5V21" stroke="#6b5344" stroke-width="1.4" stroke-linecap="round"/><path d="M12 14.5h8l-1-3.5h-6l-1 3.5z" fill="#6b5344" ${o}/></svg>`,
    osaka: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 26.5h19v-2.2H6.5z" fill="#8a929a" ${o}/><path d="M7.5 24.3h17v2.2H7.5z" fill="#a8aeb4" ${o}/><path d="M8 24.3V21.8h16v2.5H8z" fill="#f5f7fa" ${o}/><path d="M6.2 21.8q9.8-2.8 19.6 0L24.5 23.8H7.5L6.2 21.8z" fill="#3d8a62" ${o}/><path d="M10 21.8V18.8h12v3H10z" fill="#f5f7fa" ${o}/><path d="M8.8 18.8q7.2-2.2 14.4 0L22.5 20.5H9.5L8.8 18.8z" fill="#4a9a72" ${o}/><path d="M12 18.8V16.2h8v2.6H12z" fill="#f5f7fa" ${o}/><path d="M11.2 16.2q4.8-1.8 9.6 0L20.5 17.6H11.5L11.2 16.2z" fill="#5aaa82" ${o}/><path d="M15.2 13.8h1.6v2.4h-1.6z" fill="#f5f7fa" ${o}/><path d="M14.5 13.8q1.5-1.4 3 0L17 15h-2l-.5-1.2z" fill="#6bbc92" ${o}/><circle cx="16" cy="12.8" r="1.1" fill="#d4af37" ${o}/></svg>`
  };
  return icons[id] || icons.tokyo;
}

export function cityIconSvg(id){
  const s = "currentColor";
  const g = `<ellipse cx="12" cy="21.2" rx="6" ry=".9" fill="${s}" opacity=".11"/>`;
  const icons = {
    tokyo: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${g}<path d="M12 2.2l.85 2.9h3.05L12.75 7.3l.95 2.85L12 8.6l-1.7 1.55.95-2.85-2.85-2.2h3.05L12 2.2z" fill="#e85d4a"/><path d="M10.4 20.8V8.2h3.2v12.6h-3.2z" fill="${s}"/><path d="M7.8 20.8V11.2H5.8v9.6H3.8V9.6L7.5 8v12.8h.3zm8.4 0V8L19.5 6.2V20.8h-2v-9.8h-2v9.8h-2z" fill="${s}"/><rect x="11.1" y="5.2" width="1.8" height="2.4" rx=".3" fill="${s}"/></svg>`,
    fuji: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${g}<path d="M12 3.2L3.8 20h16.4L12 3.2z" fill="${s}" opacity=".14"/><path d="M12 4.8L5.8 19.2h12.4L12 4.8z" fill="${s}"/><path d="M12 5.2l2 3.6H10L12 5.2z" fill="#fff" opacity=".92"/><path d="M7.2 19.2c1.7-2.1 3.1-3.1 4.8-3.1s3.1 1 4.8 3.1" stroke="${s}" stroke-width=".75" opacity=".35"/></svg>`,
    kanazawa: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${g}<path d="M4.2 19.2V10.2l3.8-2.6 3.8 2.6 3.8-2.6 3.8 2.6v9H4.2z" fill="${s}" opacity=".13"/><path d="M5.2 18.2V11.2l3.3-2.2L12 11.2l3.5-2.2 3.3 2.2v7H5.2z" fill="${s}"/><rect x="7.2" y="12.2" width="1.8" height="5.2" fill="${s}"/><rect x="15" y="12.2" width="1.8" height="5.2" fill="${s}"/><path d="M10.4 8.6h3.2l.55 1.55h-4.3l.55-1.55z" fill="#c4a574"/></svg>`,
    shirakawa: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${g}<path d="M12 2.8L3.2 13.8h17.6L12 2.8z" fill="${s}"/><path d="M12 4.2L5.8 13.2h12.4L12 4.2z" fill="#8a6a4a" opacity=".38"/><path d="M7.2 13.2v6.8h9.6v-6.8" fill="${s}" opacity=".18"/><rect x="9.1" y="15.2" width="2.1" height="2.1" fill="${s}"/><rect x="12.8" y="15.2" width="2.1" height="2.1" fill="${s}"/></svg>`,
    takayama: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${g}<path d="M3.2 19.2V12.2l8.8-6.8 8.8 6.8v7H3.2z" fill="${s}" opacity=".13"/><path d="M4.2 18.2V12.8l7.8-5.8 7.8 5.8v5.4H4.2z" fill="${s}"/><path d="M7.2 18.2v-3.8h2.8v3.8H7.2zm7.2 0v-3.8h2.8v3.8h-2.8z" fill="#6b5344"/><rect x="10.4" y="9.2" width="3.2" height="2.1" rx=".3" fill="#c4a574"/></svg>`,
    kyoto: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${g}<path d="M8.2 20.2V10.2l7.8-4.8 7.8 4.8v10H8.2z" fill="#c4a574" opacity=".22"/><path d="M9.2 19.2V11.2l5.8-3.6 5.8 3.6v8H9.2z" fill="#d4af37"/><path d="M12 7.4l5.8 3.6V19.2H6.2V11l5.8-3.6z" fill="#e8c547" opacity=".88"/><path d="M12 7.4v11.8" stroke="#8a6a20" stroke-width=".55" opacity=".45"/></svg>`,
    nara: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${g}<path d="M12 2.6 9 5.4h6L12 2.6z" fill="${s}"/><rect x="11.1" y="5.4" width="1.8" height="1.5" fill="${s}" opacity=".45"/><path d="M12 6.9 8.2 9.8h7.6L12 6.9z" fill="${s}"/><rect x="10.8" y="9.8" width="2.4" height="1.6" fill="${s}" opacity=".45"/><path d="M12 11.4 7.4 14.6h9.2L12 11.4z" fill="${s}"/><rect x="10.5" y="14.6" width="3" height="1.8" fill="${s}" opacity=".45"/><path d="M12 16.4 6.8 19.8h10.4L12 16.4z" fill="${s}"/><rect x="10.2" y="19.8" width="3.6" height="1.4" fill="${s}" opacity=".35"/><path d="M5.2 21.2h13.6v1H5.2z" fill="${s}" opacity=".18"/><path d="M12 2.6v18.6" stroke="${s}" stroke-width=".45" opacity=".22"/></svg>`,
    osaka: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${g}<path d="M6.2 20.2V11.2l5.8-5.6 5.8 5.6v9H6.2z" fill="${s}" opacity=".13"/><path d="M7.2 19.2V12.2l4.8-4.4 4.8 4.4v7H7.2z" fill="${s}"/><path d="M9.6 19.2v-3.8h2.1v3.8H9.6zm3.2 0v-3.8h2.1v3.8h-2.1zm3.2 0v-3.8h2.1v3.8H16z" fill="#fff" opacity=".32"/><path d="M12 8.8c1.4 0 2.4 1 2.4 2.3s-1 2.3-2.4 2.3-2.4-1-2.4-2.3 1-2.3 2.4-2.3z" fill="#c45c26"/><path d="M12 6.8v1.2" stroke="#c45c26" stroke-width="1.1" stroke-linecap="round"/></svg>`
  };
  return icons[id] || icons.tokyo;
}

export function routeVehicleSvg(kind){
  if (kind === "bus") {
    return `<g class="vehicle-shape vehicle-bus"><rect x="-11" y="-5" width="22" height="10" rx="2.2" fill="#e8a020" stroke="#fff" stroke-width="1.2"/><rect x="-8" y="-3" width="5" height="4" rx=".6" fill="#fff" opacity=".85"/><rect x="-1" y="-3" width="5" height="4" rx=".6" fill="#fff" opacity=".85"/><rect x="6" y="-3" width="3" height="4" rx=".6" fill="#fff" opacity=".85"/><circle cx="-6" cy="6.5" r="2.2" fill="#333"/><circle cx="6" cy="6.5" r="2.2" fill="#333"/></g>`;
  }
  if (kind === "shinkansen") {
    /* Silhouette type N700 — nez ogival + bande bleue JR */
    return `<g class="vehicle-shape vehicle-shinkansen">` +
      `<path d="M-14 5.2V-.2c0-2.2 1.6-3.8 3.6-3.8h14.2c2.4 0 4.6 1.1 6.6 3.2L14.2 5.2H-14z" fill="#f7fbfe" stroke="#1a5f8a" stroke-width="1.15"/>` +
      `<path d="M-13.2 1.1h20.8c1.4 0 2.7.35 3.9 1.05" fill="none" stroke="#2f7fb0" stroke-width="2.1" stroke-linecap="round"/>` +
      `<rect x="-10.2" y="-2.4" width="4.2" height="2.6" rx=".45" fill="#5aa0c8"/>` +
      `<rect x="-4.4" y="-2.4" width="4.2" height="2.6" rx=".45" fill="#5aa0c8"/>` +
      `<rect x="1.4" y="-2.4" width="4.2" height="2.6" rx=".45" fill="#5aa0c8"/>` +
      `<path d="M9.2-2.1c1.5.15 2.9.85 4.2 2.05" fill="none" stroke="#c45c26" stroke-width="1.35" stroke-linecap="round"/>` +
      `<circle cx="11.6" cy="-.2" r=".55" fill="#c45c26"/>` +
      `</g>`;
  }
  return `<g class="vehicle-shape vehicle-train"><path d="M-13 4h22l3-5.5a2 2 0 00-1.8-2.8H-11.2A2 2 0 00-13-1.5L-13 4z" fill="#f4f8fb" stroke="#2f6f95" stroke-width="1.2"/><rect x="-9" y="-1" width="5" height="3" rx=".5" fill="#7eb3d1"/><rect x="-2" y="-1" width="5" height="3" rx=".5" fill="#7eb3d1"/><rect x="5" y="-1" width="4" height="3" rx=".5" fill="#7eb3d1"/><path d="M10-1.5l3 2.5" stroke="#c45c26" stroke-width="1.4" stroke-linecap="round"/></g>`;
}

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
