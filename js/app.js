(function syncTouchUi(){
  const q = "(max-width: 900px)";
  const apply = () => {
    document.documentElement.classList.toggle("touch-ui", window.matchMedia(q).matches);
  };
  apply();
  try { window.matchMedia(q).addEventListener("change", apply); } catch (_) {
    window.addEventListener("resize", apply);
  }
})();
function cityMapLogoSvg(id){
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

function cityIconSvg(id){
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

function legVehicleKind(mode){
  const m = (mode || "").toLowerCase();
  if (/avion|flight|plane|^air\b/.test(m)) return "plane";
  if (/shinkansen/.test(m)) return "shinkansen";
  if (/bus/.test(m)) return "bus";
  if (/train|hida|kintetsu|rail/.test(m)) return "train";
  return "train";
}

function legRouteParts(leg){
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
function arcControlGeo(a, b, side, amount){
  const midLat = (a.lat + b.lat) / 2;
  const midLng = (a.lng + b.lng) / 2;
  if (side === "north") return { lat: midLat + amount, lng: midLng };
  if (side === "south") return { lat: midLat - amount, lng: midLng };
  return { lat: midLat, lng: midLng };
}

function routeVehicleSvg(kind){
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

/** Logo UI (panneau trajet) — Shinkansen reconnaissable. */
function modeLogoSvg(mode){
  const kind = legVehicleKind(mode);
  if (kind === "shinkansen") {
    return `<svg class="mode-logo mode-logo-shinkansen" viewBox="0 0 48 28" aria-hidden="true">` +
      `<defs><linearGradient id="skNose" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f8fcff"/><stop offset="1" stop-color="#e8f2f8"/></linearGradient></defs>` +
      `<path d="M2 22V8.2C2 5.4 4.2 3.2 7 3.2h22.5c4.2 0 8 2.1 11.2 5.8L44 22H2z" fill="url(#skNose)" stroke="#1a5f8a" stroke-width="1.4"/>` +
      `<path d="M3.5 14.2h31.5c2.2 0 4.2.5 6 1.5" fill="none" stroke="#2f7fb0" stroke-width="3.2" stroke-linecap="round"/>` +
      `<rect x="8" y="6.2" width="6.5" height="4.2" rx=".7" fill="#5aa0c8"/>` +
      `<rect x="16.5" y="6.2" width="6.5" height="4.2" rx=".7" fill="#5aa0c8"/>` +
      `<rect x="25" y="6.2" width="6.5" height="4.2" rx=".7" fill="#5aa0c8"/>` +
      `<path d="M34.5 6.8c2.4.3 4.6 1.4 6.6 3.2" fill="none" stroke="#c45c26" stroke-width="1.8" stroke-linecap="round"/>` +
      `<circle cx="38.2" cy="9.2" r=".9" fill="#c45c26"/>` +
      `<text x="24" y="26.2" text-anchor="middle" font-size="5.2" font-weight="700" fill="#1a5f8a" letter-spacing=".4">新幹線</text>` +
      `</svg>`;
  }
  return "";
}

function modeStatHtml(mode){
  const logo = modeLogoSvg(mode);
  if (!logo) return `<div class="stat"><span>Mode</span><strong>${esc(mode)}</strong></div>`;
  return `<div class="stat mode-stat"><span>Mode</span><strong class="mode-with-logo">${logo}<span>${esc(mode)}</span></strong></div>`;
}

function prefersReducedMotion(){
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (_) { return false; }
}

function resetRouteHighlight(){
  document.querySelectorAll("#routes g.route-group").forEach(g => {
    g.classList.remove("route-active", "route-dim", "route-hover");
  });
}

function setRouteHighlight(id){
  const leg = LEGS.find(l => l.id === id);
  const journeyId = leg && leg.journey;
  document.querySelectorAll("#routes g.route-group").forEach(g => {
    const on = journeyId
      ? g.dataset.journey === journeyId
      : g.dataset.leg === id;
    g.classList.toggle("route-active", on);
    g.classList.toggle("route-dim", !on);
  });
}

function setJourneyHighlight(journeyId){
  document.querySelectorAll("#routes g.route-group").forEach(g => {
    const on = g.dataset.journey === journeyId;
    g.classList.toggle("route-active", on);
    g.classList.toggle("route-dim", !on);
  });
}

function journeyById(id){
  return (typeof JOURNEYS !== "undefined" && JOURNEYS[id]) || null;
}

function legsInJourney(journeyId){
  const j = journeyById(journeyId);
  if (j && j.legs && j.legs.length) {
    return j.legs.map(lid => LEGS.find(l => l.id === lid)).filter(Boolean);
  }
  return LEGS.filter(l => l.journey === journeyId);
}

function dayMovesForJourney(journeyId){
  const j = journeyById(journeyId);
  const day = j && j.day != null ? DAYS.find(d => d.n === j.day) : null;
  if (!day) return [];
  return (day.moves || []).filter(m => m.journey === journeyId);
}

function daysForCity(id){
  // Include any day that belongs to the city OR has an arrive/depart leg for it
  const map = new Map();
  DAYS.forEach(d => {
    const cityDay = d.city === id || d.extraCity === id;
    const moves = movesForCityDay(d.moves, id, cityDay);
    if (!cityDay && !moves.length) return;
    map.set(d.n, Object.assign({}, d, {
      moves,
      // Ideas only when this is actually a stay/visit day for the city
      ideas: cityDay ? d.ideas : [],
      ideasAfter: cityDay ? d.ideasAfter : []
    }));
  });
  return [...map.values()].sort((a, b) => a.n - b.n);
}

function legCityId(point){
  if (!point) return null;
  if (point.id) return point.id;
  // Flights use raw lat/lng for airports — treat as no city
  return null;
}

function withMoveRoles(moves, cityId){
  return (moves || []).map(m => {
    if (m.role) return Object.assign({}, m);
    const leg = m.leg ? LEGS.find(l => l.id === m.leg) : null;
    let role = "";
    if (leg){
      if (legCityId(leg.to) === cityId) role = "arrivée";
      else if (legCityId(leg.from) === cityId) role = "départ";
    }
    return Object.assign({}, m, { role });
  });
}

function touchesCityMove(m, cityId){
  if (!m.leg) return true;
  const leg = LEGS.find(l => l.id === m.leg);
  if (!leg) return true;
  return legCityId(leg.from) === cityId || legCityId(leg.to) === cityId;
}

function movesForCityDay(rawMoves, cityId, cityDay){
  rawMoves = rawMoves || [];
  if (cityDay) return withMoveRoles(rawMoves, cityId);

  const activeJourneys = new Set(
    rawMoves.filter(m => m.journey && touchesCityMove(m, cityId)).map(m => m.journey)
  );
  const out = [];
  const doneJourney = new Set();
  rawMoves.forEach(m => {
    if (m.journey && activeJourneys.has(m.journey)) {
      if (!doneJourney.has(m.journey)) {
        doneJourney.add(m.journey);
        out.push(...withMoveRoles(rawMoves.filter(x => x.journey === m.journey), cityId));
      }
    } else if (touchesCityMove(m, cityId)) {
      out.push(...withMoveRoles([m], cityId));
    }
  });
  return out;
}

function ideasOf(d){ return [].concat(d.ideas || [], d.ideasAfter || []); }

function ideasForCity(list, cityId){
  const b = MAP_BOUNDS[cityId];
  return (list || []).filter(a => {
    if (a.lat == null || a.lng == null) return true;
    return inBounds(b, a.lat, a.lng);
  });
}

function cityIdForAct(act){
  if (!act || act.lat == null) return currentCity;
  for (const id of ORDER){
    if (inBounds(MAP_BOUNDS[id], act.lat, act.lng)) return id;
  }
  return currentCity;
}

function inBounds(b, lat, lng){
  return lng >= b.west && lng <= b.east && lat >= b.south && lat <= b.north;
}

function placesOnMap(cityId){
  const b = MAP_BOUNDS[cityId];
  const pts = [], seen = new Set();
  DAYS.forEach(d => {
    ideasOf(d).forEach(a => {
      if (a.lat == null || a.lng == null) return;
      if (!inBounds(b, a.lat, a.lng)) return;
      const key = a.lat.toFixed(4) + "," + a.lng.toFixed(4);
      if (seen.has(key)) return;
      seen.add(key);
      pts.push(a);
    });
  });
  return pts;
}
function hotelsOnMap(cityId){
  const c = CITIES[cityId];
  const b = MAP_BOUNDS[cityId];
  if (!c || !b) return [];
  return (c.stays || []).filter(s => {
    const h = s.hotel;
    return h && h.name && h.name !== "—" && h.lat != null && h.lng != null && inBounds(b, h.lat, h.lng);
  });
}

/** Gares / aéroports / arrêts des trajets visibles sur la carte ville */
function stopsOnMap(cityId){
  const b = MAP_BOUNDS[cityId];
  if (!b) return [];
  const byKey = new Map();
  LEGS.forEach(leg => {
    [["from", leg.fromStop], ["to", leg.toStop]].forEach(([role, stop]) => {
      if (!stop || stop.lat == null || stop.lng == null) return;
      if (!inBounds(b, stop.lat, stop.lng)) return;
      const key = stop.lat.toFixed(4) + "," + stop.lng.toFixed(4);
      let entry = byKey.get(key);
      if (!entry) {
        entry = {
          lat: stop.lat,
          lng: stop.lng,
          name: stop.name,
          jp: stop.jp || "",
          kind: stop.kind || "Arrêt",
          title: stop.name,
          legs: []
        };
        byKey.set(key, entry);
      }
      entry.legs.push({ leg, role });
    });
  });
  return [...byKey.values()];
}

function stopPinKind(stop){
  const k = ((stop && stop.kind) || "").toLowerCase();
  if (/aéroport|aeroport|airport|hnd|cdg/.test(k) || /aéroport|aeroport|haneda|cdg|hnd/i.test(stop.name || "")) return "plane";
  if (/bus|terminal bus|arrêt bus|arret bus/.test(k)) return "bus";
  return "train";
}

function pinKind(title){
  const t = (title || "").toLowerCase();
  if (/gundam/.test(t)) return "gundam";
  if (/jinja|dera|shrine|temple|sanctuaire|inari|meiji|yasaka|kasuga|pagode|kinkaku|chūrei|churei|namba yasaka|hozenji|palais|kiyomizu|tōdai|todai|kōfuku|kofuku|nijn|nijō|nijo/.test(t)) return "torii";
  if (/château|chateau|castle|jinya|tower|tour|tsūten|tsuten/.test(t)) return "castle";
  if (/arcade|pokemon|nintendo|animate|universal|den den|teamlab|mugiwara|sunshine|character street|itoya/.test(t)) return "play";
  if (/lac|lake|parc|park|bambou|bamboo|forêt|forest|jardin|garden|sumida|momiji|téléphérique|telepherique|ropeway|yanaka|oshino|saiko|kenroku|philosophe|philosopher/.test(t)) return "nature";
  if (/marché|marche|market|omicho|ōmichō|nishiki|kuromon|miyagawa|dotonbori|shinsaibashi|ginza/.test(t)) return "market";
  if (/déjeuner|dîner|diner|thé|tea|wagashi|takoyaki|feuille d’or|feuille d'or|gold leaf|food|cérémonie|ceremonie/.test(t)) return "food";
  if (/village|gassho|shirakawa|sanmachi|nagamachi|chaya|pontochō|pontocho|yokocho|ruelle/.test(t)) return "town";
  return "pin";
}

function iconSvg(kind, accent){
  const fill = accent || "#8a4f36";
  const paper = "#fffaf3";
  const shell = `<path d="M18 1.5c-7.2 0-13 5.7-13 12.7 0 9.4 11.2 25 13 25s13-15.6 13-25C31 7.2 25.2 1.5 18 1.5z" fill="${fill}" stroke="#fff" stroke-width="1.8"/>
    <circle cx="18" cy="14" r="9.2" fill="${paper}"/>`;
  const glyphs = {
    torii: `<path d="M10 20V11h2v2h12v-2h2v9h-2v-5H12v5h-2zM9 9h18v2H9V9zm3-2h12l1 2H11l1-2z" fill="${fill}"/>`,
    castle: `<path d="M11 22v-8l3-2 4 3 4-3 3 2v8H11zm3-10V9h2v3h-2zm6 0V9h2v3h-2z" fill="${fill}"/>`,
    play: `<path d="M13 10l10 4-10 4V10zm2 8h6v2h-6v-2z" fill="${fill}"/>`,
    nature: `<path d="M18 8c-4 0-7 4-7 7 0 2 1 3.5 2.5 4.5L12 24h12l-1.5-4.5C26 18.5 27 17 27 15c0-3-3-7-9-7zm0 3c1.8 0 3.2 1 3.2 2.4S19.8 16 18 16s-3.2-1-3.2-2.6S16.2 11 18 11z" fill="${fill}"/>`,
    market: `<path d="M10 14l2-5h12l2 5v8H10v-8zm3 2h10v4H13v-4z" fill="${fill}"/>`,
    food: `<path d="M12 22c0-5 2-8 6-9v-2c-2 0-3-1-3-2.5S14.5 6 17 6s4 1 4 2.5S19.5 11 17.5 11v2c4 1 6 4 6 9H12z" fill="${fill}"/>`,
    town: `<path d="M10 22V12l8-6 8 6v10H10zm5-3h3v-4h-3v4zm7 0h3v-4h-3v4z" fill="${fill}"/>`,
    gundam: `<path d="M14 10h8v3h-2v2h4v7h-3v-4h-6v4h-3v-7h4v-2h-2v-3zm2 1v1h4v-1h-4z" fill="${fill}"/>`,
    bag: `<path d="M13 12h10v10H13V12zm3-3h4v2h-4V9z" fill="${fill}"/>`,
    train: `<path d="M12 9h12c1.2 0 2 .8 2 2v7H10v-7c0-1.2.8-2 2-2zm2 2v2h8v-2h-8zm-1 5.5a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4zm10 0a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4zM11 20l-2 3h3l1.2-3H11zm10.8 0l1.2 3h3l-2-3h-2.2z" fill="${fill}"/>`,
    plane: `<path d="M18 7l2 6h6l-2 2-4-.8L18 22l-2-1.2L14 14.2l-4 .8-2-2h6L18 7z" fill="${fill}"/>`,
    bus: `<path d="M11 8h14c1.2 0 2 1 2 2.2V20h-2.2a1.8 1.8 0 01-3.6 0h-4.4a1.8 1.8 0 01-3.6 0H11V10.2C11 9 11.8 8 13 8zm2 3v3h4v-3h-4zm6 0v3h4v-3h-4z" fill="${fill}"/>`,
    pin: `<circle cx="18" cy="14" r="3.5" fill="${fill}"/>`
  };
  return `<svg viewBox="0 0 36 42" xmlns="http://www.w3.org/2000/svg">${shell}${glyphs[kind] || glyphs.pin}</svg>`;
}

function mercY(lat){
  const r = lat * Math.PI / 180;
  return Math.log(Math.tan(Math.PI / 4 + r / 2));
}
function pctIn(b, lat, lng){
  const yN = mercY(b.north), yS = mercY(b.south);
  return {
    left: ((lng - b.west) / (b.east - b.west)) * 100,
    top: ((yN - mercY(lat)) / (yN - yS)) * 100
  };
}
function projectJapan(lat, lng){
  const p = pctIn(JAPAN_BOUNDS, lat, lng);
  const w = japanImg.naturalWidth || 1000;
  const h = japanImg.naturalHeight || 1000;
  return { x: (p.left / 100) * w, y: (p.top / 100) * h };
}

const panel = document.getElementById("panel");
const cityList = document.getElementById("city-list");
const countryView = document.getElementById("country-view");
const cityView = document.getElementById("city-view");
const cityImg = document.getElementById("city-img");
const cityPins = document.getElementById("city-pins");
const cityFrame = document.getElementById("city-frame");
const cityWorld = document.getElementById("city-world");
const countryViewport = document.getElementById("country-viewport");
const countryWorld = document.getElementById("country-world");
const japanImg = document.getElementById("japan-img");
const japanOverlay = document.getElementById("japan-overlay");
const hint = document.getElementById("hint");
let currentCity = null;
let panelContext = null;
let lastFocusAct = null;
let onsiteSelectedDayN = null;

/* Pan/zoom — mode: cover fills viewport; contain keeps grey letterbox around map */
function makePanZoom(viewport, world, opts){
  const o = Object.assign({ max:6, start:1, mode:"cover" }, opts || {});
  const st = { x:0, y:0, s:o.start, drag:false, lx:0, ly:0 };
  const pointers = new Map();
  let pinch0 = null;
  function minScale(){
    const ww = world.offsetWidth || 1, wh = world.offsetHeight || 1;
    const vw = viewport.clientWidth || 1, vh = viewport.clientHeight || 1;
    const cover = Math.max(vw / ww, vh / wh);
    const contain = Math.min(vw / ww, vh / wh);
    if (o.mode === "contain") return contain;
    return cover;
  }
  function maxScale(){
    if (typeof o.maxRelative === "number") {
      return Math.max(o.max || 6, minScale() * o.maxRelative);
    }
    return o.max;
  }
  function apply(){
    world.style.transform = `translate(${st.x}px,${st.y}px) scale(${st.s})`;
    if (typeof o.onChange === "function") o.onChange(st.s, minScale());
  }
  function clamp(){
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const min = minScale();
    const max = maxScale();
    if (st.s < min) st.s = min;
    if (st.s > max) st.s = max;
    const ww = world.offsetWidth * st.s, wh = world.offsetHeight * st.s;
    if (ww <= vw) st.x = (vw - ww) / 2;
    else st.x = Math.min(0, Math.max(vw - ww, st.x));
    if (wh <= vh) st.y = (vh - wh) / 2;
    else st.y = Math.min(0, Math.max(vh - wh, st.y));
  }
  function zoomAt(cx, cy, factor){
    const min = minScale();
    const max = maxScale();
    const ns = Math.min(max, Math.max(min, st.s * factor));
    const k = ns / st.s;
    st.x = cx - (cx - st.x) * k;
    st.y = cy - (cy - st.y) * k;
    st.s = ns;
    clamp(); apply();
  }
  function fitCover(extra){
    extra = extra == null ? 1 : extra;
    const min = minScale();
    const max = maxScale();
    st.s = Math.min(max, min * extra);
    st.x = (viewport.clientWidth - world.offsetWidth * st.s) / 2;
    st.y = (viewport.clientHeight - world.offsetHeight * st.s) / 2;
    clamp(); apply();
  }
  /** Toute la carte visible (letterbox si besoin) — évite de couper gauche/droite. */
  function fitContain(pad){
    pad = pad == null ? 1 : pad;
    const ww = world.offsetWidth || 1, wh = world.offsetHeight || 1;
    const vw = viewport.clientWidth || 1, vh = viewport.clientHeight || 1;
    const max = maxScale();
    st.s = Math.min(max, Math.min(vw / ww, vh / wh) * pad);
    st.x = (vw - ww * st.s) / 2;
    st.y = (vh - wh * st.s) / 2;
    clamp(); apply();
  }
  function focusPct(leftPct, topPct, s){
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const min = minScale();
    const max = maxScale();
    st.s = Math.min(max, Math.max(min, s));
    st.x = vw / 2 - (leftPct / 100) * world.offsetWidth * st.s;
    st.y = vh / 2 - (topPct / 100) * world.offsetHeight * st.s;
    clamp(); apply();
  }
  function pinchMetrics(){
    const arr = [...pointers.values()];
    if (arr.length < 2) return null;
    const a = arr[0], b = arr[1];
    return {
      dist: Math.hypot(b.x - a.x, b.y - a.y) || 1,
      cx: (a.x + b.x) / 2,
      cy: (a.y + b.y) / 2
    };
  }
  function isMapChrome(el){
    return !!(el && el.closest && el.closest("button, path.route-hit, path.route, .pin, .zone-hub, .sheet-grab, .overlay"));
  }
  viewport.addEventListener("wheel", e => {
    e.preventDefault();
    const r = viewport.getBoundingClientRect();
    zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.12 : 1 / 1.12);
  }, { passive:false });
  viewport.addEventListener("pointerdown", e => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (isMapChrome(e.target)) return;
    e.preventDefault();
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
    if (pointers.size >= 2) {
      st.drag = false;
      viewport.classList.remove("dragging");
      const p = pinchMetrics();
      if (p) pinch0 = { dist: p.dist, s: st.s };
    } else {
      st.drag = true; st.lx = e.clientX; st.ly = e.clientY;
      viewport.classList.add("dragging");
    }
  });
  viewport.addEventListener("dragstart", e => { e.preventDefault(); });
  viewport.addEventListener("selectstart", e => { e.preventDefault(); });
  viewport.addEventListener("pointermove", e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size >= 2 && pinch0) {
      const p = pinchMetrics();
      if (!p) return;
      const r = viewport.getBoundingClientRect();
      const cx = p.cx - r.left, cy = p.cy - r.top;
      const min = minScale();
      const max = maxScale();
      const ns = Math.min(max, Math.max(min, pinch0.s * (p.dist / pinch0.dist)));
      const k = ns / st.s;
      st.x = cx - (cx - st.x) * k;
      st.y = cy - (cy - st.y) * k;
      st.s = ns;
      clamp(); apply();
      return;
    }
    if (!st.drag) return;
    st.x += e.clientX - st.lx;
    st.y += e.clientY - st.ly;
    st.lx = e.clientX; st.ly = e.clientY;
    clamp(); apply();
  });
  function endPointer(e){
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}
    if (pointers.size < 2) pinch0 = null;
    if (pointers.size === 0) {
      st.drag = false;
      viewport.classList.remove("dragging");
    } else if (pointers.size === 1) {
      const only = [...pointers.values()][0];
      st.drag = true;
      st.lx = only.x; st.ly = only.y;
      viewport.classList.add("dragging");
    }
  }
  viewport.addEventListener("pointerup", endPointer);
  viewport.addEventListener("pointercancel", endPointer);
  function fitWorldBox(box, insets){
    insets = Object.assign({ top: 48, right: 48, bottom: 48, left: 48 }, insets || {});
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const availW = Math.max(96, vw - insets.left - insets.right);
    const availH = Math.max(96, vh - insets.top - insets.bottom);
    const bw = Math.max(24, box.maxX - box.minX);
    const bh = Math.max(24, box.maxY - box.minY);
    const cx = (box.minX + box.maxX) / 2;
    const cy = (box.minY + box.maxY) / 2;
    const min = minScale();
    const max = maxScale();
    st.s = Math.min(max, Math.max(min, Math.min(availW / bw, availH / bh) * 0.88));
    const centerX = insets.left + availW / 2;
    const centerY = insets.top + availH / 2;
    st.x = centerX - cx * st.s;
    st.y = centerY - cy * st.s;
    clamp(); apply();
  }
  return {
    state:st, apply, clamp, zoomAt, fitCover, fitContain, focusPct, fitWorldBox, minScale, maxScale,
    zoomIn(){ zoomAt(viewport.clientWidth/2, viewport.clientHeight/2, 1.2); },
    zoomOut(){ zoomAt(viewport.clientWidth/2, viewport.clientHeight/2, 1/1.2); }
  };
}

