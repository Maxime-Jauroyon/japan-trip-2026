/* Lecteur « story » plein écran : les photos et vidéos d’une journée défilent toutes seules (3 s par photo), avec barres
   de progression, zoom lent, légende et une musique japonaise choisie selon l’activité (🔊 / 🔇). Les vidéos sont muettes.
   Toucher à droite / à gauche = suivante / précédente ; rester appuyé = pause ; ✕ = fermer.
   `slides` = [{ title, sub, name, … }] ; `resolve(slide, { thumb, live, priority })` → Promise<url> (cache du téléphone d’abord).
   Le décompte des 3 s ne démarre que quand quelque chose est affiché, une photo qui tarde n’arrête jamais l’histoire, et des
   touchers très rapprochés ne chargent que la dernière diapositive. */

import { esc } from "../core/dom.js";
import { isVideo } from "../domain/journal.js";
import { soundFamily } from "../domain/sounds.js";
import { familiesAhead } from "../domain/music.js";
import { musicEnabled, nextTrack, onMusicChange, preloadForTitles, resumeMusic, setMusicEnabled, setMusicFor, stopMusic, suspendMusic, unlockMusic } from "./music-player.js";
import { SLIDE_MS, isLongPress, slideDuration, stepSlide, tapStep } from "../domain/story.js";

const MAX_BARS = 14;
const FAILSAFE_MS = 3500;       // si rien ne s’affiche (réseau), on démarre quand même le décompte

let el = null, slides = [], idx = 0, resolveUrl = null, timer = null, failsafe = null, started = 0, slideMs = SLIDE_MS, left = SLIDE_MS, token = 0;
let holding = false, ready = false, timerOn = false;
let unsubscribe = null;

/** Crédit de la musique en cours, en bas de la story. */
function paintCredit(t){
  const el_ = el && el.querySelector(".st-credit");
  if (el_) el_.textContent = t ? `♪ ${t.title} — ${t.author}, ${t.license}` : "";
  const next = el && el.querySelector(".st-music-next");
  if (next) next.hidden = !t;
}

/** Musique de la diapositive : fondu enchaîné si l’activité change de famille ; rien si le son est coupé. */
function setAmbience(slide){
  if (!slide) return;
  setMusicFor(slide.title);
  preloadForTitles(familiesAhead(slides, idx, (t) => soundFamily(t), 2).map((f) => slides.find((x) => soundFamily(x.title) === f).title));
}

function close(){
  clearTimeout(timer); clearTimeout(failsafe);
  token++; holding = false; timerOn = false; ready = false;
  if (el) { el.hidden = true; el.querySelector(".st-video").pause(); }
  stopMusic();
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  document.documentElement.classList.remove("story-open");
}

function paintBars(){
  const many = slides.length > MAX_BARS;
  el.querySelector(".st-bars").innerHTML = many
    ? `<i class="st-bar cur"><b></b></i>`
    : slides.map((_, k) => `<i class="st-bar${k < idx ? " done" : k === idx ? " cur" : ""}"><b></b></i>`).join("");
  el.querySelector(".st-count").textContent = many ? `${idx + 1} / ${slides.length}` : "";
}

const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const frozen = () => holding || document.hidden;

/** Lance (ou relance) le décompte de la diapositive affichée, sauf si on tient l’écran, si l’onglet est caché ou si rien n’est encore à voir. */
function startTimer(){
  clearTimeout(timer);
  timerOn = false;
  if (!ready || frozen()) return;
  const bar = el.querySelector(".st-bar.cur b");
  if (bar) { bar.style.transition = "none"; bar.style.width = `${100 * (1 - left / slideMs)}%`; void bar.offsetWidth; bar.style.transition = `width ${left}ms linear`; bar.style.width = "100%"; }
  const vid = el.querySelector(".st-video");
  if (!vid.hidden) vid.play().catch(() => { /* ignoré */ });
  started = Date.now();
  timerOn = true;
  timer = setTimeout(() => step(1), left);
}

