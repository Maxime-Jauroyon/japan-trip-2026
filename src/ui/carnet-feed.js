/* Le Carnet : couverture, stories par jour, barre d’outils (Fil / Grille, jours) et fil de la journée
   (chapitre par jour, moments dans l’ordre vécu avec leur heure). `ctx` fournit ce qui dépend de l’écran :
   photoBtn(iso, photo, opt) → bouton-photo ; likeHtml(iso, item) → cœur ; openStory(jour) → lecteur plein écran. */

import { CITIES, TRAVELERS } from "../core/data.js";
import { esc } from "../core/dom.js";
import { clockJst } from "../domain/journal.js";
import { storyButtonHtml } from "./story-player.js";

/** Onglet (« feed » = Journées, « hearts » = Coups de cœur), jour filtré et personne choisie (gardés tant que la page est ouverte). */
export const feedState = { mode: "feed", filter: null, who: null };

const shortDate = (d) => d.date.replace(/\s\d{4}$/, "");                 // « 10 nov »
const shortDay = (d) => `${d.dow.slice(0, 3)} ${shortDate(d)}`;            // « Mar 10 nov »
const dayLabel = (d) => `${d.dow} ${d.date.replace(/\s\d{4}$/, "")}`;
const plural = (n, w) => `${n} ${w}${n > 1 ? "s" : ""}`;
const photosOfDay = (x) => x.items.flatMap(it => it.photos.map(name => ({ iso: x.iso, id: it.id, name, title: it.title, when: it.timed ? clockJst(it.when) : "" })));

/** Diapositives du lecteur « story » pour un jour (photos dans l’ordre vécu). */
export function storySlides(x){
  return photosOfDay(x).map(p => ({ ...p, sub: [`J${x.day.n} · ${dayLabel(x.day)}`, p.when].filter(Boolean).join(" · ") }));
}

/** Un moment : heure sur la frise, titre, photos à faire défiler (points), ❤️, légende. */
function postHtml(ctx, iso, it){
  const likes = ctx.likeHtml ? ctx.likeHtml(iso, it) : "";
  const n = it.photos.length;
  return `<article class="vy-post reveal${n ? "" : " plain"}" data-post="${esc(iso + "|" + it.id)}">` +
    `<header><span class="vy-when">${it.timed ? esc(clockJst(it.when)) : "✓"}</span><strong>${esc(it.title)}</strong>` +
    (n > 1 ? `<small>${n} photos</small>` : "") + `</header>` +
    (n ? `<div class="vy-media"><div class="vy-car" data-n="${n}">${it.photos.map(name => `<div class="vy-slide">${ctx.photoBtn(iso, { name, title: it.title, id: it.id })}</div>`).join("")}</div>` +
      `<span class="vy-heart" aria-hidden="true">❤️</span></div>` +
      (n > 1 ? `<div class="vy-dots" aria-hidden="true">${it.photos.map((_, k) => `<i${k ? "" : ' class="on"'}></i>`).join("")}</div>` : "") : "") +
    (likes ? `<div class="vy-actions">${likes}</div>` : "") +
    (it.note ? `<p class="vy-caption">${esc(it.note)}</p>` : "") + `</article>`;
}

/** Fiche d’un moment (depuis les coups de cœur) : le moment tel qu’il est dans le fil, avec un retour vers la liste. `from` = libellé du retour. */
export function momentSheetHtml(ctx, iso, it, label, from){
  return `<div class="cn-sheet-bar"><button type="button" class="cn-back" data-sheet-close>‹ ${esc(from)}</button><span>${esc(label)}</span></div>` +
    `<div class="vy-line cn-sheet-body" data-day-label="${esc(label)}">${postHtml(ctx, iso, it).replace("vy-post reveal", "vy-post")}</div>`;   // pas d’apparition au défilement ici : tout est visible tout de suite
}

/** Un chapitre : le jour, son résumé (moments, photos, de telle heure à telle heure), « Revivre », puis ses moments. */
export function dayCardHtml(ctx, x){
  const { day, iso, items } = x;
  const city = CITIES[day.city];
  const extra = day.extraCity && CITIES[day.extraCity] ? " · " + CITIES[day.extraCity].name : "";
  const nPhotos = items.reduce((s, it) => s + it.photos.length, 0);
  const timed = items.filter(it => it.timed);
  const span = timed.length > 1 ? ` · ${clockJst(timed[0].when)} → ${clockJst(timed[timed.length - 1].when)}` : "";
  return `<section class="vy-daygroup" id="cn-day-${day.n}" data-day-label="${esc(`J${day.n} · ${dayLabel(day)}`)}">` +
    `<div class="vy-chapter reveal"><span class="vy-n">Jour ${day.n}</span><h3>${esc(dayLabel(day))}</h3>` +
    `<p>${esc((city ? city.name : day.city) + extra)} · ${plural(items.length, "moment")}${nPhotos ? " · " + plural(nPhotos, "photo") : ""}${esc(span)}</p>` +
    (nPhotos ? storyButtonHtml(day.n, nPhotos) : "") + (ctx.dayLikeHtml ? ctx.dayLikeHtml(iso, x.likes || []) : "") + `</div>` +
    `<div class="vy-line">${items.map(it => postHtml(ctx, iso, it)).join("")}</div></section>`;
}

