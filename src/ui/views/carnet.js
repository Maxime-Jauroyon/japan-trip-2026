/* Onglet Carnet : couverture, parcours, fil / grille de ce qu’on a vraiment fait, avec les photos
   (journal de ce téléphone, déjà synchronisé : fonctionne hors ligne). Chargement : squelettes, photos chargées à la
   demande (floues → nettes), préchargement pour le hors-ligne. Le fil n’est redessiné que si les données changent. */

import { CARNET_SEEN_KEY } from "../../config.js";
import { CITIES, DAYS, TRIP } from "../../core/data.js";
import { dayToISO, japanTodayISO } from "../../core/dates.js";
import { esc } from "../../core/dom.js";
import { agoLabel } from "../../domain/live-data.js";
import { dayTag, lastMoment, newSince, routeSteps, tripProgress } from "../../domain/carnet-live.js";
import { dayDislikedBy, dayLikedBy, doneItems, favorites, heroPhoto, hqSummary, isVideo, plannedId } from "../../domain/journal.js";
import { JOURNAL_CHANGED, JOURNAL_PREFETCH, JOURNAL_SYNC, journalConfig, journalDays, journalReadOnly, downloadAllFull, fullStatus, journalReady, knownPhotoUrl, photoUrl, prefetchPhotos, prefetchStatus, stopFull, syncNow, syncStatus, toggleDayDislike, toggleDayLike, toggleDislike, toggleLike } from "../../pwa/journal-store.js";
import { bindCarnet, carnetHtml, centerRoute, feedState, momentSheetHtml, storySlides } from "../carnet-feed.js";
import { hydratePhotos, syncLineText } from "../journal-widgets.js";
import { fillCityForecast } from "./weather.js";
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
  return `<div class="cn-react" role="group" aria-label="Votre avis">` +
    `<button type="button" class="cn-like cn-react-btn" data-like-iso="${esc(iso)}" data-like-id="${esc(it.id)}" aria-pressed="${mine}" aria-label="J’aime"><span class="cn-emo" aria-hidden="true">${mine ? "❤️" : "🤍"}</span><span class="cn-lab">J’aime</span>${it.likes.length ? `<b>${it.likes.length}</b>` : ""}</button>` +
    `<button type="button" class="cn-like cn-dislike cn-react-btn" data-dislike-iso="${esc(iso)}" data-dislike-id="${esc(it.id)}" aria-pressed="${minebad}" aria-label="Je n’ai pas aimé"><span class="cn-emo cn-thumb" aria-hidden="true">👎</span><span class="cn-lab">Pas aimé</span>${bad.length ? `<b>${bad.length}</b>` : ""}</button></div>`;
}

/** ❤️ sur une journée entière : bouton avec le jeton, simple compteur en lecture seule ; jamais de prénom. */
function dayLikeHtml(iso, likes, dislikes = []){
  const n = likes.length, nb = dislikes.length;
  if (journalReadOnly()) return (n ? `<span class="cn-daylike ro">❤️ <b>${n}</b> <small>a adoré cette journée</small></span>` : "") + (nb ? `<span class="cn-daylike ro">👎 <b>${nb}</b> <small>pas aimé cette journée</small></span>` : "");
  const me = journalConfig().author || "Moi";
  const mine = likes.includes(me), minebad = dislikes.includes(me);
  return `<div class="cn-dayreact" role="group" aria-label="Votre avis sur la journée">` +
    `<button type="button" class="cn-daylike" data-daylike-iso="${esc(iso)}" aria-pressed="${mine}" aria-label="J’ai adoré cette journée">` +
    `<span class="cn-emo" aria-hidden="true">${mine ? "❤️" : "🤍"}</span><span class="cn-lab">J’ai adoré</span>${n ? `<b>${n}</b>` : ""}</button>` +
    `<button type="button" class="cn-daylike cn-daydislike" data-daydislike-iso="${esc(iso)}" aria-pressed="${minebad}" aria-label="Je n’ai pas aimé cette journée"><span class="cn-emo" aria-hidden="true">👎</span><span class="cn-lab">Pas aimé</span>${nb ? `<b>${nb}</b>` : ""}</button></div>`;
}

