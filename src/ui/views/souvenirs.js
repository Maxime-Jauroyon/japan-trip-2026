/* Sur place › Souvenirs : suivi des achats par porteur (franchise douanière) et par magasin (détaxe Japon). Données locales à l’appareil. */

import { SOUVENIRS } from "../../core/data.js";
import { japanTodayISO } from "../../core/dates.js";
import { esc } from "../../core/dom.js";
import { addItem, detaxeByStore, level, parseAmount, remaining, removeItem, setCarrier, setNoTax, toBoth, totalsByPerson } from "../../domain/souvenirs.js";
import { loadSouvenirs, saveSouvenirs } from "../../pwa/souvenirs-store.js";
import { loadFxRate } from "./fx-converter.js";

const fmtEur = (n) => `${(Math.round(n * 100) / 100).toLocaleString("fr-FR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} €`;
const fmtYen = (n) => `${Math.round(n).toLocaleString("fr-FR")} ¥`;
const dayLabel = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

const LEVEL_TEXT = { ok: "Dans la franchise", warn: "Presque à la limite", over: "Franchise dépassée" };

function formHtml(personnes, st){
  const who = personnes.includes(st.who) ? st.who : personnes[0];
  return `<div class="tool-card sv-form">
    <div class="tool-head"><h3>Ajouter un achat</h3></div>
    <label class="sv-field"><span>Quoi ?</span><input type="text" id="sv-label" maxlength="60" placeholder="Ex. figurine, kimono, snacks…" autocomplete="off" /></label>
    <div class="sv-amount">
      <label class="sv-field"><span>Prix</span><input type="text" id="sv-value" inputmode="decimal" placeholder="0" autocomplete="off" /></label>
      <div class="sv-seg" role="group" aria-label="Devise saisie">
        <button type="button" data-cur="yen" class="${st.currency === "yen" ? "on" : ""}">¥</button>
        <button type="button" data-cur="eur" class="${st.currency === "eur" ? "on" : ""}">€</button>
      </div>
    </div>
    <p class="sv-hint" id="sv-hint" aria-live="polite"></p>
    <label class="sv-field"><span>Magasin (facultatif, pour la détaxe)</span><input type="text" id="sv-store" maxlength="40" placeholder="Ex. Don Quijote Shibuya" autocomplete="off" /></label>
    <div class="sv-field"><span>Acheté et porté par</span>
      <div class="sv-seg sv-who" role="group" aria-label="Qui l’achète">
        ${personnes.map((p) => `<button type="button" data-who="${esc(p)}" class="${p === who ? "on" : ""}">${esc(p)}</button>`).join("")}
      </div>
    </div>
    <button type="button" class="btn-primary sv-add" id="sv-add">Ajouter</button>
  </div>`;
}

function summaryHtml(items, personnes, refunds){
  const { franchiseEur: max } = SOUVENIRS;
  const t = totalsByPerson(items, personnes, refunds);
  const cards = personnes.map((p) => {
    const eur = t[p].eur;
    const lv = level(eur, max);
    const left = remaining(eur, max);
    const pct = Math.min(100, Math.round(eur / max * 100));
    const other = personnes.find((q) => q !== p);
    const msg = left >= 0
      ? `Il reste <strong>${fmtEur(left)}</strong> avant ${fmtEur(max)}`
      : `<strong>${fmtEur(-left)}</strong> de trop : passe-les dans la valise de ${esc(other)}`;
    return `<div class="sv-card sv-${lv}">
      <div class="sv-name">${esc(p)} <span class="sv-badge">${LEVEL_TEXT[lv]}</span></div>
      <div class="sv-total">${fmtEur(eur)}<small> à déclarer</small></div>
      <div class="sv-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${Math.round(eur)}" aria-label="Franchise de ${esc(p)}"><i style="width:${pct}%"></i></div>
      <div class="sv-left">${msg}</div>
      ${t[p].refund > 0 ? `<div class="sv-sub">Achats ${fmtEur(t[p].gross)} · détaxe reçue −${fmtEur(t[p].refund)}</div>` : ""}
      <div class="sv-sub">${t[p].count} achat${t[p].count > 1 ? "s" : ""} porté${t[p].count > 1 ? "s" : ""}${t[p].away ? ` · ${t[p].away} dans la valise de ${esc(other)}` : ""}</div>
    </div>`;
  }).join("");
  const room = personnes.map((p) => `${esc(p)} peut encore porter <strong>${fmtEur(Math.max(0, remaining(t[p].eur, max)))}</strong>`).join(" · ");
  return `<div class="sv-cards">${cards}</div><p class="sv-room">${room}</p><p class="sv-note">Valeur à déclarer = prix payé moins la détaxe reçue (à confirmer avec le simulateur de la douane ; gardez les factures).</p>`;
}