const countryCam = makePanZoom(countryViewport, countryWorld, {
  max:7,
  start:1,
  mode:"cover"
});
const cityCam = makePanZoom(cityFrame, cityWorld, {
  max:18,
  maxRelative:16,
  start:1,
  mode:"cover",
  onChange(){ updateCityLod(); }
});

const MAP_IMG_VER = "20";
const cityZonesEl = document.getElementById("city-zones");
const cityHubs = document.getElementById("city-hubs");
let currentCityLod = -1;
let currentMapDay = null;
const preloadedMaps = new Map();
markStandaloneMode();

function cityMapUrl(id){
  return "./maps/" + id + ".png?v=" + MAP_IMG_VER;
}

/** Précharge toutes les cartes ville dès le démarrage (mémoire + cache navigateur). */
function preloadCityMaps(){
  ORDER.forEach(id => {
    if (preloadedMaps.has(id)) return;
    const img = new Image();
    img.decoding = "async";
    img.src = cityMapUrl(id);
    preloadedMaps.set(id, img);
  });
}

function isCityMapReady(id){
  const img = preloadedMaps.get(id);
  return !!(img && img.complete && img.naturalWidth);
}

function sizeJapanWorld(){
  if (!japanImg.naturalWidth) return;
  const w = japanImg.naturalWidth, h = japanImg.naturalHeight;
  japanImg.style.width = w + "px";
  japanImg.style.height = h + "px";
  countryWorld.style.width = w + "px";
  countryWorld.style.height = h + "px";
  japanOverlay.setAttribute("width", w);
  japanOverlay.setAttribute("height", h);
  japanOverlay.setAttribute("viewBox", `0 0 ${w} ${h}`);
  japanOverlay.style.width = w + "px";
  japanOverlay.style.height = h + "px";
}

function routePathD(spec){
  const a = spec.from, b = spec.to;
  if (!a || !b || a.lat == null || b.lat == null) return "";
  const f = n => (+n).toFixed(1);

  if (spec.curveSide) {
    const amt = spec.curveAmt != null ? spec.curveAmt : 0.085;
    const peak = arcControlGeo(a, b, spec.curveSide, amt);
    const p0 = projectJapan(a.lat, a.lng);
    const pc = projectJapan(peak.lat, peak.lng);
    const p1 = projectJapan(b.lat, b.lng);
    return `M${f(p0.x)},${f(p0.y)} Q${f(pc.x)},${f(pc.y)} ${f(p1.x)},${f(p1.y)}`;
  }

  const pts = [a, ...(spec.via || []), b]
    .filter(p => p && p.lat != null)
    .map(p => projectJapan(p.lat, p.lng));
  return catmullRomPathD(pts);
}

/** Smooth curve through waypoints (Catmull-Rom → cubic Bézier). */
function catmullRomPathD(pts, tension){
  tension = tension == null ? 0.42 : tension;
  if (pts.length < 2) return "";
  const f = n => (+n).toFixed(1);
  const k = 6 / Math.max(0.25, tension);
  if (pts.length === 2) {
    const a = pts[0], b = pts[1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const bulge = Math.min(90, Math.max(18, len * 0.1));
    const mx = (a.x + b.x) / 2 + (-dy / len) * bulge;
    const my = (a.y + b.y) / 2 + (dx / len) * bulge;
    return `M${f(a.x)},${f(a.y)} Q${f(mx)},${f(my)} ${f(b.x)},${f(b.y)}`;
  }
  let d = `M${f(pts[0].x)},${f(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / k;
    const cp1y = p1.y + (p2.y - p0.y) / k;
    const cp2x = p2.x - (p3.x - p1.x) / k;
    const cp2y = p2.y - (p3.y - p1.y) / k;
    d += ` C${f(cp1x)},${f(cp1y)} ${f(cp2x)},${f(cp2y)} ${f(p2.x)},${f(p2.y)}`;
  }
  return d;
}

function pathBoundsFromD(d, pad){
  pad = pad == null ? 36 : pad;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const add = (x, y) => {
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  };
  if (d) {
    try {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      const len = path.getTotalLength();
      const steps = Math.max(16, Math.ceil(len / 48));
      for (let i = 0; i <= steps; i++) {
        const pt = path.getPointAtLength(len * i / steps);
        add(pt.x, pt.y);
      }
    } catch (_) { /* ignore */ }
  }
  if (!isFinite(minX)) return null;
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
}

function buildCountry(){
  const routes = document.getElementById("routes");
  routes.innerHTML = "";
  const reduced = prefersReducedMotion();
  LEGS.forEach(leg => {
    if (leg.skipMap) return;
    legRouteParts(leg).forEach(part => {
      const d = routePathD(part);
      if (!d) return;
      const pathId = "route-" + part.pathId;
      const vKind = legVehicleKind(part.mode);
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.classList.add("route-group");
      g.dataset.leg = part.legId;
      g.dataset.segment = part.pathId;
      g.dataset.vehicle = vKind;
      if (leg.journey) g.dataset.journey = leg.journey;

      const glow = document.createElementNS("http://www.w3.org/2000/svg", "path");
      glow.setAttribute("d", d);
      glow.setAttribute("class", "route-glow");

      const track = document.createElementNS("http://www.w3.org/2000/svg", "path");
      track.setAttribute("id", pathId);
      track.setAttribute("d", d);
      track.setAttribute("class", "route-track");

      const hit = document.createElementNS("http://www.w3.org/2000/svg", "path");
      hit.setAttribute("d", d);
      hit.setAttribute("class", "route-hit");

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("class", "route");
      path.dataset.leg = part.legId;

      const vehWrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
      vehWrap.setAttribute("class", "route-vehicle vehicle-" + vKind);
      vehWrap.innerHTML = routeVehicleSvg(vKind);

      if (!reduced) {
        const motion = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
        motion.setAttribute("dur", vKind === "bus" ? "14s" : "10s");
        motion.setAttribute("repeatCount", "indefinite");
        motion.setAttribute("rotate", "auto");
        motion.setAttribute("calcMode", "linear");
        const mpath = document.createElementNS("http://www.w3.org/2000/svg", "mpath");
        mpath.setAttribute("href", "#" + pathId);
        try { mpath.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#" + pathId); } catch (_) { /* ignore */ }
        motion.appendChild(mpath);
        vehWrap.appendChild(motion);
        motion.setAttribute("begin", (Math.random() * 8).toFixed(1) + "s");
      } else {
        vehWrap.classList.add("route-vehicle-static");
      }

      const open = e => {
        e.stopPropagation();
        const hitLeg = LEGS.find(l => l.id === part.legId);
        if (hitLeg && hitLeg.journey) openJourney(hitLeg.journey, hitLeg.id);
        else openLeg(part.legId);
      };
      hit.addEventListener("click", open);
      hit.addEventListener("mouseenter", () => g.classList.add("route-hover"));
      hit.addEventListener("mouseleave", () => g.classList.remove("route-hover"));

      g.appendChild(glow);
      g.appendChild(track);
      g.appendChild(hit);
      g.appendChild(path);
      g.appendChild(vehWrap);
      routes.appendChild(g);

      if (reduced && vehWrap.classList.contains("route-vehicle-static")) {
        try {
          const len = track.getTotalLength();
          const pt = track.getPointAtLength(len * 0.38);
          vehWrap.setAttribute("transform", `translate(${pt.x.toFixed(1)},${pt.y.toFixed(1)})`);
        } catch (_) { /* ignore */ }
      } else if (!reduced) {
        try {
          const len = track.getTotalLength();
          const motion = vehWrap.querySelector("animateMotion");
          if (motion && len > 0) {
            const sec = Math.max(5, Math.min(22, len / (vKind === "bus" ? 55 : 75)));
            motion.setAttribute("dur", sec.toFixed(1) + "s");
          }
        } catch (_) { /* ignore */ }
      }
    });
  });

  const marks = document.getElementById("country-marks");
  marks.innerHTML = "";
  ORDER.forEach((id, i) => {
    const c = CITIES[id];
    const pct = pctIn(JAPAN_BOUNDS, c.lat, c.lng);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "city-mark" + (LABEL_SIDE[id] === "left" ? " label-left" : "");
    btn.style.left = pct.left + "%";
    btn.style.top = pct.top + "%";
    btn.style.setProperty("--mark-i", String(i));
    btn.dataset.city = id;
    btn.title = c.name;
    btn.innerHTML =
      `<span class="map-logo">${cityMapLogoSvg(id)}</span>` +
      `<span class="label">${c.name}</span>`;
    btn.addEventListener("click", e => { e.stopPropagation(); openCity(id); });
    marks.appendChild(btn);
  });
}

function setActiveCity(id){
  document.querySelectorAll("#city-list button").forEach(b => b.classList.toggle("active", b.dataset.city === id));
  document.querySelectorAll(".city-mark").forEach(b => b.classList.toggle("active", b.dataset.city === id));
}

function showCountry(){
  currentCity = null;
  document.querySelector(".app").classList.remove("city-mode");
  const banner = document.getElementById("city-banner");
  if (banner) { banner.hidden = true; banner.textContent = ""; }
  countryView.classList.remove("hidden");
  cityView.classList.remove("visible");
  hint.textContent = "Glisser · pincer pour zoomer · toucher une ville";
  setActiveCity(null);
  requestAnimationFrame(() => {
    fitJapanHome();
  });
}

function fitJapanHome(){
  sizeJapanWorld();
  /* Standalone : cover exact (pas le ×1.02 qui rogne un peu les côtés). */
  countryCam.fitCover(isStandaloneApp() ? 1 : 1.02);
}

function layoutCityPins(){
  if (!currentCity || !cityImg.naturalWidth) return;
  const nw = cityImg.naturalWidth, nh = cityImg.naturalHeight;
  cityImg.style.width = nw + "px";
  cityImg.style.height = nh + "px";
  cityWorld.style.width = nw + "px";
  cityWorld.style.height = nh + "px";
  cityPins.style.width = nw + "px";
  cityPins.style.height = nh + "px";
  if (cityHubs) {
    cityHubs.style.width = nw + "px";
    cityHubs.style.height = nh + "px";
  }
  if (cityZonesEl) {
    cityZonesEl.setAttribute("width", nw);
    cityZonesEl.setAttribute("height", nh);
    cityZonesEl.setAttribute("viewBox", `0 0 ${nw} ${nh}`);
  }
  const placePin = (pin) => {
    const lat = Number(pin.dataset.lat), lng = Number(pin.dataset.lng);
    const pct = pctIn(MAP_BOUNDS[currentCity], lat, lng);
    pin.style.left = (pct.left / 100) * nw + "px";
    pin.style.top = (pct.top / 100) * nh + "px";
    const inB = pct.left >= -2 && pct.left <= 102 && pct.top >= -2 && pct.top <= 102;
    pin.style.display = inB ? "" : "none";
  };
  cityPins.querySelectorAll(".pin").forEach(placePin);
  if (cityHubs) cityHubs.querySelectorAll(".zone-hub").forEach(placePin);
  layoutCityZones(currentMapDay);
  updateCityLod(true);
}

function pointInZone(lat, lng, z){
  return lng >= z.west && lng <= z.east && lat >= z.south && lat <= z.north;
}
function zonesForCity(id){
  return (typeof CITY_ZONES !== "undefined" && CITY_ZONES[id]) ? CITY_ZONES[id] : [];
}
function zoneForPoint(cityId, lat, lng){
  return zonesForCity(cityId).find(z => pointInZone(lat, lng, z)) || null;
}
function lightenHex(hex, amount){
  const n = String(hex || "").replace("#", "");
  if (n.length !== 6) return hex;
  const ch = (i) => parseInt(n.slice(i, i + 2), 16);
  const L = (c) => Math.min(255, Math.round(c + (255 - c) * amount));
  return "#" + [L(ch(0)), L(ch(2)), L(ch(4))].map(x => x.toString(16).padStart(2, "0")).join("");
}
/** Couleurs réservées — hors palette des zones (rouge, bleu, violet, or, teal, vert). */
const PIN_COLOR_HOTEL = "#c97b84";
const PIN_COLOR_HOTEL_SEL = "#e8a8b0";
const PIN_COLOR_STOP = "#6e7c85";
const PIN_COLOR_STOP_SEL = "#9aa4ad";
const PIN_COLOR_ACT_FALLBACK = "#a85a32";
function activityPinColor(cityId, lat, lng, selected){
  const z = zoneForPoint(cityId, lat, lng);
  const base = z ? z.color : PIN_COLOR_ACT_FALLBACK;
  return selected ? lightenHex(base, 0.22) : base;
}
function zoneCenter(z){
  return { lat: (z.south + z.north) / 2, lng: (z.west + z.east) / 2 };
}
function countPlacesInZone(cityId, zone){
  return placesOnMap(cityId).filter(a => pointInZone(a.lat, a.lng, zone)).length;
}
function cityLodLevel(){
  const min = cityCam.minScale();
  if (!min) return 0;
  const r = cityCam.state.s / min;
  if (r < 1.22) return 0;
  if (r < 2.45) return 1;
  return 2;
}
function smoothstep(edge0, edge1, x){
  if (edge1 === edge0) return x >= edge1 ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
function dayZoneIds(cityId, day){
  const ids = new Set();
  if (!day) return ids;
  ideasOf(day).forEach(a => {
    if (a.lat == null) return;
    const z = zoneForPoint(cityId, a.lat, a.lng);
    if (z) ids.add(z.id);
  });
  const stay = stayForDay(cityId, day);
  const h = stay && stay.hotel;
  if (h && h.lat != null) {
    const z = zoneForPoint(cityId, h.lat, h.lng);
    if (z) ids.add(z.id);
  }
  return ids;
}
function layoutCityZones(day){
  if (!cityZonesEl || !currentCity || !cityImg.naturalWidth) return;
  const nw = cityImg.naturalWidth, nh = cityImg.naturalHeight;
  const bounds = MAP_BOUNDS[currentCity];
  const zones = zonesForCity(currentCity);
  const onZones = dayZoneIds(currentCity, day);
  const filterDay = !!(day && onZones.size);
  cityZonesEl.innerHTML = zones.map(z => {
    const tl = pctIn(bounds, z.north, z.west);
    const br = pctIn(bounds, z.south, z.east);
    const x = (Math.min(tl.left, br.left) / 100) * nw;
    const y = (Math.min(tl.top, br.top) / 100) * nh;
    const w = (Math.abs(br.left - tl.left) / 100) * nw;
    const h = (Math.abs(br.top - tl.top) / 100) * nh;
    const on = !filterDay || onZones.has(z.id);
    const cls = "zone-poly" + (filterDay ? (on ? " on" : " dim") : "");
    return `<g class="${cls}" data-zone="${esc(z.id)}">` +
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(28, w * 0.08)}" fill="${esc(z.color)}" />` +
      `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="middle">${esc(z.name)}</text>` +
      `</g>`;
  }).join("");
}
function renderCityHubs(id, day){
  if (!cityHubs) return;
  cityHubs.innerHTML = "";
  const onZones = dayZoneIds(id, day);
  const filterDay = !!(day && onZones.size);
  zonesForCity(id).forEach(z => {
    const n = countPlacesInZone(id, z);
    if (!n && id !== "shirakawa") return;
    const c = zoneCenter(z);
    const on = !filterDay || onZones.has(z.id);
    const btn = document.createElement("button");
    btn.type = "button";
    let cls = "zone-hub";
    if (filterDay) cls += on ? " on" : " dim";
    btn.className = cls;
    btn.dataset.lat = c.lat;
    btn.dataset.lng = c.lng;
    btn.dataset.zone = z.id;
    btn.title = z.name;
    btn.setAttribute("aria-label", z.name);
    const dayCount = filterDay && on
      ? ideasOf(day).filter(a => a.lat != null && pointInZone(a.lat, a.lng, z)).length
      : n;
    btn.innerHTML =
      `<span class="zone-hub-dot" style="background:${esc(z.color)}"></span>` +
      `<span class="zone-hub-label">${esc(z.name)}</span>` +
      (dayCount ? `<span class="zone-hub-count">${dayCount}</span>` : "");
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const pct = pctIn(MAP_BOUNDS[id], c.lat, c.lng);
      const zoom = cityCam.minScale() * 2.7;
      cityCam.focusPct(pct.left, pct.top, zoom);
    });
    cityHubs.appendChild(btn);
  });
}
function updateCityLod(force){
  if (!currentCity || !cityView.classList.contains("visible")) return;
  const min = cityCam.minScale() || 1;
  const s = cityCam.state.s || min;
  const ratio = Math.max(1, s / min);
  const screenFactor = Math.max(0.44, Math.min(1.28, 1.42 / Math.pow(ratio, 0.32)));
  let pinScale = screenFactor / ratio;
  if (ratio < 2.8) pinScale *= 0.86 + ratio * 0.05;
  pinScale = Math.round(pinScale * 50) / 50;
  const mobilePins = window.matchMedia("(max-width: 900px)").matches;
  const baseW = mobilePins ? 74 : 84;
  const baseH = mobilePins ? 86 : 98;
  const badgeW = Math.max(34, Math.round(baseW * pinScale));
  const badgeH = Math.round(badgeW * baseH / baseW);
  cityWorld.style.setProperty("--pin-badge-w", badgeW + "px");
  cityWorld.style.setProperty("--pin-badge-h", badgeH + "px");
  cityWorld.dataset.pinSm = badgeW < 52 ? "1" : "";
  // Hubs plus gros au dézoom max (ratio ≈ 1), puis se réduisent en zoomant
  const hubScale = Math.max(0.9, Math.min(1.75, 1.75 / Math.pow(ratio, 0.4))) / Math.max(1, Math.min(ratio, 1.12));
  cityWorld.style.setProperty("--hub-scale", String(hubScale));

  // Hubs → zones → pins. Mobile zoom-jour (~×2.5) saute les zones : pins plus tôt.
  // Jamais de « trou » où tout est invisible.
  const pinStart = mobilePins ? 1.95 : 2.28;
  const hubOp = 1 - smoothstep(1.12, 1.45, ratio);
  const zoneFade = smoothstep(pinStart - 0.2, pinStart + 0.08, ratio);
  const zoneOp = smoothstep(1.12, 1.45, ratio) * (1 - zoneFade);
  let pinOp = ratio >= pinStart ? 1 : 0;
  if (hubOp < 0.12 && zoneOp < 0.12) pinOp = 1;
  cityWorld.style.setProperty("--hub-opacity", hubOp.toFixed(3));
  cityWorld.style.setProperty("--zone-opacity", zoneOp.toFixed(3));
  cityWorld.style.setProperty("--pin-opacity", String(pinOp));
  cityWorld.classList.toggle("day-filter", !!(currentMapDay && dayZoneIds(currentCity, currentMapDay).size));
  cityWorld.classList.toggle("pins-live", pinOp >= 1);
  cityWorld.classList.toggle("hubs-live", hubOp >= 0.35);

  const lod = pinOp >= 1 ? 2 : zoneOp >= 0.4 ? 1 : 0;
  if (!force && lod === currentCityLod) return;
  currentCityLod = lod;
  cityWorld.classList.remove("lod-0", "lod-1", "lod-2");
  cityWorld.classList.add("lod-" + lod);
  if (hint && countryView.classList.contains("hidden")) {
    hint.textContent = lod === 0
      ? "Zones · zoomer pour les détails"
      : lod === 1
        ? "Quartiers · zoomer pour les pins"
        : "Glisser · pincer · toucher un pin";
  }
}