/** Ligne d’état sous le titre : « ✓ À jour · 39 photos » avec, à droite, le bouton « Actualiser » (même place pour tout le monde). */
export function renderCarnetStatus(){
  const el = document.getElementById("carnet-status");
  if (!el) return;
  const { all, done, total, running } = prefetchStatus;
  const ro = journalReadOnly();
  const off = syncStatus.state === "error" || syncStatus.state === "offline";
  const busy = syncStatus.state === "syncing";
  el.classList.toggle("err", syncStatus.state === "error");
  // Famille (lecture seule) : on dit l’heure de la dernière lecture réussie, et clairement quand il n’y a pas de réseau
  const at = ro && syncStatus.state === "public" && syncStatus.at ? " à " + new Date(syncStatus.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
  const text = !ro && off ? syncLineText(true)
    : busy ? "Actualisation…"
    : ro && off ? (all ? "Hors ligne · dernières photos reçues" : "Hors ligne")
    : running ? `Nouvelles photos ${done} / ${total}`
    : `✓ À jour${at}${all ? ` · ${all} photo${all > 1 ? "s" : ""}${hqSummary(fullStatus).complete ? " en haute qualité" : ""}` : ""}`;
  el.innerHTML = `<span class="cn-status-text">${esc(text)}</span>` +
    (running && total ? `<span class="cn-offline"><i style="width:${Math.round(100 * done / total)}%"></i></span>` : "") +
    `<button type="button" class="cn-refresh${busy ? " spin" : ""}" id="carnet-refresh"${busy ? " disabled" : ""}><span aria-hidden="true">↻</span> Actualiser</button>`;
  // Photos en haute qualité : dire clairement ce qui est sur le téléphone, et proposer de tout prendre (avec le poids)
  const hq = document.getElementById("carnet-hq");
  const body = document.getElementById("carnet-body");
  if (hq && body) {   // en haut pour ceux qui écrivent le carnet, en bas pour la famille (haut de page plus net)
    if (ro) { if (body.nextElementSibling !== hq) body.after(hq); }
    else if (body.previousElementSibling !== hq) body.before(hq);
  }
  if (hq) {
    const h = hqSummary(fullStatus);
    hq.hidden = !h.show;
    hq.innerHTML = h.show ? `<span>${esc(h.text)}</span><button type="button" data-hq="${h.action}">${esc(h.button)}</button>` : "";
  }
}

let model = [];

/* —— Fiche d’un moment ouverte depuis les coups de cœur : par-dessus la liste, qui reste telle quelle dessous —— */
let sheet = null, sheetKey = null, sheetSig = null;

function closeSheet(){
  if (sheet) { sheet.remove(); sheet = null; sheetKey = null; sheetSig = null; document.documentElement.classList.remove("sheet-open"); }
}

/** Un moment sans ses avis : ce qui oblige à redessiner (titre, photos, heure…), par opposition aux ❤️ / 👎 mis à jour sur place. */
const withoutVotes = ({ likes: _l, dislikes: _d, ...rest }) => rest;

/** (Re)dessine la fiche du moment `sheetKey` d’après le journal actuel ; si seuls les avis ont changé, ils sont mis à jour sur place. */
function renderSheet(){
  if (!sheet || !sheetKey) return;
  const [iso, id] = sheetKey.split("|");
  const x = model.find(d => d.iso === iso);
  const it = x && x.items.find(i => i.id === id);
  if (!it) { closeSheet(); return; }
  const sig = JSON.stringify([withoutVotes(it), journalConfig().author, journalReadOnly()]);
  if (sig === sheetSig) { patchReactions(sheet, [x]); return; }
  sheetSig = sig;
  const top = sheet.scrollTop;
  sheet.innerHTML = momentSheetHtml({ photoBtn, likeHtml }, iso, it, `J${x.day.n} · ${x.day.dow} ${x.day.date.replace(/\s\d{4}$/, "")}`, feedState.vote === "dislikes" ? "Pas aimés" : "Coups de cœur");
  prefillPhotos(sheet);
  hydratePhotos(sheet);
  sheet.querySelector("[data-sheet-close]").addEventListener("click", closeSheet);
  bindDoubleTap(sheet);
  sheet.scrollTop = top;
}

function openMoment(iso, id){
  closeSheet();
  sheet = document.createElement("div");
  sheet.className = "cn-sheet";
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-label", "Moment");
  sheet.addEventListener("click", onReactClick);
  sheetKey = iso + "|" + id;
  document.body.appendChild(sheet);
  document.documentElement.classList.add("sheet-open");
  renderSheet();
}

/* —— Avis ❤️ / 👎 : un seul écouteur (délégation) et mise à jour sur place —— */
let bump = null;   // bouton qu’on vient de toucher : son emoji « rebondit » une fois l’avis enregistré

function onReactClick(e){
  const b = e.target.closest("[data-like-id], [data-dislike-id], [data-daylike-iso], [data-daydislike-iso]");
  if (!b || journalReadOnly()) return;
  const d = b.dataset;
  if (d.likeId) { bump = ["like", d.likeIso, d.likeId]; toggleLike(d.likeIso, d.likeId); }
  else if (d.dislikeId) { bump = ["dislike", d.dislikeIso, d.dislikeId]; toggleDislike(d.dislikeIso, d.dislikeId); }
  else if (d.daylikeIso) { bump = ["daylike", d.daylikeIso]; toggleDayLike(d.daylikeIso); }
  else { bump = ["daydislike", d.daydislikeIso]; toggleDayDislike(d.daydislikeIso); }
}

/** Remet à jour les seuls emplacements d’avis de `root` d’après `days` (aucun autre nœud n’est touché). */
function patchReactions(root, days){
  const byIso = new Map(days.map(x => [x.iso, x]));
  const set = (el, html) => { if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; } };
  root.querySelectorAll("[data-react]").forEach(el => {
    const [iso, id] = el.dataset.react.split("|");
    const x = byIso.get(iso), it = x && x.items.find(i => i.id === id);
    if (it) set(el, likeHtml(iso, it));
  });
  root.querySelectorAll("[data-dayreact]").forEach(el => {
    const x = byIso.get(el.dataset.dayreact);
    if (x) set(el, dayLikeHtml(x.iso, x.likes, x.dislikes));
  });
  playBump(root);
}