function detaxeHtml(items, refunds){
  const g = detaxeByStore(items, SOUVENIRS.detaxeMinYen);
  if (!g.length) return `<p class="sv-empty">Indique le magasin d’un achat pour voir s’il atteint le minimum de détaxe (${fmtYen(SOUVENIRS.detaxeMinYen)} par magasin et par jour).</p>`;
  return `<ul class="sv-detaxe">${g.map((x) => `<li class="${x.removed ? "off" : x.ok ? "ok" : ""}"><span><strong>${esc(x.store)}</strong> · ${esc(dayLabel(x.day))}</span><span>${x.removed ? "détaxe non faite" : `${fmtYen(x.yen)} · ${x.ok ? "détaxable ✓" : `il manque ${fmtYen(x.missing)}`}`}</span><button type="button" class="sv-notax" data-ids="${esc(x.ids.join(","))}" data-on="${x.removed ? "0" : "1"}">${x.removed ? "Rétablir" : "Retirer"}</button>${x.removed ? "" : `<label class="sv-refund"><span>Remboursement reçu (¥)</span><input type="text" inputmode="numeric" data-refund="${esc(x.key)}" data-max="${Math.round(x.yen)}" value="${refunds[x.key] ? Math.min(refunds[x.key], Math.round(x.yen)) : ""}" placeholder="0" autocomplete="off" /></label>`}</li>`).join("")}</ul>
    <p class="sv-note">Indicatif (montant hors taxe, règles à confirmer en magasin). « Retirer » si le magasin n’a pas fait la démarche : les achats restent comptés dans la franchise. Détaxe à faire à la douane de Haneda avant l’embarquement, achats non utilisés + reçus + passeports.</p>`;
}

function listHtml(items, personnes){
  if (!items.length) return `<p class="sv-empty">Aucun achat pour l’instant.</p>`;
  let day = "";
  return items.map((it) => {
    const head = it.day !== day ? `<h4 class="sv-day">${esc(dayLabel(it.day))}</h4>` : "";
    day = it.day;
    const other = personnes.find((q) => q !== it.carrier);
    const main = it.entered === "eur" ? fmtEur(it.eur) : fmtYen(it.yen);
    const alt = it.entered === "eur" ? fmtYen(it.yen) : fmtEur(it.eur);
    const away = it.carrier !== it.who ? ` · acheté par ${esc(it.who)}` : "";
    return `${head}<div class="sv-row" data-id="${esc(it.id)}">
      <div class="sv-row-main"><strong>${esc(it.label || "Achat")}</strong><span>${main} <small>≈ ${alt}</small>${it.store ? ` · ${esc(it.store)}` : ""}${away}</span></div>
      <button type="button" class="sv-carry" data-carrier="${esc(other)}" title="Changer qui le porte">Porté par ${esc(it.carrier)} ⇄</button>
      <button type="button" class="sv-del" aria-label="Supprimer cet achat">✕</button>
    </div>`;
  }).join("");
}

function refresh(root){
  const st = loadSouvenirs();
  const { personnes } = SOUVENIRS;
  root.querySelector("#sv-summary").innerHTML = summaryHtml(st.items, personnes, st.refunds);
  root.querySelector("#sv-detaxe").innerHTML = detaxeHtml(st.items, st.refunds);
  root.querySelector("#sv-list").innerHTML = listHtml(st.items, personnes);
}

function updateHint(root){
  const st = loadSouvenirs();
  const v = parseAmount(root.querySelector("#sv-value").value);
  const hint = root.querySelector("#sv-hint");
  const both = v == null ? null : toBoth(v, st.currency, loadFxRate());
  hint.textContent = !both ? `Taux : ${loadFxRate().toString().replace(".", ",")} ¥ = 1 €` : st.currency === "yen" ? `≈ ${fmtEur(both.eur)}` : `≈ ${fmtYen(both.yen)}`;
}