function renderCityPins(id, day, selected){
  currentMapDay = day || null;
  const places = placesOnMap(id);
  const hotels = hotelsOnMap(id);
  const stops = stopsOnMap(id);
  const dayKeys = new Set();
  const dayStopKeys = new Set();
  if (day){
    ideasOf(day).forEach(a => {
      if (a.lat == null) return;
      dayKeys.add(a.lat.toFixed(4) + "," + a.lng.toFixed(4));
    });
    (day.moves || []).forEach(m => {
      if (!m.leg) return;
      const leg = LEGS.find(l => l.id === m.leg);
      if (!leg) return;
      [leg.fromStop, leg.toStop].forEach(s => {
        if (s && s.lat != null) dayStopKeys.add(s.lat.toFixed(4) + "," + s.lng.toFixed(4));
      });
    });
  }
  const selKey = selected && selected.lat != null
    ? selected.lat.toFixed(4) + "," + selected.lng.toFixed(4)
    : null;
  cityPins.innerHTML = "";
  places.forEach(a => {
    const key = a.lat.toFixed(4) + "," + a.lng.toFixed(4);
    const onDay = !day || dayKeys.has(key);
    const isSel = selKey === key;
    const kind = pinKind(a.title);
    const accent = activityPinColor(id, a.lat, a.lng, isSel);
    const btn = document.createElement("button");
    btn.type = "button";
    let cls = "pin";
    if (day) cls += onDay ? " on" : " dim";
    if (isSel) cls += " selected";
    // Autres activités du même jour : visibles, sans surbrillance
    else if (selKey && !isSel && (!day || !onDay)) cls += " dim";
    btn.className = cls;
    btn.dataset.lat = a.lat;
    btn.dataset.lng = a.lng;
    btn.title = a.title;
    btn.setAttribute("aria-label", a.title);
    btn.innerHTML = `<span class="badge">${iconSvg(kind, accent)}</span>`;
    btn.addEventListener("click", e => {
      e.stopPropagation();
      openActivityDetail(a);
    });
    cityPins.appendChild(btn);
  });
  stops.forEach(stop => {
    const key = stop.lat.toFixed(4) + "," + stop.lng.toFixed(4);
    const onDay = !day || dayStopKeys.has(key);
    const isSel = selKey === key;
    const accent = isSel ? PIN_COLOR_STOP_SEL : PIN_COLOR_STOP;
    const btn = document.createElement("button");
    btn.type = "button";
    let cls = "pin pin-stop";
    if (day) cls += onDay ? " on" : " dim";
    if (isSel) cls += " selected";
    else if (selKey && !isSel && day && !onDay) cls += " dim";
    btn.className = cls;
    btn.dataset.lat = stop.lat;
    btn.dataset.lng = stop.lng;
    btn.title = stop.name + " (" + stop.kind + ")";
    btn.setAttribute("aria-label", stop.kind + " · " + stop.name);
    btn.innerHTML = `<span class="badge">${iconSvg(stopPinKind(stop), accent)}</span>`;
    btn.addEventListener("click", e => {
      e.stopPropagation();
      openStopDetail(stop);
    });
    cityPins.appendChild(btn);
  });
  hotels.forEach(stay => {
    const h = stay.hotel;
    const key = h.lat.toFixed(4) + "," + h.lng.toFixed(4);
    const isSel = selKey === key;
    const activeStay = day ? stayForDay(id, day) : null;
    const onStay = !day || (activeStay && activeStay.id === stay.id);
    const accent = isSel ? PIN_COLOR_HOTEL_SEL : PIN_COLOR_HOTEL;
    const btn = document.createElement("button");
    btn.type = "button";
    let cls = "pin pin-hotel";
    if (day) cls += onStay ? " on" : " dim";
    if (isSel) cls += " selected";
    btn.className = cls;
    btn.dataset.lat = h.lat;
    btn.dataset.lng = h.lng;
    btn.dataset.stay = stay.id;
    btn.title = h.name + " (hôtel)";
    btn.setAttribute("aria-label", "Hôtel · " + h.name);
    btn.innerHTML = `<span class="badge">${iconSvg("bag", accent)}</span>`;
    btn.addEventListener("click", e => {
      e.stopPropagation();
      openHotelDetail(stay);
    });
    cityPins.appendChild(btn);
  });
  renderCityHubs(id, day || null);
  layoutCityPins();
}

function highlightPin(act, opts){
  if (!currentCity || !act || act.lat == null) return;
  lastFocusAct = act;
  const dayEl = panel.querySelector("details.day[open]");
  const dayN = dayEl ? Number(dayEl.dataset.dayN) : null;
  const day = dayN != null ? DAYS.find(d => d.n === dayN) : null;
  renderCityPins(currentCity, day || null, act);
  if (opts && opts.zoom) {
    const pct = pctIn(MAP_BOUNDS[currentCity], act.lat, act.lng);
    const mobile = window.matchMedia("(max-width: 900px)").matches;
    const zoom = cityCam.minScale() * (mobile ? 2.8 : 2.6);
    cityCam.focusPct(pct.left, pct.top, zoom);
    return;
  }
  cityCam.clamp();
  cityCam.apply();
}

function fitCityMap(){
  if (!cityImg.naturalWidth) return;
  layoutCityPins();
  // iOS: attendre que le layout (header masqué) ait une vraie hauteur
  const run = () => {
    if (!cityFrame.clientWidth || !cityFrame.clientHeight) return false;
    cityCam.fitCover(1);
    return true;
  };
  if (!run()) {
    requestAnimationFrame(() => {
      if (!run()) requestAnimationFrame(run);
    });
  }
}

function openDayInPanel(){
  const dayEl = panel.querySelector("details.day[open]");
  if (!dayEl) return null;
  const dayN = Number(dayEl.dataset.dayN);
  return DAYS.find(d => d.n === dayN) || null;
}

function refreshCityMapView(){
  if (!currentCity || !cityImg.naturalWidth) return;
  layoutCityPins();
  const run = () => {
    if (!cityFrame.clientWidth || !cityFrame.clientHeight) return false;
    if (lastFocusAct && lastFocusAct.lat != null) {
      cityCam.clamp();
      cityCam.apply();
    } else {
      const day = openDayInPanel();
      if (day) focusDayMap(currentCity, day);
      else cityCam.fitCover(1);
    }
    cityCam.clamp();
    cityCam.apply();
    return true;
  };
  if (!run()) requestAnimationFrame(() => { if (!run()) requestAnimationFrame(run); });
}

function scheduleCityMapRefresh(){
  // Mobile : attendre que le sheet ait réduit le city-frame avant de zoomer
  const mobile = window.matchMedia("(max-width: 900px)").matches;
  if (mobile) {
    const app = document.querySelector(".app");
    if (app && panel.classList.contains("open") && currentCity &&
        !app.classList.contains("sheet-mid") &&
        !app.classList.contains("sheet-max") &&
        !app.classList.contains("sheet-min")) {
      app.classList.add("sheet-mid");
    }
    void cityFrame.offsetHeight;
  }
  refreshCityMapView();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      refreshCityMapView();
      if (mobile) setTimeout(refreshCityMapView, 80);
    });
  });
}

function showCity(id, dayN){
  currentCity = id;
  document.querySelector(".app").classList.add("city-mode");
  const banner = document.getElementById("city-banner");
  if (banner) {
    banner.hidden = false;
    banner.textContent = CITIES[id].name;
  }
  cityView.classList.add("visible");
  countryView.classList.add("hidden");
  hint.textContent = CITIES[id].name + " · pastilles = activités · train/avion = gares · valise = hôtel";
  setActiveCity(id);
  const day = dayN != null ? DAYS.find(d => d.n === dayN) : null;
  const apply = () => {
    renderCityPins(id, day || null);
    scheduleCityMapRefresh();
  };
  cityImg.onload = apply;
  cityImg.onerror = () => {
    cityFrame.style.background = "#d5dde3";
  };
  if (cityImg.dataset.id === id && cityImg.complete && cityImg.naturalWidth){
    apply();
  } else {
    cityImg.dataset.id = id;
    cityImg.alt = "Carte de " + CITIES[id].name;
    const url = cityMapUrl(id);
    // Si déjà préchargée : appliquer tout de suite après assignation src
    if (isCityMapReady(id)) {
      cityImg.onload = null;
      cityImg.src = url;
      if (cityImg.complete && cityImg.naturalWidth) apply();
      else cityImg.onload = apply;
    } else {
      cityImg.src = url;
    }
  }
}

