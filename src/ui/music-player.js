/* Moteur de musique de la story : Web Audio (le volume reste réglable sur iPhone, ce que `audio.volume` ne permet pas),
   fondus enchaînés à puissance égale entre deux familles de musique ou entre deux morceaux d’une même famille,
   playlist par famille (le morceau suivant recouvre la fin du courant : aucune coupure, aucune boucle audible),
   préchargement des familles à venir et bouton « morceau suivant ». Règles de calcul : domain/music.js. */

import { soundFor } from "../domain/sounds.js";
import { FADE_FAMILY_S, FADE_SKIP_S, FADE_STOP_S, FADE_TRACK_S, crossfadeStart, gainAt, nextTrackIndex, rampCurve, trimCache } from "../domain/music.js";

const SOUND_KEY = "japan-trip-story-sound";
const MAX_BUFFERS = 4;          // morceaux décodés gardés en mémoire (≈ 14 Mo chacun)
const SILENT_MP3 = "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAACAAABVgAQ0NDQ0NDQ0NDQ0NDXl5eXl5eXl5eXl5eeXl5eXl5eXl5eXl5eZSUlJSUlJSUlJSUlK+vr6+vr6+vr6+vr6/KysrKysrKysrKysrl5eXl5eXl5eXl5eXl////////////////AAAAAExhdmM2MC4zMQAAAAAAAAAAAAAAACQDQAAAAAAAAAVYsAJ7ggAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MoxAAAAANIAAAAAExBTUVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MoxHwAAANIAAAAAFVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MoxHwAAANIAAAAAFVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MoxHwAAANIAAAAAFVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MoxHwAAANIAAAAAFVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MoxHwAAANIAAAAAFVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MoxHwAAANIAAAAAFVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MoxHwAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";

let ctx = null, master = null, silentEl = null, ticker = null, epoch = 0, wanted = null;
let voices = [];                // morceaux en cours : { family, idx, track, src, gain, ramp, startAt, dur, volume, nextDone, dying, killAt }
const buffers = new Map();      // fichier → Promise<AudioBuffer | null>
const lastIdx = {};             // famille → dernier morceau joué (on enchaîne sur le suivant quand on y revient)
const listeners = new Set();

const notify = () => listeners.forEach((fn) => { try { fn(currentTrack()); } catch (_) { /* ignoré */ } });

export const musicEnabled = () => { try { return localStorage.getItem(SOUND_KEY) !== "off"; } catch (_) { return true; } };
export const setMusicEnabled = (on) => { try { localStorage.setItem(SOUND_KEY, on ? "on" : "off"); } catch (_) { /* pas de stockage */ } };

/** Abonne `fn(morceau | null)` aux changements de morceau (crédit affiché dans la story). Rend la fonction de désabonnement. */
export function onMusicChange(fn){ listeners.add(fn); return () => listeners.delete(fn); }

/** Morceau en cours (le plus récent qui ne s’éteint pas) : { family, label, title, author, license } ou null. */
export function currentTrack(){
  const v = [...voices].reverse().find((x) => !x.dying);
  return v ? { family: v.family, label: v.label, title: v.track.title, author: v.track.author, license: v.track.license } : null;
}

/** État pour les tests : contexte audio, morceaux actifs et leur gain à l’instant. */
export function musicDebug(){
  const now = ctx ? ctx.currentTime : 0;
  return { ctx: ctx ? ctx.state : null, voices: voices.map((v) => ({ family: v.family, file: v.track.file, dying: !!v.dying, gain: gainAt(v.ramp, now) })) };
}

/**
 * À appeler DANS le geste de l’utilisateur (toucher « Revivre la journée ») : crée et réveille le contexte audio
 * (obligatoire sur iPhone), passe la session audio en « lecture » (le son passe même interrupteur silencieux activé).
 */
export function unlockMusic(){
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.connect(ctx.destination);
    }
    if (navigator.audioSession) navigator.audioSession.type = "playback";
    ctx.resume();
    const s = ctx.createBufferSource();
    s.buffer = ctx.createBuffer(1, 1, 22050);
    s.connect(ctx.destination);
    s.start(0);
    if (!silentEl) { silentEl = new Audio(SILENT_MP3); silentEl.loop = true; }
    silentEl.play().catch(() => { /* ignoré */ });
    return true;
  } catch (_) { return false; }
}

function loadBuffer(file){
  if (!ctx) return Promise.resolve(null);
  if (buffers.has(file)) { const p = buffers.get(file); buffers.delete(file); buffers.set(file, p); return p; }   // le plus récemment utilisé en dernier
  const p = fetch(file)
    .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); })
    .then((ab) => new Promise((ok, ko) => { const r = ctx.decodeAudioData(ab, ok, ko); if (r && r.then) r.then(ok, ko); }))
    .catch(() => { buffers.delete(file); return null; });
  buffers.set(file, p);
  trimCache(buffers, MAX_BUFFERS, voices.map((v) => v.track.file));
  return p;
}

/** Rampe de gain à puissance égale vers `to` en `sec` secondes, à partir du gain actuel (même en plein fondu). */
function ramp(v, to, sec){
  const now = ctx.currentTime;
  const from = v.ramp ? gainAt(v.ramp, now) : v.gain.gain.value;
  const g = v.gain.gain;
  g.cancelScheduledValues(now);
  g.setValueAtTime(from, now);
  if (sec <= 0.02 || Math.abs(to - from) < 1e-4) { g.setValueAtTime(to, now); v.ramp = { from: to, to, t0: now, dur: 0 }; return; }
  g.setValueCurveAtTime(Float32Array.from(rampCurve(from, to, 48)), now, sec);
  v.ramp = { from, to, t0: now, dur: sec };
}

