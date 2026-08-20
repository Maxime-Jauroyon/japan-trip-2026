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
function cityIconSvg(id){
  const stroke = "currentColor";
  const icons = {
    tokyo: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3l1.2 4.2H18l-3.6 2.6 1.4 4.2L12 11.8 8.2 14l1.4-4.2L6 7.2h4.8L12 3z" fill="${stroke}" opacity=".15"/><path d="M11 21V9h2v12h-2zm-4 0V12H5v9H3V10l4-2v13H7zm10 0V10l4 2v11h-2v-9h-2v9h-2zM11 7V4h2v3h-2z" fill="${stroke}"/></svg>`,
    fuji: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L3 20h18L12 4z" fill="${stroke}" opacity=".12"/><path d="M12 5.5L4.8 19h14.4L12 5.5zm0 3.2l2.2 4.1H9.8L12 8.7z" fill="${stroke}"/><path d="M7 19c1.5-2.5 3.2-3.8 5-3.8S15.5 16.5 17 19H7z" fill="${stroke}" opacity=".35"/></svg>`,
    kanazawa: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20V10l4-3 4 3 4-3 4 3v10H4z" fill="${stroke}" opacity=".12"/><path d="M5 19V11l3.5-2.5L12 11l3.5-2.5L19 11v8H5zm3-8V8h2v3H8zm6 0V8h2v3h-2zM7 19h10v-5H7v5z" fill="${stroke}"/></svg>`,
    shirakawa: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L4 14h16L12 3z" fill="${stroke}" opacity=".12"/><path d="M12 4.5L5.5 14h13L12 4.5zM7 14v6h10v-6H7zm2 2h2v2H9v-2zm4 0h2v2h-2v-2z" fill="${stroke}"/></svg>`,
    takayama: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20V11l8-6 8 6v9H4z" fill="${stroke}" opacity=".12"/><path d="M5 19V12l7-5 7 5v7H5zm4-2h2v-3H9v3zm4 0h2v-3h-2v3z" fill="${stroke}"/><circle cx="12" cy="9" r="1.4" fill="${stroke}"/></svg>`,
    kyoto: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 20V9h2v2h10V9h2v11h-2v-6H7v6H5z" fill="${stroke}" opacity=".12"/><path d="M4 8h16v2H4V8zm3-3h10l1 2H6l1-2zM6 11h2v8H6v-8zm10 0h2v8h-2v-8zM10 13h4v2h-4v-2z" fill="${stroke}"/></svg>`,
    nara: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5c-3 0-5.5 2.2-5.5 5.2 0 2.4 1.4 4.3 3.5 5.3L9 20h6l-1-4.5c2.1-1 3.5-2.9 3.5-5.3C17.5 7.2 15 5 12 5z" fill="${stroke}" opacity=".12"/><path d="M12 6.2c2.4 0 4.3 1.7 4.3 4 0 1.8-1.1 3.3-2.8 3.9l-.5.2.8 3.5h-3.6l.8-3.5-.5-.2c-1.7-.6-2.8-2.1-2.8-3.9 0-2.3 1.9-4 4.3-4zm-3.2 2.4l1.5 1.1M15.2 8.6l-1.5 1.1" stroke="${stroke}" stroke-width="1.4" stroke-linecap="round"/><circle cx="10.2" cy="10.2" r="0.8" fill="${stroke}"/><circle cx="13.8" cy="10.2" r="0.8" fill="${stroke}"/></svg>`,
    osaka: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 14c0-3 2-5 5-6v-1.5C10.5 6.5 9.5 5.5 9.5 4.2 9.5 3 10.6 2 12 2s2.5 1 2.5 2.2c0 1.3-1 2.3-2.5 2.3V8c3 1 5 3 5 6v6H7v-6z" fill="${stroke}" opacity=".12"/><path d="M8 20v-5.5c0-2.4 1.6-4.2 4-5V8.2c-1.7 0-2.8-.9-2.8-2.2S10.3 3.8 12 3.8s2.8.9 2.8 2.2-1.1 2.2-2.8 2.2V9.5c2.4.8 4 2.6 4 5V20H8zm2-2h4v-3h-4v3z" fill="${stroke}"/></svg>`
  };
  return icons[id] || icons.tokyo;
}

