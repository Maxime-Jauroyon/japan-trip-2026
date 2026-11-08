/* Page « Notre voyage » (voyage.html) : lecture seule, pour la famille — couverture, parcours, fil ou grille
   de ce qu’on a vraiment fait avec les photos. Aucun jeton, aucune donnée pratique (hôtels, prix, billets). */

import { DAYS, TRIP, loadData } from "../core/data.js";
import { dayToISO, japanTodayISO } from "../core/dates.js";
import { esc } from "../core/dom.js";
import { doneItems, thumbName } from "../domain/journal.js";
import { loadPublicJournal, publicPhotoUrl } from "../pwa/journal-public.js";
import { bindCarnet, carnetHtml } from "./carnet-feed.js";

const REFRESH_MS = 90000;
let journal = null;
let cfg = null;

/** Photo lue directement sur le dépôt public ; elle apparaît floue (miniature) puis nette. */
const photoBtn = (iso, p, opt = {}) => {
  const url = publicPhotoUrl(cfg, iso, opt.thumb ? thumbName(p.name) : p.name);
  return `<button type="button" class="vy-photo${opt.cover ? " cover" : ""}${opt.thumb ? " sq" : ""} loading"${opt.cover ? " data-cover=\"1\"" : ""} data-full="${esc(publicPhotoUrl(cfg, iso, p.name))}" data-label="${esc(p.title)}" aria-label="${esc(p.title)}">` +
    `<img src="${esc(url)}" alt="${esc(p.title)}" loading="lazy" decoding="async" onload="this.parentNode.classList.remove('loading')" onerror="this.parentNode.classList.remove('loading');this.parentNode.classList.add('missing')" /></button>`;
};
const likeHtml = (iso, it) => it.likes.length ? `<span class="cn-like ro">❤️ <b>${it.likes.length}</b></span><small class="cn-likers">${esc(it.likes.join(", "))}</small>` : "";

let box = null, list = [], idx = 0;
function showLight(i){
  idx = (i + list.length) % list.length;
  box.innerHTML = `<img src="${esc(list[idx].full)}" alt="" /><span class="jv-pos">${list.length > 1 ? `${idx + 1} / ${list.length}` : ""}</span><div class="jv-cap"><strong>${esc(list[idx].label)}</strong></div>`;
}
function openLightbox(root, btn){
  if (!box) {
    box = document.createElement("div");
    box.className = "vy-light";
    let x0 = null;
    box.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", e => {
      const dx = x0 == null ? 0 : e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) showLight(idx + (dx < 0 ? 1 : -1)); else box.hidden = true;
    });
    document.addEventListener("keydown", e => {
      if (box.hidden) return;
      if (e.key === "Escape") box.hidden = true;
      if (e.key === "ArrowRight") showLight(idx + 1);
      if (e.key === "ArrowLeft") showLight(idx - 1);
    });
    document.body.appendChild(box);
  }
  const all = [...root.querySelectorAll("[data-full]:not([data-cover])")];   // la couverture double une photo du fil
  list = all.map(b => ({ full: b.dataset.full, label: b.dataset.label }));
  box.hidden = false;
  showLight(Math.max(0, all.findIndex(b => b.dataset.full === btn.dataset.full)));
}

const SKELETON = `<div class="cn-skel"><div class="sk sk-cover"></div><div class="sk-row"><i class="sk sk-dot"></i><i class="sk sk-dot"></i><i class="sk sk-dot"></i><i class="sk sk-dot"></i></div><div class="sk sk-post"></div></div>`;

function paint(root){
  const days = journal.map(([iso, jd]) => ({ iso, day: DAYS.find(d => dayToISO(d) === iso), items: doneItems(jd) })).filter(x => x.day && x.items.length);
  root.innerHTML = carnetHtml({ days, today: japanTodayISO(), datesLabel: TRIP.datesLabelLong,
    emptyText: "Le carnet se remplit au fil du voyage : les premières photos arrivent bientôt." }, { photoBtn, likeHtml }) +
    `<p class="vy-foot">Mis à jour à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · se rafraîchit tout seul</p>`;
  root.querySelectorAll("[data-full]").forEach(b => b.addEventListener("click", () => openLightbox(root, b)));
  bindCarnet(root, () => paint(root));
}

async function refresh(root){
  const isos = DAYS.map(dayToISO).filter(iso => iso && iso <= japanTodayISO());
  journal = await loadPublicJournal(cfg, isos);
  paint(root);
}

export async function initVoyagePage(){
  const root = document.getElementById("voyage");
  root.innerHTML = SKELETON;
  try {
    await loadData();
  } catch (_) {
    root.innerHTML = `<p class="vy-empty">Impossible de charger le carnet pour le moment.</p>`;
    return;
  }
  cfg = TRIP.journal;
  await refresh(root);
  setInterval(() => { if (!document.hidden) refresh(root); }, REFRESH_MS);
}
