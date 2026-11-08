/* Page « Notre voyage » (voyage.html) : lecture seule, pour la famille — le parcours jour par jour,
   ce qu’on a vraiment fait et les photos. Aucun jeton, aucune donnée pratique (hôtels, prix, billets). */

import { CITIES, DAYS, ORDER, TRIP, TRAVELERS, loadData } from "../core/data.js";
import { dayToISO, japanTodayISO } from "../core/dates.js";
import { esc } from "../core/dom.js";
import { doneItems, thumbName } from "../domain/journal.js";
import { cityStayDates } from "../domain/trip.js";
import { loadPublicJournal, publicPhotoUrl } from "../pwa/journal-public.js";

const REFRESH_MS = 90000;

const dayLabel = (d) => `${d.dow} ${d.date.replace(/\s\d{4}$/, "")}`;

/** Miniature pour la page famille : lue directement sur le dépôt public. */
const publicPhotoBtn = (cfg) => (iso, p) =>
  `<button type="button" class="vy-thumb" data-full="${esc(publicPhotoUrl(cfg, iso, p.name))}" aria-label="${esc(p.title)}">` +
  `<img src="${esc(publicPhotoUrl(cfg, iso, thumbName(p.name)))}" alt="${esc(p.title)}" loading="lazy" decoding="async" /></button>`;

/** Carte d’un jour (partagée avec l’onglet Carnet) ; `photoBtn(iso, { name, title, id })` fabrique une miniature. */
export function dayCardHtml(photoBtn, day, iso, items){
  const city = CITIES[day.city];
  const photos = items.flatMap(it => it.photos.map(name => ({ name, title: it.title, id: it.id })));
  return `<article class="vy-day"><header><span class="vy-n">J${day.n}</span><div><h3>${esc(dayLabel(day))}</h3>` +
    `<p>${esc(city ? city.name : day.city)}${day.extraCity && CITIES[day.extraCity] ? " · " + esc(CITIES[day.extraCity].name) : ""}</p></div></header>` +
    `<ul class="vy-list">` + items.map(it =>
      `<li><span class="vy-time">${esc(it.time || "✓")}</span><span class="vy-what"><strong>${esc(it.title)}</strong>` +
      `${it.note ? `<small>${esc(it.note)}</small>` : ""}</span>${it.by ? `<span class="vy-by">${esc(it.by)}</span>` : ""}</li>`).join("") + `</ul>` +
    (photos.length ? `<div class="vy-grid">${photos.map(p => photoBtn(iso, p)).join("")}</div>` : "") + `</article>`;
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