function esc(s){
  return String(s == null ? "" : s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

function statusClass(s){
  if (s === "paid") return "paid";
  if (s === "reserved") return "reserved";
  return "placeholder";
}
function statusLabel(s){
  if (s === "paid") return "Payé";
  if (s === "reserved") return "Réservé";
  return "À réserver";
}
function hotelIconSvg(){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-6h6v6"/><path d="M3 12h18"/></svg>`;
}
function hotelPhotos(h){
  const out = [];
  const seen = new Set();
  const push = src => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    out.push(src);
  };
  if (h.photo) push(h.photo);
  (h.photos || []).forEach(push);
  if (h.img) push(h.img);
  const slug = h.photoSlug || h.slug;
  if (slug){
    push("./img/hotels/" + slug + ".jpg");
    push("./img/hotels/" + slug + "-2.jpg");
    push("./img/hotels/" + slug + "-3.jpg");
    push("./img/hotels/" + slug + "-4.jpg");
    push("./img/hotels/" + slug + "-5.jpg");
  }
  return out.slice(0, 5);
}

function renderHotelCard(stay){
  const h = stay.hotel || {};
  const thumbs = hotelPhotos(h);
  const onErr = `onerror="this.remove();var t=this.parentElement;if(!t)return;t.classList.remove('has-photo');var ph=t.querySelector('.ph');if(ph)ph.style.display='grid'"`;
  const thumb = thumbs[0]
    ? `<div class="thumb has-photo"><img src="${esc(thumbs[0])}" alt="" loading="lazy" ${onErr}/><div class="ph" style="display:none">${hotelIconSvg()}</div></div>`
    : `<div class="thumb"><div class="ph">${hotelIconSvg()}</div></div>`;
  return `<button type="button" class="hotel-card" data-stay="${esc(stay.id)}">
    ${thumb}
    <div class="meta">
      <div class="name">${esc(h.name || "Hôtel à définir")}</div>
      <div class="row"><em>${esc(h.area || "")}</em></div>
      <div class="row">${esc(stay.nights)} · ${esc(h.checkIn || stay.from)} → ${esc(h.checkOut || stay.to)}</div>
      <div class="row" style="margin-top:6px"><span class="status ${statusClass(h.status)}">${statusLabel(h.status)}</span></div>
    </div>
  </button>`;
}
function stayGroups(c, days){
  if (c.id === "tokyo" && c.stays.length >= 2){
    return [
      // Séjour 1 + jour de départ vers Fuji (jour 5, parfois sans idées Tokyo)
      { stay: c.stays[0], days: days.filter(d => d.n <= 5) },
      // Séjour 2 : retour shinkansen + jours Tokyo + vol
      { stay: c.stays[1], days: days.filter(d => d.n >= 20) }
    ];
  }
  return [{ stay: c.stays[0], days }];
}

/** Hôtel du séjour correspondant au jour ouvert (Tokyo a 2 séjours). */
function stayForDay(cityId, day){
  const c = CITIES[cityId];
  if (!c || !day) return null;
  const groups = stayGroups(c, daysForCity(cityId));
  for (const g of groups){
    if ((g.days || []).some(d => d.n === day.n)) return g.stay;
  }
  return (c.stays && c.stays[0]) || null;
}

function dayPinPoints(cityId, day){
  const b = MAP_BOUNDS[cityId];
  if (!b) return [];
  const inMap = p => p && p.lat != null && inBounds(b, p.lat, p.lng);
  const isAirport = s => /aéroport|aeroport|airport|\bhnd\b|\bcdg\b/i.test(`${s.kind || ""} ${s.name || ""}`);

  const activities = [];
  ideasOf(day).forEach(a => { if (inMap(a)) activities.push(a); });

  const stops = [];
  (day.moves || []).forEach(m => {
    const leg = LEGS.find(l => l.id === m.leg);
    if (!leg) return;
    [leg.fromStop, leg.toStop].forEach(s => {
      if (!inMap(s)) return;
      if (activities.length && isAirport(s)) return;
      stops.push(s);
    });
  });

  const stay = stayForDay(cityId, day);
  const h = stay && stay.hotel;
  const hotel = inMap(h) ? [h] : [];

  // Cadrer sur le programme du jour, pas les transferts lointains (ex. Haneda le jour 1).
  if (activities.length) return [...activities, ...hotel];
  if (stops.length) return [...stops, ...hotel];
  return hotel;
}

function focusDayMap(cityId, day){
  if (!cityImg.naturalWidth) return;
  layoutCityPins();
  const bounds = MAP_BOUNDS[cityId];
  const pts = dayPinPoints(cityId, day);
  const min = cityCam.minScale();
  const mobile = window.matchMedia("(max-width: 900px)").matches;
  const nw = cityImg.naturalWidth;
  const nh = cityImg.naturalHeight;
  if (!pts.length) {
    cityCam.fitCover(mobile ? 1.55 : 1.38);
    return;
  }
  if (pts.length === 1) {
    const pct = pctIn(bounds, pts[0].lat, pts[0].lng);
    cityCam.focusPct(pct.left, pct.top, min * (mobile ? 2.8 : 2.6));
    return;
  }
  let minL = 100, maxL = 0, minT = 100, maxT = 0;
  pts.forEach(p => {
    const pct = pctIn(bounds, p.lat, p.lng);
    minL = Math.min(minL, pct.left);
    maxL = Math.max(maxL, pct.left);
    minT = Math.min(minT, pct.top);
    maxT = Math.max(maxT, pct.top);
  });
  const cx = (minL + maxL) / 2;
  const cy = (minT + maxT) / 2;
  const span = Math.max(maxL - minL, maxT - minT, 4);

  if (mobile) {
    // Sur mobile le cadre est court (sheet) : zoomer fort sur le centre du jour
    // plutôt qu’un fitWorldBox trop proche du fitCover.
    const factor = Math.min(3.1, Math.max(2.5, 3.1 - span * 0.02));
    cityCam.focusPct(cx, cy, min * factor);
    return;
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  pts.forEach(p => {
    const pct = pctIn(bounds, p.lat, p.lng);
    const x = (pct.left / 100) * nw;
    const y = (pct.top / 100) * nh;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  const pad = 56;
  const box = {
    minX: minX - pad,
    minY: minY - pad,
    maxX: maxX + pad,
    maxY: maxY + pad
  };
  cityCam.fitWorldBox(box, { top: 32, right: 32, bottom: 32, left: 32 });
  const cap = min * 2.7;
  if (cityCam.state.s > cap) {
    const bx = (box.minX + box.maxX) / 2;
    const by = (box.minY + box.maxY) / 2;
    const vw = cityFrame.clientWidth;
    const vh = cityFrame.clientHeight;
    cityCam.state.s = cap;
    cityCam.state.x = vw / 2 - bx * cap;
    cityCam.state.y = vh / 2 - by * cap;
    cityCam.clamp();
    cityCam.apply();
  }
}

function mapsIconSvg(){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>`;
}
function mapsDirectionsUrl(act){
  if (!act || act.lat == null || act.lng == null) return null;
  const dest = `${act.lat},${act.lng}`;
  // origin omis → Google Maps utilise la position actuelle sur le téléphone
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=walking`;
}
function mapsLinkHtml(act, kind){
  const url = mapsDirectionsUrl(act);
  if (!url) return "";
  if (kind === "detail") {
    return `<a class="detail-maps" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><span>${mapsIconSvg()}</span><span>Itinéraire Google Maps</span></a>`;
  }
  return `<a class="act-maps" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="Itinéraire depuis ma position" aria-label="Ouvrir l’itinéraire Google Maps">${mapsIconSvg()}</a>`;
}
function notesListHtml(notes){
  const list = notes || [];
  if (!list.length) return "";
  return `<ul class="detail-notes">${list.map(n => `<li>${esc(n)}</li>`).join("")}</ul>`;
}
function actLinksHtml(links){
  const list = links || [];
  if (!list.length) return "";
  return `<div class="act-links">` + list.map(l =>
    `<a class="act-link" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label || l.url)}</a>`
  ).join("") + `</div>`;
}

function renderIdeas(list, offset){
  offset = offset || 0;
  return (list || []).map((a, i) =>
    `<div class="act" data-act-idx="${offset + i}" role="button" tabindex="0"><span class="dot"></span><div class="act-title">${esc(a.title)}</div>${mapsLinkHtml(a, "list")}</div>`
  ).join("");
}
function renderLuggageLocker(day){
  if (!day) return "";
  const stay = stayForDay(day.city, day);
  const h = stay && stay.hotel;
  const firstStay = h && h.name && h.name !== "—" && isFirstDayOfStay(day.city, day);
  const checkInSort = firstStay ? parseHotelTimeSort(h.checkIn, 16 * 60) : null;
  const moveRange = moveSortRange(day.moves || []);
  const early = firstStay && isEarlyArrivalBeforeCheckIn(moveRange, checkInSort);
  if (!day.luggageLocker && !early) return "";
  const locker = day.luggageLocker || {};
  const title = locker.title || "Consigne bagages";
  const when = locker.when || (early ? "Après arrivée · avant check-in" : "");
  const desc = locker.desc || (early ? "À renseigner quand une consigne sera trouvée." : "");
  // Pas de pin / pas de Maps tant qu’il n’y a pas de coords
  return `<div class="act act-locker" role="note">` +
    `<span class="dot"></span>` +
    `<div>` +
    `<div class="act-title">${esc(title)}</div>` +
    (when ? `<div class="when">${esc(when)}</div>` : "") +
    (desc ? `<div class="dummy">${esc(desc)}</div>` : "") +
    `</div>` +
    `</div>`;
}
function stopEntryOnCity(cityId, stopRef){
  if (!cityId || !stopRef || stopRef.lat == null || stopRef.lng == null) return null;
  const b = MAP_BOUNDS[cityId];
  if (!b || !inBounds(b, stopRef.lat, stopRef.lng)) return null;
  const key = stopRef.lat.toFixed(4) + "," + stopRef.lng.toFixed(4);
  return stopsOnMap(cityId).find(s =>
    s.lat.toFixed(4) + "," + s.lng.toFixed(4) === key
  ) || null;
}
function moveStationBtnHtml(cityId, stop, role){
  const entry = stopEntryOnCity(cityId, stop);
  if (!entry) return "";
  const label = role === "from" ? "Départ" : "Arrivée";
  return `<button type="button" class="move-station-btn" data-stop-lat="${entry.lat}" data-stop-lng="${entry.lng}">` +
    `<span class="move-station-role">${esc(label)}</span>` +
    `<span class="move-station-name">${esc(entry.name)}</span>` +
    `</button>`;
}
function groupMovesByJourney(list){
  const groups = [];
  let current = null;
  (list || []).forEach(m => {
    if (m.journey) {
      if (!current || current.id !== m.journey) {
        current = { id: m.journey, title: "", meta: "", dest: "", moves: [] };
        groups.push(current);
      }
      const j = journeyById(m.journey);
      if (m.journeyTitle) current.title = m.journeyTitle;
      else if (j && j.title) current.title = j.title;
      if (m.journeyMeta) current.meta = m.journeyMeta;
      else if (j && j.meta) current.meta = j.meta;
      if (j && j.dest) current.dest = j.dest;
      current.moves.push(m);
      return;
    }
    current = null;
    groups.push({ id: null, moves: [m] });
  });
  return groups;
}
function renderMoveCard(m, cityId){
  const leg = m.leg ? LEGS.find(l => l.id === m.leg) : null;
  const mode = (leg && leg.mode) || m.mode || "";
  const when = leg
    ? `${leg.depart || "—"} → ${leg.arrive || "—"}`
    : (m.when || "");
  const ticket = leg
    ? `${statusLabel(leg.status)} · ${leg.payment || ""}`
    : (m.dummy || "");
  const role = m.role ? `<span class="badge-tag" style="margin-bottom:6px">${esc(m.role)}</span>` : "";
  const stops = leg && (leg.fromStop || leg.toStop)
    ? `<div class="dummy stops">${esc(stopLabel(leg.fromStop))} → ${esc(stopLabel(leg.toStop))}</div>`
    : "";
  const stationBtns = leg
    ? [moveStationBtnHtml(cityId, leg.fromStop, "from"), moveStationBtnHtml(cityId, leg.toStop, "to")].filter(Boolean).join("")
    : "";
  const stationActions = stationBtns
    ? `<div class="move-station-actions">${stationBtns}</div>`
    : "";
  const cls = m.transfer ? "move move-transfer" : "move";
  return `<div class="${cls}"${m.leg ? ` data-leg="${m.leg}"` : ""}>${role}<div class="when">${esc(mode)} · ${esc(when)}</div><div class="title">${esc(m.title)}</div>${stops}<div class="dummy">${esc(ticket)}</div>${stationActions}</div>`;
}
function renderMoves(list, cityId){
  return groupMovesByJourney(list).map(g => {
    const inner = g.moves.map(m => renderMoveCard(m, cityId)).join("");
    if (!g.id) return inner;
    const j = journeyById(g.id);
    const destLine = g.dest
      ? `<p class="journey-dest">Destination · <strong>${esc(g.dest)}</strong>${j && j.destJp ? ` <span class="jp-name">${esc(j.destJp)}</span>` : ""}</p>`
      : "";
    return `<section class="journey-block" data-journey="${esc(g.id)}">` +
      `<div class="journey-head">` +
      `<div class="journey-head-text">` +
      (j && j.subtitle ? `<span class="journey-label">${esc(j.subtitle)}</span>` : "") +
      `<h3>${esc(g.title || "Trajet")}</h3>` +
      `</div>` +
      (g.meta ? `<span class="journey-meta">${esc(g.meta)}</span>` : "") +
      `</div>` +
      destLine +
      `<div class="journey-steps">${inner}</div>` +
      `</section>`;
  }).join("");
}
function stopLabel(s){
  if (!s) return "—";
  return s.name || "—";
}
function cityIdForCoords(lat, lng){
  if (lat == null || lng == null) return null;
  for (const id of ORDER){
    if (inBounds(MAP_BOUNDS[id], lat, lng)) return id;
  }
  return null;
}
function mapViewportInsets(){
  const mobile = window.matchMedia("(max-width: 900px)").matches;
  const panel = document.getElementById("panel");
  const open = panel && panel.classList.contains("open");
  if (mobile) {
    if (!open) return { top: 56, right: 28, bottom: 36, left: 28 };
    if (panel.classList.contains("minimized")) {
      return { top: 56, right: 20, bottom: 72, left: 20 };
    }
    if (panel.classList.contains("expanded")) {
      const h = panel.offsetHeight || Math.round(window.innerHeight * 0.78);
      return { top: 48, right: 16, bottom: h + 20, left: 16 };
    }
    const h = panel.offsetHeight || Math.round(window.innerHeight * 0.42);
    return { top: 52, right: 16, bottom: h + 24, left: 16 };
  }
  if (open) {
    const pw = panel.offsetWidth || 380;
    return { top: 52, right: pw + 28, bottom: 40, left: 40 };
  }
  return { top: 52, right: 52, bottom: 52, left: 52 };
}

function legPathBounds(leg){
  const parts = legRouteParts(leg);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  parts.forEach(part => {
    const box = pathBoundsFromD(routePathD(part), 0);
    if (!box) return;
    minX = Math.min(minX, box.minX); minY = Math.min(minY, box.minY);
    maxX = Math.max(maxX, box.maxX); maxY = Math.max(maxY, box.maxY);
  });
  if (!isFinite(minX)) {
    [leg.from, ...(leg.via || []), leg.to].forEach(p => {
      if (!p || p.lat == null) return;
      const pt = projectJapan(p.lat, p.lng);
      minX = Math.min(minX, pt.x); minY = Math.min(minY, pt.y);
      maxX = Math.max(maxX, pt.x); maxY = Math.max(maxY, pt.y);
    });
  }
  if (!isFinite(minX)) return null;
  const pad = 36;
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
}

function setLegMode(on){
  document.querySelector(".app")?.classList.toggle("leg-mode", !!on);
}
function legEndPoint(leg, role){
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
function clearLegEnds(){
  document.querySelectorAll(".city-mark").forEach(b => {
    b.classList.remove("leg-from", "leg-to", "leg-via", "leg-related");
  });
}
function renderLegEnds(leg){
  [legEndPoint(leg, "from"), legEndPoint(leg, "to")].filter(Boolean).forEach(end => {
    if (!end.cityId) return;
    const mark = document.querySelector(`.city-mark[data-city="${end.cityId}"]`);
    if (mark) mark.classList.add("leg-related", end.role === "from" ? "leg-from" : "leg-to");
  });
  (leg.viaCities || []).forEach(id => {
    const mark = document.querySelector(`.city-mark[data-city="${id}"]`);
    if (mark) mark.classList.add("leg-related", "leg-via");
  });
}
function focusLegEnd(leg, role, pulse){
  const end = legEndPoint(leg, role);
  if (!end) return;
  if (currentCity) showCountry();
  requestAnimationFrame(() => {
    sizeJapanWorld();
    const box = legPathBounds(leg);
    if (box) countryCam.fitWorldBox(box, mapViewportInsets());
    else {
      const pct = pctIn(JAPAN_BOUNDS, end.lat, end.lng);
      countryCam.focusPct(pct.left, pct.top, Math.max(countryCam.minScale() * 2.4, 2.2));
    }
    if (pulse) {
      hint.textContent = (role === "from" ? "Départ" : "Arrivée") + " · " + end.name + (end.cityId && CITIES[end.cityId] ? " · " + CITIES[end.cityId].name : "");
    }
  });
}
function focusLegOverview(leg){
  const a = legEndPoint(leg, "from");
  const b = legEndPoint(leg, "to");
  const pts = [a, b].filter(Boolean);
  if (!pts.length) return;
  requestAnimationFrame(() => {
    sizeJapanWorld();
    const box = legPathBounds(leg);
    if (box) {
      countryCam.fitWorldBox(box, mapViewportInsets());
    } else if (pts.length === 1) {
      const pct = pctIn(JAPAN_BOUNDS, pts[0].lat, pts[0].lng);
      countryCam.focusPct(pct.left, pct.top, Math.max(countryCam.minScale() * 2.2, 2));
    } else {
      const minLat = Math.min(a.lat, b.lat), maxLat = Math.max(a.lat, b.lat);
      const minLng = Math.min(a.lng, b.lng), maxLng = Math.max(a.lng, b.lng);
      const p1 = projectJapan(minLat, minLng);
      const p2 = projectJapan(maxLat, maxLng);
      countryCam.fitWorldBox({
        minX: Math.min(p1.x, p2.x),
        minY: Math.min(p1.y, p2.y),
        maxX: Math.max(p1.x, p2.x),
        maxY: Math.max(p1.y, p2.y)
      }, mapViewportInsets());
    }
  });
}
function renderJourneyEnds(journey, legs){
  clearLegEnds();
  if (!legs.length) return;
  const first = legs[0];
  const last = legs[legs.length - 1];
  [legEndPoint(first, "from"), legEndPoint(last, "to")].forEach(end => {
    if (!end || !end.cityId) return;
    const mark = document.querySelector(`.city-mark[data-city="${end.cityId}"]`);
    if (mark) mark.classList.add("leg-related", end.role === "from" ? "leg-from" : "leg-to");
  });
  const viaIds = new Set();
  legs.forEach((leg, i) => {
    if (i > 0) {
      const from = legEndPoint(leg, "from");
      if (from && from.cityId) viaIds.add(from.cityId);
    }
    if (i < legs.length - 1) {
      const to = legEndPoint(leg, "to");
      if (to && to.cityId) viaIds.add(to.cityId);
    }
  });
  viaIds.forEach(id => {
    const firstLeg = legs[0];
    const lastLeg = legs[legs.length - 1];
    const fromId = legEndPoint(firstLeg, "from")?.cityId;
    const toId = legEndPoint(lastLeg, "to")?.cityId;
    if (id === fromId || id === toId) return;
    const mark = document.querySelector(`.city-mark[data-city="${id}"]`);
    if (mark) mark.classList.add("leg-related", "leg-via");
  });
}
function journeyPathBounds(legs){
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  legs.forEach(leg => {
    const box = legPathBounds(leg);
    if (!box) return;
    minX = Math.min(minX, box.minX); minY = Math.min(minY, box.minY);
    maxX = Math.max(maxX, box.maxX); maxY = Math.max(maxY, box.maxY);
  });
  if (!isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}
function focusJourneyOverview(legs){
  requestAnimationFrame(() => {
    sizeJapanWorld();
    const box = journeyPathBounds(legs);
    if (box) countryCam.fitWorldBox(box, mapViewportInsets());
  });
}
function openJourney(journeyId, focusLegId){
  const j = journeyById(journeyId);
  const legs = legsInJourney(journeyId);
  if (!j || !legs.length) {
    if (focusLegId) openLeg(focusLegId, { forceSingle: true });
    return;
  }
  const moves = dayMovesForJourney(journeyId);
  panelContext = { type: "journey", journey: j, legs };
  showCountry();
  setLegMode(true);
  setJourneyHighlight(journeyId);
  document.querySelectorAll("#routes path.route-hit").forEach(p => {
    p.style.pointerEvents = "";
  });
  setActiveCity(null);
  renderJourneyEnds(j, legs);
  const destLine = j.dest
    ? `<p class="journey-dest panel-journey-dest">Destination · <strong>${esc(j.dest)}</strong>${j.destJp ? ` <span class="jp-name">${esc(j.destJp)}</span>` : ""}</p>`
    : "";
  panel.classList.remove("panel-city");
  panel.classList.add("panel-leg", "panel-journey");
  panel.innerHTML =
    sheetGrabHtml() +
    `<div class="overlay-head"><div class="head-text"><h2>${esc(j.title)}</h2><span class="jp-name">${esc(j.subtitle || "")}${j.meta ? " · " + esc(j.meta) : ""}</span></div><button class="close" type="button" aria-label="Fermer">×</button></div>` +
    `<div class="overlay-body">` +
    `<span class="sheet-kind trajet">Trajet · ${legs.length} étapes</span>` +
    destLine +
    `<div class="journey-panel-steps">${moves.map(m => renderMoveCard(m, null)).join("")}</div>` +
    `<p class="note">Cliquer une étape pour les détails et réservations.</p>` +
    `</div>`;
  panel.classList.add("open");
  bindSheetGrab();
  panel.querySelector(".close").onclick = () => closePanel(true);
  panel.querySelectorAll(".move[data-leg]").forEach(n => {
    n.addEventListener("click", e => {
      e.stopPropagation();
      openLeg(n.dataset.leg, { fromJourney: true });
    });
  });
  if (window.matchMedia("(max-width: 900px)").matches) {
    setSheetState("mid");
  }
  hint.textContent = "Trajet · " + j.title;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => focusJourneyOverview(legs));
  });
}
function openCityAtLegEnd(leg, role){
  const end = legEndPoint(leg, role);
  if (!end || !end.cityId || !CITIES[end.cityId]) {
    focusLegEnd(leg, role, true);
    return;
  }
  openCity(end.cityId);
  // After city map loads, highlight the stop pin
  const tryFocus = () => {
    if (!cityImg.complete || !cityImg.naturalWidth || currentCity !== end.cityId) {
      setTimeout(tryFocus, 80);
      return;
    }
    const stop = stopsOnMap(end.cityId).find(s =>
      Math.abs(s.lat - end.lat) < 0.0008 && Math.abs(s.lng - end.lng) < 0.0008
    );
    if (stop) openStopDetail(stop);
    else highlightPin({ lat: end.lat, lng: end.lng, title: end.name });
  };
  setTimeout(tryFocus, 120);
}
function stopBlockHtml(leg){
  if (!leg.fromStop && !leg.toStop) return "";
  const row = (label, s, role) => {
    if (!s) return "";
    const title = s.jp ? `${s.name} · ${s.jp}` : (s.name || "—");
    const hasGeo = s.lat != null && s.lng != null;
    if (!hasGeo) {
      return `<div class="stat wide"><span>${esc(label)} · ${esc(s.kind || "Arrêt")}</span><strong>${esc(title)}</strong></div>`;
    }
    return `<button type="button" class="stat wide stop-jump" data-end="${esc(role)}">` +
      `<span>${esc(label)} · ${esc(s.kind || "Arrêt")}</span>` +
      `<strong>${esc(title)}</strong>` +
      `<em class="jump-hint">Voir sur la carte</em>` +
      `</button>`;
  };
  return row("Départ", leg.fromStop, "from") + row("Arrivée", leg.toStop, "to");
}
function parseBookingDate(iso){
  if (!iso) return null;
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}
function todayLocalDate(){
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
function formatBookingDateFr(d){
  if (!d) return "";
  return d.toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" });
}
/** Jaune = pas encore · Rouge = réservable · Vert = déjà réservé. */
function bookingOpenStatus(link, leg){
  const legDone = leg && (leg.status === "reserved" || leg.status === "paid");
  const linkDone = !!(link.reserved || link.paid || legDone);
  if (linkDone) {
    return {
      key:"reserved",
      label: leg && leg.status === "paid" ? "Payé / réservé" : "Réservé"
    };
  }
  if (link.optional && !link.openFrom) {
    return { key:"optional", label:"Optionnel · IC le jour J" };
  }
  const open = parseBookingDate(link.openFrom);
  if (!open) return { key:"bookable", label: link.optional ? "Optionnel · réservable" : "Réservable" };
  const today = todayLocalDate();
  const days = Math.round((open.getTime() - today.getTime()) / 86400000);
  const when = formatBookingDateFr(open);
  const time = link.openTime ? ` · ${link.openTime} JST` : "";
  if (days <= 0) {
    return {
      key:"bookable",
      label: link.optional ? "Optionnel · réservable" : "Réservable — à réserver"
    };
  }
  // Pas encore (jaune) — y compris « bientôt »
  if (days <= 14) {
    return {
      key:"wait",
      label: `${link.optional ? "Optionnel · " : ""}Bientôt · dans ${days} j · ${when}${time}`
    };
  }
  return {
    key:"wait",
    label: `${link.optional ? "Optionnel · " : ""}Pas encore · ouvre ${when}${time}`
  };
}
function legBookingsHtml(leg){
  const b = leg.bookings;
  if (!b || !b.links || !b.links.length) return "";
  const statuses = b.links.map(l => bookingOpenStatus(l, leg));
  const required = statuses.filter(s => s.key !== "optional");
  const pool = required.length ? required : statuses;
  const hasReserved = pool.some(s => s.key === "reserved");
  const hasBookable = pool.some(s => s.key === "bookable");
  const hasWait = pool.some(s => s.key === "wait");
  const allReserved = pool.length && pool.every(s => s.key === "reserved");
  const summaryKey = allReserved ? "reserved"
    : hasReserved && (hasBookable || hasWait) ? "bookable"
    : hasBookable ? "bookable"
    : hasWait ? "wait"
    : "optional";
  const summaryLabel =
    summaryKey === "reserved" ? "Déjà réservé" :
    summaryKey === "bookable" && hasWait ? "Partiellement réservable" :
    summaryKey === "bookable" ? "Réservable — action requise" :
    summaryKey === "wait" ? "Pas encore réservable" :
    "Réservation optionnelle";
  const summary =
    `<div class="booking-summary status-${esc(summaryKey)}">` +
    `<span class="booking-dot" aria-hidden="true"></span>` +
    `<span>${esc(summaryLabel)}</span></div>`;
  const note = b.note ? `<p class="note booking-note">${esc(b.note)}</p>` : "";
  const links = b.links.map((l, i) => {
    const st = statuses[i];
    return `<a class="booking-link status-${esc(st.key)}" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">` +
      `<span class="booking-status"><span class="booking-dot" aria-hidden="true"></span>${esc(st.label)}</span>` +
      `<span class="booking-site">${esc(l.site || "Book")}</span>` +
      `<strong>${esc(l.label)}</strong>` +
      `</a>`;
  }).join("");
  return `<div class="leg-bookings"><h4>Réservation en ligne (EN)</h4>${summary}<div class="booking-links">${links}</div>${note}</div>`;
}
function legEndsToolbarHtml(leg){
  const a = legEndPoint(leg, "from");
  const b = legEndPoint(leg, "to");
  const btn = (end, role) => {
    if (!end) return "";
    const tag = role === "from" ? "Départ" : "Arrivée";
    const city = end.cityId && CITIES[end.cityId] ? CITIES[end.cityId].name : "";
    return `<div class="leg-end-actions">` +
      `<button type="button" class="leg-focus-btn ${role}" data-end="${role}">` +
      `<span class="ab">${role === "from" ? "A" : "B"}</span>` +
      `<span class="txt"><em>${esc(tag)}</em><strong>${esc(end.name)}</strong>${city ? `<small>${esc(city)}</small>` : ""}</span>` +
      `</button>` +
      (end.cityId
        ? `<button type="button" class="leg-city-btn" data-end-city="${role}" title="Ouvrir la carte ville">Ville</button>`
        : "") +
      `</div>`;
  };
  return `<div class="leg-ends-bar">${btn(a, "from")}${btn(b, "to")}</div>`;
}

function photoSlug(act){
  if (act.slug) return act.slug;
  const t = (act.title || "").toLowerCase();
  const rules = [
    [/akihabara/, "akihabara"], [/shinjuku/, "shinjuku"], [/sens[oō]-?ji|asakusa/, "sensoji"],
    [/ueno/, "ueno"], [/meiji/, "meiji"], [/harajuku|omotesand[oō]/, "harajuku"], [/shibuya/, "shibuya"],
    [/odaiba|gundam/, "odaiba"], [/tokyo tower/, "tokyo-tower"], [/chūrei|churei|pagode/, "chureito"],
    [/kawaguchi|lac kawaguchi/, "kawaguchi"], [/kenroku/, "kenrokuen"], [/château de kanazawa/, "kanazawa-castle"],
    [/shirakawa/, "shirakawa"], [/sanmachi/, "sanmachi"], [/kiyomizu/, "kiyomizu"],
    [/arashiyama|bambou/, "arashiyama"], [/kinkaku/, "kinkakuji"], [/fushimi|inari/, "fushimi"],
    [/nij[oō]|nijo|nijō/, "nijo"], [/parc de nara|cerfs/, "nara-park"], [/t[oō]dai|todai/, "todaiji"],
    [/d[oō]tonbori|dotonbori/, "dotonbori"], [/universal/, "usj"], [/château d[’']osaka|osaka castle/, "osaka-castle"],
    [/teamlab/, "teamlab"], [/nishiki/, "nishiki"], [/kuromon/, "kuromon"],
    [/character street|tokyo character/, "character-street"], [/sumida/, "sumida"],
    [/nezu|yanaka/, "yanaka"], [/oshino/, "oshino"], [/iyashi|saiko/, "saiko"],
    [/itchiku|kubota/, "itchiku"], [/music forest/, "music-forest"], [/higashi chaya/, "higashi-chaya"],
    [/ōmichō|omicho|ōmicho/, "omicho"], [/oyama/, "oyama"], [/xxie|21st|musée du xxi/, "kanazawa-museum"],
    [/nishi chaya/, "nishi-chaya"], [/nagamachi|samoura/, "nagamachi"], [/feuille d[’']or|gold leaf/, "gold-leaf"],
    [/myōryū|myoryu|ninja/, "myoryuji"], [/teramachi/, "teramachi"], [/miyagawa/, "miyagawa"],
    [/jinya/, "jinya"], [/pontochō|pontocho/, "pontocho"], [/cérémonie du thé|ceremonie du the|matcha/, "tea"],
    [/wagashi/, "wagashi"], [/yasaka/, "yasaka"], [/daigo/, "daigo"], [/philosophe/, "philosopher"],
    [/kōfuku|kofuku/, "kofukuji"], [/kasuga/, "kasuga"], [/namba yasaka/, "namba-yasaka"],
    [/den den/, "denden"], [/shinsekai|tsūten|tsuten/, "shinsekai"], [/shinsaibashi/, "shinsaibashi"],
    [/hozenji/, "hozenji"], [/palais impérial|jardins est/, "imperial"], [/ginza|itoya/, "ginza"],
    [/animate/, "animate"], [/téléphérique|telepherique|ropeway|panoramique/, "ropeway"],
    [/momiji/, "momiji"]
  ];
  for (const [re, slug] of rules){
    if (re.test(t)) return slug;
  }
  return null;
}

function photosFor(act){
  const out = [];
  const seen = new Set();
  const push = src => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    out.push(src);
  };
  if (act.photo) push(act.photo);
  (act.photos || []).forEach(push);
  if (act.img) push(act.img);
  const slug = photoSlug(act);
  if (slug){
    push("./img/activities/" + slug + ".jpg");
    push("./img/activities/" + slug + "-2.jpg");
    push("./img/activities/" + slug + "-3.jpg");
    // related fallbacks from same city vibe
    const related = {
      akihabara: ["shinjuku","shibuya"], shinjuku: ["shibuya","tokyo-tower"], sensoji: ["ueno","yanaka"],
      ueno: ["sensoji","yanaka"], meiji: ["harajuku","shibuya"], harajuku: ["meiji","shibuya"],
      shibuya: ["harajuku","shinjuku"], odaiba: ["tokyo-tower","teamlab"], teamlab: ["odaiba","tokyo-tower"],
      "tokyo-tower": ["odaiba","shinjuku"], chureito: ["kawaguchi","oshino"], kawaguchi: ["chureito","ropeway"],
      kenrokuen: ["kanazawa-castle","higashi-chaya"], "kanazawa-castle": ["kenrokuen","omicho"],
      shirakawa: ["sanmachi"], sanmachi: ["shirakawa","miyagawa"], kiyomizu: ["yasaka","fushimi"],
      arashiyama: ["kinkakuji","philosopher"], kinkakuji: ["arashiyama","nijo"], fushimi: ["kiyomizu","daigo"],
      nijo: ["nishiki","philosopher"], "nara-park": ["todaiji","kasuga"], todaiji: ["nara-park","kofukuji"],
      dotonbori: ["osaka-castle","shinsaibashi"], usj: ["dotonbori"], "osaka-castle": ["dotonbori","kuromon"]
    };
    (related[slug] || []).forEach(r => {
      push("./img/activities/" + r + ".jpg");
      push("./img/activities/" + r + "-2.jpg");
    });
  }
  return out.slice(0, 5);
}

function photoFor(act){
  const list = photosFor(act);
  return list[0] || null;
}

function renderPhotoGallery(srcs, kind){
  if (!srcs.length){
    return `<div class="detail-hero"><div class="ph">${iconSvg(kind, "#c4a574")}</div></div>`;
  }
  const onErr = `onerror="var box=this.closest('.shot,.detail-hero');if(!box)return;this.remove();if(!box.querySelector('img'))box.style.display='none'"`;
  const hero = `<div class="detail-hero"><img src="${esc(srcs[0])}" alt="" loading="lazy" ${onErr}/><div class="ph" style="display:none">${iconSvg(kind, "#c4a574")}</div></div>`;
  const rest = srcs.slice(1);
  if (!rest.length) return hero;
  const shots = rest.map((src, i) =>
    `<div class="shot${rest.length === 1 || (rest.length === 3 && i === 0) ? " wide" : ""}"><img src="${esc(src)}" alt="" loading="lazy" ${onErr}/></div>`
  ).join("");
  return hero + `<div class="photo-gallery">${shots}</div>`;
}

function showDetailSheet(html){
  const cityEl = panel.querySelector(".city-panel");
  const detailEl = panel.querySelector(".detail-sheet");
  if (!cityEl || !detailEl) return;
  detailEl.innerHTML =
    `<button type="button" class="detail-back">← Retour aux jours</button>${html}`;
  cityEl.style.display = "none";
  detailEl.classList.add("show");
  // Revenir en haut du panneau (titre / description, pas les photos)
  const body = panel.querySelector(".overlay-body");
  if (body) body.scrollTop = 0;
  requestAnimationFrame(() => { if (body) body.scrollTop = 0; });
  // Mobile : garder la hauteur actuelle (si réduit → moyen pour lire)
  if (window.matchMedia("(max-width: 900px)").matches) {
    if (sheetState() === "min") setSheetState("mid");
  }
  detailEl.querySelector(".detail-back").onclick = () => {
    detailEl.classList.remove("show");
    detailEl.innerHTML = "";
    cityEl.style.display = "";
    lastFocusAct = null;
    if (body) body.scrollTop = 0;
    if (currentCity){
      const dayEl = panel.querySelector("details.day[open]");
      const dayN = dayEl ? Number(dayEl.dataset.dayN) : null;
      const day = dayN != null ? DAYS.find(d => d.n === dayN) : null;
      renderCityPins(currentCity, day || null, null);
      syncSheetMapInset();
    }
  };
  bindCopyButtons(detailEl);
}

function openActivityDetail(act, opts){
  if (!panelContext || panelContext.type !== "city") return;
  const targetCity = cityIdForAct(act);
  if (targetCity && currentCity && targetCity !== currentCity){
    showCity(targetCity, null);
  }
  const kind = pinKind(act.title);
  const gallery = renderPhotoGallery(photosFor(act), kind);
  showDetailSheet(
    `<span class="sheet-kind activity">Activité</span>` +
    `<h3>${esc(act.title)}</h3>` +
    mapsLinkHtml(act, "detail") +
    `<p class="desc">${esc(act.desc || "")}</p>` +
    notesListHtml(act.notes) +
    actLinksHtml(act.links) +
    gallery +
    contextPhraseHtml(phraseContextForAct(act))
  );
  highlightPin(act, opts);
}

function openHotelDetail(stay){
  if (!panelContext || panelContext.type !== "city") return;
  const h = stay.hotel || {};
  const mapAct = (h.lat != null && h.lng != null) ? { lat: h.lat, lng: h.lng, title: h.name } : null;
  const photos = hotelPhotos(h);
  showDetailSheet(
    `<span class="sheet-kind hotel">Hôtel</span>` +
    `<h3>${esc(h.name || "Hôtel à définir")}</h3>` +
    (mapAct ? mapsLinkHtml(mapAct, "detail") : "") +
    `<p class="desc">${esc(h.desc || "")}</p>` +
    renderPhotoGallery(photos, "town") +
    `<div class="pill-row"><span class="status ${statusClass(h.status)}">${statusLabel(h.status)}</span></div>` +
    `<dl class="detail-kv">` +
    `<dt>Séjour</dt><dd>${esc(stay.label || "")}</dd>` +
    `<dt>Dates</dt><dd>${esc(stay.from)} → ${esc(stay.to)} · ${esc(stay.nights)}</dd>` +
    `<dt>Quartier</dt><dd>${esc(h.area || "—")}</dd>` +
    `<dt>Adresse</dt><dd>${copyFieldHtml(h.address || "—")}</dd>` +
    `<dt>Arrivée</dt><dd>${esc(h.checkIn || "—")}</dd>` +
    `<dt>Départ</dt><dd>${esc(h.checkOut || "—")}</dd>` +
    (h.phone ? `<dt>Téléphone</dt><dd>${copyFieldHtml(h.phone)}</dd>` : "") +
    `<dt>Prix</dt><dd>${esc(h.price || "—")}</dd>` +
    `</dl>` +
    notesListHtml(h.notes) +
    contextPhraseHtml("hotel")
  );
  if (mapAct) highlightPin(mapAct);
}

function openStopDetail(stop, opts){
  if (!panelContext || panelContext.type !== "city") return;
  const mapAct = { lat: stop.lat, lng: stop.lng, title: stop.name };
  const legsHtml = (stop.legs || []).map(({ leg, role }) => {
    const roleLabel = role === "from" ? "Départ" : "Arrivée";
    return `<button type="button" class="stop-leg-link" data-leg="${esc(leg.id)}">` +
      `<span class="when">${esc(roleLabel)} · ${esc(leg.mode)}</span>` +
      `<strong>${esc(leg.title)}</strong>` +
      `<span class="dummy">${esc(leg.subtitle || "")}</span>` +
      `</button>`;
  }).join("");
  showDetailSheet(
    `<span class="sheet-kind stop">Trajet</span>` +
    `<h3>${esc(stop.name)}</h3>` +
    (stop.jp ? `<p class="jp-name">${esc(stop.jp)}</p>` : "") +
    mapsLinkHtml(mapAct, "detail") +
    `<dl class="detail-kv">` +
    `<dt>Type</dt><dd>${esc(stop.kind || "Arrêt")}</dd>` +
    `</dl>` +
    (legsHtml ? `<div class="stop-legs">${legsHtml}</div>` : "") +
    contextPhraseHtml(stopPhraseContext(stop))
  );
  const sheet = panel.querySelector(".detail-sheet");
  if (sheet) {
    sheet.querySelectorAll(".stop-leg-link[data-leg]").forEach(n => {
      n.addEventListener("click", () => openLeg(n.dataset.leg));
    });
  }
  highlightPin(mapAct, opts);
}

function bindPanel(days, cityId){
  days = days || [];
  cityId = cityId || (panelContext && panelContext.city && panelContext.city.id);
  panel.querySelector(".close").onclick = () => closePanel(true);
  panel.querySelectorAll(".move-station-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const lat = Number(btn.dataset.stopLat);
      const lng = Number(btn.dataset.stopLng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const stop = stopEntryOnCity(cityId, { lat, lng });
      if (stop) openStopDetail(stop, { zoom: true });
      else highlightPin({ lat, lng, title: btn.querySelector(".move-station-name")?.textContent || "Gare" }, { zoom: true });
    });
  });
  panel.querySelectorAll(".journey-block[data-journey]").forEach(block => {
    block.querySelector(".journey-head")?.addEventListener("click", () => {
      openJourney(block.dataset.journey);
    });
  });
  panel.querySelectorAll(".move[data-leg]").forEach(n =>
    n.addEventListener("click", () => openLeg(n.dataset.leg))
  );
  panel.querySelectorAll(".hotel-card[data-stay]").forEach(n => {
    n.addEventListener("click", () => {
      const stay = (panelContext.city.stays || []).find(s => s.id === n.dataset.stay);
      if (stay) openHotelDetail(stay);
    });
  });
  panel.querySelectorAll("details.day").forEach((el) => {
    const dayN = Number(el.dataset.dayN);
    const day = days.find(d => d.n === dayN) || days[0];
    const filtered = [].concat(
      ideasForCity(day && day.ideas, cityId),
      ideasForCity(day && day.ideasAfter, cityId)
    );
    el.querySelectorAll(".act").forEach(node => {
      const idx = Number(node.dataset.actIdx);
      const act = filtered[idx];
      if (!act) return;
      const open = () => openActivityDetail(act, { zoom: true });
      node.addEventListener("click", (e) => {
        if (e.target.closest && e.target.closest("a.act-maps")) return;
        open();
      });
      node.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
      const mapBtn = node.querySelector("a.act-maps");
      if (mapBtn) mapBtn.addEventListener("click", e => e.stopPropagation());
    });
    el.addEventListener("toggle", () => {
      if (!currentCity) return;
      if (el.open && day){
        showCity(currentCity, day.n);
        panel.querySelectorAll("details.day").forEach(o => { if (o !== el) o.open = false; });
        scheduleCityMapRefresh();
      } else if (![...panel.querySelectorAll("details.day")].some(d => d.open)){
        showCity(currentCity, null);
        scheduleCityMapRefresh();
      }
    });
  });
}

function sheetGrabHtml(){
  return `<button type="button" class="sheet-grab" aria-label="Glisser ou toucher pour agrandir / réduire" aria-expanded="false"><span class="sheet-bar"></span><span class="sheet-chevron">▴</span></button>`;
}
function sheetState(){
  if (panel.classList.contains("minimized")) return "min";
  if (panel.classList.contains("expanded")) return "max";
  return "mid";
}
function syncSheetMapInset(){
  const app = document.querySelector(".app");
  if (!app) return;
  app.classList.remove("sheet-mid", "sheet-max", "sheet-min");
  const mobile = window.matchMedia("(max-width: 900px)").matches;
  if (mobile && panel.classList.contains("open") && currentCity) {
    const s = sheetState();
    app.classList.add(s === "max" ? "sheet-max" : s === "min" ? "sheet-min" : "sheet-mid");
  }
  // Forcer le reflow puis recentrer tout de suite (pas d’attente d’un clic)
  void cityFrame.offsetHeight;
  const refresh = () => refreshCityMapView();
  refresh();
  requestAnimationFrame(refresh);
}
function setSheetState(s){
  panel.classList.remove("expanded", "minimized");
  if (s === "max") panel.classList.add("expanded");
  if (s === "min") panel.classList.add("minimized");
  const grab = panel.querySelector(".sheet-grab");
  if (grab){
    grab.setAttribute("aria-expanded", s === "max" ? "true" : "false");
    const ch = grab.querySelector(".sheet-chevron");
    if (ch) ch.textContent = s === "max" ? "▾" : "▴";
  }
  syncSheetMapInset();
}
function cycleSheet(){
  const s = sheetState();
  if (s === "mid") setSheetState("max");
  else if (s === "max") setSheetState("min");
  else setSheetState("mid");
}
function bindSheetGrab(){
  panel.classList.remove("expanded", "minimized");
  const grab = panel.querySelector(".sheet-grab");
  if (!grab) return;
  grab.setAttribute("aria-expanded", "false");
  const ch = grab.querySelector(".sheet-chevron");
  if (ch) ch.textContent = "▴";
  syncSheetMapInset();

  let drag = null;
  const onDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag = { y: e.clientY, state: sheetState(), moved: false, id: e.pointerId };
    try { grab.setPointerCapture(e.pointerId); } catch (_) {}
  };
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (Math.abs(e.clientY - drag.y) > 10) drag.moved = true;
  };
  const onUp = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dy = e.clientY - drag.y;
    if (drag.moved && Math.abs(dy) > 36) {
      if (dy > 0) {
        // vers le bas = réduire
        if (drag.state === "max") setSheetState("mid");
        else setSheetState("min");
      } else {
        // vers le haut = agrandir
        if (drag.state === "min") setSheetState("mid");
        else setSheetState("max");
      }
    } else if (!drag.moved) {
      cycleSheet();
    }
    drag = null;
  };
  grab.addEventListener("pointerdown", onDown);
  grab.addEventListener("pointermove", onMove);
  grab.addEventListener("pointerup", onUp);
  grab.addEventListener("pointercancel", () => { drag = null; });
}

function fillCityPanel(c, days, openN){
  panelContext = { type:"city", city:c, days };
  const groups = stayGroups(c, days);
  const staysHtml = groups.map(({ stay, days: stayDays }) => {
    const cards = stayDays.map(d => {
      const moves = d.moves || [];
      const ideas = ideasForCity(d.ideas, c.id);
      const ideasAfter = ideasForCity(d.ideasAfter, c.id);
      const lockerHtml = renderLuggageLocker(d);
      let body = "";
      if (moves.length) body += renderMoves(moves, c.id);
      if (lockerHtml) body += `<h4>Bagages</h4>${lockerHtml}`;
      if (ideas.length) body += `<h4>Idées</h4>${renderIdeas(ideas, 0)}`;
      if (ideasAfter.length) body += `<h4>Après l’arrivée</h4>${renderIdeas(ideasAfter, ideas.length)}`;
      if (!body) body = `<p class="note">Rien de prévu ce jour-là pour cette ville.</p>`;
      return `<details class="day" data-day-n="${d.n}"${d.n === openN ? " open" : ""}><summary><span class="day-title">Jour ${d.n} · ${esc(d.dow)}</span><span class="day-date">${esc(d.date)}</span></summary><div class="slot">${body}</div></details>`;
    }).join("");
    return `<section class="stay-block">
      <div class="stay-head"><h3>${esc(stay.label)}</h3><span class="stay-dates">${esc(stay.from)} → ${esc(stay.to)}</span></div>
      ${renderHotelCard(stay)}
      ${cards}
    </section>`;
  }).join("");

  panel.classList.remove("panel-leg");
  panel.classList.add("panel-city");
  panel.innerHTML =
    sheetGrabHtml() +
    `<div class="overlay-head"><div class="head-text"><h2>${esc(c.name)}</h2><span class="jp-name">${esc(c.jp)} · ville verrouillée</span></div><button class="close" type="button" aria-label="Fermer">×</button></div>` +
    `<div class="overlay-body"><div class="city-panel">${staysHtml}</div><div class="detail-sheet"></div></div>`;
  panel.classList.add("open");
  bindSheetGrab();
  bindPanel(days, c.id);
}

function closePanel(reset){
  if (reset === undefined) reset = true;
  panel.classList.remove("open", "expanded", "minimized", "panel-city", "panel-leg", "panel-journey");
  document.querySelector(".app")?.classList.remove("sheet-mid", "sheet-max", "sheet-min");
  lastFocusAct = null;
  panelContext = null;
  setLegMode(false);
  clearLegEnds();
  setActiveCity(null);
  if (reset) goOverview();
}
function goOverview(){
  panel.classList.remove("open", "expanded", "minimized", "panel-city", "panel-leg", "panel-journey");
  document.querySelector(".app")?.classList.remove("sheet-mid", "sheet-max", "sheet-min");
  lastFocusAct = null;
  panelContext = null;
  setLegMode(false);
  clearLegEnds();
  resetRouteHighlight();
  showCountry();
}
function openCity(id){
  clearLegEnds();
  showCity(id, null);
  fillCityPanel(CITIES[id], daysForCity(id), null);
}
function openLeg(id, opts){
  opts = opts || {};
  const leg = LEGS.find(l => l.id === id);
  if (!leg) return;
  if (leg.journey && !opts.fromJourney && !opts.forceSingle) {
    openJourney(leg.journey, id);
    return;
  }
  panelContext = { type:"leg", leg, journey: leg.journey || null };
  showCountry();
  setLegMode(true);
  if (leg.journey) setJourneyHighlight(leg.journey);
  else setRouteHighlight(id);
  document.querySelectorAll("#routes path.route-hit").forEach(p => {
    p.style.pointerEvents = "";
  });
  setActiveCity(null);
  renderLegEnds(leg);
  const tips = leg.tips ? `<p class="note" style="color:var(--gold-2)">${esc(leg.tips)}</p>` : "";
  const details = (leg.details || []).map(d => `<li>${esc(d)}</li>`).join("");
  const j = leg.journey ? journeyById(leg.journey) : null;
  const journeyBack = leg.journey
    ? `<button type="button" class="journey-back" data-journey="${esc(leg.journey)}">← ${esc(j && j.title ? j.title : "Trajet complet")}</button>`
    : "";
  panel.classList.remove("panel-city", "panel-journey");
  panel.classList.add("panel-leg");
  panel.innerHTML =
    sheetGrabHtml() +
    `<div class="overlay-head"><div class="head-text"><h2>${esc(leg.title)}</h2><span class="jp-name">${esc(leg.subtitle)}</span></div><button class="close" type="button" aria-label="Fermer">×</button></div>` +
    `<div class="overlay-body">` +
    journeyBack +
    `<span class="sheet-kind trajet">Étape</span>` +
    legEndsToolbarHtml(leg) +
    `<div class="pill-row"><span class="status ${statusClass(leg.status)}">${statusLabel(leg.status)}</span></div>` +
    `<div class="trajet-grid">` +
    `<div class="stat"><span>Départ</span><strong>${esc(leg.depart || "—")}</strong></div>` +
    `<div class="stat"><span>Arrivée</span><strong>${esc(leg.arrive || "—")}</strong></div>` +
    modeStatHtml(leg.mode) +
    `<div class="stat"><span>Durée</span><strong>${esc(leg.duration || "—")}</strong></div>` +
    `<div class="stat wide"><span>Compagnie</span><strong>${esc(leg.operator || "—")}</strong></div>` +
    stopBlockHtml(leg) +
    `</div>` +
    `<dl class="detail-kv">` +
    `<dt>Place</dt><dd>${esc(leg.seat || "—")}</dd>` +
    `<dt>Réf. résa</dt><dd>${esc(leg.ref || "—")}</dd>` +
    `<dt>Paiement</dt><dd>${esc(leg.payment || "—")}</dd>` +
    `<dt>Prix</dt><dd>${esc(leg.price || "—")}</dd>` +
    `</dl>` +
    (details ? `<ul class="detail-notes">${details}</ul>` : "") +
    legBookingsHtml(leg) +
    tips +
    contextPhraseHtml(legPhraseContext(leg.mode)) +
    `</div>`;
  panel.classList.add("open");
  bindSheetGrab();
  bindCopyButtons(panel);
  panel.querySelector(".close").onclick = () => closePanel(true);
  panel.querySelectorAll(".journey-back[data-journey]").forEach(n => {
    n.addEventListener("click", () => openJourney(n.dataset.journey));
  });
  panel.querySelectorAll("[data-end]").forEach(n => {
    n.addEventListener("click", () => focusLegEnd(leg, n.dataset.end, true));
  });
  panel.querySelectorAll("[data-end-city]").forEach(n => {
    n.addEventListener("click", () => openCityAtLegEnd(leg, n.dataset.endCity));
  });
  if (window.matchMedia("(max-width: 900px)").matches) {
    setSheetState("mid");
  }
  hint.textContent = "Trajet · détails et arrêts dans le panneau";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => focusLegOverview(leg));
  });
}

