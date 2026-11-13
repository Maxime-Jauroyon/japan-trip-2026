/* Onglet Carnet : couverture, parcours, fil / grille de ce qu’on a vraiment fait, avec les photos
   (journal de ce téléphone, déjà synchronisé : fonctionne hors ligne). Chargement : squelettes, photos chargées à la
   demande (floues → nettes), préchargement pour le hors-ligne. Le fil n’est redessiné que si les données changent. */

import { DAYS, TRIP } from "../../core/data.js";
import { dayToISO, japanTodayISO } from "../../core/dates.js";
import { esc } from "../../core/dom.js";
import { dayLikedBy, doneItems, favorites, heroPhoto, isVideo, likersOf } from "../../domain/journal.js";
import { JOURNAL_PREFETCH, JOURNAL_SYNC, journalConfig, journalDays, journalReadOnly, journalReady, photoUrl, prefetchPhotos, prefetchStatus, syncNow, syncStatus, toggleDayLike, toggleLike } from "../../pwa/journal-store.js";
import { bindCarnet, carnetHtml, feedState, storySlides } from "../carnet-feed.js";
import { hydratePhotos, syncLineText } from "../journal-widgets.js";
import { openStory } from "../story-player.js";

const SKELETON = `<div class="cn-skel"><div class="sk sk-cover"></div><div class="sk-row"><i class="sk sk-dot"></i><i class="sk sk-dot"></i><i class="sk sk-dot"></i><i class="sk sk-dot"></i></div>` +
  `<div class="sk sk-post"></div></div>`;

/** Photo du carnet. `opt.story` : simple vignette (dans le rond d’une story, lui-même un bouton → pas de bouton imbriqué). */
function photoBtn(iso, p, opt = {}){
  const tag = opt.story ? "span" : "button";
  return `<${tag}${opt.story ? "" : ' type="button"'} class="vy-photo${opt.thumb ? " sq" : ""}${isVideo(p.name) ? " is-video" : ""}"${opt.thumb ? "" : ' data-jp-feed="1"'}${opt.cover ? ' data-jp-cover="1"' : ""}${opt.story ? ' data-jp-story="1"' : ""} ` +
    `data-jp-iso="${esc(iso)}" data-jp-id="${esc(p.id)}" data-jp-name="${esc(p.name)}" aria-label="${esc(p.title)}"><img data-jphoto alt="" decoding="async" /></${tag}>`;
}

/** Cœur : cliquable avec le jeton, simple compteur en lecture seule ; jamais de prénom. */
function likeHtml(iso, it){
  if (journalReadOnly()) return it.likes.length ? `<span class="cn-like ro">❤️ <b>${it.likes.length}</b></span>` : "";
  const mine = it.likes.includes(journalConfig().author || "Moi");
  return `<button type="button" class="cn-like" data-like-iso="${esc(iso)}" data-like-id="${esc(it.id)}" aria-pressed="${mine}" aria-label="J’aime">${mine ? "❤️" : "🤍"}${it.likes.length ? ` <b>${it.likes.length}</b>` : ""}</button>`;
}

/** ❤️ sur une journée entière : bouton avec le jeton, simple compteur en lecture seule ; jamais de prénom. */
function dayLikeHtml(iso, likes){
  const n = likes.length;
  if (journalReadOnly()) return n ? `<span class="cn-daylike ro">❤️ <b>${n}</b> <small>a adoré cette journée</small></span>` : "";
  const mine = likes.includes(journalConfig().author || "Moi");
  return `<button type="button" class="cn-daylike" data-daylike-iso="${esc(iso)}" aria-pressed="${mine}" aria-label="J’ai adoré cette journée">` +
    `<span aria-hidden="true">${mine ? "❤️" : "🤍"}</span> <span>${mine ? "J’ai adoré cette journée" : "J’ai adoré cette journée ?"}</span>${n ? ` <b>${n}</b>` : ""}</button>`;
}

/** État discret : une ligne ; le détail seulement s’il y a un souci ou un téléchargement en cours. */
export function renderCarnetStatus(){
  const el = document.getElementById("carnet-status");
  if (!el) return;
  const { all, done, total, running } = prefetchStatus;
  const bad = journalReady() && (syncStatus.state === "error" || syncStatus.state === "offline");
  el.classList.toggle("err", syncStatus.state === "error");
  const text = bad ? syncLineText(true)
    : syncStatus.state === "syncing" ? "⟳ Synchronisation…"
    : running ? `Nouvelles photos ${done} / ${total}`
    : `✓ À jour${all ? ` · ${all} photo${all > 1 ? "s" : ""}` : ""}`;
  el.innerHTML = `<span>${esc(text)}</span>` + (running && total ? `<span class="cn-offline"><i style="width:${Math.round(100 * done / total)}%"></i></span>` : "");
  document.getElementById("carnet-refresh")?.classList.toggle("spin", syncStatus.state === "syncing");
}