/** Stories : un rond par jour (vignette de la première photo), le plus récent d’abord ; toucher = revivre la journée. */
function storiesHtml(model, ctx){
  const days = model.days.filter(x => x.items.some(it => it.photos.length)).slice().reverse();
  if (!days.length) return "";
  return `<p class="cn-hint">Revivre une journée en diaporama</p><div class="cn-stories" aria-label="Revivre une journée">` + days.map(x => {
    const first = photosOfDay(x)[0];
    return `<button type="button" class="cn-story" data-story-day="${x.day.n}" aria-label="${esc(`Revivre le jour ${x.day.n}`)}">` +
      `<span class="cn-ring"><span class="cn-ico">${ctx.photoBtn(x.iso, first, { thumb: true, story: true })}</span></span><b>${esc(shortDate(x.day))}</b></button>`;
  }).join("") + `</div>`;
}

/** Coups de cœur : les journées et les moments aimés, par personne (puces) ou par tous. `model.favs` = { days, moments, likers } avec libellés. */
function heartsHtml(model, ctx){
  const f = model.favs || { days: [], moments: [], likers: [] };
  const chips = `<div class="cn-days cn-who"><button type="button" data-who="" aria-pressed="${!feedState.who}">Tous</button>` +
    f.likers.map(a => `<button type="button" data-who="${esc(a)}" aria-pressed="${feedState.who === a}">❤️ ${esc(a)}</button>`).join("") + `</div>`;
  if (!f.days.length && !f.moments.length) {
    return chips + `<p class="vy-empty">${feedState.who ? `${esc(feedState.who)} n’a pas encore de coup de cœur.` : "Pas encore de coup de cœur : touchez le ❤️ d’un moment ou d’une journée."}</p>`;
  }
  const who = (list) => (feedState.who ? "" : `<small>${list.map(esc).join(" · ")}</small>`);
  const daysHtml = f.days.length ? `<h3 class="cn-fav-title">Journées adorées</h3><div class="cn-favdays">` + f.days.map(d =>
    `<button type="button" class="cn-favday" data-goday="${d.n}">❤️ <span><b>Jour ${d.n}</b> ${esc(d.label)}</span>${who(d.who)}</button>`).join("") + `</div>` : "";
  const momentsHtml = f.moments.length ? `<h3 class="cn-fav-title">Moments aimés</h3><div class="cn-favs">` + f.moments.map(m =>
    `<article class="cn-fav" role="button" tabindex="0" data-fav-open="${esc(m.iso + "|" + m.id)}" aria-label="${esc(`Ouvrir ${m.title}`)}">` +
    (m.photos.length ? ctx.photoBtn(m.iso, { id: m.id, name: m.photos[0], title: m.title }, { thumb: true, story: true }) : `<span class="cn-fav-ph">❤️</span>`) +
    `<div><strong>${esc(m.title)}</strong><small>${esc(m.label)}${m.photos.length > 1 ? ` · ${m.photos.length} photos` : ""}</small>${who(m.who)}</div><span class="cn-fav-go" aria-hidden="true">›</span></article>`).join("") + `</div>` : "";
  return chips + daysHtml + momentsHtml;
}

const HELP_KEY = "japan-trip-carnet-help";
const helpSeen = () => { try { return localStorage.getItem(HELP_KEY) === "1"; } catch (_) { return false; } };

/** Petite carte d’aide pour qui découvre le Carnet (affichée jusqu’à « J’ai compris » ; le ❤️ à poser n’est cité qu’à ceux qui peuvent le faire). */
function helpHtml(model){
  if (helpSeen()) return "";
  const lines = ["👆 Faites défiler pour suivre le voyage, jour après jour.", "🖼 Touchez une photo pour l’agrandir ; glissez pour voir les suivantes.", "▶ « Revivre la journée » : un diaporama avec de la musique."];
  if (!model.readOnly) lines.push("❤️ Touchez le cœur pour dire que vous avez aimé un moment ou une journée.");
  return `<aside class="cn-help" role="note"><strong>Comment ça marche ?</strong><ul>${lines.map(l => `<li>${esc(l)}</li>`).join("")}</ul>` +
    `<button type="button" data-help-close>J’ai compris</button></aside>`;
}

