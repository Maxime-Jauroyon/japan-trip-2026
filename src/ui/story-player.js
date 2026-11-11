/* Lecteur « story » plein écran : les photos et vidéos d’une journée défilent toutes seules (3 s par photo), avec barres
   de progression, zoom lent, légende et une ambiance sonore choisie selon l’activité (🔊 / 🔇). Les vidéos sont muettes.
   Toucher à droite / à gauche = suivante / précédente ; rester appuyé = pause ; ✕ = fermer.
   `slides` = [{ title, sub, name, … }] ; `resolve(slide, thumb)` → Promise<url> (le média vient du cache du téléphone). */

import { esc } from "../core/dom.js";
import { isVideo } from "../domain/journal.js";
import { soundFor } from "../domain/sounds.js";

const SLIDE_MS = 3000;          // durée d’une photo
const VIDEO_MAX_MS = 8000;      // durée maximale d’une vidéo dans la story
const MAX_BARS = 14;
const SOUND_KEY = "japan-trip-story-sound";

let el = null, slides = [], idx = 0, resolveUrl = null, timer = null, started = 0, slideMs = SLIDE_MS, left = SLIDE_MS, paused = false, token = 0;
let audio = null, family = null, fadeTimer = null;

const soundOn = () => { try { return localStorage.getItem(SOUND_KEY) !== "off"; } catch (_) { return true; } };
const setSoundOn = (on) => { try { localStorage.setItem(SOUND_KEY, on ? "on" : "off"); } catch (_) { /* pas de stockage */ } };

/** Fondu du volume de l’ambiance vers `to` en `ms` ; `then` à la fin. */
function fadeAudio(to, ms, then){
  clearInterval(fadeTimer);
  if (!audio) { if (then) then(); return; }
  const from = audio.volume, steps = Math.max(1, Math.round(ms / 50));
  let k = 0;
  fadeTimer = setInterval(() => {
    k++;
    audio.volume = Math.min(1, Math.max(0, from + (to - from) * (k / steps)));
    if (k >= steps) { clearInterval(fadeTimer); if (then) then(); }
  }, 50);
}

/** Met l’ambiance de l’activité (fondu enchaîné si elle change) ; rien si le son est coupé. */
function setAmbience(slide){
  if (!audio) return;
  const next = slide ? soundFor(slide.title) : null;
  const credit = el.querySelector(".st-credit");
  if (!soundOn() || !next) { fadeAudio(0, 300, () => audio.pause()); credit.textContent = ""; family = null; return; }
  if (family && family.id === next.id && !audio.paused) return;
  family = next;
  credit.textContent = `♪ ${next.label} — ${next.author}, ${next.license}`;
  const start = () => {
    audio.src = next.file;
    audio.loop = true;
    audio.volume = 0;
    audio.play().then(() => fadeAudio(next.volume, 600)).catch(() => { /* lecture refusée : l’histoire continue en silence */ });
  };
  if (audio.paused || !audio.src) start(); else fadeAudio(0, 350, start);
}

function close(){
  clearTimeout(timer);
  token++;
  if (el) { el.hidden = true; el.querySelector(".st-video").pause(); }
  if (audio) fadeAudio(0, 250, () => audio.pause());
  family = null;
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
  if (bar) { bar.style.transition = "none"; bar.style.width = `${100 * (1 - left / slideMs)}%`; void bar.offsetWidth; bar.style.transition = `width ${left}ms linear`; bar.style.width = "100%"; }
  started = Date.now();
  timer = setTimeout(() => go(idx + 1), left);
}

function pause(){
  if (paused) return;
  paused = true;
  clearTimeout(timer);
  left = Math.max(300, left - (Date.now() - started));
  el.querySelector(".st-video").pause();
  const bar = el.querySelector(".st-bar.cur b");
  if (bar) { const w = getComputedStyle(bar).width; bar.style.transition = "none"; bar.style.width = w; }
  el.classList.add("paused");
}

function resume(){
  if (!paused) return;
  paused = false;
  el.classList.remove("paused");
  const vid = el.querySelector(".st-video");
  if (!vid.hidden) vid.play().catch(() => { /* ignoré */ });
  run();
}