let model = [];

/** Ouvre le lecteur « story » sur les photos d’un jour, dans l’ordre vécu. */
function openDayStory(dayN){
  const x = model.find(d => d.day.n === dayN);
  if (!x) return;
  openStory(storySlides(x), 0, (sl, o) => photoUrl(sl.iso, sl.name, !!o.thumb, { priority: o.priority, live: o.live }));
}

/** Coups de cœur du carnet (filtrés par personne), avec les libellés de jour ; si la personne choisie n’a plus de cœur, on revient à « Tous ». */
function favoritesModel(){
  const all = journalDays();
  const likers = likersOf(all);
  if (feedState.who && !likers.includes(feedState.who)) feedState.who = null;
  const f = favorites(all, feedState.who);
  const info = (iso) => { const d = DAYS.find(x => dayToISO(x) === iso); return d ? { n: d.n, label: `${d.dow} ${d.date.replace(/\s\d{4}$/, "")}` } : { n: 0, label: iso }; };
  return {
    likers,
    days: f.days.map(x => ({ ...x, ...info(x.iso) })),
    moments: f.moments.map(m => ({ ...m, label: `J${info(m.iso).n} · ${info(m.iso).label}` }))
  };
}

let lastSig = null;

/** Redessine seulement si le contenu a changé (ou si `force`) ; garde le défilement et la position de chaque carrousel. */
export function renderCarnet(force){
  const box = document.getElementById("carnet-body");
  if (!box) return;
  const scroller = document.getElementById("view-carnet");
  const days = journalDays()
    .map(([iso, jd]) => ({ iso, day: DAYS.find(d => dayToISO(d) === iso), items: doneItems(jd, iso), likes: dayLikedBy(jd) }))
    .filter(x => x.day && x.items.length);
  renderCarnetStatus();
  if (!days.length && (syncStatus.state === "syncing" || (journalReadOnly() && syncStatus.state !== "public"))) { box.innerHTML = SKELETON; lastSig = null; return; }   // premier chargement
  model = days;
  const hero = heroPhoto(journalDays());
  const favs = favoritesModel();
  const sig = JSON.stringify([days, hero, favs, feedState.mode, feedState.filter, feedState.who, journalConfig().author, journalReadOnly(), japanTodayISO()]);
  if (!force && sig === lastSig && box.children.length) return;   // rien de nouveau : ne rien toucher
  lastSig = sig;
  const top = scroller ? scroller.scrollTop : 0;
  const slides = {};
  box.querySelectorAll(".vy-post[data-post]").forEach(p => { const c = p.querySelector(".vy-car"); if (c && c.scrollLeft) slides[p.dataset.post] = c.scrollLeft; });
  box.innerHTML = carnetHtml({ days, hero, favs, today: japanTodayISO(), datesLabel: TRIP.datesLabelLong,
    emptyText: journalReadOnly() ? "Le carnet se remplit au fil du voyage : les premières photos arrivent bientôt."
      : "Rien pour l’instant. Coche ce que vous faites dans Sur place › Journal et ajoutez des photos : tout apparaît ici." }, { photoBtn, likeHtml, dayLikeHtml });
  box.querySelectorAll(".vy-post[data-post]").forEach(p => { const c = p.querySelector(".vy-car"); if (c && slides[p.dataset.post]) c.scrollLeft = slides[p.dataset.post]; });
  hydratePhotos(box);
  bindCarnet(box, () => renderCarnet(true), { openStory: openDayStory });
  box.querySelectorAll("[data-like-id]").forEach(b => b.addEventListener("click", () => toggleLike(b.dataset.likeIso, b.dataset.likeId)));
  box.querySelectorAll("[data-daylike-iso]").forEach(b => b.addEventListener("click", () => toggleDayLike(b.dataset.daylikeIso)));
  bindDoubleTap(box);
  if (scroller) scroller.scrollTop = top;
}

/** Double-appui sur une photo du fil = ❤️ ; un appui simple (après 300 ms) ouvre la photo en grand. */
function bindDoubleTap(box){
  if (journalReadOnly()) return;   // lecture seule : un appui ouvre simplement la photo
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

/** Bouton « Actualiser », bouton ↑, tirer vers le bas pour actualiser. */
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
}
