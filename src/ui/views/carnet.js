/* Onglet Carnet : le parcours et ce qu’on a vraiment fait, jour par jour, avec les photos
   (d’après le journal de ce téléphone, déjà synchronisé : fonctionne hors ligne). Même présentation que la page famille. */

import { DAYS, TRAVELERS } from "../../core/data.js";
import { dayToISO, japanTodayISO } from "../../core/dates.js";
import { esc } from "../../core/dom.js";
import { doneItems } from "../../domain/journal.js";
import { journalDays } from "../../pwa/journal-store.js";
import { hydratePhotos } from "../journal-widgets.js";
import { dayCardHtml, routeHtml } from "../voyage-page.js";

/** Miniature qui s’ouvre dans la visionneuse du journal (avec « Supprimer »). */
const localPhotoBtn = (iso, p) =>
  `<button type="button" class="vy-thumb" data-jp-iso="${esc(iso)}" data-jp-id="${esc(p.id)}" data-jp-name="${esc(p.name)}" aria-label="${esc(p.title)}"><img data-jphoto alt="" decoding="async" /></button>`;

export function renderCarnet(){
  const box = document.getElementById("carnet-body");
  if (!box) return;
  const days = journalDays()
    .map(([iso, jd]) => ({ iso, day: DAYS.find(d => dayToISO(d) === iso), items: doneItems(jd) }))
    .filter(x => x.day && x.items.length);
  const nPlaces = days.reduce((s, x) => s + x.items.length, 0);
  const nPhotos = days.reduce((s, x) => s + x.items.reduce((t, it) => t + it.photos.length, 0), 0);
  box.innerHTML =
    `<p class="vy-stats">${esc(TRAVELERS.join(" & "))} · ${nPlaces} moment${nPlaces > 1 ? "s" : ""} · ${nPhotos} photo${nPhotos > 1 ? "s" : ""}</p>` +
    routeHtml(japanTodayISO()) +
    (days.length ? days.slice().reverse().map(x => dayCardHtml(localPhotoBtn, x.day, x.iso, x.items)).join("")
      : `<p class="vy-empty">Rien pour l’instant. Coche ce que vous faites dans Sur place › Journal et ajoutez des photos : tout apparaît ici, jour par jour.</p>`);
  hydratePhotos(box);
}

/** Bouton « Envoyer à la famille » (page voyage.html, lecture seule). */
export function bindCarnetShare(){
  document.getElementById("carnet-share")?.addEventListener("click", async () => {
    const url = new URL("voyage.html", location.href).href;
    try {
      if (navigator.share) { await navigator.share({ title: "Notre voyage au Japon", text: "Notre voyage au Japon, en direct :", url }); return; }
    } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(url); alert("Lien copié :\n" + url); } catch (_) { prompt("Lien à envoyer :", url); }
  });
}
