/* Onglet Carnet : couverture, parcours, fil / grille de ce qu’on a vraiment fait, avec les photos
   (journal de ce téléphone, déjà synchronisé : fonctionne hors ligne). Chargement : squelettes, photos chargées à la
   demande (floues → nettes), préchargement pour le hors-ligne. Le fil n’est redessiné que si les données changent. */

import { DAYS, TRIP } from "../../core/data.js";
import { dayToISO, japanTodayISO } from "../../core/dates.js";
import { esc } from "../../core/dom.js";
import { doneItems } from "../../domain/journal.js";
import { JOURNAL_PREFETCH, JOURNAL_SYNC, journalConfig, journalDays, journalReady, prefetchPhotos, prefetchStatus, syncNow, syncStatus, toggleLike } from "../../pwa/journal-store.js";
import { bindCarnet, carnetHtml, feedState } from "../carnet-feed.js";
import { hydratePhotos, syncLineText } from "../journal-widgets.js";

const SKELETON = `<div class="cn-skel"><div class="sk sk-cover"></div><div class="sk-row"><i class="sk sk-dot"></i><i class="sk sk-dot"></i><i class="sk sk-dot"></i><i class="sk sk-dot"></i></div>` +
  `<div class="sk sk-post"></div></div>`;

const photoBtn = (iso, p, opt = {}) =>
  `<button type="button" class="vy-photo${opt.thumb ? " sq" : ""}"${opt.thumb ? "" : ' data-jp-feed="1"'}${opt.cover ? " data-jp-cover=\"1\"" : ""} data-jp-iso="${esc(iso)}" data-jp-id="${esc(p.id)}" data-jp-name="${esc(p.name)}" aria-label="${esc(p.title)}">` +
  `<img data-jphoto alt="" decoding="async" /></button>`;

function likeHtml(iso, it){
  const mine = it.likes.includes(journalConfig().author || "Moi");
  return `<button type="button" class="cn-like" data-like-iso="${esc(iso)}" data-like-id="${esc(it.id)}" aria-pressed="${mine}" aria-label="J’aime">${mine ? "❤️" : "🤍"}${it.likes.length ? ` <b>${it.likes.length}</b>` : ""}</button>` +
    (it.likes.length ? `<small class="cn-likers">${esc(it.likes.join(", "))}</small>` : "");
}

/** État discret : une ligne (✓ synchronisé · photos prêtes hors ligne), le détail seulement s’il y a un souci. */
export function renderCarnetStatus(){
  const el = document.getElementById("carnet-status");
  if (!el) return;
  const { done, total, running } = prefetchStatus;
  const bad = journalReady() && (syncStatus.state === "error" || syncStatus.state === "offline");
  el.classList.toggle("err", syncStatus.state === "error");
  const text = !journalReady() ? syncLineText(false)
    : bad ? syncLineText(true)
    : syncStatus.state === "syncing" ? "⟳ Synchronisation…"
    : `✓ À jour${total ? ` · ${total} photo${total > 1 ? "s" : ""} hors ligne` : ""}`;
  el.innerHTML = `<span>${esc(text)}</span>` + (running && total ? `<span class="cn-offline"><i style="width:${Math.round(100 * done / total)}%"></i></span>` : "");
  document.getElementById("carnet-refresh")?.classList.toggle("spin", syncStatus.state === "syncing");
}

let lastSig = null;

