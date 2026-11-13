/* Le Carnet : couverture, stories par jour, barre d’outils (Fil / Grille, jours) et fil de la journée
   (chapitre par jour, moments dans l’ordre vécu avec leur heure). `ctx` fournit ce qui dépend de l’écran :
   photoBtn(iso, photo, opt) → bouton-photo ; likeHtml(iso, item) → cœur ; openStory(jour) → lecteur plein écran. */

import { CITIES, TRAVELERS } from "../core/data.js";
import { esc } from "../core/dom.js";
import { clockJst } from "../domain/journal.js";
import { storyButtonHtml } from "./story-player.js";

/** Mode d’affichage et jour filtré (gardés tant que la page est ouverte). */
export const feedState = { mode: "feed", filter: null };

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
  return `<div class="cn-stories" aria-label="Revivre une journée">` + days.map(x => {
    const first = photosOfDay(x)[0];
    return `<button type="button" class="cn-story" data-story-day="${x.day.n}" aria-label="${esc(`Revivre le jour ${x.day.n}`)}">` +
      `<span class="cn-ring"><span class="cn-ico">${ctx.photoBtn(x.iso, first, { thumb: true, story: true })}</span></span><b>J${x.day.n}</b></button>`;
  }).join("") + `</div>`;
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
  const bar = `<div class="cn-toolbar"><div class="cn-seg" role="tablist" aria-label="Affichage">` +
    `<button type="button" data-mode="feed" aria-pressed="${feedState.mode === "feed"}">Fil</button>` +
    `<button type="button" data-mode="grid" aria-pressed="${feedState.mode === "grid"}">Grille</button></div>` +
    `<div class="cn-days"><button type="button" data-fday="" aria-pressed="${!feedState.filter}">Tout</button>` +
    model.days.slice().reverse().map(x => `<button type="button" data-fday="${x.day.n}" aria-pressed="${feedState.filter === x.day.n}">J${x.day.n}</button>`).join("") + `</div></div>`;
  let body;
  if (!model.days.length) body = `<p class="vy-empty">${esc(model.emptyText || "Rien pour l’instant.")}</p>`;
  else if (feedState.mode === "grid") {
    const shots = days.slice().reverse().flatMap(photosOfDay);
    body = shots.length ? `<div class="cn-grid" data-day-label="">${shots.map(s => ctx.photoBtn(s.iso, s, { thumb: true })).join("")}</div>` : `<p class="vy-empty">Pas encore de photo.</p>`;
  } else body = days.slice().reverse().map(x => dayCardHtml(ctx, x)).join("");
  return cover + storiesHtml(model, ctx) + bar + body;
}

let revealer = null;
let counted = false;

/** Branche la barre d’outils, les stories, les points des carrousels et l’apparition en douceur ; `again()` redessine. */
export function bindCarnet(root, again, ctx){
  root.querySelectorAll("[data-mode]").forEach(b => b.addEventListener("click", () => { feedState.mode = b.dataset.mode; again(); }));
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
