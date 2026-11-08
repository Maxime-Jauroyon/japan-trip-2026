/* Briques d’interface du journal : bouton d’état (à faire / fait / pas fait), lignes d’ajouts,
   feuille « Ajouter ce qu’on a fait ». Utilisées par le panneau d’un jour, la fiche d’une activité et Sur place › Journal. */

import { esc } from "../core/dom.js";
import { state } from "../core/state.js";
import { STATUS_LABELS, likedBy, livePhotos, nextStatus } from "../domain/journal.js";
import { JOURNAL_CHANGED, addExtra, addPhotos, journalConfig, journalDay, patchItem, photoUrl, removeItem, removePhoto, setPlannedStatus, syncStatus, toggleLike } from "../pwa/journal-store.js";
import { pickPhotos } from "../pwa/photo-resize.js";

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

/** Ligne d’une activité ajoutée sur place (avec ses photos et un bouton 📷). */
export function extraRowHtml(iso, it){
  return `<li class="jr-extra" data-extra="${esc(it.id)}" data-iso="${esc(iso)}" role="button" tabindex="0">` +
    `<span class="jr-time">${esc(it.time || "·")}</span>` +
    `<span class="jr-main"><strong>${esc(it.title)}</strong>${it.note ? `<small>${esc(it.note)}</small>` : ""}</span>` +
    `${it.by ? `<span class="jr-by">${esc(it.by)}</span>` : ""}${cameraButtonHtml(iso, { id: it.id }, "")}` +
    photoStripHtml(iso, it.id, livePhotos(it)) + `</li>`;
}

export function extrasListHtml(iso, extras){
  return extras.length ? `<ul class="jr-extras">${extras.map(it => extraRowHtml(iso, it)).join("")}</ul>` : "";
}

export const addButtonHtml = (iso) => `<button type="button" class="jr-add" data-add-iso="${esc(iso)}"><span aria-hidden="true">＋</span> Ajouter une activité</button>`;

/* —— Photos —— */

/** Bande de miniatures d’un item (remplies ensuite par hydratePhotos). */
export function photoStripHtml(iso, id, names){
  if (!names.length) return "";
  return `<div class="jr-strip">` + names.map(n =>
    `<button type="button" class="jr-thumb" data-jp-iso="${esc(iso)}" data-jp-id="${esc(id)}" data-jp-name="${esc(n)}" aria-label="Voir la photo"><img data-jphoto alt="" decoding="async" /></button>`).join("") + `</div>`;
}

/** Bouton « 📷 Photos » : `target` = idée du programme (title) ou activité ajoutée (id). */
export const cameraButtonHtml = (iso, target, label = "Photos") =>
  `<button type="button" class="jr-cam" data-add-photo data-iso="${esc(iso)}"${target.id ? ` data-id="${esc(target.id)}"` : ` data-title="${esc(target.title)}"`}><span aria-hidden="true">📷</span> ${esc(label)}</button>`;

