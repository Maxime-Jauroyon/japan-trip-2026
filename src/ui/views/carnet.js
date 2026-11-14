/* Onglet Carnet : couverture, parcours, fil / grille de ce qu’on a vraiment fait, avec les photos
   (journal de ce téléphone, déjà synchronisé : fonctionne hors ligne). Chargement : squelettes, photos chargées à la
   demande (floues → nettes), préchargement pour le hors-ligne. Le fil n’est redessiné que si les données changent. */

import { DAYS, TRIP } from "../../core/data.js";
import { dayToISO, japanTodayISO } from "../../core/dates.js";
import { esc } from "../../core/dom.js";
import { dayDislikedBy, dayLikedBy, doneItems, favorites, heroPhoto, hqSummary, isVideo, likersOf, plannedId } from "../../domain/journal.js";
import { JOURNAL_CHANGED, JOURNAL_PREFETCH, JOURNAL_SYNC, journalConfig, journalDays, journalReadOnly, downloadAllFull, fullStatus, journalReady, photoUrl, prefetchPhotos, prefetchStatus, stopFull, syncNow, syncStatus, toggleDayDislike, toggleDayLike, toggleDislike, toggleLike } from "../../pwa/journal-store.js";
import { bindCarnet, carnetHtml, feedState, momentSheetHtml, storySlides } from "../carnet-feed.js";
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
  const bad = it.dislikes || [];
  if (journalReadOnly()) return (it.likes.length ? `<span class="cn-like ro">❤️ <b>${it.likes.length}</b></span>` : "") + (bad.length ? `<span class="cn-like ro">👎 <b>${bad.length}</b></span>` : "");
  const me = journalConfig().author || "Moi";
  const mine = it.likes.includes(me), minebad = bad.includes(me);
  return `<button type="button" class="cn-like" data-like-iso="${esc(iso)}" data-like-id="${esc(it.id)}" aria-pressed="${mine}" aria-label="J’aime">${mine ? "❤️" : "🤍"}${it.likes.length ? ` <b>${it.likes.length}</b>` : ""}</button>` +
    `<button type="button" class="cn-like cn-dislike" data-dislike-iso="${esc(iso)}" data-dislike-id="${esc(it.id)}" aria-pressed="${minebad}" aria-label="Je n’ai pas aimé"><span class="cn-thumb">👎</span>${bad.length ? ` <b>${bad.length}</b>` : ""}</button>`;
}

/** ❤️ sur une journée entière : bouton avec le jeton, simple compteur en lecture seule ; jamais de prénom. */
function dayLikeHtml(iso, likes, dislikes = []){
  const n = likes.length, nb = dislikes.length;
  if (journalReadOnly()) return (n ? `<span class="cn-daylike ro">❤️ <b>${n}</b> <small>a adoré cette journée</small></span>` : "") + (nb ? `<span class="cn-daylike ro">👎 <b>${nb}</b> <small>pas aimé cette journée</small></span>` : "");
  const me = journalConfig().author || "Moi";
  const mine = likes.includes(me), minebad = dislikes.includes(me);
  return `<button type="button" class="cn-daylike" data-daylike-iso="${esc(iso)}" aria-pressed="${mine}" aria-label="J’ai adoré cette journée">` +
    `<span aria-hidden="true">${mine ? "❤️" : "🤍"}</span> <span>${mine ? "J’ai adoré cette journée" : "J’ai adoré cette journée ?"}</span>${n ? ` <b>${n}</b>` : ""}</button>` +
    `<button type="button" class="cn-daylike cn-daydislike" data-daydislike-iso="${esc(iso)}" aria-pressed="${minebad}" aria-label="Je n’ai pas aimé cette journée"><span aria-hidden="true">👎</span> <span>${minebad ? "Pas aimé" : "Pas aimé ?"}</span>${nb ? ` <b>${nb}</b>` : ""}</button>`;
}