async function go(i){
  if (i >= slides.length) { close(); return; }
  idx = Math.max(0, i);
  const my = ++token;
  clearTimeout(timer);
  slideMs = left = SLIDE_MS;
  paused = false;
  el.classList.remove("paused");
  const s = slides[idx];
  paintBars();
  setAmbience(s);
  el.querySelector(".st-title").textContent = s.title || "";
  el.querySelector(".st-sub").textContent = s.sub || "";
  const img = el.querySelector(".st-img"), vid = el.querySelector(".st-video");
  vid.pause(); vid.classList.remove("show"); vid.hidden = true;
  if (isVideo(s.name)) {
    // Vidéo : toujours muette ; elle dure sa durée réelle (3 à 8 s)
    img.classList.remove("show");
    const [url, poster] = [await resolveUrl(s, false), await resolveUrl(s, true)];
    if (my !== token) return;
    if (url) {
      vid.muted = true; vid.defaultMuted = true;
      vid.poster = poster || "";
      vid.src = url; vid.hidden = false;
      try { await new Promise((ok, ko) => { vid.onloadedmetadata = ok; vid.onerror = ko; setTimeout(ok, 4000); }); } catch (_) { /* illisible : durée par défaut */ }
      if (my !== token) return;
      if (vid.duration && isFinite(vid.duration)) slideMs = left = Math.min(VIDEO_MAX_MS, Math.max(SLIDE_MS, Math.round(vid.duration * 1000)));
      vid.currentTime = 0;
      vid.classList.add("show");
      vid.play().catch(() => { /* ignoré */ });
    } else if (poster) { img.src = poster; img.classList.add("show"); }
    paintBars();
    run();
    if (slides[idx + 1]) resolveUrl(slides[idx + 1], !isVideo(slides[idx + 1].name) ? false : true);
    return;
  }
  const url = await resolveUrl(s, false);
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
  if (slides[idx + 1]) resolveUrl(slides[idx + 1], isVideo(slides[idx + 1].name));   // prépare la suivante (miniature seulement si c’est une vidéo)
}

function build(){
  el = document.createElement("div");
  el.className = "st-player";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Revivre la journée");
  el.innerHTML = `<img class="st-img" alt="" /><video class="st-video" muted playsinline loop hidden></video><div class="st-top"><div class="st-bars"></div>` +
    `<div class="st-head"><div class="st-text"><strong class="st-title"></strong><small class="st-sub"></small></div>` +
    `<span class="st-count"></span><button type="button" class="st-sound" aria-label="Couper ou remettre le son"></button>` +
    `<button type="button" class="st-close" aria-label="Fermer">×</button></div></div>` +
    `<span class="st-pause" aria-hidden="true">⏸</span><span class="st-credit"></span>`;
  const sound = el.querySelector(".st-sound");
  const paintSound = () => { sound.textContent = soundOn() ? "🔊" : "🔇"; };
  paintSound();
  sound.addEventListener("click", e => { e.stopPropagation(); setSoundOn(!soundOn()); paintSound(); family = null; setAmbience(slides[idx]); });
  document.body.appendChild(el);
  el.querySelector(".st-close").addEventListener("click", e => { e.stopPropagation(); close(); });
  let downAt = 0, downX = 0, downY = 0;
  el.addEventListener("pointerdown", e => {
    if (e.target.closest(".st-close, .st-sound")) return;
    downAt = Date.now(); downX = e.clientX; downY = e.clientY;
    pause();
  });
  el.addEventListener("pointerup", e => {
    if (e.target.closest(".st-close, .st-sound") || !downAt) return;
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
  document.addEventListener("visibilitychange", () => {
    if (!el || el.hidden) return;
    if (document.hidden) { pause(); if (audio) audio.pause(); } else { resume(); if (audio && family && soundOn()) audio.play().catch(() => { /* ignoré */ }); }
  });
}

/** Ouvre le lecteur sur `list` (à partir de `start`). */
export function openStory(list, start, resolve){
  if (!list || !list.length) return;
  if (!el) build();
  slides = list;
  resolveUrl = resolve;
  el.hidden = false;
  document.documentElement.classList.add("story-open");
  // L’élément audio est créé et lancé ici, dans le geste de l’utilisateur (obligatoire sur iPhone pour pouvoir jouer ensuite)
  if (!audio) audio = new Audio();
  family = null;
  setAmbience(list[start || 0]);
  go(start || 0);
}

/** Texte d’accroche du bouton « Revivre » (utilisé par le Carnet). */
export const storyButtonHtml = (dayN, n) =>
  `<button type="button" class="cn-play" data-story-day="${dayN}"><span aria-hidden="true">▶</span> Revivre la journée <small>${esc(String(n))} photo${n > 1 ? "s" : ""}</small></button>`;