/** Charge les photos : miniature floue tout de suite (cache de l’appareil), puis la photo nette ; « Réessayer » si elle manque. */
export function hydratePhotos(root){
  root.querySelectorAll("[data-jp-name]").forEach(async b => {
    const img = b.querySelector("img[data-jphoto]");
    if (!img) return;
    const feed = !!b.dataset.jpFeed;
    b.classList.remove("missing");
    b.classList.add("loading");
    const [iso, name] = [b.dataset.jpIso, b.dataset.jpName];
    if (feed) {
      const small = await photoUrl(iso, name, true);
      if (small) { img.src = small; img.classList.add("blur"); }
    }
    const url = await photoUrl(iso, name, !feed);
    if (!url) { b.classList.remove("loading"); if (!img.src) b.classList.add("missing"); return; }
    const done = () => { img.classList.remove("blur"); b.classList.remove("loading"); };
    if (feed && img.src && img.src !== url) {
      const full = new Image();
      full.onload = () => { img.src = url; done(); };
      full.onerror = done;
      full.src = url;
    } else { img.onload = done; img.src = url; if (img.complete) done(); }
  });
  root.querySelectorAll("[data-jp-name]:not([data-jp-bound])").forEach(b => { b.dataset.jpBound = "1"; b.addEventListener("click", e => {
    e.stopPropagation();
    if (b.classList.contains("missing")) { b.classList.remove("missing"); hydratePhotos(b.parentElement || root); return; }
    const all = [...root.querySelectorAll("[data-jp-name]:not([data-jp-cover])")];   // la couverture double une photo du fil
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
    await addPhotos(b.dataset.iso, b.dataset.id ? { id: b.dataset.id } : { title: b.dataset.title }, files);
    b.classList.remove("busy");
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
      `<div class="jv-stage"><img alt="" /><span class="jv-heart" aria-hidden="true">❤️</span></div>` +
      `<div class="jv-cap"><strong></strong><small></small></div>` +
      `<div class="jr-viewer-bar"><button type="button" class="jv-like"></button><button type="button" class="jv-del">Supprimer</button></div>`;
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
    viewer.querySelector(".jv-close").onclick = () => { viewer.hidden = true; };
    viewer.querySelector(".jv-like").onclick = () => likeCurrent(false);
    viewer.querySelector(".jv-del").onclick = () => {
      const p = vList[vIdx];
      if (p && confirm("Supprimer cette photo pour tout le monde ?")) { removePhoto(p.iso, p.id, p.name); viewer.hidden = true; }
    };
    document.addEventListener("keydown", e => {
      if (!viewer || viewer.hidden) return;
      if (e.key === "Escape") viewer.hidden = true;
      if (e.key === "ArrowRight") showViewer(vIdx + 1);
      if (e.key === "ArrowLeft") showViewer(vIdx - 1);
    });
    document.addEventListener(JOURNAL_CHANGED, () => { if (viewer && !viewer.hidden) paintLike(); });
  }
  viewer.hidden = false;
  showViewer(vIdx);
}

function likeCurrent(onlyAdd){
  const p = vList[vIdx];
  if (!p) return;
  const it = journalDay(p.iso).items[p.id];
  const mine = likedBy(it).includes(authorName());
  if (!(onlyAdd && mine)) toggleLike(p.iso, p.id);
  if (onlyAdd) { const h = viewer.querySelector(".jv-heart"); h.classList.remove("pop"); void h.offsetWidth; h.classList.add("pop"); }
}

function paintLike(){
  const p = vList[vIdx];
  const it = p && journalDay(p.iso).items[p.id];
  const who = likedBy(it);
  const btn = viewer.querySelector(".jv-like");
  btn.textContent = `${who.includes(authorName()) ? "❤️" : "🤍"} ${who.length || ""}`.trim();
  btn.title = who.join(", ");
}

async function showViewer(i){
  if (!vList.length) return;
  vIdx = (i + vList.length) % vList.length;
  const p = vList[vIdx];
  viewer.querySelector(".jv-pos").textContent = vList.length > 1 ? `${vIdx + 1} / ${vList.length}` : "";
  viewer.querySelector(".jv-cap strong").textContent = p.title || "";
  viewer.querySelector(".jv-cap small").textContent = [p.label, (journalDay(p.iso).items[p.id] || {}).by].filter(Boolean).join(" · ");
  paintLike();
  const img = viewer.querySelector("img");
  img.removeAttribute("src");
  const [small, full] = [await photoUrl(p.iso, p.name, true), photoUrl(p.iso, p.name, false)];
  if (vList[vIdx] === p && small) img.src = small;
  const url = await full;
  if (vList[vIdx] === p && url) img.src = url;
}

/** Branche les lignes d’ajouts (modifier) et les boutons « Ajouter » d’un conteneur. */
export function bindJournalRows(root){
  hydratePhotos(root);
  bindCameraButtons(root);
  root.querySelectorAll("[data-extra]").forEach(li => {
    const open = () => openJournalSheet({ iso: li.dataset.iso, id: li.dataset.extra });
    li.addEventListener("click", open);
    li.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  });
  root.querySelectorAll("[data-add-iso]").forEach(b => b.addEventListener("click", () => openJournalSheet({ iso: b.dataset.addIso })));
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

/* —— Feuille d’ajout / de modification —— */

let sheet = null;

function closeSheet(){
  if (sheet) sheet.hidden = true;
  document.documentElement.classList.remove("jr-sheet-open");
}

/** Ouvre la feuille : `id` absent = nouvelle activité ; sinon modification (avec « Supprimer »). */
export function openJournalSheet({ iso, id }){
  const cur = id ? journalDay(iso).items[id] : null;
  if (!sheet) {
    sheet = document.createElement("div");
    sheet.className = "jr-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-label", "Activité");
    document.body.appendChild(sheet);
  }
  const pos = state.userPos ? { lat: state.userPos.lat, lng: state.userPos.lng } : null;
  let geo = cur && cur.lat != null ? { lat: cur.lat, lng: cur.lng } : null;
  sheet.innerHTML =
    `<div class="jr-card"><div class="jr-head"><h3>${cur ? "Modifier" : "Ce qu’on a fait"}</h3><button type="button" class="jr-close" aria-label="Fermer">×</button></div>` +
    `<label class="jr-field"><span>Quoi ?</span><input type="text" id="jr-title" maxlength="80" placeholder="ex. Ramen chez Ichiran, karaoké…" value="${esc(cur ? cur.title : "")}" autocomplete="off" /></label>` +
    `<div class="jr-row"><label class="jr-field"><span>Heure</span><input type="time" id="jr-time" value="${esc(cur && cur.time ? cur.time : "")}" /></label>` +
    `<button type="button" class="jr-geo" id="jr-geo"${pos || geo ? "" : " disabled"}>${geo ? "📍 Position ajoutée ✓" : "📍 Ajouter ma position"}</button></div>` +
    `<label class="jr-field"><span>Note (facultatif)</span><textarea id="jr-note" rows="2" maxlength="300" placeholder="Un souvenir, un conseil…">${esc(cur && cur.note ? cur.note : "")}</textarea></label>` +
    (cur ? photoStripHtml(iso, id, livePhotos(cur)) : "") +
    `<button type="button" class="jr-cam wide" id="jr-photo-btn"><span aria-hidden="true">📷</span> <span id="jr-photo-label">${cur ? "Ajouter des photos" : "Ajouter des photos"}</span></button>` +
    `<div class="jr-actions">${cur ? `<button type="button" class="btn-secondary jr-del">Supprimer</button>` : ""}<button type="button" class="btn-primary jr-save">Enregistrer</button></div></div>`;
  sheet.hidden = false;
  document.documentElement.classList.add("jr-sheet-open");
  const $ = (s) => sheet.querySelector(s);
  $(".jr-close").onclick = closeSheet;
  sheet.onclick = (e) => { if (e.target === sheet) closeSheet(); };
  let pending = [];
  hydratePhotos(sheet);
  $("#jr-photo-btn").onclick = async () => {
    const files = await pickPhotos();
    if (!files.length) return;
    if (cur) { await addPhotos(iso, { id }, files); $("#jr-photo-label").textContent = `${files.length} photo${files.length > 1 ? "s" : ""} ajoutée${files.length > 1 ? "s" : ""} ✓`; return; }
    pending = pending.concat(files);
    $("#jr-photo-label").textContent = `${pending.length} photo${pending.length > 1 ? "s" : ""} prête${pending.length > 1 ? "s" : ""} ✓`;
  };
  $("#jr-geo").onclick = () => { if (pos) { geo = pos; $("#jr-geo").textContent = "📍 Position ajoutée ✓"; } };
  $(".jr-save").onclick = () => {
    const title = $("#jr-title").value.trim();
    if (!title) { $("#jr-title").focus(); return; }
    const fields = { title, time: $("#jr-time").value || undefined, note: $("#jr-note").value.trim() || undefined, lat: geo ? geo.lat : undefined, lng: geo ? geo.lng : undefined };
    if (cur) patchItem(iso, id, fields);
    else { const nid = addExtra(iso, fields); if (pending.length) addPhotos(iso, { id: nid }, pending); }
    closeSheet();
  };
  const del = $(".jr-del");
  if (del) del.onclick = () => { if (confirm("Supprimer cette activité ?")) { removeItem(iso, id); closeSheet(); } };
  if (!cur) setTimeout(() => $("#jr-title").focus(), 50);
}