function daysForCity(id){
  // Include any day that belongs to the city OR has an arrive/depart leg for it
  const map = new Map();
  DAYS.forEach(d => {
    const cityDay = d.city === id || d.extraCity === id;
    const moves = movesForCity(d.moves, id);
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

function movesForCity(moves, cityId){
  return (moves || []).filter(m => {
    if (!m.leg) return true;
    const leg = LEGS.find(l => l.id === m.leg);
    if (!leg) return true;
    return legCityId(leg.from) === cityId || legCityId(leg.to) === cityId;
  }).map(m => {
    const leg = m.leg ? LEGS.find(l => l.id === m.leg) : null;
    let role = "";
    if (leg){
      if (legCityId(leg.to) === cityId) role = "arrivée";
      else if (legCityId(leg.from) === cityId) role = "départ";
    }
    return Object.assign({}, m, { role });
  });
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
  if (!c) return [];
  return (c.stays || []).filter(s => {
    const h = s.hotel;
    return h && h.name && h.name !== "—" && h.lat != null && h.lng != null;
  });
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

/* Pan/zoom — mode: cover fills viewport; contain keeps grey letterbox around map */
function makePanZoom(viewport, world, opts){
  const o = Object.assign({ max:6, start:1, mode:"cover" }, opts || {});
  const st = { x:0, y:0, s:o.start, drag:false, lx:0, ly:0 };
  const pointers = new Map();
  let pinch0 = null;
  function minScale(){
    const ww = world.offsetWidth || 1, wh = world.offsetHeight || 1;
    const vw = viewport.clientWidth || 1, vh = viewport.clientHeight || 1;
    return o.mode === "contain"
      ? Math.min(vw / ww, vh / wh)
      : Math.max(vw / ww, vh / wh);
  }
  function apply(){ world.style.transform = `translate(${st.x}px,${st.y}px) scale(${st.s})`; }
  function clamp(){
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const min = minScale();
    if (st.s < min) st.s = min;
    if (st.s > o.max) st.s = o.max;
    const ww = world.offsetWidth * st.s, wh = world.offsetHeight * st.s;
    if (ww <= vw) st.x = (vw - ww) / 2;
    else st.x = Math.min(0, Math.max(vw - ww, st.x));
    if (wh <= vh) st.y = (vh - wh) / 2;
    else st.y = Math.min(0, Math.max(vh - wh, st.y));
  }
  function zoomAt(cx, cy, factor){
    const min = minScale();
    const ns = Math.min(o.max, Math.max(min, st.s * factor));
    const k = ns / st.s;
    st.x = cx - (cx - st.x) * k;
    st.y = cy - (cy - st.y) * k;
    st.s = ns;
    clamp(); apply();
  }
  function fitCover(extra){
    extra = extra == null ? 1 : extra;
    const min = minScale();
    st.s = Math.min(o.max, min * extra);
    st.x = (viewport.clientWidth - world.offsetWidth * st.s) / 2;
    st.y = (viewport.clientHeight - world.offsetHeight * st.s) / 2;
    clamp(); apply();
  }
  function focusPct(leftPct, topPct, s){
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const min = minScale();
    st.s = Math.min(o.max, Math.max(min, s));
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
    return !!(el && el.closest && el.closest("button, path.route-hit, path.route, .pin, .sheet-grab, .overlay"));
  }
  viewport.addEventListener("wheel", e => {
    e.preventDefault();
    const r = viewport.getBoundingClientRect();
    zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.12 : 1 / 1.12);
  }, { passive:false });
  viewport.addEventListener("pointerdown", e => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (isMapChrome(e.target)) return;
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
  viewport.addEventListener("pointermove", e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size >= 2 && pinch0) {
      const p = pinchMetrics();
      if (!p) return;
      const r = viewport.getBoundingClientRect();
      const cx = p.cx - r.left, cy = p.cy - r.top;
      const min = minScale();
      const ns = Math.min(o.max, Math.max(min, pinch0.s * (p.dist / pinch0.dist)));
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
  return {
    state:st, apply, clamp, zoomAt, fitCover, focusPct, minScale,
    zoomIn(){ zoomAt(viewport.clientWidth/2, viewport.clientHeight/2, 1.2); },
    zoomOut(){ zoomAt(viewport.clientWidth/2, viewport.clientHeight/2, 1/1.2); }
  };
}

const countryCam = makePanZoom(countryViewport, countryWorld, { max:7, start:1, mode:"cover" });
const cityCam = makePanZoom(cityFrame, cityWorld, { max:9, start:1, mode:"cover" });

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

function routePathD(leg){
  const pts = [leg.from, ...(leg.via || []), leg.to].map(p => projectJapan(p.lat, p.lng));
  if (pts.length < 2) return "";
  const f = p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  if (pts.length === 2){
    const a = pts[0], b = pts[1];
    const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.08;
    const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.08;
    return `M${f(a)} Q${mx.toFixed(1)},${my.toFixed(1)} ${f(b)}`;
  }
  // Smooth polyline through waypoints (avoids other cities, e.g. Osaka→Tokyo south of Fuji)
  let d = `M${f(pts[0])}`;
  for (let i = 1; i < pts.length - 1; i++){
    const midX = (pts[i].x + pts[i + 1].x) / 2;
    const midY = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q${f(pts[i])} ${midX.toFixed(1)},${midY.toFixed(1)}`;
  }
  const last = pts[pts.length - 1], prev = pts[pts.length - 2];
  d += ` Q${f(prev)} ${f(last)}`;
  return d;
}

function buildCountry(){
  const routes = document.getElementById("routes");
  routes.innerHTML = "";
  LEGS.forEach(leg => {
    if (leg.skipMap) return;
    const d = routePathD(leg);
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.dataset.leg = leg.id;
    const hit = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hit.setAttribute("d", d);
    hit.setAttribute("class", "route-hit");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("class", "route");
    path.dataset.leg = leg.id;
    const open = e => { e.stopPropagation(); openLeg(leg.id); };
    hit.addEventListener("click", open);
    hit.addEventListener("mouseenter", () => path.classList.add("hot"));
    hit.addEventListener("mouseleave", () => path.classList.remove("hot"));
    g.appendChild(hit);
    g.appendChild(path);
    routes.appendChild(g);
  });

  const marks = document.getElementById("country-marks");
  marks.innerHTML = "";
  ORDER.forEach(id => {
    const c = CITIES[id];
    const pct = pctIn(JAPAN_BOUNDS, c.lat, c.lng);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "city-mark" + (LABEL_SIDE[id] === "left" ? " label-left" : "");
    btn.style.left = pct.left + "%";
    btn.style.top = pct.top + "%";
    btn.dataset.city = id;
    btn.title = c.name;
    btn.innerHTML = `<span class="ico-wrap">${cityIconSvg(id)}</span><span class="label">${c.name}</span>`;
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
    sizeJapanWorld();
    // Fill viewport with map (ocean color matches PNG fill — no grey frame)
    countryCam.fitCover(1.02);
  });
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
  cityPins.querySelectorAll(".pin").forEach(pin => {
    const lat = Number(pin.dataset.lat), lng = Number(pin.dataset.lng);
    const pct = pctIn(MAP_BOUNDS[currentCity], lat, lng);
    pin.style.left = (pct.left / 100) * nw + "px";
    pin.style.top = (pct.top / 100) * nh + "px";
    const inB = pct.left >= -2 && pct.left <= 102 && pct.top >= -2 && pct.top <= 102;
    pin.style.display = inB ? "" : "none";
  });
}

function renderCityPins(id, day, selected){
  const places = placesOnMap(id);
  const hotels = hotelsOnMap(id);
  const dayKeys = new Set();
  if (day){
    ideasOf(day).forEach(a => {
      if (a.lat == null) return;
      dayKeys.add(a.lat.toFixed(4) + "," + a.lng.toFixed(4));
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
    const accent = isSel ? "#e85d20" : "#a85a32";
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
  hotels.forEach(stay => {
    const h = stay.hotel;
    const key = h.lat.toFixed(4) + "," + h.lng.toFixed(4);
    const isSel = selKey === key;
    const accent = isSel ? "#e0c99a" : "#c4a574";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pin pin-hotel" + (isSel ? " selected" : "");
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
  layoutCityPins();
}

function highlightPin(act){
  if (!currentCity || !act || act.lat == null) return;
  lastFocusAct = act;
  const dayEl = panel.querySelector("details.day[open]");
  const dayN = dayEl ? Number(dayEl.dataset.dayN) : null;
  const day = dayN != null ? DAYS.find(d => d.n === dayN) : null;
  renderCityPins(currentCity, day || null, act);
  const pct = pctIn(MAP_BOUNDS[currentCity], act.lat, act.lng);
  const zoom = Math.max(cityCam.minScale() * 1.35, cityCam.minScale() * 1.15);
  cityCam.focusPct(pct.left, pct.top, zoom);
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
  hint.textContent = CITIES[id].name + " · glisser / pincer · pastilles = activités · valise = hôtel";
  setActiveCity(id);
  const day = dayN != null ? DAYS.find(d => d.n === dayN) : null;
  const apply = () => {
    renderCityPins(id, day || null);
    fitCityMap();
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
    cityImg.src = "./maps/" + id + ".png?v=5";
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (cityImg.complete && cityImg.naturalWidth) fitCityMap();
    });
  });
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
function renderHotelCard(stay){
  const h = stay.hotel || {};
  return `<button type="button" class="hotel-card" data-stay="${esc(stay.id)}">
    <div class="thumb">${hotelIconSvg()}</div>
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

function renderIdeas(list, offset){
  offset = offset || 0;
  return (list || []).map((a, i) =>
    `<div class="act" data-act-idx="${offset + i}" role="button" tabindex="0"><span class="dot"></span><div class="act-title">${esc(a.title)}</div>${mapsLinkHtml(a, "list")}</div>`
  ).join("");
}
function renderMoves(list){
  return (list || []).map(m => {
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
    return `<div class="move"${m.leg ? ` data-leg="${m.leg}"` : ""}>${role}<div class="when">${esc(mode)} · ${esc(when)}</div><div class="title">${esc(m.title)}</div>${stops}<div class="dummy">${esc(ticket)}</div></div>`;
  }).join("");
}
function stopLabel(s){
  if (!s) return "—";
  return s.name || "—";
}
function stopBlockHtml(leg){
  if (!leg.fromStop && !leg.toStop) return "";
  const row = (label, s) => {
    if (!s) return "";
    const title = s.jp ? `${s.name} · ${s.jp}` : (s.name || "—");
    return `<div class="stat wide"><span>${esc(label)} · ${esc(s.kind || "Arrêt")}</span><strong>${esc(title)}</strong></div>`;
  };
  return row("Départ", leg.fromStop) + row("Arrivée", leg.toStop);
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
}

function openActivityDetail(act){
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
    gallery
  );
  highlightPin(act);
}

function openHotelDetail(stay){
  if (!panelContext || panelContext.type !== "city") return;
  const h = stay.hotel || {};
  const mapAct = (h.lat != null && h.lng != null) ? { lat: h.lat, lng: h.lng, title: h.name } : null;
  showDetailSheet(
    `<span class="sheet-kind hotel">Hôtel</span>` +
    `<div class="detail-hero"><div class="ph">${hotelIconSvg()}</div></div>` +
    `<h3>${esc(h.name || "Hôtel à définir")}</h3>` +
    (mapAct ? mapsLinkHtml(mapAct, "detail") : "") +
    `<p class="desc">${esc(h.desc || "")}</p>` +
    `<div class="pill-row"><span class="status ${statusClass(h.status)}">${statusLabel(h.status)}</span></div>` +
    `<dl class="detail-kv">` +
    `<dt>Séjour</dt><dd>${esc(stay.label || "")}</dd>` +
    `<dt>Dates</dt><dd>${esc(stay.from)} → ${esc(stay.to)} · ${esc(stay.nights)}</dd>` +
    `<dt>Quartier</dt><dd>${esc(h.area || "—")}</dd>` +
    `<dt>Adresse</dt><dd>${esc(h.address || "—")}</dd>` +
    `<dt>Arrivée</dt><dd>${esc(h.checkIn || "—")}</dd>` +
    `<dt>Départ</dt><dd>${esc(h.checkOut || "—")}</dd>` +
    `<dt>Paiement</dt><dd>${esc(h.payment || "—")}</dd>` +
    `<dt>Prix</dt><dd>${esc(h.price || "—")}</dd>` +
    `</dl>` +
    notesListHtml(h.notes)
  );
  if (mapAct) highlightPin(mapAct);
}

function bindPanel(days, cityId){
  days = days || [];
  cityId = cityId || (panelContext && panelContext.city && panelContext.city.id);
  panel.querySelector(".close").onclick = () => closePanel(true);
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
      const open = () => openActivityDetail(act);
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
      } else if (![...panel.querySelectorAll("details.day")].some(d => d.open)){
        showCity(currentCity, null);
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
  const refresh = () => {
    if (!currentCity) return;
    if (lastFocusAct && lastFocusAct.lat != null) highlightPin(lastFocusAct);
    else fitCityMap();
    cityCam.clamp();
    cityCam.apply();
  };
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
      let body = "";
      if (moves.length) body += renderMoves(moves);
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
  panel.classList.remove("open", "expanded", "minimized", "panel-city", "panel-leg");
  document.querySelector(".app")?.classList.remove("sheet-mid", "sheet-max", "sheet-min");
  lastFocusAct = null;
  panelContext = null;
  setActiveCity(null);
  if (reset) goOverview();
}
function goOverview(){
  panel.classList.remove("open", "expanded", "minimized", "panel-city", "panel-leg");
  document.querySelector(".app")?.classList.remove("sheet-mid", "sheet-max", "sheet-min");
  lastFocusAct = null;
  panelContext = null;
  document.querySelectorAll("#routes path.route").forEach(p => {
    p.style.stroke = "";
    p.style.strokeWidth = "";
    p.style.opacity = "";
  });
  showCountry();
}
function openCity(id){
  showCity(id, null);
  fillCityPanel(CITIES[id], daysForCity(id), null);
}
function openLeg(id){
  const leg = LEGS.find(l => l.id === id);
  panelContext = { type:"leg", leg };
  showCountry();
  document.querySelectorAll("#routes path.route").forEach(p => {
    const on = p.dataset.leg === id;
    p.style.stroke = on ? "#c45c26" : "#6e5a48";
    p.style.strokeWidth = on ? "6" : "4";
    p.style.opacity = on ? "1" : "0.35";
  });
  document.querySelectorAll("#routes path.route-hit").forEach(p => {
    p.style.pointerEvents = "";
  });
  setActiveCity(null);
  const tips = leg.tips ? `<p class="note" style="color:var(--gold-2)">${esc(leg.tips)}</p>` : "";
  const details = (leg.details || []).map(d => `<li>${esc(d)}</li>`).join("");
  panel.classList.remove("panel-city");
  panel.classList.add("panel-leg");
  panel.innerHTML =
    sheetGrabHtml() +
    `<div class="overlay-head"><div class="head-text"><h2>${esc(leg.title)}</h2><span class="jp-name">${esc(leg.subtitle)}</span></div><button class="close" type="button" aria-label="Fermer">×</button></div>` +
    `<div class="overlay-body">` +
    `<span class="sheet-kind trajet">Trajet</span>` +
    `<div class="pill-row"><span class="status ${statusClass(leg.status)}">${statusLabel(leg.status)}</span></div>` +
    `<div class="trajet-grid">` +
    `<div class="stat"><span>Départ</span><strong>${esc(leg.depart || "—")}</strong></div>` +
    `<div class="stat"><span>Arrivée</span><strong>${esc(leg.arrive || "—")}</strong></div>` +
    `<div class="stat"><span>Mode</span><strong>${esc(leg.mode)}</strong></div>` +
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
    tips +
    `</div>`;
  panel.classList.add("open");
  bindSheetGrab();
  panel.querySelector(".close").onclick = () => closePanel(true);
  if (window.matchMedia("(max-width: 900px)").matches) {
    setSheetState("max");
  }
  const via = leg.via || [];
  const mid = via.length
    ? via[Math.floor(via.length / 2)]
    : { lat: (leg.from.lat + leg.to.lat) / 2, lng: (leg.from.lng + leg.to.lng) / 2 };
  const pct = pctIn(JAPAN_BOUNDS, mid.lat, mid.lng);
  requestAnimationFrame(() => {
    sizeJapanWorld();
    countryCam.focusPct(pct.left, pct.top, Math.max(countryCam.minScale() * 1.6, 2.0));
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
  if (currentCity) fitCityMap();
  else {
    sizeJapanWorld();
    countryCam.fitCover(1.02);
  }
});

function bootCountry(){
  sizeJapanWorld();
  buildCountry();
  showCountry();
}
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
function renderPrep(){
  const box = document.getElementById("prep-checklist");
  const plan = document.getElementById("prep-plan");
  const bud = document.getElementById("prep-budget");
  if (!box || !plan || !bud) return;
  const state = loadChecks();
  box.innerHTML = PREP_CHECKS.map(item => {
    const on = !!state[item.id];
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
  plan.innerHTML = PREP_PLAN.map(t => `<li>${esc(t)}</li>`).join("");
  const rows = PREP_BUDGET.map(b =>
    `<div class="${b.done ? "" : "muted"}">${esc(b.label)}<span class="meta" style="display:block;font-size:12px;font-weight:400">${esc(b.note)}</span></div><div class="amt">${esc(b.amount)}</div>`
  ).join("");
  bud.innerHTML = rows + `<div class="total"><span>Vols déjà sortis</span><span>≈ 2 000 €</span></div>`;
}
function actMetaFor(act){
  const slug = photoSlug(act);
  return (slug && ACT_META[slug]) || { hours: "Horaires variables", duration: "1–2 h" };
}
function renderOnsiteDay(day){
  const body = document.getElementById("onsite-day-body");
  if (!body || !day) { if (body) body.innerHTML = ""; return; }
  const city = CITIES[day.city];
  const moves = day.moves || [];
  const ideas = [].concat(day.ideas || [], day.ideasAfter || []);
  let html = "";
  if (moves.length){
    html += `<p class="lead" style="margin-bottom:10px">Trajets du jour</p>`;
    moves.forEach(m => {
      html += `<div class="onsite-act"><div class="t">${esc(m.title)}</div><div class="tags"><span class="tag">${esc(m.mode || "Trajet")}</span><span class="tag">${esc(m.when || "")}</span></div><div class="d">${esc(m.dummy || "")}</div></div>`;
    });
  }
  if (ideas.length){
    html += `<p class="lead" style="margin:16px 0 10px">Idées · ${esc(city ? city.name : day.city)}</p>`;
    ideas.forEach(a => {
      const meta = actMetaFor(a);
      const map = mapsLinkHtml(a, "detail");
      html += `<div class="onsite-act"><div class="t">${esc(a.title)}</div><div class="tags"><span class="tag">⏱ ${esc(meta.duration)}</span><span class="tag">🕒 ${esc(meta.hours)}</span></div><div class="d">${esc(a.desc || "")}</div>${notesListHtml(a.notes)}${map}</div>`;
    });
  } else if (!moves.length){
    html = `<p class="lead">Rien de prévu ce jour-là (transfert / vol).</p>`;
  }
  body.innerHTML = html;
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
    const city = CITIES[match.city];
    todayBox.innerHTML = `<div class="today-card"><div class="kicker">Aujourd’hui (heure Japon)</div><h3>Jour ${match.n} · ${esc(match.dow)} ${esc(match.date)}</h3><p>${esc(city ? city.name : match.city)}${match.extraCity ? " → " + esc(CITIES[match.extraCity].name) : ""}</p></div>`;
    renderOnsiteDay(match);
    pick.hidden = true;
  } else if (iso < start){
    const daysLeft = Math.ceil((Date.parse(start + "T00:00:00+09:00") - Date.now()) / 86400000);
    todayBox.innerHTML = `<div class="today-card"><div class="kicker">Avant le départ</div><h3>Encore ≈ ${daysLeft} jour${daysLeft > 1 ? "s" : ""}</h3><p>Le voyage commence le 8 nov 2026. Choisis un jour ci-dessous pour prévisualiser.</p></div>`;
    pick.hidden = false;
  } else if (iso > end){
    todayBox.innerHTML = `<div class="today-card"><div class="kicker">Après le voyage</div><h3>Trip terminé</h3><p>Tu peux quand même refeuilleter chaque jour.</p></div>`;
    pick.hidden = false;
  } else {
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
      renderOnsiteDay(day);
    });
  });
  if (!match){
    const first = DAYS[0];
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
      else { sizeJapanWorld(); countryCam.fitCover(1.02); }
    });
  }
}
document.getElementById("app-tabs")?.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => setAppTab(btn.dataset.tab));
});