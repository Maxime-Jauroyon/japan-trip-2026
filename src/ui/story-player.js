/* Lecteur « story » plein écran : les photos d’une journée défilent toutes seules, avec barres de progression,
   zoom lent et légende. Toucher à droite / à gauche = suivante / précédente ; rester appuyé = pause ; ✕ = fermer.
   `slides` = [{ title, sub, … }] ; `resolve(slide)` → Promise<url> (la photo vient du cache du téléphone). */

import { esc } from "../core/dom.js";

const SLIDE_MS = 4500;
const MAX_BARS = 14;

let el = null, slides = [], idx = 0, resolveUrl = null, timer = null, started = 0, left = SLIDE_MS, paused = false, token = 0;

function close(){
  clearTimeout(timer);
  token++;
  if (el) el.hidden = true;
  document.documentElement.classList.remove("story-open");
}

function paintBars(){
  const many = slides.length > MAX_BARS;
  el.querySelector(".st-bars").innerHTML = many
    ? `<i class="st-bar cur"><b></b></i>`
    : slides.map((_, k) => `<i class="st-bar${k < idx ? " done" : k === idx ? " cur" : ""}"><b></b></i>`).join("");
  el.querySelector(".st-count").textContent = many ? `${idx + 1} / ${slides.length}` : "";
}

function run(){
  clearTimeout(timer);
  const bar = el.querySelector(".st-bar.cur b");
  if (bar) { bar.style.transition = "none"; bar.style.width = `${100 * (1 - left / SLIDE_MS)}%`; void bar.offsetWidth; bar.style.transition = `width ${left}ms linear`; bar.style.width = "100%"; }
  started = Date.now();
  timer = setTimeout(() => go(idx + 1), left);
}

function pause(){
  if (paused) return;
  paused = true;
  clearTimeout(timer);
  left = Math.max(300, left - (Date.now() - started));
  const bar = el.querySelector(".st-bar.cur b");
  if (bar) { const w = getComputedStyle(bar).width; bar.style.transition = "none"; bar.style.width = w; }
  el.classList.add("paused");
}

function resume(){
  if (!paused) return;
  paused = false;
  el.classList.remove("paused");
  run();
}

async function go(i){
  if (i >= slides.length) { close(); return; }
  idx = Math.max(0, i);
  const my = ++token;
  clearTimeout(timer);
  left = SLIDE_MS;
  paused = false;
  el.classList.remove("paused");
  const s = slides[idx];
  paintBars();
  el.querySelector(".st-title").textContent = s.title || "";
  el.querySelector(".st-sub").textContent = s.sub || "";
  const img = el.querySelector(".st-img");
  const url = await resolveUrl(s);
  if (my !== token) return;
  if (url) {
    img.classList.remove("show");
    img.src = url;
    try { await img.decode(); } catch (_) { /* affichée quand même */ }
    if (my !== token) return;
    img.style.animation = "none"; void img.offsetWidth; img.style.animation = "";
    img.classList.add("show");
  }
  run();
  if (slides[idx + 1]) resolveUrl(slides[idx + 1]);   // prépare la suivante
}

function build(){
  el = document.createElement("div");
  el.className = "st-player";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Revivre la journée");
  el.innerHTML = `<img class="st-img" alt="" /><div class="st-top"><div class="st-bars"></div>` +
    `<div class="st-head"><div class="st-text"><strong class="st-title"></strong><small class="st-sub"></small></div>` +
    `<span class="st-count"></span><button type="button" class="st-close" aria-label="Fermer">×</button></div></div>` +
    `<span class="st-pause" aria-hidden="true">⏸</span>`;
  document.body.appendChild(el);
  el.querySelector(".st-close").addEventListener("click", e => { e.stopPropagation(); close(); });
  let downAt = 0, downX = 0, downY = 0;
  el.addEventListener("pointerdown", e => {
    if (e.target.closest(".st-close")) return;
    downAt = Date.now(); downX = e.clientX; downY = e.clientY;
    pause();
  });
  el.addEventListener("pointerup", e => {
    if (e.target.closest(".st-close") || !downAt) return;
    const held = Date.now() - downAt, dy = e.clientY - downY;
    downAt = 0;
    if (dy > 90) { close(); return; }                       // glisser vers le bas = fermer
    if (held > 260) { resume(); return; }                    // appui long = simple pause
    go(downX < el.clientWidth * 0.33 ? idx - 1 : idx + 1);   // toucher : gauche = précédente, sinon suivante
  });
  el.addEventListener("pointercancel", () => { downAt = 0; resume(); });
  document.addEventListener("keydown", e => {
    if (!el || el.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") go(idx + 1);
    if (e.key === "ArrowLeft") go(idx - 1);
  });
  document.addEventListener("visibilitychange", () => { if (el && !el.hidden) { if (document.hidden) pause(); else resume(); } });
}

/** Ouvre le lecteur sur `list` (à partir de `start`). */
export function openStory(list, start, resolve){
  if (!list || !list.length) return;
  if (!el) build();
  slides = list;
  resolveUrl = resolve;
  el.hidden = false;
  document.documentElement.classList.add("story-open");
  go(start || 0);
}

/** Texte d’accroche du bouton « Revivre » (utilisé par le Carnet). */
export const storyButtonHtml = (dayN, n) =>
  `<button type="button" class="cn-play" data-story-day="${dayN}"><span aria-hidden="true">▶</span> Revivre la journée <small>${esc(String(n))} photo${n > 1 ? "s" : ""}</small></button>`;