ORDER.forEach(id => {
  const c = CITIES[id];
  const b = document.createElement("button");
  b.type = "button";
  b.dataset.city = id;
  b.innerHTML = `<span class="ico">${cityIconSvg(id)}</span><span><strong>${c.name}</strong></span>`;
  b.addEventListener("click", () => openCity(id));
  cityList.appendChild(b);
});

document.getElementById("z-home").onclick = () => closePanel(true);
document.getElementById("z-in").onclick = () => {
  if (countryView.classList.contains("hidden")) cityCam.zoomIn();
  else countryCam.zoomIn();
};
document.getElementById("z-out").onclick = () => {
  if (countryView.classList.contains("hidden")) cityCam.zoomOut();
  else countryCam.zoomOut();
};
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closePanel(true);
});
window.addEventListener("resize", () => {
  if (currentCity) refreshCityMapView();
  else fitJapanHome();
});

function bootCountry(){
  sizeJapanWorld();
  buildCountry();
  showCountry();
}
// Précharge les cartes villes dès que possible (en parallèle de la carte Japon)
preloadCityMaps();
if (japanImg.complete && japanImg.naturalWidth) bootCountry();
else japanImg.onload = bootCountry;
// —— Onglets Préparatifs / Sur place (site statique : Date() + localStorage) ——
function japanTodayISO(){
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date());
  } catch (_) {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }
}
function dayToISO(day){
  // "8 nov 2026" → 2026-11-08
  const m = String(day.date || "").match(/(\d+)\s+nov\s+(\d{4})/i);
  if (!m) return null;
  return m[2] + "-11-" + String(m[1]).padStart(2, "0");
}
function findTripDayByISO(iso){
  return DAYS.find(d => dayToISO(d) === iso) || null;
}
function loadChecks(){
  try { return JSON.parse(localStorage.getItem(CHECK_KEY) || "{}"); } catch (_) { return {}; }
}
function saveChecks(obj){
  try { localStorage.setItem(CHECK_KEY, JSON.stringify(obj)); } catch (_) {}
}
function prepCheckState(){
  const st = loadChecks();
  let changed = false;
  PREP_CHECKS.forEach(item => {
    if (item.done && !(item.id in st)) {
      st[item.id] = true;
      changed = true;
    }
  });
  if (changed) saveChecks(st);
  return st;
}
function renderPrep(){
  const box = document.getElementById("prep-checklist");
  const bud = document.getElementById("prep-budget");
  const who = document.getElementById("prep-travelers");
  if (!box || !bud) return;
  if (who && typeof TRAVELERS !== "undefined") {
    who.textContent = "Voyageurs : " + TRAVELERS.join(" & ");
  }
  const state = prepCheckState();
  box.innerHTML = PREP_CHECKS.map(item => {
    const on = Object.prototype.hasOwnProperty.call(state, item.id) ? !!state[item.id] : !!item.done;
    return `<li><input type="checkbox" id="ck-${item.id}" data-check="${item.id}"${on ? " checked" : ""}/><label for="ck-${item.id}" class="${on ? "done" : ""}">${esc(item.label)}<span class="meta">${esc(item.meta)}</span></label></li>`;
  }).join("");
  box.querySelectorAll("input[data-check]").forEach(inp => {
    inp.addEventListener("change", () => {
      const st = loadChecks();
      st[inp.dataset.check] = inp.checked;
      saveChecks(st);
      const lab = box.querySelector(`label[for="${inp.id}"]`);
      if (lab) lab.classList.toggle("done", inp.checked);
    });
  });
  const rows = PREP_BUDGET.map(b =>
    `<div class="${b.done ? "" : "muted"}">${esc(b.label)}<span class="meta" style="display:block;font-size:12px;font-weight:400">${esc(b.note)}</span></div><div class="amt">${esc(b.amount)}</div>`
  ).join("");
  const tot = (typeof PREP_BUDGET_TOTAL !== "undefined" && PREP_BUDGET_TOTAL)
    ? PREP_BUDGET_TOTAL
    : { label:"Total / pers.", amount:"—" };
  bud.innerHTML = rows + `<div class="total"><span>${esc(tot.label)}</span><span>${esc(tot.amount)}</span></div>`;
  renderPrepBookings();
  renderPrepReminders();
  renderPracticalInfo();
}

