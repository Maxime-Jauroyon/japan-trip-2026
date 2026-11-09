/* Le Carnet : couverture, parcours (stories), barre d’outils (Fil / Grille, jours) et fil de publications.
   Partagé par l’onglet Carnet (journal du téléphone) et la page famille (lecture seule) : seule la façon de
   fabriquer une photo (`ctx.photoBtn`) et le cœur (`ctx.likeHtml`) change. */

import { CITIES, DAYS, ORDER, TRAVELERS } from "../core/data.js";
import { dayToISO } from "../core/dates.js";
import { esc } from "../core/dom.js";
import { cityIconSvg } from "../shared/icons.js";

/** Mode d’affichage et jour filtré (gardés tant que la page est ouverte). */
export const feedState = { mode: "feed", filter: null };

const dayLabel = (d) => `${d.dow} ${d.date.replace(/\s\d{4}$/, "")}`;

/** Une publication façon Instagram : auteur + titre, photos à faire défiler (points), ❤️, légende. */
function postHtml(ctx, iso, it){
  const who = it.by || "";
  const meta = [who, it.time].filter(Boolean).join(" · ");
  const likes = ctx.likeHtml ? ctx.likeHtml(iso, it) : "";
  const n = it.photos.length;
  return `<article class="vy-post${n ? "" : " plain"}" data-post="${esc(iso + "|" + it.id)}"><header><span class="vy-avatar" aria-hidden="true">${esc((who || "✓").slice(0, 1))}</span>` +
    `<div><strong>${esc(it.title)}</strong>${meta ? `<small>${esc(meta)}</small>` : ""}</div></header>` +
    (n ? `<div class="vy-media"><div class="vy-car" data-n="${n}">${it.photos.map(name => `<div class="vy-slide">${ctx.photoBtn(iso, { name, title: it.title, id: it.id })}</div>`).join("")}</div>` +
      `<span class="vy-heart" aria-hidden="true">❤️</span></div>` +
      (n > 1 ? `<div class="vy-dots" aria-hidden="true">${it.photos.map((_, k) => `<i${k ? "" : ' class="on"'}></i>`).join("")}</div>` : "") : "") +
    (likes ? `<div class="vy-actions">${likes}</div>` : "") +
    (it.note ? `<p class="vy-caption">${who ? `<b>${esc(who)}</b>` : ""}${esc(it.note)}</p>` : "") + `</article>`;
}

/** Un jour du fil : bandeau du jour puis ses publications. */
export function dayCardHtml(ctx, day, iso, items){
  const city = CITIES[day.city];
  const extra = day.extraCity && CITIES[day.extraCity] ? " · " + CITIES[day.extraCity].name : "";
  return `<section class="vy-daygroup" id="cn-day-${day.n}" data-day-label="${esc(`J${day.n} · ${dayLabel(day)}`)}"><h3 class="vy-dayhead"><span class="vy-n">J${day.n}</span>${esc(dayLabel(day))}` +
    `<small>${esc((city ? city.name : day.city) + extra)}</small></h3>` +
    items.map(it => postHtml(ctx, iso, it)).join("") + `</section>`;
}

/** Parcours façon « stories » : un rond par ville, anneau doré si on y est passé ; toucher = aller au premier jour de la ville. */
function storiesHtml(model){
  return `<div class="cn-stories" aria-label="Parcours">` + ORDER.map(id => {
    const c = CITIES[id];
    const first = DAYS.find(d => d.city === id);
    const reached = first && dayToISO(first) <= model.today;
    const hasPosts = model.days.some(x => x.day.city === id);
    return `<button type="button" class="cn-story${reached ? " reached" : ""}" data-city="${esc(id)}"${hasPosts ? "" : ' data-empty="1"'} aria-label="${esc(c.name)}">` +
      `<span class="cn-ring"><span class="cn-ico">${cityIconSvg(id)}</span></span><b>${esc(c.name)}</b></button>`;
  }).join("") + `</div>`;
}

