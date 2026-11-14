/* Briques d’interface du journal : bouton d’état (à faire / fait / pas fait), photos et visionneuse.
   Utilisées par le panneau d’un jour, la fiche d’une activité et Sur place › Journal. */

import { esc } from "../core/dom.js";
import { STATUS_LABELS, dislikedBy, heroPhoto, isVideo, likedBy, livePhotos, nextStatus } from "../domain/journal.js";
import { JOURNAL_CHANGED, addPhotos, cachedPhotoUrl, journalConfig, journalDay, journalDays, journalReadOnly, lastMediaNotice, photoUrl, removePhoto, setCoverPhoto, setHeroPhoto, setPlannedStatus, syncStatus, toggleDislike, toggleLike } from "../pwa/journal-store.js";
import { pickPhotos } from "../pwa/photo-resize.js";
import { retryDelay } from "../domain/story.js";

const GLYPH = { todo: "○", done: "✓", skipped: "✗" };

/** Bouton rond d’état d’une idée du programme. `fixed` : activité prévue (parc) → seulement à faire / fait. */
export function statusButtonHtml(iso, title, status, fixed){
  return `<button type="button" class="st-btn st-${status}" data-st-iso="${esc(iso)}" data-st-title="${esc(title)}"${fixed ? ' data-st-fixed="1"' : ""} ` +
    `aria-label="${esc(title)} : ${STATUS_LABELS[status]} (toucher pour changer)" title="${STATUS_LABELS[status]}">${GLYPH[status]}</button>`;
}

export function bindStatusButtons(root){
  root.querySelectorAll("[data-st-title]").forEach(b => b.addEventListener("click", e => {
    e.stopPropagation();
    const cur = ["todo", "done", "skipped"].find(s => b.classList.contains("st-" + s)) || "todo";
    let next = nextStatus(cur);
    if (b.dataset.stFixed && next === "skipped") next = "todo";
    setPlannedStatus(b.dataset.stIso, b.dataset.stTitle, next);
  }));
}

/** Pastille « Prévu » des activités à billets (parcs) : ce ne sont pas de simples idées. */
export const fixedPillHtml = (fixed) => fixed ? `<span class="fixed-pill">🎟️ Prévu</span>` : "";

/* —— Photos —— */

/** Bande de miniatures d’un item (remplies ensuite par hydratePhotos). */
export function photoStripHtml(iso, id, names){
  if (!names.length) return "";
  return `<div class="jr-strip">` + names.map(n =>
    `<button type="button" class="jr-thumb${isVideo(n) ? " is-video" : ""}" data-jp-iso="${esc(iso)}" data-jp-id="${esc(id)}" data-jp-name="${esc(n)}" aria-label="Voir la photo"><img data-jphoto alt="" decoding="async" /></button>`).join("") + `</div>`;
}

/** Bouton « 📷 Photos » d’une idée du programme (`target.title`). */
export const cameraButtonHtml = (iso, target, label = "Photos / vidéos") => journalReadOnly() ? "" :
  `<button type="button" class="jr-cam" data-add-photo data-iso="${esc(iso)}" data-title="${esc(target.title)}"><span aria-hidden="true">📷</span> ${esc(label)}</button>`;

let observer = null, nearObserver = null, retryBound = false;

const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));

/**
 * Charge une photo : miniature floue tout de suite (cache de l’appareil), puis la photo nette. Si la photo nette ne vient pas
 * (réseau, limite du serveur), on réessaie quelques fois (délais croissants) ; en dernier recours la miniature reste affichée
 * NETTE (jamais floue pour toujours) et un appui relance. Priorité : plus haut quand la photo est à l’écran.
 */