/** Redessine seulement si le contenu a changé (ou si `force`) ; garde le défilement et la position de chaque carrousel. */
export function renderCarnet(force){
  const box = document.getElementById("carnet-body");
  if (!box) return;
  const scroller = document.getElementById("view-carnet");
  const days = journalDays()
    .map(([iso, jd]) => ({ iso, day: DAYS.find(d => dayToISO(d) === iso), items: doneItems(jd) }))
    .filter(x => x.day && x.items.length);
  renderCarnetStatus();
  if (!days.length && syncStatus.state === "syncing") { box.innerHTML = SKELETON; lastSig = null; return; }   // premier chargement
  const sig = JSON.stringify([days, feedState.mode, feedState.filter, journalConfig().author, japanTodayISO()]);
  if (!force && sig === lastSig && box.children.length) return;   // rien de nouveau : ne rien toucher
  lastSig = sig;
  const top = scroller ? scroller.scrollTop : 0;
  const slides = {};
  box.querySelectorAll(".vy-post[data-post]").forEach(p => { const c = p.querySelector(".vy-car"); if (c && c.scrollLeft) slides[p.dataset.post] = c.scrollLeft; });
  box.innerHTML = carnetHtml({ days, today: japanTodayISO(), datesLabel: TRIP.datesLabelLong,
    emptyText: "Rien pour l’instant. Coche ce que vous faites dans Sur place › Journal et ajoutez des photos : tout apparaît ici." }, { photoBtn, likeHtml });
  box.querySelectorAll(".vy-post[data-post]").forEach(p => { const c = p.querySelector(".vy-car"); if (c && slides[p.dataset.post]) c.scrollLeft = slides[p.dataset.post]; });
  hydratePhotos(box);
  bindCarnet(box, () => renderCarnet(true));
  box.querySelectorAll("[data-like-id]").forEach(b => b.addEventListener("click", () => toggleLike(b.dataset.likeIso, b.dataset.likeId)));
  bindDoubleTap(box);
  if (scroller) scroller.scrollTop = top;
}

/** Double-appui sur une photo du fil = ❤️ ; un appui simple (après 300 ms) ouvre la photo en grand. */
function bindDoubleTap(box){
  box.querySelectorAll(".vy-media").forEach(m => {
    let last = 0, timer = null;
    m.addEventListener("click", e => {
      if (m.dataset.pass) { delete m.dataset.pass; return; }   // le clic relancé après l’attente : on le laisse passer
      e.stopPropagation();
      const btn = e.target.closest(".vy-photo");
      const now = Date.now();
      if (now - last < 320) {
        clearTimeout(timer); last = 0;
        const post = m.closest(".vy-post");
        const [iso, id] = post.dataset.post.split("|");
        const h = m.querySelector(".vy-heart");
        h.classList.remove("pop"); void h.offsetWidth; h.classList.add("pop");
        if (post.querySelector(".cn-like")?.getAttribute("aria-pressed") !== "true") toggleLike(iso, id);
        return;
      }
      last = now;
      timer = setTimeout(() => { m.dataset.pass = "1"; if (btn) btn.click(); }, 300);
    }, true);
  });
}

/** Boutons « Actualiser » / « Envoyer à la famille », bouton ↑, tirer vers le bas pour actualiser. */
export function bindCarnetShare(){
  document.addEventListener(JOURNAL_PREFETCH, renderCarnetStatus);
  document.addEventListener(JOURNAL_SYNC, () => { renderCarnetStatus(); renderCarnet(); });
  const refresh = () => { syncNow().then(prefetchPhotos); };
  document.getElementById("carnet-refresh")?.addEventListener("click", refresh);
  const view = document.getElementById("view-carnet");
  if (view) {
    let y0 = null;
    view.addEventListener("touchstart", e => { y0 = view.scrollTop === 0 ? e.touches[0].clientY : null; }, { passive: true });
    view.addEventListener("touchend", e => { if (y0 != null && e.changedTouches[0].clientY - y0 > 90 && view.scrollTop === 0) refresh(); y0 = null; });
    const up = document.createElement("button");
    up.type = "button";
    up.className = "cn-top";
    up.setAttribute("aria-label", "Revenir en haut");
    up.textContent = "↑";
    up.addEventListener("click", () => view.scrollTo({ top: 0, behavior: "smooth" }));
    view.appendChild(up);
    view.addEventListener("scroll", () => up.classList.toggle("show", view.scrollTop > 900 && view.classList.contains("active")), { passive: true });
  }
  document.getElementById("carnet-share")?.addEventListener("click", async () => {
    const url = new URL("voyage.html", location.href).href;
    try {
      if (navigator.share) { await navigator.share({ title: "Notre voyage au Japon", text: "Notre voyage au Japon, en direct :", url }); return; }
    } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(url); alert("Lien copié :\n" + url); } catch (_) { prompt("Lien à envoyer :", url); }
  });
}