/** Page entière du carnet (hors indicateurs de synchro, propres à chaque écran). */
export function carnetHtml(model, ctx){
  const days = feedState.filter ? model.days.filter(x => x.day.n === feedState.filter) : model.days;
  const photos = model.days.flatMap(x => x.items.flatMap(it => it.photos.map(name => ({ iso: x.iso, id: it.id, name, title: it.title }))));
  const nMoments = model.days.reduce((s, x) => s + x.items.length, 0);
  const nCities = new Set(model.days.map(x => x.day.city)).size;
  const latest = photos[photos.length - 1];
  const stats = [`${model.days.length} jour${model.days.length > 1 ? "s" : ""}`, `${nMoments} moment${nMoments > 1 ? "s" : ""}`,
    `${photos.length} photo${photos.length > 1 ? "s" : ""}`, `${nCities} ville${nCities > 1 ? "s" : ""}`];
  const cover = `<section class="cn-cover${latest ? "" : " empty"}">${latest ? ctx.photoBtn(latest.iso, latest, { cover: true }) : ""}` +
    `<div class="cn-cover-text"><p class="vy-kicker">${esc(model.datesLabel || "")}</p><h2>${esc(TRAVELERS.join(" & "))} au Japon</h2>` +
    `<p class="cn-stats">${stats.map(s => `<span>${esc(s)}</span>`).join("")}</p></div></section>`;
  const bar = `<div class="cn-toolbar"><div class="cn-seg" role="tablist" aria-label="Affichage">` +
    `<button type="button" data-mode="feed" aria-pressed="${feedState.mode === "feed"}">Fil</button>` +
    `<button type="button" data-mode="grid" aria-pressed="${feedState.mode === "grid"}">Grille</button></div>` +
    `<div class="cn-days"><button type="button" data-fday="" aria-pressed="${!feedState.filter}">Tout</button>` +
    model.days.map(x => `<button type="button" data-fday="${x.day.n}" aria-pressed="${feedState.filter === x.day.n}">J${x.day.n}</button>`).join("") + `</div></div>`;
  let body;
  if (!model.days.length) body = `<p class="vy-empty">${esc(model.emptyText || "Rien pour l’instant.")}</p>`;
  else if (feedState.mode === "grid") {
    const shots = days.flatMap(x => x.items.flatMap(it => it.photos.map(name => ({ iso: x.iso, id: it.id, name, title: it.title, label: `J${x.day.n} · ${dayLabel(x.day)}` }))));
    body = shots.length ? `<div class="cn-grid" data-day-label="">${shots.map(s => ctx.photoBtn(s.iso, s, { thumb: true })).join("")}</div>` : `<p class="vy-empty">Pas encore de photo.</p>`;
  } else body = days.slice().reverse().map(x => dayCardHtml(ctx, x.day, x.iso, x.items)).join("");
  return cover + storiesHtml(model) + bar + body;
}

/** Branche la barre d’outils, les stories et le compteur de photos ; `again()` redessine après un changement. */
export function bindCarnet(root, again){
  root.querySelectorAll("[data-mode]").forEach(b => b.addEventListener("click", () => { feedState.mode = b.dataset.mode; again(); }));
  root.querySelectorAll("[data-fday]").forEach(b => b.addEventListener("click", () => { feedState.filter = b.dataset.fday ? Number(b.dataset.fday) : null; again(); }));
  root.querySelectorAll(".cn-story").forEach(b => b.addEventListener("click", () => {
    const first = DAYS.find(d => d.city === b.dataset.city);
    const el = first && root.querySelector(`#cn-day-${first.n}`) || [...root.querySelectorAll(".vy-daygroup")].find(g => g.querySelector(".vy-dayhead small")?.textContent.startsWith(CITIES[b.dataset.city].name));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  root.querySelectorAll(".vy-car").forEach(car => {
    const dots = car.closest(".vy-post").querySelectorAll(".vy-dots i");
    if (dots.length < 2) return;
    car.addEventListener("scroll", () => {
      const i = Math.min(dots.length - 1, Math.round(car.scrollLeft / Math.max(1, car.clientWidth)));
      dots.forEach((d, k) => d.classList.toggle("on", k === i));
    }, { passive: true });
  });
}
