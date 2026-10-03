/* Phrases utiles : cartes tappables et mode « Montrer » — la phrase en très grand, plein écran,
   à tendre au serveur ou au vendeur. Un seul écouteur délégué pour toute l’app. */

import { esc } from "../core/dom.js";

/** Carte d’une phrase (Sur place ou fiche de lieu). `small` : version compacte des fiches. */
export function phraseCardHtml(p, small){
  return `<button type="button" class="${small ? "phrase-sm" : "phrase"}" data-phrase>` +
    `<span class="fr">${esc(p.fr)}</span>` +
    `<span class="jp" lang="ja">${esc(p.jp)}</span>` +
    `<span class="ro">${esc(p.ro)}</span>` +
    (p.note ? `<span class="note">${esc(p.note)}</span>` : "") +
    `</button>`;
}

let box = null;

function close(){
  if (box) box.hidden = true;
}

function show(card){
  if (!box) {
    box = document.createElement("div");
    box.className = "phrase-show";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Phrase en grand");
    box.addEventListener("click", close);
    document.body.appendChild(box);
  }
  const txt = (sel) => card.querySelector(sel)?.textContent || "";
  box.innerHTML =
    `<div class="ps-jp" lang="ja">${esc(txt(".jp"))}</div>` +
    `<div class="ps-ro">${esc(txt(".ro"))}</div>` +
    `<div class="ps-fr">${esc(txt(".fr"))}</div>` +
    `<p class="ps-hint">Toucher pour fermer</p>`;
  box.hidden = false;
}

export function initPhraseShow(){
  document.addEventListener("click", e => {
    const card = e.target.closest && e.target.closest("[data-phrase]");
    if (card) show(card);
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && box && !box.hidden) { e.stopImmediatePropagation(); close(); }
  }, true);
}
