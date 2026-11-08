/* Page « Notre voyage » (voyage.html) : lecture seule, pour la famille — le parcours jour par jour,
   ce qu’on a vraiment fait et les photos. Aucun jeton, aucune donnée pratique (hôtels, prix, billets). */

import { CITIES, DAYS, ORDER, TRIP, TRAVELERS, loadData } from "../core/data.js";
import { dayToISO, japanTodayISO } from "../core/dates.js";
import { esc } from "../core/dom.js";
import { doneItems } from "../domain/journal.js";
import { cityStayDates } from "../domain/trip.js";
import { loadPublicJournal, publicPhotoUrl } from "../pwa/journal-public.js";

const REFRESH_MS = 90000;

const dayLabel = (d) => `${d.dow} ${d.date.replace(/\s\d{4}$/, "")}`;

/** Photo pour la page famille : lue directement sur le dépôt public (taille réduite, chargée à la demande). */
const publicPhotoBtn = (cfg) => (iso, p) =>
  `<button type="button" class="vy-photo" data-full="${esc(publicPhotoUrl(cfg, iso, p.name))}" aria-label="${esc(p.title)}">` +
  `<img src="${esc(publicPhotoUrl(cfg, iso, p.name))}" alt="${esc(p.title)}" loading="lazy" decoding="async" /></button>`;

/** Une publication : auteur, titre, photos à faire défiler, légende. */
function postHtml(photoBtn, iso, it){
  const who = it.by || "";
  const meta = [who, it.time].filter(Boolean).join(" · ");
  return `<article class="vy-post${it.photos.length ? "" : " plain"}"><header><span class="vy-avatar" aria-hidden="true">${esc((who || "✓").slice(0, 1))}</span>` +
    `<div><strong>${esc(it.title)}</strong>${meta ? `<small>${esc(meta)}</small>` : ""}</div></header>` +
    (it.photos.length
      ? `<div class="vy-media"><div class="vy-car" data-n="${it.photos.length}">${it.photos.map(name => `<div class="vy-slide">${photoBtn(iso, { name, title: it.title, id: it.id })}</div>`).join("")}</div>` +
        (it.photos.length > 1 ? `<span class="vy-count" aria-hidden="true">1 / ${it.photos.length}</span>` : "") + `</div>`
      : "") +
    (it.note ? `<p class="vy-caption">${esc(it.note)}</p>` : "") + `</article>`;
}

/** Un jour du fil : bandeau du jour puis ses publications (partagé avec l’onglet Carnet). */
export function dayCardHtml(photoBtn, day, iso, items){
  const city = CITIES[day.city];
  const extra = day.extraCity && CITIES[day.extraCity] ? " · " + CITIES[day.extraCity].name : "";
  return `<section class="vy-daygroup"><h3 class="vy-dayhead"><span class="vy-n">J${day.n}</span>${esc(dayLabel(day))}` +
    `<small>${esc((city ? city.name : day.city) + extra)}</small></h3>` +
    items.slice().sort((a, b) => b.photos.length - a.photos.length).map(it => postHtml(photoBtn, iso, it)).join("") + `</section>`;
}

/** Compteur « 2 / 4 » qui suit le défilement des photos d’une publication. */
export function bindCarousels(root){
  root.querySelectorAll(".vy-car").forEach(car => {
    const count = car.parentElement.querySelector(".vy-count");
    if (!count) return;
    car.addEventListener("scroll", () => {
      const i = Math.round(car.scrollLeft / Math.max(1, car.clientWidth)) + 1;
      count.textContent = `${Math.min(i, Number(car.dataset.n))} / ${car.dataset.n}`;
    }, { passive: true });
  });
}

/** Parcours : les villes dans l’ordre ; celles déjà atteintes en couleur. */
export function routeHtml(today){
  return `<ol class="vy-route" aria-label="Parcours">` + ORDER.map((id, i) => {
    const c = CITIES[id];
    const first = DAYS.find(d => d.city === id);
    const reached = first && dayToISO(first) <= today;
    return `<li class="${reached ? "reached" : ""}"><b>${i + 1}</b><span><strong>${esc(c.name)}</strong><small>${esc(cityStayDates(c))}</small></span></li>`;
  }).join("") + `</ol>`;
}

let lightbox = null;
function openLightbox(url){
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.className = "vy-light";
    lightbox.addEventListener("click", () => { lightbox.hidden = true; });
    document.body.appendChild(lightbox);
  }
  lightbox.innerHTML = `<img src="${esc(url)}" alt="" />`;
  lightbox.hidden = false;
}

async function render(root){
  const cfg = TRIP.journal;
  const today = japanTodayISO();
  const isos = DAYS.map(dayToISO).filter(iso => iso && iso <= today);
  const journal = await loadPublicJournal(cfg, isos);
  const days = journal.map(([iso, jd]) => ({ iso, day: DAYS.find(d => dayToISO(d) === iso), items: doneItems(jd) })).filter(x => x.day && x.items.length);
  const nPlaces = days.reduce((s, x) => s + x.items.length, 0);
  const nPhotos = days.reduce((s, x) => s + x.items.reduce((t, it) => t + it.photos.length, 0), 0);
  root.innerHTML =
    `<header class="vy-hero"><p class="vy-kicker">${esc(TRIP.datesLabelLong)}</p><h1>${esc(TRAVELERS.join(" & "))} au Japon</h1>` +
    `<p class="vy-stats">${nPlaces} moment${nPlaces > 1 ? "s" : ""} · ${nPhotos} photo${nPhotos > 1 ? "s" : ""}</p></header>` +
    routeHtml(today) +
    (days.length ? days.slice().reverse().map(x => dayCardHtml(publicPhotoBtn(cfg), x.day, x.iso, x.items)).join("")
      : `<p class="vy-empty">Le carnet se remplit au fil du voyage : les premières photos arrivent bientôt.</p>`) +
    `<p class="vy-foot">Mis à jour à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · se rafraîchit tout seul</p>`;
  root.querySelectorAll("[data-full]").forEach(b => b.addEventListener("click", () => openLightbox(b.dataset.full)));
  bindCarousels(root);
}

export async function initVoyagePage(){
  const root = document.getElementById("voyage");
  try {
    await loadData();
  } catch (_) {
    root.innerHTML = `<p class="vy-empty">Impossible de charger le carnet pour le moment.</p>`;
    return;
  }
  await render(root);
  setInterval(() => { if (!document.hidden) render(root); }, REFRESH_MS);
}