function bind(root){
  root.addEventListener("click", (e) => {
    const cur = e.target.closest("[data-cur]");
    const who = e.target.closest("[data-who]");
    if (cur) {
      saveSouvenirs({ currency: cur.dataset.cur });
      root.querySelectorAll("[data-cur]").forEach((b) => b.classList.toggle("on", b === cur));
      updateHint(root);
    } else if (who) {
      saveSouvenirs({ who: who.dataset.who });
      root.querySelectorAll("[data-who]").forEach((b) => b.classList.toggle("on", b === who));
    } else if (e.target.closest("#sv-add")) add(root);
    else if (e.target.closest(".sv-notax")) {
      const b = e.target.closest(".sv-notax");
      saveSouvenirs({ items: setNoTax(loadSouvenirs().items, b.dataset.ids.split(","), b.dataset.on === "1") });
      refresh(root);
    } else {
      const row = e.target.closest(".sv-row");
      if (!row) return;
      const st = loadSouvenirs();
      const carry = e.target.closest(".sv-carry");
      if (carry) saveSouvenirs({ items: setCarrier(st.items, row.dataset.id, carry.dataset.carrier) });
      else if (e.target.closest(".sv-del") && confirm("Supprimer cet achat ?")) saveSouvenirs({ items: removeItem(st.items, row.dataset.id) });
      else return;
      refresh(root);
    }
  });
  root.querySelector("#sv-value").addEventListener("input", () => updateHint(root));
  root.addEventListener("change", (e) => {
    const inp = e.target.closest("[data-refund]");
    if (!inp) return;
    const n = parseAmount(inp.value);
    const max = Number(inp.dataset.max) || 0;
    const refunds = { ...loadSouvenirs().refunds };
    if (n == null || n <= 0) delete refunds[inp.dataset.refund];
    else refunds[inp.dataset.refund] = Math.min(Math.round(n), max);
    saveSouvenirs({ refunds });
    refresh(root);
  });
  root.querySelector(".sv-form").addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.tagName === "INPUT") add(root); });
}

function add(root){
  const st = loadSouvenirs();
  const v = parseAmount(root.querySelector("#sv-value").value);
  const valueEl = root.querySelector("#sv-value");
  if (v == null || v <= 0) { valueEl.focus(); valueEl.classList.add("bad"); return; }
  valueEl.classList.remove("bad");
  const both = toBoth(v, st.currency, loadFxRate());
  const who = SOUVENIRS.personnes.includes(st.who) ? st.who : SOUVENIRS.personnes[0];
  const item = {
    id: `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    label: root.querySelector("#sv-label").value.trim(),
    store: root.querySelector("#sv-store").value.trim(),
    day: japanTodayISO(),
    who, carrier: who, entered: st.currency, eur: both.eur, yen: both.yen,
  };
  saveSouvenirs({ items: addItem(st.items, item), who });
  ["#sv-label", "#sv-value", "#sv-store"].forEach((s) => { root.querySelector(s).value = ""; });
  updateHint(root);
  refresh(root);
}

export function renderSouvenirs(){
  const root = document.getElementById("onsite-souvenirs");
  if (!root || !SOUVENIRS.personnes.length) return;
  if (!root.dataset.bound) {
    root.dataset.bound = "1";
    const st = loadSouvenirs();
    root.innerHTML = `<div id="sv-summary"></div>
      ${formHtml(SOUVENIRS.personnes, st)}
      <div class="tool-card"><div class="tool-head"><h3>Détaxe Japon</h3></div><div id="sv-detaxe"></div></div>
      <div class="tool-card"><div class="tool-head"><h3>Achats</h3></div><div id="sv-list"></div></div>
      <p class="sv-note">Franchise douanière UE : ${fmtEur(SOUVENIRS.franchiseEur)} par voyageur en avion ; seuls comptent les achats que chacun porte. Suivi gardé sur cet appareil.</p>`;
    bind(root);
    updateHint(root);
  }
  refresh(root);
}