async function loadPhoto(b){
  const img = b.querySelector("img[data-jphoto]");
  if (!img) return;
  const [iso, name] = [b.dataset.jpIso, b.dataset.jpName];
  const video = isVideo(name);
  if (video) b.classList.add("is-video");
  const feed = !!b.dataset.jpFeed && !video;   // une vidéo n’est jamais chargée dans une image : seulement sa miniature
  b.classList.remove("missing");
  delete b.dataset.jpSoft;
  const live = () => b.isConnected;            // Carnet redessiné entre-temps : inutile de continuer
  const priority = () => (b.dataset.jpNear ? 6 : 1);
  // Déjà sur le téléphone : affichage immédiat, sans scintillement ni flou (rien n’est retéléchargé)
  const hit = await cachedPhotoUrl(iso, name, !feed);
  if (hit) { img.src = hit; img.classList.remove("blur"); b.classList.remove("loading"); return; }
  b.classList.add("loading");
  if (feed) {
    const small = await photoUrl(iso, name, true, { priority: () => priority() + 1, live });
    if (small && !img.getAttribute("src")) { img.src = small; img.classList.add("blur"); }
  }
  let url = "";
  for (let attempt = 0; live(); attempt++) {
    url = await photoUrl(iso, name, !feed, { priority, live });
    const wait = url ? null : retryDelay(attempt);
    if (url || wait == null) break;
    await sleep(wait);
  }
  b.classList.remove("loading");
  if (!live()) return;
  if (!url) {
    img.classList.remove("blur");
    if (img.getAttribute("src")) b.dataset.jpSoft = "1"; else b.classList.add("missing");
    return;
  }
  const done = () => { img.classList.remove("blur"); b.classList.remove("loading"); };
  if (feed && img.getAttribute("src") && img.src !== url) {
    const full = new Image();
    full.onload = () => { img.src = url; done(); };
    full.onerror = done;
    full.src = url;
  } else { img.onload = done; img.src = url; if (img.complete) done(); }
}

/** Branche les photos d’un conteneur : chargées quand elles approchent de l’écran, en priorité celles qui sont visibles. */
export function hydratePhotos(root){
  if (!observer && "IntersectionObserver" in window) {
    observer = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      observer.unobserve(e.target);
      loadPhoto(e.target);
    }), { rootMargin: "500px 400px" });
    nearObserver = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) e.target.dataset.jpNear = "1"; else delete e.target.dataset.jpNear;
    }), { rootMargin: "0px" });
  }
  if (!retryBound) {
    retryBound = true;
    // Retour du réseau : on relance les photos qui n’avaient pas pu arriver
    window.addEventListener("online", () => document.querySelectorAll(".vy-photo.missing, [data-jp-soft]").forEach(b => loadPhoto(b)));
  }
  root.querySelectorAll("[data-jp-name]").forEach(b => {
    if (b.dataset.jpSeen && !b.classList.contains("missing")) return;
    b.dataset.jpSeen = "1";
    if (nearObserver) nearObserver.observe(b);
    if (observer) observer.observe(b); else loadPhoto(b);
  });
  root.querySelectorAll("[data-jp-name]:not([data-jp-bound]):not([data-jp-story])").forEach(b => { b.dataset.jpBound = "1"; b.addEventListener("click", e => {
    e.stopPropagation();
    if (b.classList.contains("missing")) { b.classList.remove("missing"); hydratePhotos(b.parentElement || root); return; }
    const all = [...root.querySelectorAll("[data-jp-name]:not([data-jp-cover]):not([data-jp-story])")];   // la couverture double une photo du fil
    const same = (el) => el.dataset.jpIso === b.dataset.jpIso && el.dataset.jpId === b.dataset.jpId && el.dataset.jpName === b.dataset.jpName;
    const label = (el) => (el.closest("[data-day-label]") || {}).dataset?.dayLabel || "";
    openPhotoViewer(all.map(el => ({ iso: el.dataset.jpIso, id: el.dataset.jpId, name: el.dataset.jpName, title: el.getAttribute("aria-label") || "", label: label(el) })), all.findIndex(same));
  }); });
}