function fadeOut(v, sec){
  if (v.dying) return;
  v.dying = true;
  ramp(v, 0, sec);
  v.killAt = ctx.currentTime + sec + 0.1;
}

function kill(v){
  try { v.src.stop(); } catch (_) { /* déjà arrêté */ }
  try { v.src.disconnect(); v.gain.disconnect(); } catch (_) { /* ignoré */ }
  voices = voices.filter((x) => x !== v);
}

async function startVoice(fam, idx, fade){
  const track = fam.tracks[idx % fam.tracks.length];
  const buf = await loadBuffer(track.file);
  if (!buf || !ctx) return null;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  src.connect(gain);
  gain.connect(master);
  src.start(0);
  const v = { family: fam.id, label: fam.label, idx: idx % fam.tracks.length, track, src, gain, ramp: null, startAt: ctx.currentTime, dur: buf.duration, volume: fam.volume, nextDone: false, dying: false, killAt: 0 };
  ramp(v, fam.volume, fade);
  voices.push(v);
  lastIdx[fam.id] = v.idx;
  startTicker();
  return v;
}

/** Surveille les fins de morceaux (lance le suivant 4 s avant la fin) et éteint ceux qui ont fini de s’effacer. */
function tick(){
  if (!ctx) return;
  const now = ctx.currentTime;
  voices.filter((v) => v.dying && now >= v.killAt).forEach(kill);
  const active = voices.filter((v) => !v.dying);
  active.forEach((v) => {
    if (v.nextDone || now - v.startAt < crossfadeStart(v.dur, FADE_TRACK_S)) return;
    v.nextDone = true;
    const family = wanted && wanted.id === v.family ? wanted : null;
    if (!family) return;
    startVoice(family, nextTrackIndex(v.idx, family.tracks.length), FADE_TRACK_S).then((n) => { if (n) { fadeOut(v, FADE_TRACK_S); notify(); } else v.nextDone = false; });
  });
  while (voices.length > 3) { const old = voices.find((v) => v.dying) || voices[0]; kill(old); }   // des changements très rapprochés : jamais plus de 3 morceaux en même temps
  if (!voices.length) stopTicker();
}
function startTicker(){ if (!ticker) ticker = setInterval(tick, 250); }
function stopTicker(){ clearInterval(ticker); ticker = null; if (ctx && ctx.state === "running" && !voices.length) ctx.suspend().catch(() => { /* ignoré */ }); }

/** Musique de l’activité `title` : continue si la famille ne change pas, sinon fondu enchaîné vers la famille voulue. */
export function setMusicFor(title){
  if (!ctx) return;
  const fam = musicEnabled() ? soundFor(title) : null;
  if (!fam) { stopMusic(); return; }
  if (ctx.state === "suspended") ctx.resume();
  const playing = voices.filter((v) => !v.dying);
  if (wanted && wanted.id === fam.id && playing.length) return;   // même famille : la musique continue
  wanted = fam;
  const my = ++epoch;
  const from = playing.slice();
  const idx = lastIdx[fam.id] == null ? 0 : nextTrackIndex(lastIdx[fam.id], fam.tracks.length);
  startVoice(fam, idx, FADE_FAMILY_S).then((v) => {
    if (!v) { if (my === epoch) from.forEach((o) => fadeOut(o, FADE_STOP_S)); return; }
    if (my !== epoch) { fadeOut(v, 0.3); return; }               // une autre activité a pris la place entre-temps
    from.forEach((o) => fadeOut(o, FADE_FAMILY_S));
    notify();
  });
}

/** Passe au morceau suivant de la famille en cours (fondu court). */
export function nextTrack(){
  const v = [...voices].reverse().find((x) => !x.dying);
  if (!v || !wanted || wanted.id !== v.family) return;
  const my = ++epoch;
  startVoice(wanted, nextTrackIndex(v.idx, wanted.tracks.length), FADE_SKIP_S).then((n) => {
    if (!n) return;
    if (my !== epoch) { fadeOut(n, 0.3); return; }
    voices.filter((o) => o !== n && !o.dying).forEach((o) => fadeOut(o, FADE_SKIP_S));
    notify();
  });
}

/** Précharge (télécharge et décode) le morceau qui jouera à la prochaine entrée dans la famille de chacun de ces titres. */
export function preloadForTitles(titles){
  if (!ctx || !musicEnabled()) return;
  titles.forEach((title) => {
    const fam = soundFor(title);
    if (!fam || (wanted && wanted.id === fam.id)) return;
    const idx = lastIdx[fam.id] == null ? 0 : nextTrackIndex(lastIdx[fam.id], fam.tracks.length);
    loadBuffer(fam.tracks[idx % fam.tracks.length].file);
  });
}

/** Coupe en fondu (🔇, fermeture de la story). */
export function stopMusic(sec = FADE_STOP_S){
  epoch++;
  wanted = null;
  if (!ctx) return;
  voices.forEach((v) => fadeOut(v, sec));
  notify();
}

/** Onglet caché : on fige le temps audio ; de retour : on reprend. */
export function suspendMusic(){ if (ctx && ctx.state === "running") ctx.suspend().catch(() => { /* ignoré */ }); }
export function resumeMusic(){ if (ctx && voices.length && ctx.state === "suspended") ctx.resume().catch(() => { /* ignoré */ }); }