/** Ligne d’état sous le titre : « ✓ À jour · 39 photos » avec, à droite, le bouton « Actualiser » (même place pour tout le monde). */
export function renderCarnetStatus(){
  const el = document.getElementById("carnet-status");
  if (!el) return;
  const { all, done, total, running } = prefetchStatus;
  const bad = journalReady() && (syncStatus.state === "error" || syncStatus.state === "offline");
  const busy = syncStatus.state === "syncing";
  el.classList.toggle("err", syncStatus.state === "error");
  const text = bad ? syncLineText(true)
    : busy ? "Actualisation…"
    : running ? `Nouvelles photos ${done} / ${total}`
    : `✓ À jour${all ? ` · ${all} photo${all > 1 ? "s" : ""}${hqSummary(fullStatus).complete ? " en haute qualité" : ""}` : ""}`;
  el.innerHTML = `<span class="cn-status-text">${esc(text)}</span>` +
    (running && total ? `<span class="cn-offline"><i style="width:${Math.round(100 * done / total)}%"></i></span>` : "") +
    `<button type="button" class="cn-refresh${busy ? " spin" : ""}" id="carnet-refresh"${busy ? " disabled" : ""}><span aria-hidden="true">↻</span> Actualiser</button>`;
  // Photos en haute qualité : dire clairement ce qui est sur le téléphone, et proposer de tout prendre (avec le poids)
  const hq = document.getElementById("carnet-hq");
  if (hq) {
    const h = hqSummary(fullStatus);
    hq.hidden = !h.show;
    hq.innerHTML = h.show ? `<span>${esc(h.text)}</span><button type="button" data-hq="${h.action}">${esc(h.button)}</button>` : "";
  }
}

let model = [];

/* —— Fiche d’un moment ouverte depuis les coups de cœur : par-dessus la liste, qui reste telle quelle dessous —— */
let sheet = null, sheetKey = null;

function closeSheet(){
  if (sheet) { sheet.remove(); sheet = null; sheetKey = null; document.documentElement.classList.remove("sheet-open"); }
}

/** (Re)dessine la fiche du moment `sheetKey` d’après le journal actuel (cœurs, photos) en gardant le défilement. */
function renderSheet(){
  if (!sheet || !sheetKey) return;
  const [iso, id] = sheetKey.split("|");
  const x = model.find(d => d.iso === iso);
  const it = x && x.items.find(i => i.id === id);
  if (!it) { closeSheet(); return; }
  const top = sheet.scrollTop;
  sheet.innerHTML = momentSheetHtml({ photoBtn, likeHtml }, iso, it, `J${x.day.n} · ${x.day.dow} ${x.day.date.replace(/\s\d{4}$/, "")}`, "Coups de cœur");
  hydratePhotos(sheet);
  sheet.querySelector("[data-sheet-close]").addEventListener("click", closeSheet);
  sheet.querySelectorAll("[data-like-id]").forEach(b => b.addEventListener("click", () => toggleLike(b.dataset.likeIso, b.dataset.likeId)));
  sheet.querySelectorAll("[data-dislike-id]").forEach(b => b.addEventListener("click", () => toggleDislike(b.dataset.dislikeIso, b.dataset.dislikeId)));
  bindDoubleTap(sheet);
  sheet.scrollTop = top;
}

function openMoment(iso, id){
  closeSheet();
  sheet = document.createElement("div");
  sheet.className = "cn-sheet";
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-label", "Moment");
  sheetKey = iso + "|" + id;
  document.body.appendChild(sheet);
  document.documentElement.classList.add("sheet-open");
  renderSheet();
}

/** Échap ferme la fiche ; un cœur posé dans la fiche la remet à jour. */
export function bindMomentSheet(){
  document.addEventListener("keydown", e => { if (e.key === "Escape" && sheet && !document.querySelector(".jr-viewer:not([hidden])")) closeSheet(); });
  document.addEventListener(JOURNAL_CHANGED, () => { if (sheet) { renderCarnet(); renderSheet(); } });
}

/** Ouvre le lecteur « story » sur les photos d’un jour, dans l’ordre vécu. */
function openDayStory(dayN){
  const x = model.find(d => d.day.n === dayN);
  if (!x) return;
  openStory(storySlides(x), 0, (sl, o) => photoUrl(sl.iso, sl.name, !!o.thumb, { priority: o.priority, live: o.live }));
}

/** Titre actuel d’une idée du programme (ex. « Kenroku-en (le soir) »), pour les moments gardés sous leur ancien titre dans le journal. */
function programTitle(iso, id){
  const day = DAYS.find(d => dayToISO(d) === iso);
  const a = day && (day.ideas || []).find(x => plannedId(x.title) === id);
  return a ? a.title : "";
}