/** Branche les boutons « Photos » d’un conteneur. */
export function bindCameraButtons(root){
  root.querySelectorAll("[data-add-photo]").forEach(b => b.addEventListener("click", async e => {
    e.stopPropagation();
    const files = await pickPhotos();
    if (!files.length) return;
    b.classList.add("busy");
    const label = b.innerHTML;
    const hasVideo = files.some(f => f.type && f.type.startsWith("video/"));
    if (hasVideo) b.textContent = "Préparation de la vidéo…";
    await addPhotos(b.dataset.iso, { title: b.dataset.title }, files, hasVideo ? (p) => { b.textContent = `Vidéo ${Math.round(p * 100)} %`; } : undefined);
    b.innerHTML = label;
    b.classList.remove("busy");
    const note = lastMediaNotice();
    if (note) alert(note);
  }));
}

let viewer = null;
let vList = [], vIdx = 0;

const authorName = () => journalConfig().author || "Moi";

/** Visionneuse plein écran : glisser pour passer d’une photo à l’autre, double-appui = ❤️, légende, suppression. */
export function openPhotoViewer(list, index){
  vList = list;
  vIdx = Math.max(0, index);
  if (!viewer) {
    viewer = document.createElement("div");
    viewer.className = "jr-viewer";
    viewer.setAttribute("role", "dialog");
    viewer.setAttribute("aria-label", "Photo");
    viewer.innerHTML =
      `<button type="button" class="jv-close" aria-label="Fermer">×</button><span class="jv-pos"></span>` +
      `<div class="jv-stage"><img alt="" /><video class="jv-video" muted loop playsinline controls hidden></video><span class="jv-heart" aria-hidden="true">❤️</span></div>` +
      `<div class="jv-cap"><strong></strong><small></small></div>` +
      `<div class="jr-viewer-bar"><button type="button" class="jv-like"></button><button type="button" class="jv-dislike" aria-label="Je n’ai pas aimé"></button><button type="button" class="jv-star"></button>` +
      `<button type="button" class="jv-hero"></button><button type="button" class="jv-del" aria-label="Supprimer la photo">🗑</button></div>`;
    document.body.appendChild(viewer);
    const stage = viewer.querySelector(".jv-stage");
    let x0 = null, lastTap = 0;
    stage.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", e => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) { showViewer(vIdx + (dx < 0 ? 1 : -1)); return; }
      const now = Date.now();
      if (now - lastTap < 320) { likeCurrent(true); lastTap = 0; } else lastTap = now;
    });
    stage.addEventListener("dblclick", () => likeCurrent(true));
    viewer.querySelector(".jv-close").onclick = closeViewer;
    viewer.querySelector(".jv-like").onclick = () => likeCurrent(false);
    viewer.querySelector(".jv-dislike").onclick = () => { const p = vList[vIdx]; if (p && !journalReadOnly()) toggleDislike(p.iso, p.id); };
    viewer.querySelector(".jv-star").onclick = () => { const p = vList[vIdx]; if (p) setCoverPhoto(p.iso, p.id, p.name); };
    viewer.querySelector(".jv-hero").onclick = () => { const p = vList[vIdx]; if (p) setHeroPhoto(p.iso, p.id, p.name); };
    viewer.querySelector(".jv-del").onclick = () => {
      const p = vList[vIdx];
      if (p && confirm("Supprimer cette photo pour tout le monde ?")) { removePhoto(p.iso, p.id, p.name); closeViewer(); }
    };
    document.addEventListener("keydown", e => {
      if (!viewer || viewer.hidden) return;
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") showViewer(vIdx + 1);
      if (e.key === "ArrowLeft") showViewer(vIdx - 1);
    });
    document.addEventListener(JOURNAL_CHANGED, () => { if (viewer && !viewer.hidden) paintLike(); });
  }
  viewer.hidden = false;
  showViewer(vIdx);
}

function closeViewer(){
  const vid = viewer.querySelector("video");
  vid.pause(); vid.removeAttribute("src");
  viewer.hidden = true;
}

function likeCurrent(onlyAdd){
  const p = vList[vIdx];
  if (!p || journalReadOnly()) return;
  const it = journalDay(p.iso).items[p.id];
  const mine = likedBy(it).includes(authorName());
  if (!(onlyAdd && mine)) toggleLike(p.iso, p.id);
  if (onlyAdd) { const h = viewer.querySelector(".jv-heart"); h.classList.remove("pop"); void h.offsetWidth; h.classList.add("pop"); }
}

