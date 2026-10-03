/* Bottom sheet (mobile) : suit le doigt, se cale sur 3 positions — aperçu, moitié, plein — avec l’élan.
   Le panneau a une hauteur fixe et ne fait que translater (variable CSS --sheet-y) : pas de recalcul
   de mise en page pendant le geste. Sur ordinateur, rien de tout ça : panneau latéral. */

import { panel } from "../../core/elements.js";
import { isMobileUi } from "../../core/env.js";

const STATES = ["min", "mid", "max"];
/** Part de la hauteur de la carte occupée par le sheet à mi-hauteur. */
const MID_RATIO = 0.5;
/** Projection de l’élan (ms) : un petit coup sec suffit à changer de position. */
const MOMENTUM_MS = 160;

let current = "mid";
let offset = 0;          // translateY courant (px)
let onChange = null;     // rappel quand le sheet s’est posé (recadrage de la carte)
let bodyBound = null;

const containerH = () => (panel.parentElement && panel.parentElement.clientHeight) || window.innerHeight;

/** Hauteur visible en position « aperçu » : poignée + en-tête (+ bande des jours). */
function peekHeight(){
  const top = panel.querySelector(".panel-top");
  const grab = panel.querySelector(".sheet-grab");
  const h = (top ? top.offsetHeight : 0) + (grab ? grab.offsetHeight : 0);
  return Math.max(96, Math.min(h + 6, 220));
}

function offsetFor(s){
  const H = panel.offsetHeight;
  if (s === "max") return 0;
  if (s === "min") return Math.max(0, H - peekHeight());
  return Math.max(0, H - Math.round(containerH() * MID_RATIO));
}

function apply(y){
  offset = y;
  panel.style.setProperty("--sheet-y", `${Math.round(y)}px`);
}

/** Le contenu doit pouvoir défiler jusqu’en bas même quand le sheet n’est pas plein. */
function padBody(){
  const body = panel.querySelector(".overlay-body");
  if (body) body.style.paddingBottom = isMobileUi() ? `${Math.round(offset) + 28}px` : "";
}

export function sheetState(){
  return current;
}

export function setSheetState(s, opts = {}){
  if (!STATES.includes(s)) s = "mid";
  current = s;
  panel.classList.toggle("expanded", s === "max");
  panel.classList.toggle("minimized", s === "min");
  const grab = panel.querySelector(".sheet-grab");
  if (grab) grab.setAttribute("aria-expanded", s === "max" ? "true" : "false");
  if (isMobileUi()) {
    apply(offsetFor(s));
    padBody();
  } else {
    panel.style.removeProperty("--sheet-y");
  }
  if (!opts.silent && onChange) onChange(s);
}

/** Position la plus proche de la position projetée (avec l’élan). */
function settle(velocity){
  const projected = offset + velocity * MOMENTUM_MS;
  const best = STATES.reduce((a, s) =>
    Math.abs(offsetFor(s) - projected) < Math.abs(offsetFor(a) - projected) ? s : a, "mid");
  panel.classList.remove("dragging");
  setSheetState(best);
}

/** Déplacement élastique : libre entre plein et aperçu, freiné au-delà. */
function dragTo(y){
  const max = offsetFor("min");
  if (y < 0) y = y / 3;
  else if (y > max) y = max + (y - max) / 3;
  apply(y);
}

function tracker(startY){
  const t0 = performance.now();
  return { startY, startOffset: offset, lastY: startY, lastT: t0, v: 0 };
}

function track(t, y){
  const now = performance.now();
  const dt = Math.max(1, now - t.lastT);
  t.v = 0.8 * ((y - t.lastY) / dt) + 0.2 * t.v;
  t.lastY = y;
  t.lastT = now;
  dragTo(t.startOffset + (y - t.startY));
}

/** Poignée + en-tête : glisser (le sheet suit le doigt) ou toucher (agrandir / réduire). */
function bindHandle(el){
  let t = null, moved = false, id = null;
  el.addEventListener("pointerdown", e => {
    if (!isMobileUi() || (e.pointerType === "mouse" && e.button !== 0)) return;
    if (e.target.closest("button:not(.sheet-grab), a, input, .day-strip")) return;
    t = tracker(e.clientY); moved = false; id = e.pointerId;
    panel.classList.add("dragging");
    try { el.setPointerCapture(id); } catch (_) { /* ignore */ }
  });
  el.addEventListener("pointermove", e => {
    if (!t || e.pointerId !== id) return;
    if (Math.abs(e.clientY - t.startY) > 6) moved = true;
    if (moved) track(t, e.clientY);
  });
  const end = e => {
    if (!t || e.pointerId !== id) return;
    const tap = !moved;
    const v = t.v;
    t = null;
    if (tap) {
      panel.classList.remove("dragging");
      if (el.classList.contains("sheet-grab")) setSheetState(current === "max" ? "mid" : current === "mid" ? "max" : "mid");
      else if (current === "min") setSheetState("mid");
      return;
    }
    settle(v);
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}

/**
 * Contenu : tirer vers le bas quand la liste est tout en haut réduit le sheet ;
 * pousser vers le haut quand il n’est pas plein l’agrandit d’abord (comme Plans / Google Maps).
 */
function bindBody(body){
  let t = null, mode = null, x0 = 0;
  body.addEventListener("touchstart", e => {
    if (!isMobileUi() || e.touches.length !== 1) return;
    const p = e.touches[0];
    t = tracker(p.clientY); x0 = p.clientX; mode = null;
  }, { passive: true });
  body.addEventListener("touchmove", e => {
    if (!t) return;
    const p = e.touches[0];
    const dy = p.clientY - t.startY, dx = p.clientX - x0;
    if (!mode) {
      if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return;
      if (Math.abs(dx) > Math.abs(dy)) { mode = "none"; return; }   // balayage horizontal (jours)
      const atTop = body.scrollTop <= 0;
      mode = (dy < 0 && current !== "max") || (dy > 0 && atTop) ? "sheet" : "scroll";
      if (mode === "sheet") { t = tracker(p.clientY); panel.classList.add("dragging"); }
    }
    if (mode === "sheet") {
      e.preventDefault();
      track(t, p.clientY);
    }
  }, { passive: false });
  const end = () => {
    if (t && mode === "sheet") settle(t.v);
    t = null; mode = null;
  };
  body.addEventListener("touchend", end);
  body.addEventListener("touchcancel", end);
}

/** À appeler après chaque rendu du panneau. `changed` : rappel quand le sheet se pose. */
export function bindSheet(changed, initial = "mid"){
  onChange = changed || null;
  panel.classList.remove("dragging");
  panel.querySelectorAll(".sheet-grab, .panel-top").forEach(bindHandle);
  const body = panel.querySelector(".overlay-body");
  if (body && bodyBound !== body) { bindBody(body); bodyBound = body; }
  // Poser sans animation hors écran puis animer l’arrivée (le panneau vient d’être (ré)écrit)
  setSheetState(initial, { silent: true });
  if (onChange) onChange(initial);
}

export function sheetGrabHtml(){
  return `<button type="button" class="sheet-grab" aria-label="Glisser ou toucher pour agrandir / réduire" aria-expanded="false"><span class="sheet-bar"></span></button>`;
}
