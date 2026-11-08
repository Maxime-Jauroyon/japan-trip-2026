/* Onglet Carnet : couverture, parcours, fil / grille de ce qu’on a vraiment fait, avec les photos
   (journal de ce téléphone, déjà synchronisé : fonctionne hors ligne). Chargement : squelettes, photos floues → nettes,
   préchargement de toutes les photos pour le hors-ligne. */

import { DAYS, TRIP } from "../../core/data.js";
import { dayToISO, japanTodayISO } from "../../core/dates.js";
import { esc } from "../../core/dom.js";
import { doneItems, likedBy } from "../../domain/journal.js";
import { JOURNAL_PREFETCH, JOURNAL_SYNC, journalConfig, journalDays, journalReady, prefetchPhotos, prefetchStatus, syncNow, syncStatus, toggleLike } from "../../pwa/journal-store.js";
import { bindCarnet, carnetHtml } from "../carnet-feed.js";
import { hydratePhotos, syncLineText } from "../journal-widgets.js";

const SKELETON = `<div class="cn-skel"><div class="sk sk-cover"></div><div class="sk-row"><i class="sk sk-dot"></i><i class="sk sk-dot"></i><i class="sk sk-dot"></i><i class="sk sk-dot"></i></div>` +
  `<div class="sk sk-post"></div><div class="sk sk-post"></div></div>`;

const photoBtn = (iso, p, opt = {}) =>
  `<button type="button" class="vy-photo${opt.cover ? " cover" : ""}${opt.thumb ? " sq" : ""}"${opt.thumb ? "" : ' data-jp-feed="1"'}${opt.cover ? " data-jp-cover=\"1\"" : ""} data-jp-iso="${esc(iso)}" data-jp-id="${esc(p.id)}" data-jp-name="${esc(p.name)}" aria-label="${esc(p.title)}">` +
  `<img data-jphoto alt="" decoding="async" /></button>`;

function likeHtml(iso, it){
  const mine = it.likes.includes(journalConfig().author || "Moi");
  return `<button type="button" class="cn-like" data-like-iso="${esc(iso)}" data-like-id="${esc(it.id)}" aria-pressed="${mine}" aria-label="J’aime">${mine ? "❤️" : "🤍"}${it.likes.length ? ` <b>${it.likes.length}</b>` : ""}</button>` +
    (it.likes.length ? `<small class="cn-likers">${esc(it.likes.join(", "))}</small>` : "");
}

/** Barre d’état : synchro, photos prêtes hors ligne. */
export function renderCarnetStatus(){
  const el = document.getElementById("carnet-status");
  if (!el) return;
  const { done, total, running } = prefetchStatus;
  const pct = total ? Math.round(100 * done / total) : 100;
  el.innerHTML = `<span>${esc(syncLineText(journalReady()))}</span>` +
    (total ? `<span class="cn-offline${running ? " running" : ""}"><i style="width:${pct}%"></i><b>${running ? `Photos hors ligne ${done} / ${total}` : `✓ ${total} photo${total > 1 ? "s" : ""} prête${total > 1 ? "s" : ""} hors ligne`}</b></span>` : "");
  const btn = document.getElementById("carnet-refresh");
  if (btn) btn.classList.toggle("spin", syncStatus.state === "syncing");
}

export function renderCarnet(){
  const box = document.getElementById("carnet-body");
  if (!box) return;
  const scroller = document.getElementById("view-carnet");
  const top = scroller ? scroller.scrollTop : 0;
  const days = journalDays()
    .map(([iso, jd]) => ({ iso, day: DAYS.find(d => dayToISO(d) === iso), items: doneItems(jd) }))
    .filter(x => x.day && x.items.length);
  renderCarnetStatus();
  if (!days.length && syncStatus.state === "syncing") { box.innerHTML = SKELETON; return; }   // premier chargement : squelette
  box.innerHTML = carnetHtml({ days, today: japanTodayISO(), datesLabel: TRIP.datesLabelLong,
    emptyText: "Rien pour l’instant. Coche ce que vous faites dans Sur place › Journal et ajoutez des photos : tout apparaît ici." }, { photoBtn, likeHtml });
  hydratePhotos(box);
  bindCarnet(box, renderCarnet);
  box.querySelectorAll("[data-like-id]").forEach(b => b.addEventListener("click", () => toggleLike(b.dataset.likeIso, b.dataset.likeId)));
  if (scroller) scroller.scrollTop = top;   // un envoi ou un cœur ne fait pas remonter le fil
}

/** Boutons « Actualiser » / « Envoyer à la famille » et tirer vers le bas pour actualiser. */
export function bindCarnetShare(){
  document.addEventListener(JOURNAL_PREFETCH, renderCarnetStatus);
  document.addEventListener(JOURNAL_SYNC, () => { renderCarnetStatus(); if (syncStatus.state !== "syncing") renderCarnet(); else if (!document.querySelector("#carnet-body .vy-post")) renderCarnet(); });
  const refresh = () => { syncNow().then(prefetchPhotos); };
  document.getElementById("carnet-refresh")?.addEventListener("click", refresh);
  const view = document.getElementById("view-carnet");
  let y0 = null;
  view?.addEventListener("touchstart", e => { y0 = view.scrollTop === 0 ? e.touches[0].clientY : null; }, { passive: true });
  view?.addEventListener("touchend", e => { if (y0 != null && e.changedTouches[0].clientY - y0 > 90 && view.scrollTop === 0) refresh(); y0 = null; });
  document.getElementById("carnet-share")?.addEventListener("click", async () => {
    const url = new URL("voyage.html", location.href).href;
    try {
      if (navigator.share) { await navigator.share({ title: "Notre voyage au Japon", text: "Notre voyage au Japon, en direct :", url }); return; }
    } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(url); alert("Lien copié :\n" + url); } catch (_) { prompt("Lien à envoyer :", url); }
  });
}