/** Coups de cœur du carnet (filtrés par personne), avec les libellés de jour ; si la personne choisie n’a plus de cœur, on revient à « Tous ». */
function favoritesModel(){
  const all = journalDays();
  const vote = feedState.vote === "dislikes" ? "dislikes" : "likes";
  const likers = likersOf(all, vote);
  if (feedState.who && !likers.includes(feedState.who)) feedState.who = null;
  const f = favorites(all, feedState.who, vote);
  const info = (iso) => { const d = DAYS.find(x => dayToISO(x) === iso); return d ? { n: d.n, label: `${d.dow} ${d.date.replace(/\s\d{4}$/, "")}` } : { n: 0, label: iso }; };
  return {
    vote,
    likers,
    days: f.days.map(x => ({ ...x, ...info(x.iso) })),
    moments: f.moments.map(m => ({ ...m, title: programTitle(m.iso, m.id) || m.title, label: `J${info(m.iso).n} · ${info(m.iso).label}` }))
  };
}

let lastSig = null;

/** Redessine seulement si le contenu a changé (ou si `force`) ; garde le défilement et la position de chaque carrousel. */
export function renderCarnet(force){
  const box = document.getElementById("carnet-body");
  if (!box) return;
  const scroller = document.getElementById("view-carnet");
  const days = journalDays()
    .map(([iso, jd]) => {
      const day = DAYS.find(d => dayToISO(d) === iso);
      // L’ordre du programme du jour (ordre vécu sur les jours « à ordre fixe ») prime sur l’heure de coche, souvent saisie plus tard
      const items = day ? doneItems(jd, iso, { order: (day.ideas || []).map(a => plannedId(a.title)), fixed: !!day.ordreFixe,
        titles: Object.fromEntries((day.ideas || []).map(a => [plannedId(a.title), a.title])) }) : [];
      return { iso, day, items, likes: dayLikedBy(jd), dislikes: dayDislikedBy(jd) };
    })
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
  box.innerHTML = carnetHtml({ days, hero, favs, readOnly: journalReadOnly(), today: japanTodayISO(), datesLabel: TRIP.datesLabelLong,
    emptyText: journalReadOnly() ? "Le carnet se remplit au fil du voyage : les premières photos arrivent bientôt."
      : "Rien pour l’instant. Coche ce que vous faites dans Sur place › Journal et ajoutez des photos : tout apparaît ici." }, { photoBtn, likeHtml, dayLikeHtml });
  box.querySelectorAll(".vy-post[data-post]").forEach(p => { const c = p.querySelector(".vy-car"); if (c && slides[p.dataset.post]) c.scrollLeft = slides[p.dataset.post]; });
  hydratePhotos(box);
  bindCarnet(box, () => renderCarnet(true), { openStory: openDayStory, openMoment });
  box.querySelectorAll("[data-like-id]").forEach(b => b.addEventListener("click", () => toggleLike(b.dataset.likeIso, b.dataset.likeId)));
  box.querySelectorAll("[data-daylike-iso]").forEach(b => b.addEventListener("click", () => toggleDayLike(b.dataset.daylikeIso)));
  box.querySelectorAll("[data-dislike-id]").forEach(b => b.addEventListener("click", () => toggleDislike(b.dataset.dislikeIso, b.dataset.dislikeId)));
  box.querySelectorAll("[data-daydislike-iso]").forEach(b => b.addEventListener("click", () => toggleDayDislike(b.dataset.daydislikeIso)));
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
  bindMomentSheet();
  document.addEventListener(JOURNAL_PREFETCH, renderCarnetStatus);
  document.addEventListener(JOURNAL_SYNC, () => { renderCarnetStatus(); renderCarnet(); });
  const refresh = () => { syncNow().then(prefetchPhotos); };
  document.getElementById("carnet-hq")?.addEventListener("click", e => {
    const b = e.target.closest("[data-hq]");
    if (b) { if (b.dataset.hq === "stop") stopFull(); else downloadAllFull(); }
  });
  document.getElementById("carnet-status")?.addEventListener("click", e => { if (e.target.closest("#carnet-refresh")) refresh(); });   // la ligne est redessinée souvent : on écoute la ligne, pas le bouton
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