/** Page entière du carnet (hors indicateurs de synchro, propres à l’écran). */
export function carnetHtml(model, ctx){
  const days = feedState.filter ? model.days.filter(x => x.day.n === feedState.filter) : model.days;
  const photos = model.days.flatMap(photosOfDay);
  const nMoments = model.days.reduce((s, x) => s + x.items.length, 0);
  const nCities = new Set(model.days.map(x => x.day.city)).size;
  const latest = model.hero || photos[photos.length - 1];   // couverture choisie à la main, sinon la dernière photo
  const stats = [[model.days.length, "jour"], [nMoments, "moment"], [photos.length, "photo"], [nCities, "ville"]];
  const cover = `<section class="cn-cover${latest ? "" : " empty"}">${latest ? ctx.photoBtn(latest.iso, latest, { cover: true }) : ""}` +
    `<div class="cn-cover-text"><p class="vy-kicker">${esc(model.datesLabel || "")}</p><h2>${esc(TRAVELERS.join(" & "))} au Japon</h2>` +
    `<p class="cn-stats">${stats.map(([n, w]) => `<span><b data-count="${n}">${n}</b> ${w}${n > 1 ? "s" : ""}</span>`).join("")}</p></div></section>`;
  const tab = (mode, label) => `<button type="button" role="tab" data-mode="${mode}" aria-pressed="${feedState.mode === mode}" aria-selected="${feedState.mode === mode}">${label}</button>`;
  const bar = `<div class="cn-toolbar"><div class="cn-seg" role="tablist" aria-label="Affichage">${tab("feed", "Journées")}${tab("hearts", "❤️ Coups de cœur")}</div>` +
    (feedState.mode === "hearts" ? "" : `<div class="cn-days" aria-label="Choisir un jour"><button type="button" data-fday="" aria-pressed="${!feedState.filter}">Tous les jours</button>` +
    model.days.slice().reverse().map(x => `<button type="button" data-fday="${x.day.n}" aria-pressed="${feedState.filter === x.day.n}" aria-label="${esc(`Jour ${x.day.n}, ${dayLabel(x.day)}`)}">${esc(shortDay(x.day))}</button>`).join("") + `</div>`) + `</div>`;
  let body;
  if (!model.days.length) body = `<p class="vy-empty">${esc(model.emptyText || "Rien pour l’instant.")}</p>`;
  else if (feedState.mode === "hearts") body = heartsHtml(model, ctx);
  else body = days.slice().reverse().map(x => dayCardHtml(ctx, x)).join("");
  return helpHtml(model) + cover + storiesHtml(model, ctx) + bar + body;
}

let revealer = null;
let counted = false;

/** Branche la barre d’outils, les stories, les points des carrousels et l’apparition en douceur ; `again()` redessine. */
export function bindCarnet(root, again, ctx){
  root.querySelectorAll("[data-mode]").forEach(b => b.addEventListener("click", () => { feedState.mode = b.dataset.mode; again(); }));
  root.querySelectorAll("[data-help-close]").forEach(b => b.addEventListener("click", () => {
    try { localStorage.setItem(HELP_KEY, "1"); } catch (_) { /* pas de stockage : la carte reviendra */ }
    const card = b.closest(".cn-help"); if (card) card.remove();
  }));
  root.querySelectorAll("[data-fav-open]").forEach(b => {
    const open = () => { const [iso, id] = b.dataset.favOpen.split("|"); if (ctx && ctx.openMoment) ctx.openMoment(iso, id); };
    b.addEventListener("click", open);
    b.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  });
  root.querySelectorAll("[data-who]").forEach(b => b.addEventListener("click", () => { feedState.who = b.dataset.who || null; again(); }));
  root.querySelectorAll("[data-goday]").forEach(b => b.addEventListener("click", () => { feedState.mode = "feed"; feedState.filter = Number(b.dataset.goday); again(); }));
  root.querySelectorAll("[data-fday]").forEach(b => b.addEventListener("click", () => { feedState.filter = b.dataset.fday ? Number(b.dataset.fday) : null; again(); }));
  root.querySelectorAll("[data-story-day]").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); if (ctx && ctx.openStory) ctx.openStory(Number(b.dataset.storyDay)); }));
  root.querySelectorAll(".vy-car").forEach(car => {
    const dots = car.closest(".vy-post").querySelectorAll(".vy-dots i");
    if (dots.length < 2) return;
    car.addEventListener("scroll", () => {
      const i = Math.min(dots.length - 1, Math.round(car.scrollLeft / Math.max(1, car.clientWidth)));
      dots.forEach((d, k) => d.classList.toggle("on", k === i));
    }, { passive: true });
  });
  // Compteurs de la couverture qui montent (une fois, sauf si les animations sont réduites)
  const calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!calm && !counted && root.querySelector("[data-count]")) {
    counted = true;
    root.querySelectorAll("[data-count]").forEach(b => {
      const n = Number(b.dataset.count), t0 = performance.now();
      if (n < 2) return;
      const tick = (t) => { const k = Math.min(1, (t - t0) / 700); b.textContent = String(Math.round(n * k)); if (k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
  }
  // Apparition en douceur au défilement (rien si le navigateur ne sait pas observer : tout reste visible)
  const items = root.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { items.forEach(n => n.classList.add("in")); return; }
  if (!revealer) revealer = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); revealer.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
  items.forEach(n => revealer.observe(n));
}