/** Fige le décompte là où il en est (toucher maintenu, onglet caché). */
function freezeTimer(){
  if (timerOn) {
    clearTimeout(timer);
    timerOn = false;
    left = Math.max(300, left - (Date.now() - started));
    const bar = el.querySelector(".st-bar.cur b");
    if (bar) { const w = getComputedStyle(bar).width; bar.style.transition = "none"; bar.style.width = w; }
  }
  el.querySelector(".st-video").pause();
}

/** Quelque chose est affiché (ou on renonce à attendre) : le décompte peut partir. */
function markReady(my){
  if (my !== token || ready) return;
  ready = true;
  clearTimeout(failsafe);
  startTimer();
}

/** Aller d’une diapositive : +1 / −1 ; fermer après la dernière. */
function step(dir){
  const r = stepSlide(idx, dir, slides.length);
  if (r.close) close(); else goTo(r.idx);
}

/** Affiche `url` dans `img` une fois décodée (la diapositive est toujours la même : `my`). */
async function paintImage(img, url, my, fresh){
  if (!url) return false;
  const pre = new Image();
  pre.src = url;
  try { await pre.decode(); } catch (_) { /* affichée quand même */ }
  if (my !== token) return false;
  img.src = url;
  img.classList.add("show");
  if (fresh) { img.style.animation = "none"; void img.offsetWidth; img.style.animation = ""; }
  return true;
}

/** Précharge les diapositives suivantes en arrière-plan (miniature puis photo ; une vidéo : sa miniature). */
function preloadNext(){
  [idx + 1, idx + 2].forEach((k) => {
    const n = slides[k];
    if (!n) return;
    resolveUrl(n, { thumb: true, priority: 3 });
    if (!isVideo(n.name)) resolveUrl(n, { thumb: false, priority: 2 });
  });
}

function goTo(i){
  idx = Math.max(0, Math.min(slides.length - 1, i));
  const my = ++token;
  clearTimeout(timer); clearTimeout(failsafe);
  timerOn = false; ready = false;
  slideMs = left = SLIDE_MS;
  const s = slides[idx];
  paintBars();
  setAmbience(s);
  el.querySelector(".st-title").textContent = s.title || "";
  el.querySelector(".st-sub").textContent = s.sub || "";
  el.classList.remove("gone");
  const vid = el.querySelector(".st-video");
  vid.pause(); vid.classList.remove("show"); vid.hidden = true;
  failsafe = setTimeout(() => { if (my === token && !ready) { el.classList.add("gone"); markReady(my); } }, FAILSAFE_MS);
  loadSlide(my, s);
}

async function loadSlide(my, s){
  const live = () => my === token;
  await sleep(60);                       // des touchers très rapprochés : seule la dernière diapositive charge vraiment
  if (!live()) return;
  const img = el.querySelector(".st-img"), vid = el.querySelector(".st-video");
  const thumb = await resolveUrl(s, { thumb: true, live, priority: 11 });
  if (!live()) return;
  img.classList.remove("show");
  const shown = await paintImage(img, thumb, my, true);
  if (!live()) return;
  if (shown || !isVideo(s.name)) { if (!shown) el.classList.add("gone"); markReady(my); }
  preloadNext();
  const full = await resolveUrl(s, { thumb: false, live, priority: 10 });
  if (!live() || !full) return;
  if (isVideo(s.name)) {
    // Vidéo : toujours muette ; elle dure sa durée réelle (3 à 8 s) ; la miniature reste dessous jusqu’au démarrage
    vid.muted = true; vid.defaultMuted = true;
    vid.src = full; vid.hidden = false;
    try { await new Promise((ok, ko) => { vid.onloadedmetadata = ok; vid.onerror = ko; setTimeout(ok, 4000); }); } catch (_) { vid.hidden = true; return; }
    if (!live()) return;
    vid.currentTime = 0;
    vid.classList.add("show");
    el.classList.remove("gone");
    slideMs = left = slideDuration(true, vid.duration);
    ready = true; clearTimeout(failsafe);
    startTimer();                        // repart à 0 avec la vraie durée de la vidéo
  } else if (full !== thumb) {
    await paintImage(img, full, my, false);   // la photo nette remplace la miniature, sans relancer le zoom
    if (live()) { el.classList.remove("gone"); markReady(my); }
  }
}