function renderPrepBookings(){
  const box = document.getElementById("prep-bookings");
  const lead = document.getElementById("prep-bookings-lead");
  const sec = document.getElementById("prep-bookings-sec");
  if (!box || !sec) return;
  const alerts = collectBookableAlerts();
  sec.classList.toggle("has-bookable", alerts.length > 0);
  if (!alerts.length) {
    if (lead) lead.textContent = "Rien d’ouvert pour l’instant — cette section s’allumera dès qu’un trajet devient réservable.";
    box.innerHTML = `<p class="prep-bookings-empty">Aucun trajet à réserver maintenant.</p>`;
    return;
  }
  if (lead) {
    lead.textContent = alerts.length === 1
      ? "1 trajet est réservable — à faire avant d’oublier."
      : alerts.length + " trajets sont réservables — à faire avant d’oublier.";
  }
  box.innerHTML = alerts.map(a =>
    `<a class="prep-booking-card" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">` +
    `<span class="prep-booking-status"><span class="booking-dot" aria-hidden="true"></span>Réservable</span>` +
    `<strong>${esc(a.legTitle)}</strong>` +
    `<span class="prep-booking-meta">${esc(a.label)} · ${esc(a.site)}</span>` +
    `<span class="prep-booking-go">Ouvrir le site →</span></a>`
  ).join("");
}

