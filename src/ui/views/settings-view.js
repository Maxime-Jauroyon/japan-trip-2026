/* Onglet Réglages : thème, relief 3D, cartes hors ligne. */

import { esc } from "../../core/dom.js";
import { setMapRelief } from "../../map/controller.js";
import { mapReliefEnabled } from "../../map/map-view.js";
import { cancelOfflineMaps, clearOfflineMaps, downloadOfflineMaps, offlineDownload, offlineMapsInfo, offlineStorageUsage } from "../../map/offline-tiles.js";
import { updateOfflineStatus } from "../app-shell.js";
import { applyThemePref, setThemePref } from "../theme.js";

function formatBytes(n){
  if (n == null) return "";
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + " Ko";
  return (n / (1024 * 1024)).toFixed(n > 100 * 1024 * 1024 ? 0 : 1).replace(".", ",") + " Mo";
}

async function renderOfflineMapsStatus(){
  const status = document.getElementById("offline-maps-status");
  const clearBtn = document.getElementById("offline-maps-clear");
  const dlBtn = document.getElementById("offline-maps-download");
  if (!status) return;
  if (offlineDownload) return;
  const info = offlineMapsInfo();
  const usage = await offlineStorageUsage();
  const used = usage != null ? " · stockage utilisé : " + formatBytes(usage) : "";
  if (info) {
    const d = new Date(info.at);
    const when = isNaN(d) ? "" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    status.innerHTML = `<span class="ok-dot" aria-hidden="true"></span> Cartes disponibles hors ligne` +
      (when ? ` (téléchargées le ${esc(when)})` : "") + esc(used) +
      (info.failed ? `<br><small>${info.failed} tuiles manquantes — relancer en Wi‑Fi pour compléter.</small>` : "");
    status.classList.add("ready");
    if (dlBtn) dlBtn.textContent = "Mettre à jour les cartes";
  } else {
    status.textContent = "Pas encore téléchargées. Les zones déjà consultées restent en cache" + used + ".";
    status.classList.remove("ready");
    if (dlBtn) dlBtn.textContent = "Télécharger les cartes hors ligne";
  }
  if (clearBtn) clearBtn.hidden = !info;
}

export function renderSettings(){
  applyThemePref();
  const relief = document.getElementById("relief-toggle");
  if (relief) relief.checked = mapReliefEnabled();
  renderOfflineMapsStatus();
  updateOfflineStatus();
}

export function bindSettings(){
  document.querySelectorAll("#theme-picker [data-theme-choice]").forEach(b => {
    b.addEventListener("click", () => setThemePref(b.dataset.themeChoice));
  });
  const relief = document.getElementById("relief-toggle");
  if (relief) relief.addEventListener("change", () => setMapRelief(relief.checked));
  const dlBtn = document.getElementById("offline-maps-download");
  const clearBtn = document.getElementById("offline-maps-clear");
  const prog = document.getElementById("offline-maps-progress");
  const status = document.getElementById("offline-maps-status");
  if (dlBtn) dlBtn.addEventListener("click", async () => {
    if (offlineDownload) {
      cancelOfflineMaps();
      return;
    }
    if (navigator.onLine === false) {
      status.textContent = "Hors ligne : connecte-toi (idéalement en Wi‑Fi) pour télécharger.";
      return;
    }
    dlBtn.textContent = "Annuler";
    if (clearBtn) clearBtn.hidden = true;
    prog.hidden = false;
    prog.style.setProperty("--p", "0%");
    status.classList.remove("ready");
    status.textContent = "Préparation…";
    try {
      await downloadOfflineMaps((done, total, bytes) => {
        prog.style.setProperty("--p", (100 * done / total).toFixed(1) + "%");
        status.textContent = `Téléchargement… ${done} / ${total} tuiles · ${formatBytes(bytes)}`;
      });
      prog.hidden = true;
      await renderOfflineMapsStatus();
    } catch (e) {
      prog.hidden = true;
      status.textContent = "Interrompu : " + (e && e.message ? e.message : "erreur réseau") + ". Les tuiles déjà reçues sont gardées.";
      dlBtn.textContent = "Reprendre le téléchargement";
    }
  });
  if (clearBtn) clearBtn.addEventListener("click", async () => {
    if (!confirm("Supprimer les cartes hors ligne de cet appareil ?")) return;
    await clearOfflineMaps();
    renderOfflineMapsStatus();
  });
}