function build(){
  el = document.createElement("div");
  el.className = "st-player";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Revivre la journée");
  el.innerHTML = `<img class="st-img" alt="" /><video class="st-video" muted playsinline loop hidden></video><div class="st-top"><div class="st-bars"></div>` +
    `<div class="st-head"><div class="st-text"><strong class="st-title"></strong><small class="st-sub"></small></div>` +
    `<span class="st-count"></span><button type="button" class="st-music-next" aria-label="Morceau suivant" title="Morceau suivant" hidden>⏭</button>` +
    `<button type="button" class="st-sound" aria-label="Couper ou remettre le son"></button>` +
    `<button type="button" class="st-close" aria-label="Fermer">×</button></div></div>` +
    `<span class="st-pause" aria-hidden="true">⏸</span><span class="st-credit"></span>`;
  const sound = el.querySelector(".st-sound");
  const paintSound = () => { sound.textContent = musicEnabled() ? "🔊" : "🔇"; };
  paintSound();
  sound.addEventListener("click", e => { e.stopPropagation(); setMusicEnabled(!musicEnabled()); paintSound(); if (musicEnabled()) setAmbience(slides[idx]); else stopMusic(); });
  el.querySelector(".st-music-next").addEventListener("click", e => { e.stopPropagation(); nextTrack(); });
  document.body.appendChild(el);
  el.querySelector(".st-close").addEventListener("click", e => { e.stopPropagation(); close(); });
  let downAt = 0, downX = 0, downY = 0;
  const hold = (on) => { holding = on; el.classList.toggle("paused", on); };
  el.addEventListener("pointerdown", e => {
    if (e.target.closest(".st-close, .st-sound, .st-music-next") || holding) return;   // un seul doigt à la fois
    downAt = Date.now(); downX = e.clientX; downY = e.clientY;
    hold(true);
    freezeTimer();
  });
  el.addEventListener("pointerup", e => {
    if (!holding) return;
    const held = Date.now() - downAt, dy = e.clientY - downY;
    hold(false);
    if (dy > 90) { close(); return; }                       // glisser vers le bas = fermer
    if (isLongPress(held)) { startTimer(); return; }         // appui long = simple pause
    step(tapStep(downX, el.clientWidth));                    // toucher : gauche = précédente, sinon suivante
  });
  el.addEventListener("pointercancel", () => { if (holding) { hold(false); startTimer(); } });
  document.addEventListener("keydown", e => {
    if (!el || el.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });
  document.addEventListener("visibilitychange", () => {
    if (!el || el.hidden) return;
    if (document.hidden) { freezeTimer(); suspendMusic(); } else { startTimer(); resumeMusic(); }
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
  // Le contexte audio est créé et réveillé ici, dans le geste de l’utilisateur (obligatoire sur iPhone pour pouvoir jouer ensuite)
  unlockMusic();
  if (unsubscribe) unsubscribe();
  unsubscribe = onMusicChange(paintCredit);
  holding = false;
  el.classList.remove("paused");
  goTo(start || 0);
}

/** Texte d’accroche du bouton « Revivre » (utilisé par le Carnet). */
export const storyButtonHtml = (dayN, n) =>
  `<button type="button" class="cn-play" data-story-day="${dayN}"><span aria-hidden="true">▶</span> Revivre la journée <small>${esc(String(n))} photo${n > 1 ? "s" : ""}</small></button>`;
