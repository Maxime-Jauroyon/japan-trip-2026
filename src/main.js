/* Point d’entrée : charge les données du voyage puis démarre la carte et l’interface.
   Architecture (dépendances vers le bas uniquement) :
     core/ shared/  →  domain/  →  map/  →  ui/  →  main.js
   La carte n’importe jamais l’UI : elle passe par core/hooks.js, relié ici. */
import { loadData } from "./core/data.js";
import { setHooks } from "./core/hooks.js";
import { initMap } from "./map/controller.js";
import { showMapFallback } from "./map/map-view.js";
import { registerTileProtocol } from "./map/offline-tiles.js";
import { bindForceRefresh, registerServiceWorker, requestPhotoPrecache } from "./pwa/sw-register.js";
import { initIOSInstallHint, initTodoAlerts } from "./ui/alerts.js";
import { initAppShell, initTouchUi } from "./ui/app-shell.js";
import { initCityList } from "./ui/city-list.js";
import { initMapControls } from "./ui/map-controls.js";
import { initMyPosition } from "./ui/my-position.js";
import { initPhraseShow } from "./ui/phrase-show.js";
import { openActivityDetail, openCity, openHotelDetail, openStopDetail } from "./ui/panels/city-panel.js";
import { openJourney, openLeg } from "./ui/panels/leg-panel.js";
import { initTabs, setAppTab } from "./ui/tabs.js";
import { initTheme } from "./ui/theme.js";
import { initPrepView } from "./ui/views/prep-view.js";
import { bindSettings } from "./ui/views/settings-view.js";

async function main() {
  initTouchUi();
  registerServiceWorker();
  bindForceRefresh(document.getElementById("force-refresh"));
  try {
    await loadData();
  } catch (e) {
    console.error(e);
    showMapFallback("Les données du voyage n’ont pas pu être chargées. Vérifie la connexion puis recharge la page.");
    return;
  }
  setHooks({ openCity, openLeg, openJourney, openActivityDetail, openStopDetail, openHotelDetail, setAppTab });
  registerTileProtocol();
  initCityList();
  initMapControls();
  initMyPosition();
  initMap();
  initTheme();
  bindSettings();
  initTabs();
  initAppShell();
  initIOSInstallHint();
  initPrepView();
  initTodoAlerts();
  initPhraseShow();
  // Photos complètes en tâche de fond, une fois la page affichée (les vignettes sont déjà là)
  const later = () => setTimeout(requestPhotoPrecache, 4000);
  if (document.readyState === "complete") later();
  else window.addEventListener("load", later, { once: true });
}

main();
