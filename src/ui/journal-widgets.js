/* Briques d’interface du journal : bouton d’état (à faire / fait / pas fait), lignes d’ajouts,
   feuille « Ajouter ce qu’on a fait ». Utilisées par le panneau d’un jour, la fiche d’une activité et Sur place › Journal. */

import { esc } from "../core/dom.js";
import { state } from "../core/state.js";
import { STATUS_LABELS, livePhotos, nextStatus } from "../domain/journal.js";
import { addExtra, addPhotos, journalDay, patchItem, photoUrl, removeItem, removePhoto, setPlannedStatus, syncStatus } from "../pwa/journal-store.js";
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

/** Charge les miniatures (cache de l’appareil, sinon dépôt) et branche l’ouverture en grand. */
export function hydratePhotos(root){
  root.querySelectorAll("img[data-jphoto]").forEach(async img => {
    const b = img.closest("[data-jp-name]");
    if (!b) return;
    const url = await photoUrl(b.dataset.jpIso, b.dataset.jpName, true);
    if (url) img.src = url; else b.classList.add("missing");
  });
  root.querySelectorAll("[data-jp-name]").forEach(b => b.addEventListener("click", e => {
    e.stopPropagation();
    openPhotoViewer(b.dataset.jpIso, b.dataset.jpId, b.dataset.jpName);
  }));
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

export async function openPhotoViewer(iso, id, name){
  if (!viewer) {
    viewer = document.createElement("div");
    viewer.className = "jr-viewer";
    viewer.setAttribute("role", "dialog");
    viewer.setAttribute("aria-label", "Photo");
    document.body.appendChild(viewer);
  }
  viewer.innerHTML = `<img alt="" /><div class="jr-viewer-bar"><button type="button" class="jr-v-del">Supprimer</button><button type="button" class="jr-v-close">Fermer</button></div>`;
  viewer.hidden = false;
  const close = () => { viewer.hidden = true; };
  viewer.querySelector(".jr-v-close").onclick = close;
  viewer.onclick = (e) => { if (e.target === viewer || e.target.tagName === "IMG") close(); };
  viewer.querySelector(".jr-v-del").onclick = () => { if (confirm("Supprimer cette photo pour tout le monde ?")) { removePhoto(iso, id, name); close(); } };
  const url = await photoUrl(iso, name, false) || await photoUrl(iso, name, true);
  if (url) viewer.querySelector("img").src = url;
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