function playBump(root){
  if (!bump) return;
  const [kind, iso, id] = bump;
  const hit = [...root.querySelectorAll(kind === "like" ? "[data-like-id]" : kind === "dislike" ? "[data-dislike-id]" : kind === "daylike" ? "[data-daylike-iso]" : "[data-daydislike-iso]")].find(b => {
    const d = b.dataset;
    return kind === "like" ? d.likeIso === iso && d.likeId === id : kind === "dislike" ? d.dislikeIso === iso && d.dislikeId === id : (d.daylikeIso || d.daydislikeIso) === iso;
  });
  const emo = hit && hit.querySelector(".cn-emo");
  if (emo) { bump = null; emo.classList.add("bump"); }
}

/** Après un redessin : les images déjà en mémoire reprennent leur place tout de suite (pas d’image vide le temps de les relire). */
function prefillPhotos(root){
  root.querySelectorAll("[data-jp-name]").forEach(b => {
    const img = b.querySelector("img[data-jphoto]");
    if (!img) return;
    const [iso, name] = [b.dataset.jpIso, b.dataset.jpName];
    const feed = !!b.dataset.jpFeed && !isVideo(name);
    const full = knownPhotoUrl(iso, name, !feed);
    if (full) { img.src = full; return; }
    const small = feed ? knownPhotoUrl(iso, name, true) : "";
    if (small) { img.src = small; img.classList.add("blur"); }
  });
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
function favoritesModel(days){
  const all = journalDays();
  const vote = feedState.vote === "dislikes" ? "dislikes" : "likes";
  // Seulement ce qui est affiché dans le Carnet : un moment aimé puis repassé « pas fait » n’est plus listé (on ne pourrait pas l’ouvrir)
  const only = new Set(days.flatMap(x => x.items.map(it => x.iso + "|" + it.id)));
  const everyone = favorites(all, null, vote, only);
  const likers = [...new Set([...everyone.days, ...everyone.moments].flatMap(x => x.who))].sort((a, b) => a.localeCompare(b, "fr"));
  if (feedState.who && !likers.includes(feedState.who)) feedState.who = null;
  const f = feedState.who ? favorites(all, feedState.who, vote, only) : everyone;
  const total = (v) => { const t = favorites(all, null, v, only); return t.days.length + t.moments.length; };
  const counts = { likes: total("likes"), dislikes: total("dislikes") };
  const info = (iso) => { const d = DAYS.find(x => dayToISO(x) === iso); return d ? { n: d.n, label: `${d.dow} ${d.date.replace(/\s\d{4}$/, "")}` } : { n: 0, label: iso }; };
  return {
    vote,
    counts,
    likers,
    days: f.days.map(x => ({ ...x, ...info(x.iso) })),
    moments: f.moments.map(m => ({ ...m, title: programTitle(m.iso, m.id) || m.title, label: `J${info(m.iso).n} · ${info(m.iso).label}` }))
  };
}

/* Nouveautés pour la famille : « vu » = instant du dernier moment connu à la visite précédente. La référence est figée pour la session
   (les badges ne disparaissent pas pendant la lecture) ; elle est mise à jour 6 s après l’affichage du Carnet. */
let seenBaseline = null, seenTimer = null;
function loadSeen(){
  if (seenBaseline === null) { try { seenBaseline = Number(localStorage.getItem(CARNET_SEEN_KEY)) || 0; } catch (_) { seenBaseline = 0; } }
  return seenBaseline;
}
function commitSeen(){
  if (seenTimer || !model.length) return;
  seenTimer = setTimeout(() => {
    seenTimer = null;   // ré-armé au prochain affichage : ce qui arrive pendant la visite sera « vu » aussi
    const view = document.getElementById("view-carnet");
    if (!view || !view.classList.contains("active")) return;   // pas encore regardé : on réessaie au prochain affichage
    const latest = Math.max(0, ...model.flatMap(x => x.items.map(it => it.at || 0)));   // la liste du moment, pas celle du premier affichage
    try { if (latest) localStorage.setItem(CARNET_SEEN_KEY, String(latest)); } catch (_) { /* pas de stockage */ }
  }, 6000);
}

/** Où en est le voyage + dernier moment + nouveautés (famille, lecture seule) pour la carte du haut. */
function liveModel(days){
  const todayISO = japanTodayISO();
  const trip = DAYS.map(d => ({ n: d.n, iso: dayToISO(d), city: d.city }));
  const progress = tripProgress(trip, todayISO);
  const last = lastMoment(days);
  const seen = loadSeen();
  const news = journalReadOnly() && seen ? newSince(days, seen) : { moments: 0, photos: 0, first: null, keys: new Set() };
  const now = Date.now();
  const sameDay = last && last.iso === todayISO;
  return {
    total: progress.total, progress, todayISO, news,
    cityName: progress.cityId && CITIES[progress.cityId] ? CITIES[progress.cityId].name : "",
    route: routeSteps(trip, progress.status === "before" ? 0 : progress.n).map(s => ({ ...s, name: CITIES[s.cityId] ? CITIES[s.cityId].name : s.cityId })),
    last: last ? { title: last.title, ago: sameDay || now - last.when < 36 * 3600000 ? agoLabel(last.when, now) : (DAYS.find(d => dayToISO(d) === last.iso) || {}).date || "" } : null
  };
}

let lastSig = null, lastStruct = null;

/**
 * Redessine seulement si le contenu a changé (ou si `force`) ; garde le défilement et la position de chaque carrousel.
 * Si seuls des avis (❤️ / 👎) ont changé dans le fil, ils sont mis à jour sur place : rien d’autre ne bouge.
 */
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
      const first = items.find(it => it.photos.length);
      return { iso, day, items, likes: dayLikedBy(jd), dislikes: dayDislikedBy(jd), tag: dayTag(iso, japanTodayISO()),
        hero: first ? { id: first.id, name: first.photos[0], title: first.title } : null };
    })
    .filter(x => x.day && x.items.length);
  renderCarnetStatus();
  const ro = journalReadOnly();
  // Premier chargement : squelettes tant que la lecture est en cours (jamais indéfiniment : hors ligne, on le dit)
  if (!days.length && (syncStatus.state === "syncing" || (ro && (syncStatus.state === "idle" || syncStatus.state === "nocfg")))) { box.innerHTML = SKELETON; lastSig = lastStruct = null; return; }
  model = days;
  if (feedState.filter && !days.some(x => x.day.n === feedState.filter)) feedState.filter = null;   // le jour filtré n’a plus rien : on revient à tous les jours
  const hero = heroPhoto(journalDays());
  const favs = favoritesModel(days);
  const live = liveModel(days);
  days.forEach(x => x.items.forEach(it => { it.isNew = live.news.keys.has(x.iso + "|" + it.id); }));
  const offline = syncStatus.state === "offline" || syncStatus.state === "error";
  const struct = JSON.stringify([days.map(x => ({ ...x, likes: 0, dislikes: 0, items: x.items.map(withoutVotes) })), hero,
    { ...live, last: live.last && live.last.title, news: { ...live.news, keys: [...live.news.keys] } }, feedState.mode === "hearts" ? favs : 0, feedState.mode, feedState.filter, feedState.who, feedState.vote,
    journalConfig().author, ro, ro && !days.length && offline, japanTodayISO()]);
  // « il y a 12 min » change tout seul : comme les avis, ce texte est mis à jour sur place (il ne force pas un redessin)
  const sig = struct + JSON.stringify([live.last && live.last.ago, days.map(x => [x.likes, x.dislikes, x.items.map(it => [it.likes, it.dislikes])])]);
  const drawn = !!box.querySelector(".cn-cover");   // un carnet est déjà affiché (pas les squelettes)
  if (drawn) centerRoute(box);   // le carnet a pu être dessiné onglet caché : la bande des étapes se cale à l’affichage
  if (!force && drawn && sig === lastSig) return;   // rien de nouveau : ne rien toucher
  if (!force && drawn && struct === lastStruct) {   // seuls des avis (ou l’ancienneté du dernier moment) ont changé
    lastSig = sig;
    patchReactions(box, days);
    const ago = box.querySelector("[data-live-ago]");
    if (ago && live.last) ago.textContent = live.last.ago;
    return;
  }
  lastSig = sig; lastStruct = struct;
  const top = scroller ? scroller.scrollTop : 0;
  const slides = {};
  box.querySelectorAll(".vy-post[data-post]").forEach(p => { const c = p.querySelector(".vy-car"); if (c && c.scrollLeft) slides[p.dataset.post] = c.scrollLeft; });
  box.innerHTML = carnetHtml({ days, hero, favs, live, readOnly: ro, today: japanTodayISO(), datesLabel: TRIP.datesLabelLong,
    emptyText: !ro ? "Rien pour l’instant. Coche ce que vous faites dans Sur place › Journal et ajoutez des photos : tout apparaît ici."
      : offline ? "Pas de connexion pour l’instant : le carnet s’affichera dès que le réseau revient. Touchez « Actualiser » pour réessayer."
      : "Le carnet se remplit au fil du voyage : les premières photos arrivent bientôt." }, { photoBtn, likeHtml, dayLikeHtml });
  box.querySelectorAll("[data-react], [data-dayreact]").forEach(el => { el.dataset.html = el.innerHTML; });
  box.querySelectorAll(".vy-post[data-post]").forEach(p => { const c = p.querySelector(".vy-car"); if (c && slides[p.dataset.post]) c.scrollLeft = slides[p.dataset.post]; });
  if (drawn) prefillPhotos(box);
  hydratePhotos(box);
  if (live.progress.status === "during" && live.progress.cityId) fillCityForecast(box, live.progress.cityId);
  commitSeen();
  bindCarnet(box, () => renderCarnet(true), { openStory: openDayStory, openMoment, instant: drawn });
  bindDoubleTap(box);
  playBump(box);
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
      timer = setTimeout(() => { if (btn && btn.isConnected) { m.dataset.pass = "1"; btn.click(); } }, 300);
    }, true);
  });
}

/** Bouton « Actualiser », avis ❤️ / 👎 (délégation), bouton ↑, tirer vers le bas pour actualiser. */
export function bindCarnetShare(){
  bindMomentSheet();
  document.addEventListener(JOURNAL_PREFETCH, renderCarnetStatus);
  document.addEventListener(JOURNAL_SYNC, () => { renderCarnetStatus(); renderCarnet(); });
  const refresh = () => { syncNow(true).then(prefetchPhotos); };   // demandé à la main : pas de limite de fréquence
  document.getElementById("carnet-body")?.addEventListener("click", onReactClick);
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
