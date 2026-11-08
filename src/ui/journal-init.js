/* Branche le journal partagé : démarre la synchro et redessine ce qui affiche le journal quand il change. */

import { JOURNAL_CHANGED, JOURNAL_SYNC, initJournalStore } from "../pwa/journal-store.js";
import { refreshDayView } from "./panels/city-panel.js";
import { renderCarnet } from "./views/carnet.js";
import { renderJournalSync, renderJournalView } from "./views/journal.js";
import { renderNextStop } from "./views/next-stop.js";

export function initJournal(){
  document.addEventListener(JOURNAL_CHANGED, () => {
    refreshDayView();
    renderJournalView();
    renderNextStop();
    renderCarnet();
  });
  document.addEventListener(JOURNAL_SYNC, renderJournalSync);
  initJournalStore();
}