function collectPrepReminders(){
  if (typeof PREP_CHECKS === "undefined") return [];
  const state = prepCheckState();
  const today = todayLocalDate();
  return PREP_CHECKS.filter(item => item.remindFrom).map(item => {
    const due = parseBookingDate(item.remindFrom);
    const done = Object.prototype.hasOwnProperty.call(state, item.id) ? !!state[item.id] : !!item.done;
    const days = due ? Math.round((due.getTime() - today.getTime()) / 86400000) : null;
    const active = due ? days <= 0 : false;
    const soon = due ? days > 0 && days <= 45 : false;
    return { ...item, due, days, done, active, soon };
  }).filter(r => !r.done);
}

function renderPrepReminders(){
  const box = document.getElementById("prep-reminders");
  const sec = document.getElementById("prep-reminders-sec");
  if (!box || !sec) return;
  const list = collectPrepReminders();
  if (!list.length) {
    sec.hidden = true;
    return;
  }
  sec.hidden = false;
  const anyActive = list.some(r => r.active);
  sec.classList.toggle("has-due", anyActive);
  box.innerHTML = list.map(r => {
    const when = r.due ? formatBookingDateFr(r.due) : "";
    const badge = r.active
      ? `<span class="prep-reminder-badge due">À faire maintenant</span>`
      : r.days != null
        ? `<span class="prep-reminder-badge">Dans ${r.days} j · ${esc(when)}</span>`
        : "";
    const linkList = (r.links && r.links.length)
      ? r.links
      : (r.url ? [{ label: r.urlLabel || "Ouvrir le guide →", url: r.url }] : []);
    const linksHtml = linkList.map(l =>
      `<a class="prep-reminder-link" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a>`
    ).join("");
    return `<div class="prep-reminder-card${r.active ? " due" : ""}">` +
      `${badge}<strong>${esc(r.label)}</strong>` +
      `<span class="prep-booking-meta">${esc(r.meta)}</span>` +
      (linksHtml ? `<div class="prep-reminder-links">${linksHtml}</div>` : "") +
      `<label class="prep-reminder-check"><input type="checkbox" data-check="${esc(r.id)}"/> Marquer comme fait</label>` +
      `</div>`;
  }).join("");
  box.querySelectorAll("input[data-check]").forEach(inp => {
    inp.addEventListener("change", () => {
      const st = loadChecks();
      st[inp.dataset.check] = inp.checked;
      saveChecks(st);
      renderPrep();
      renderReminderAlert();
    });
  });
}

function copyFieldHtml(text){
  if (!text || text === "—") return esc(text || "—");
  return `<span class="copy-field"><span class="copy-text">${esc(text)}</span>` +
    `<button type="button" class="copy-btn" data-copy-text="${esc(text)}">Copier</button></span>`;
}
function bindCopyButtons(root){
  (root || document).querySelectorAll(".copy-btn[data-copy-text]").forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", async () => {
      const t = btn.getAttribute("data-copy-text");
      if (!t) return;
      try {
        await navigator.clipboard.writeText(t);
        const prev = btn.textContent;
        btn.textContent = "Copié !";
        setTimeout(() => { btn.textContent = prev; }, 1600);
      } catch (_) { /* ignore */ }
    });
  });
}
function contextPhraseHtml(key){
  const list = (typeof CONTEXT_PHRASES !== "undefined" && CONTEXT_PHRASES[key]) || [];
  if (!list.length) return "";
  return `<div class="context-phrases"><h4>Phrases utiles</h4>` +
    list.map(p =>
      `<div class="phrase-sm"><div class="fr">${esc(p.fr)}</div><div class="jp">${esc(p.jp)}</div><div class="ro">${esc(p.ro)}</div></div>`
    ).join("") + `</div>`;
}
function legPhraseContext(mode){
  const m = String(mode || "").toLowerCase();
  if (/avion|vol|plane/.test(m)) return "plane";
  if (/bus/.test(m)) return "bus";
  return "train";
}
function stopPhraseContext(stop){
  const k = stopPinKind(stop);
  if (k === "plane") return "plane";
  if (k === "bus") return "bus";
  return "train";
}
function phraseContextForAct(act){
  const t = (act.title || "").toLowerCase();
  if (/temple|sanctuaire|jinja|dera|shrine|todai|fushimi|meiji|senso|kasuga|kinkaku|kiyomizu|pagode|inari|nijo|kōfuku|kofuku/.test(t)) return "temple";
  if (/marché|marche|market|nishiki|kuromon|omicho|ōmichō|magasin|boutique|shopping|donki|animate|pokemon/.test(t)) return "shop";
  if (/déjeuner|dejeuner|dîner|diner|restaurant|ramen|sushi|wagashi|thé|tea|izakaya|takoyaki|okonomiyaki|street food/.test(t)) return "restaurant";
  return "visit";
}

function openMapForDay(day){
  if (!day || !CITIES[day.city]) return;
  setAppTab("map");
  const id = day.city;
  clearLegEnds();
  showCity(id, day.n);
  fillCityPanel(CITIES[id], daysForCity(id), day.n);
  requestAnimationFrame(() => {
    panel.querySelectorAll("details.day").forEach(el => {
      el.open = Number(el.dataset.dayN) === day.n;
    });
    scheduleCityMapRefresh();
  });
}
function getOnsiteSelectedDay(){
  if (onsiteSelectedDayN != null) return DAYS.find(d => d.n === onsiteSelectedDayN) || null;
  const iso = japanTodayISO();
  return findTripDayByISO(iso);
}
function syncOnsiteMapBtn(day){
  const btn = document.getElementById("onsite-map-btn");
  if (!btn) return;
  if (day && CITIES[day.city]) {
    btn.hidden = false;
    btn.textContent = "Voir sur la carte · " + CITIES[day.city].name;
  } else btn.hidden = true;
}