function paintLike(){
  const p = vList[vIdx];
  if (!p) return;
  const it = p && journalDay(p.iso).items[p.id];
  const who = likedBy(it);
  const btn = viewer.querySelector(".jv-like");
  btn.textContent = `${who.includes(authorName()) ? "❤️" : "🤍"} ${who.length || ""}`.trim();
  const bad = dislikedBy(it);
  const dbtn = viewer.querySelector(".jv-dislike");
  dbtn.textContent = `👎 ${bad.length || ""}`.trim();
  dbtn.classList.toggle("on", bad.includes(authorName()));
  // Photo phare de l’activité / couverture du carnet : état de la photo affichée
  const star = viewer.querySelector(".jv-star"), hero = viewer.querySelector(".jv-hero");
  const isStar = !!(it && it.cover === p.name);
  const h = heroPhoto(journalDays());
  const isHero = !!(h && h.iso === p.iso && h.id === p.id && h.name === p.name);
  star.textContent = isStar ? "⭐ Photo phare ✓" : "☆ Photo phare";
  star.classList.toggle("on", isStar);
  hero.textContent = isHero ? "🖼 Couverture ✓" : "🖼 Couverture";
  hero.classList.toggle("on", isHero);
}

async function showViewer(i){
  if (!vList.length) return;
  vIdx = (i + vList.length) % vList.length;
  const p = vList[vIdx];
  viewer.querySelector("img").hidden = false;
  viewer.querySelector(".jv-pos").textContent = vList.length > 1 ? `${vIdx + 1} / ${vList.length}` : "";
  viewer.querySelector(".jv-cap strong").textContent = p.title || "";
  viewer.querySelector(".jv-cap small").textContent = p.label || "";
  viewer.querySelector(".jr-viewer-bar").hidden = journalReadOnly();   // lecture seule : ni cœur ni suppression
  paintLike();
  const img = viewer.querySelector("img"), vid = viewer.querySelector("video");
  vid.pause(); vid.removeAttribute("src"); vid.hidden = true;
  img.removeAttribute("src");
  const live = () => vList[vIdx] === p && !viewer.hidden;   // on a déjà tourné la page : abandonner
  const small = await photoUrl(p.iso, p.name, true, { priority: 11, live });
  if (live() && small) img.src = small;
  let url = "";
  for (let attempt = 0; live(); attempt++) {
    url = await photoUrl(p.iso, p.name, false, { priority: 10, live });
    const wait = url ? null : retryDelay(attempt);
    if (url || wait == null) break;
    await sleep(wait);
  }
  if (!live() || !url) return;
  if (isVideo(p.name)) {
    // Vidéo : toujours sans son, en boucle ; la miniature reste affichée jusqu’à ce qu’elle démarre
    vid.muted = true; vid.poster = small || "";
    vid.src = url; vid.hidden = false; img.hidden = true;
    vid.play().catch(() => { /* lecture au toucher */ });
  } else { img.hidden = false; img.src = url; }
  // Les voisines se préparent en douce pour que le balayage soit instantané
  [vIdx + 1, vIdx - 1].forEach((k) => { const n = vList[(k + vList.length) % vList.length]; if (n && n !== p && !isVideo(n.name)) photoUrl(n.iso, n.name, false, { priority: 2 }); });
}

/** Branche les photos et les boutons 📷 d’un conteneur. */
export function bindJournalRows(root){
  hydratePhotos(root);
  bindCameraButtons(root);
}

/** Ligne d’état de la synchro (Sur place › Journal, Réglages). */
export function syncLineText(configured){
  if (!configured) return "Pas connecté : tout reste sur ce téléphone. Réglages › Journal pour partager avec l’autre téléphone.";
  switch (syncStatus.state) {
    case "syncing": return "Synchronisation…";
    case "offline": return "Hors ligne : sera envoyé au retour du réseau.";
    case "error": return "Synchro impossible : " + syncStatus.error;
    case "ok": return "Synchronisé" + (syncStatus.at ? " à " + new Date(syncStatus.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "") + ".";
    default: return "";
  }
}