function parseWhenSort(when){
  const s = String(when || "").toLowerCase();
  const hm = s.match(/(\d{1,2})[:h](\d{2})/);
  if (hm) return parseInt(hm[1], 10) * 60 + parseInt(hm[2], 10);
  if (/matin|morning|tôt|tot/.test(s)) return 8 * 60;
  if (/après-midi|apres-midi|midi/.test(s)) return 13 * 60;
  if (/soir|nuit|après|apres/.test(s)) return 19 * 60;
  if (/arrivée|arrivee|atterr|vol/.test(s)) return 7 * 60;
  return 12 * 60;
}
function parseHotelTimeSort(str, fallback){
  const s = String(str || "");
  const hm = s.match(/(\d{1,2})[:h](\d{2})/);
  if (hm) return parseInt(hm[1], 10) * 60 + parseInt(hm[2], 10);
  if (/matin/.test(s.toLowerCase())) return 9 * 60;
  if (/après-midi|apres-midi/.test(s.toLowerCase())) return 15 * 60;
  return fallback;
}
function moveSortRange(moves){
  let min = Infinity, max = 0;
  (moves || []).forEach(m => {
    const t = parseWhenSort(m.when);
    min = Math.min(min, t);
    max = Math.max(max, t);
  });
  if (!isFinite(min)) min = 0;
  return { min, max };
}
function luggageBeforeCheckInHint(){
  return "Demander aussi à l’hôtel s’il accepte les bagages avant le check-in.";
}
function isEarlyArrivalBeforeCheckIn(moveRange, checkInSort){
  return moveRange.max > 0 && checkInSort != null && checkInSort > moveRange.max + 45;
}
function isFirstDayOfStay(cityId, day){
  const stay = stayForDay(cityId, day);
  if (!stay) return false;
  const groups = stayGroups(CITIES[cityId], daysForCity(cityId));
  for (const g of groups){
    if (g.stay.id !== stay.id) continue;
    return (g.days || []).some(d => d.n === day.n) && g.days[0].n === day.n;
  }
  return false;
}
function isLastDayOfStay(cityId, day){
  const stay = stayForDay(cityId, day);
  if (!stay) return false;
  const groups = stayGroups(CITIES[cityId], daysForCity(cityId));
  for (const g of groups){
    if (g.stay.id !== stay.id) continue;
    const ds = g.days || [];
    return ds.some(d => d.n === day.n) && ds[ds.length - 1].n === day.n;
  }
  return false;
}
function renderDayTimeline(day){
  if (!day) return "";
  const cityId = day.city;
  const city = CITIES[cityId];
  const items = [];
  const stay = stayForDay(cityId, day);
  const h = stay && stay.hotel;
  const moves = day.moves || [];
  const moveRange = moveSortRange(moves);
  const firstStay = h && h.name && h.name !== "—" && isFirstDayOfStay(cityId, day);
  const lastStay = h && h.name && h.name !== "—" && isLastDayOfStay(cityId, day);
  const checkInSort = firstStay ? parseHotelTimeSort(h.checkIn, 16 * 60) : null;
  const earlyArrival = firstStay && isEarlyArrivalBeforeCheckIn(moveRange, checkInSort);

  if (lastStay && !firstStay) {
    const checkOutSort = parseHotelTimeSort(h.checkOut, 10 * 60);
    const beforeDepart = moveRange.min < Infinity && moveRange.min > 60
      ? moveRange.min - 45
      : checkOutSort;
    items.push({
      sort: Math.min(checkOutSort, beforeDepart),
      cls: "tl-hotel",
      time: h.checkOut ? "Check-out · " + h.checkOut.split("·")[0].trim() : "Fin de séjour",
      title: h.name,
      desc: h.checkOut ? h.checkOut : "",
      tags: ["Valise"]
    });
  }

  groupMovesByJourney(moves).forEach(g => {
    if (g.id) {
      items.push({
        sort: parseWhenSort(g.moves[0] && g.moves[0].when),
        cls: "tl-journey",
        time: g.meta || (g.moves[0] && g.moves[0].when) || "Trajet",
        title: g.title,
        desc: g.dest ? "Destination · " + g.dest : "",
        tags: ["Trajet"],
        journeyId: g.id,
        moves: g.moves
      });
      return;
    }
    g.moves.forEach(m => {
      items.push({
        sort: parseWhenSort(m.when),
        cls: "tl-move",
        time: m.when || "Trajet",
        title: m.title,
        desc: m.dummy || "",
        tags: [m.mode || "Trajet"]
      });
    });
  });

  if (earlyArrival) {
    const locker = day.luggageLocker || {};
    const lockerAct = locker.lat != null && locker.lng != null ? locker : null;
    items.push({
      sort: moveRange.max + 10,
      cls: "tl-locker",
      time: locker.when || "Après arrivée · avant check-in",
      title: locker.title || "Consigne bagages",
      desc: locker.desc || "À renseigner quand une consigne sera trouvée.",
      tags: ["Valise"],
      act: lockerAct
    });
  }

  (day.ideas || []).forEach((a, i) => {
    const meta = actMetaFor(a);
    let sort;
    if (firstStay && checkInSort != null) {
      const gap = earlyArrival ? 40 : 25;
      const afterArrival = (moveRange.max > 0 ? moveRange.max : 8 * 60) + gap;
      sort = Math.min(afterArrival + i * 35, checkInSort - 15);
    } else {
      sort = 10 * 60 + i * 45;
    }
    items.push({
      sort,
      cls: "tl-idea",
      time: meta.duration + " · " + meta.hours,
      title: a.title,
      desc: a.desc || "",
      tags: ["Idée"],
      act: a
    });
  });

  if (firstStay) {
    const afterArrival = moveRange.max > 0 ? moveRange.max + 20 : 0;
    const sort = Math.max(checkInSort, afterArrival);
    let desc = [h.checkIn, h.area].filter(Boolean).join(" · ");
    if (earlyArrival) {
      desc = (desc ? desc + " — " : "") + luggageBeforeCheckInHint();
    }
    items.push({
      sort,
      cls: "tl-hotel",
      time: h.checkIn ? "Check-in · " + h.checkIn : "Hébergement",
      title: h.name,
      desc,
      tags: [stay.label || "Séjour"]
    });
  }

  (day.ideasAfter || []).forEach((a, i) => {
    const meta = actMetaFor(a);
    let sort;
    if (firstStay && checkInSort != null) {
      sort = Math.max(checkInSort, moveRange.max) + 50 + i * 40;
    } else {
      sort = 14 * 60 + i * 45;
    }
    items.push({
      sort,
      cls: "tl-idea",
      time: meta.duration + " · " + meta.hours,
      title: a.title,
      desc: a.desc || "",
      tags: ["Idée"],
      act: a
    });
  });

  items.sort((a, b) => a.sort - b.sort);
  if (!items.length) {
    return `<p class="lead">Rien de prévu ce jour-là${city ? " · " + esc(city.name) : ""}.</p>`;
  }

  return `<div class="day-timeline">` + items.map(it => {
    const map = it.act ? mapsLinkHtml(it.act, "detail") : "";
    const tags = (it.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join("");
    if (it.cls === "tl-journey") {
      const steps = (it.moves || []).map(m =>
        `<div class="tl-journey-step">${m.role ? `<span class="tl-step-role">${esc(m.role)}</span>` : ""}<span>${esc(m.title)}</span></div>`
      ).join("");
      return `<div class="tl-item tl-journey"${it.journeyId ? ` data-journey="${esc(it.journeyId)}"` : ""}>` +
        `<div class="tl-time">${esc(it.time)}</div>` +
        `<div class="tl-title">${esc(it.title)}</div>` +
        (tags ? `<div class="tl-tags">${tags}</div>` : "") +
        (it.desc ? `<div class="tl-desc tl-journey-dest">${esc(it.desc)}</div>` : "") +
        `<div class="tl-journey-steps">${steps}</div>` +
        `</div>`;
    }
    return `<div class="tl-item ${it.cls}">` +
      `<div class="tl-time">${esc(it.time)}</div>` +
      `<div class="tl-title">${esc(it.title)}</div>` +
      (tags ? `<div class="tl-tags">${tags}</div>` : "") +
      (it.desc ? `<div class="tl-desc">${esc(it.desc)}</div>` : "") +
      map +
      `</div>`;
  }).join("") + `</div>`;
}

const WX_LABELS = {
  0:"Ensoleillé", 1:"Plutôt clair", 2:"Nuageux", 3:"Couvert",
  45:"Brouillard", 48:"Brouillard", 51:"Bruine", 53:"Bruine", 55:"Bruine",
  61:"Pluie", 63:"Pluie", 65:"Forte pluie", 71:"Neige", 73:"Neige", 75:"Neige",
  80:"Averses", 81:"Averses", 82:"Fortes averses", 95:"Orage"
};
const WEATHER_CACHE_KEY = "japan-trip-weather-v1";
function loadWeatherCache(){
  try { return JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || "{}"); } catch (_) { return {}; }
}
function saveWeatherCache(obj){
  try { localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(obj)); } catch (_) {}
}
function daysUntilISO(iso){
  const today = japanTodayISO();
  return Math.round((Date.parse(iso + "T12:00:00+09:00") - Date.parse(today + "T12:00:00+09:00")) / 86400000);
}
async function getWeatherForDay(day){
  const iso = dayToISO(day);
  const city = CITIES[day.city];
  if (!iso || !city) return null;
  const until = daysUntilISO(iso);
  const climate = (typeof NOV_CLIMATE !== "undefined" && NOV_CLIMATE[day.city]) || null;

  if (until > 16 || until < 0) {
    if (!climate) return null;
    return { type:"climate", min:climate.lo, max:climate.hi, note:climate.note };
  }

  const cacheKey = day.city + "|" + iso;
  const cache = loadWeatherCache();
  const hit = cache[cacheKey];
  if (hit && hit.date === japanTodayISO()) return hit.data;

  if (!navigator.onLine) {
    if (climate) return { type:"climate", min:climate.lo, max:climate.hi, note:climate.note + " (hors ligne)" };
    return null;
  }

  try {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + city.lat +
      "&longitude=" + city.lng +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
      "&timezone=Asia%2FTokyo&start_date=" + iso + "&end_date=" + iso;
    const res = await fetch(url);
    if (!res.ok) throw new Error("weather");
    const json = await res.json();
    const d = json.daily || {};
    const code = d.weather_code && d.weather_code[0];
    const data = {
      type: "forecast",
      min: Math.round(d.temperature_2m_min[0]),
      max: Math.round(d.temperature_2m_max[0]),
      label: WX_LABELS[code] || "Variable",
      rain: d.precipitation_probability_max ? d.precipitation_probability_max[0] : null
    };
    cache[cacheKey] = { date: japanTodayISO(), data };
    saveWeatherCache(cache);
    return data;
  } catch (_) {
    if (climate) return { type:"climate", min:climate.lo, max:climate.hi, note:climate.note };
    return null;
  }
}
async function renderOnsiteWeather(day){
  const box = document.getElementById("onsite-weather");
  if (!box || !day) { if (box) box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = `<div class="wx-title">Météo · …</div><div class="wx-note">Chargement</div>`;
  const wx = await getWeatherForDay(day);
  if (!wx) { box.hidden = true; return; }
  const cityName = CITIES[day.city] ? CITIES[day.city].name : day.city;
  if (wx.type === "forecast") {
    box.innerHTML =
      `<div class="wx-title">Prévisions · ${esc(cityName)} · ${esc(day.date)}</div>` +
      `<div class="wx-temps">${wx.min}° – ${wx.max}°C · ${esc(wx.label)}</div>` +
      (wx.rain != null ? `<div class="wx-note">Pluie : ${wx.rain}%</div>` : "");
  } else {
    box.innerHTML =
      `<div class="wx-title">Climat type · novembre · ${esc(cityName)}</div>` +
      `<div class="wx-temps">${wx.min}° – ${wx.max}°C</div>` +
      `<div class="wx-note">${esc(wx.note)}</div>`;
  }
}

function renderOnsiteDay(day){
  const body = document.getElementById("onsite-day-body");
  if (!body || !day) { if (body) body.innerHTML = ""; return; }
  body.innerHTML = renderDayTimeline(day);
  renderOnsiteWeather(day);
  syncOnsiteMapBtn(day);
}

function updateOfflineStatus(){
  const el = document.getElementById("offline-status");
  if (!el) return;
  const online = navigator.onLine;
  const ver = (typeof APP_CACHE_VER !== "undefined" ? APP_CACHE_VER : "?");
  const iosApp = isIOSInstalledPWA();
  el.textContent = (online ? "En ligne" : "Hors ligne") + " · cache " + ver + (iosApp ? " · app" : "");
  el.classList.toggle("online", online);
  el.classList.toggle("offline", !online);
}

const IOS_INSTALL_KEY = "japan-trip-ios-install-dismiss-v1";
const BOOKING_ALERT_KEY = "japan-trip-booking-alert-dismiss-v1";
const REMINDER_ALERT_KEY = "japan-trip-reminder-alert-dismiss-v1";
function isIOSDevice(){
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}
function isStandaloneApp(){
  return window.navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches;
}
function isIOSInstalledPWA(){
  return isStandaloneApp();
}
function markStandaloneMode(){
  const on = isStandaloneApp();
  document.documentElement.classList.toggle("standalone", on);
  document.querySelector(".app")?.classList.toggle("standalone", on);
  if (!on) return;
  syncStandaloneHeight();
  if (!window.__standaloneHeightBound) {
    window.__standaloneHeightBound = true;
    window.addEventListener("resize", syncStandaloneHeight);
    window.visualViewport?.addEventListener("resize", syncStandaloneHeight);
  }
}
/** Hauteur réelle du webview — comble la bande vide sous la tab bar (sans toucher à la largeur). */
function syncStandaloneHeight(){
  if (!isStandaloneApp()) return;
  const h = Math.round(window.innerHeight || 0);
  if (h < 100) return;
  document.documentElement.style.setProperty("--app-h", h + "px");
  requestAnimationFrame(() => {
    if (typeof currentCity !== "undefined" && currentCity) {
      if (typeof refreshCityMapView === "function") refreshCityMapView();
    } else if (typeof fitJapanHome === "function") {
      fitJapanHome();
    }
  });
}
function initIOSInstallHint(){
  const box = document.getElementById("ios-install");
  const btn = document.getElementById("ios-install-dismiss");
  if (!box || !btn) return;
  if (!isIOSDevice() || isIOSInstalledPWA()) {
    box.hidden = true;
    return;
  }
  try {
    if (localStorage.getItem(IOS_INSTALL_KEY) === "1") {
      box.hidden = true;
      return;
    }
  } catch (_) { /* ignore */ }
  box.hidden = false;
  syncBottomBanners();
  btn.addEventListener("click", () => {
    box.hidden = true;
    try { localStorage.setItem(IOS_INSTALL_KEY, "1"); } catch (_) { /* ignore */ }
    syncBottomBanners();
  });
}

function loadDismissedBookingAlerts(){
  try {
    const raw = localStorage.getItem(BOOKING_ALERT_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (_) {
    return new Set();
  }
}
function saveDismissedBookingAlerts(set){
  try { localStorage.setItem(BOOKING_ALERT_KEY, JSON.stringify([...set])); } catch (_) { /* ignore */ }
}
function collectBookableAlerts(){
  const out = [];
  LEGS.forEach(leg => {
    const links = leg.bookings?.links;
    if (!links) return;
    links.forEach((link, i) => {
      if (bookingOpenStatus(link, leg).key !== "bookable") return;
      out.push({
        id: leg.id + ":" + i,
        legId: leg.id,
        legTitle: leg.title || (leg.from + " → " + leg.to),
        label: link.label,
        site: link.site,
        url: link.url
      });
    });
  });
  return out;
}
function syncBottomBanners(){
  const layers = [
    { el: document.getElementById("ios-install"), est: 132 },
    { el: document.getElementById("booking-alert"), est: 150 },
    { el: document.getElementById("reminder-alert"), est: 150 }
  ];
  let bottom = 12;
  layers.forEach(({ el, est }) => {
    if (!el) return;
    if (el.hidden) {
      el.style.bottom = "";
      el.classList.remove("above-ios");
      return;
    }
    el.style.bottom = `calc(${bottom}px + env(safe-area-inset-bottom))`;
    bottom += est;
  });
}
function renderBookingAlert(){
  const box = document.getElementById("booking-alert");
  const list = document.getElementById("booking-alert-list");
  const btn = document.getElementById("booking-alert-dismiss");
  if (!box || !list || !btn) return;

  const dismissed = loadDismissedBookingAlerts();
  const alerts = collectBookableAlerts().filter(a => !dismissed.has(a.id));
  if (!alerts.length) {
    box.hidden = true;
    syncBottomBanners();
    return;
  }

  list.innerHTML = alerts.map(a =>
    `<li><button type="button" class="booking-alert-item" data-leg-id="${esc(a.legId)}" data-url="${esc(a.url)}">` +
    `<span><strong>${esc(a.legTitle)}</strong><span>${esc(a.label)} · ${esc(a.site)}</span></span>` +
    `<span class="booking-alert-go" aria-hidden="true">Voir →</span></button></li>`
  ).join("");

  list.querySelectorAll(".booking-alert-item").forEach(el => {
    el.addEventListener("click", () => {
      const legId = el.dataset.legId;
      const url = el.dataset.url;
      if (legId) openLeg(legId);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    });
  });

  box.hidden = false;
  syncBottomBanners();

  if (btn._bookingBound) return;
  btn._bookingBound = true;
  btn.addEventListener("click", () => {
    const dismissedNow = loadDismissedBookingAlerts();
    collectBookableAlerts().forEach(a => dismissedNow.add(a.id));
    saveDismissedBookingAlerts(dismissedNow);
    box.hidden = true;
    syncBottomBanners();
  });
}
function initBookingAlert(){
  renderBookingAlert();
}

function loadDismissedReminderAlerts(){
  try {
    const raw = localStorage.getItem(REMINDER_ALERT_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (_) {
    return new Set();
  }
}
function saveDismissedReminderAlerts(set){
  try { localStorage.setItem(REMINDER_ALERT_KEY, JSON.stringify([...set])); } catch (_) { /* ignore */ }
}
function collectDueReminderAlerts(){
  return collectPrepReminders().filter(r => r.active);
}
function renderReminderAlert(){
  const box = document.getElementById("reminder-alert");
  const list = document.getElementById("reminder-alert-list");
  const btn = document.getElementById("reminder-alert-dismiss");
  if (!box || !list || !btn) return;

  const dismissed = loadDismissedReminderAlerts();
  const alerts = collectDueReminderAlerts().filter(a => !dismissed.has(a.id));
  if (!alerts.length) {
    box.hidden = true;
    syncBottomBanners();
    return;
  }

  list.innerHTML = alerts.map(a => {
    const firstUrl = (a.links && a.links[0] && a.links[0].url) || a.url || "";
    return `<li><button type="button" class="reminder-alert-item" data-url="${esc(firstUrl)}" data-check-id="${esc(a.id)}">` +
    `<span><strong>${esc(a.label)}</strong><span>${esc(a.meta)}</span></span>` +
    `<span class="reminder-alert-go" aria-hidden="true">Préparatifs →</span></button></li>`;
  }).join("");

  list.querySelectorAll(".reminder-alert-item").forEach(el => {
    el.addEventListener("click", () => {
      setAppTab("prep");
      const sec = document.getElementById("prep-reminders-sec");
      if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  box.hidden = false;
  syncBottomBanners();

  if (btn._reminderBound) return;
  btn._reminderBound = true;
  btn.addEventListener("click", () => {
    const dismissedNow = loadDismissedReminderAlerts();
    collectDueReminderAlerts().forEach(a => dismissedNow.add(a.id));
    saveDismissedReminderAlerts(dismissedNow);
    box.hidden = true;
    syncBottomBanners();
  });
}
function initReminderAlert(){
  renderReminderAlert();
}

function renderPracticalInfo(){
  const box = document.getElementById("prep-practical");
  if (!box || typeof PRACTICAL_INFO === "undefined") return;
  box.innerHTML = PRACTICAL_INFO.map(sec =>
    `<article class="practical-card"><h4>${esc(sec.title)}</h4><ul>` +
    sec.items.map(it => `<li>${esc(it)}</li>`).join("") +
    `</ul></article>`
  ).join("");
}

function buildPrintHtml(){
  const who = (typeof TRAVELERS !== "undefined" ? TRAVELERS.join(" & ") : "Voyageurs");
  let html =
    `<h1>Voyage au Japon</h1>` +
    `<p class="print-sub">8–29 novembre 2026 · ${esc(who)}</p>`;
  DAYS.forEach(day => {
    const city = CITIES[day.city];
    html += `<h2>Jour ${day.n} · ${esc(day.dow)} ${esc(day.date)} · ${esc(city ? city.name : day.city)}</h2>`;
    const stay = stayForDay(day.city, day);
    const h = stay && stay.hotel;
    if (h && h.name && h.name !== "—") {
      html += `<div class="print-hotel"><strong>${esc(h.name)}</strong> · ${esc(h.area || "")}<br>` +
        `${esc(h.address || "")}<br>` +
        `Check-in ${esc(h.checkIn || "—")} · Check-out ${esc(h.checkOut || "—")}</div>`;
    }
    (day.moves || []).forEach(m => {
      html += `<h3>${esc(m.when || "Trajet")} · ${esc(m.title)}</h3>` +
        `<p>${esc(m.mode || "")} — ${esc(m.dummy || "")}</p>`;
    });
    if (day.luggageLocker) {
      const L = day.luggageLocker;
      html += `<h3>${esc(L.title || "Consigne bagages")}</h3>` +
        `<p>${esc(L.when || "")}${L.when && L.desc ? " — " : ""}${esc(L.desc || "")}</p>`;
    }
    [].concat(day.ideas || [], day.ideasAfter || []).forEach(a => {
      html += `<h3>${esc(a.title)}</h3><p>${esc(a.desc || "")}</p>`;
    });
  });
  return html;
}
function printTrip(){
  const root = document.getElementById("print-root");
  if (!root) return;
  root.innerHTML = buildPrintHtml();
  root.hidden = false;
  window.print();
  root.hidden = true;
}

function actMetaFor(act){
  const slug = photoSlug(act);
  return (slug && ACT_META[slug]) || { hours: "Horaires variables", duration: "1–2 h" };
}
function loadFxRate(){
  try {
    const n = Number(localStorage.getItem(FX_KEY));
    if (Number.isFinite(n) && n > 0) return n;
  } catch (_) {}
  return FX_DEFAULT;
}
function saveFxRate(n){
  try { localStorage.setItem(FX_KEY, String(n)); } catch (_) {}
}
function formatFxYen(n){
  if (!Number.isFinite(n)) return "";
  return String(Math.round(n));
}
function formatFxEur(n){
  if (!Number.isFinite(n)) return "";
  return (Math.round(n * 100) / 100).toFixed(2);
}
function initFxConverter(){
  const rateEl = document.getElementById("fx-rate");
  const yenEl = document.getElementById("fx-yen");
  const eurEl = document.getElementById("fx-eur");
  if (!rateEl || !yenEl || !eurEl || rateEl.dataset.bound) return;
  rateEl.dataset.bound = "1";
  let last = "yen";
  rateEl.value = String(loadFxRate());
  function rate(){
    const n = Number(rateEl.value);
    return Number.isFinite(n) && n > 0 ? n : FX_DEFAULT;
  }
  function syncFromYen(){
    const y = Number(yenEl.value);
    if (yenEl.value === "" || !Number.isFinite(y)) { eurEl.value = ""; return; }
    eurEl.value = formatFxEur(y / rate());
  }
  function syncFromEur(){
    const e = Number(eurEl.value);
    if (eurEl.value === "" || !Number.isFinite(e)) { yenEl.value = ""; return; }
    yenEl.value = formatFxYen(e * rate());
  }
  rateEl.addEventListener("input", () => {
    const n = Number(rateEl.value);
    if (Number.isFinite(n) && n > 0) saveFxRate(n);
    if (last === "eur") syncFromEur();
    else syncFromYen();
  });
  yenEl.addEventListener("input", () => { last = "yen"; syncFromYen(); });
  eurEl.addEventListener("input", () => { last = "eur"; syncFromEur(); });
}
function onsiteHotelLine(day){
  const stay = stayForDay(day.city, day);
  const h = stay && stay.hotel;
  if (!h || !h.name || h.name === "—") return "";
  return `<p class="today-hotel"><strong>${esc(h.name)}</strong>` +
    (h.checkIn ? `<br><span>${esc(h.checkIn)}</span>` : "") +
    `</p>`;
}
function renderOnsite(){
  const todayBox = document.getElementById("onsite-today");
  const pick = document.getElementById("onsite-day-pick");
  const phrases = document.getElementById("onsite-phrases");
  if (!todayBox || !pick || !phrases) return;
  initFxConverter();
  const iso = japanTodayISO();
  const match = findTripDayByISO(iso);
  const start = "2026-11-08", end = "2026-11-29";
  if (match){
    onsiteSelectedDayN = match.n;
    const city = CITIES[match.city];
    todayBox.innerHTML =
      `<div class="today-card"><div class="kicker">Aujourd’hui (heure Japon)</div>` +
      `<h3>Jour ${match.n} · ${esc(match.dow)} ${esc(match.date)}</h3>` +
      `<p>${esc(city ? city.name : match.city)}${match.extraCity ? " → " + esc(CITIES[match.extraCity].name) : ""}</p>` +
      onsiteHotelLine(match) +
      `</div>`;
    renderOnsiteDay(match);
    pick.hidden = true;
  } else if (iso < start){
    onsiteSelectedDayN = null;
    const daysLeft = Math.ceil((Date.parse(start + "T00:00:00+09:00") - Date.now()) / 86400000);
    todayBox.innerHTML = `<div class="today-card"><div class="kicker">Avant le départ</div><h3>Encore ≈ ${daysLeft} jour${daysLeft > 1 ? "s" : ""}</h3><p>Le voyage commence le 8 nov 2026. Choisis un jour ci-dessous pour prévisualiser.</p></div>`;
    pick.hidden = false;
  } else if (iso > end){
    onsiteSelectedDayN = null;
    todayBox.innerHTML = `<div class="today-card"><div class="kicker">Après le voyage</div><h3>Trip terminé</h3><p>Tu peux quand même refeuilleter chaque jour.</p></div>`;
    pick.hidden = false;
  } else {
    onsiteSelectedDayN = null;
    todayBox.innerHTML = `<div class="today-card"><div class="kicker">Pendant le voyage</div><h3>Jour hors programme ?</h3><p>Choisis un jour ci-dessous.</p></div>`;
    pick.hidden = false;
  }
  pick.innerHTML = DAYS.map(d =>
    `<button type="button" data-day="${d.n}"${match && match.n === d.n ? " class=\"on\"" : ""}>J${d.n}</button>`
  ).join("");
  pick.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      pick.querySelectorAll("button").forEach(b => b.classList.remove("on"));
      btn.classList.add("on");
      const day = DAYS.find(d => d.n === Number(btn.dataset.day));
      onsiteSelectedDayN = day ? day.n : null;
      renderOnsiteDay(day);
    });
  });
  if (!match){
    const first = DAYS[0];
    onsiteSelectedDayN = first.n;
    const b0 = pick.querySelector("button");
    if (b0) b0.classList.add("on");
    renderOnsiteDay(first);
  }
  phrases.innerHTML = PHRASES.map(p =>
    `<div class="phrase"><div class="fr">${esc(p.fr)}</div><div class="jp">${esc(p.jp)}</div><div class="ro">${esc(p.ro)}</div></div>`
  ).join("");
}
function setAppTab(tab){
  const app = document.querySelector(".app");
  const tabs = document.querySelectorAll("#app-tabs button");
  const prep = document.getElementById("view-prep");
  const onsite = document.getElementById("view-onsite");
  if (!app) return;
  app.classList.remove("tab-map", "tab-prep", "tab-onsite");
  app.classList.add("tab-" + tab);
  tabs.forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  if (prep) prep.classList.toggle("active", tab === "prep");
  if (onsite) onsite.classList.toggle("active", tab === "onsite");
  if (tab === "prep") renderPrep();
  if (tab === "onsite") renderOnsite();
  if (tab === "map") {
    requestAnimationFrame(() => {
      if (currentCity) syncSheetMapInset();
      else fitJapanHome();
    });
  }
}
document.getElementById("app-tabs")?.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => setAppTab(btn.dataset.tab));
});
document.getElementById("print-trip")?.addEventListener("click", printTrip);
document.getElementById("onsite-map-btn")?.addEventListener("click", () => {
  const day = getOnsiteSelectedDay();
  if (day) openMapForDay(day);
});
updateOfflineStatus();
markStandaloneMode();
initIOSInstallHint();
initBookingAlert();
initReminderAlert();
window.addEventListener("online", updateOfflineStatus);
window.addEventListener("offline", updateOfflineStatus);