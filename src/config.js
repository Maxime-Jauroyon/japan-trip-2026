/* Configuration de l’app (pas de contenu de voyage) : version, clés de stockage local, cache des tuiles. */

/** Version affichée — garder en sync avec sw.js (scripts/bump-version.mjs). */
export const APP_VERSION = "v186";

/* Clés localStorage (préfixe japan-trip-, suffixe -vN pour migrer un format). */
export const CHECK_KEY = "japan-trip-check-v1";
export const FX_KEY = "japan-trip-fx-rate-v1";
export const THEME_KEY = "japan-trip-theme-v1";
export const MAP_RELIEF_KEY = "japan-trip-map-relief-v1";
export const WEATHER_CACHE_KEY = "japan-trip-weather-v1";
export const IOS_INSTALL_KEY = "japan-trip-ios-install-dismiss-v1";
/** Carte « À faire » repoussée : date ISO du jour où elle a été masquée (revient le lendemain). */
export const TODO_SNOOZE_KEY = "japan-trip-todo-snooze-v2";
/** Réservations de trajets marquées « faites » sur cet appareil (ids « trajet:lien »). */
export const TODO_DONE_KEY = "japan-trip-todo-done-v2";
/** Section ouverte dans Préparatifs (todo, checklist, budget, infos). */
export const PREP_PANE_KEY = "japan-trip-prep-pane-v1";
export const OFFLINE_MAPS_KEY = "japan-trip-offline-maps-v1";
/** Version pour laquelle la vue Japon a été pré-chargée en tâche de fond (ordinateur). */
/** Étapes du jour cochées « Fait » (carte « Et maintenant ? ») : { "AAAA-MM-JJ": [titres] }. */
export const DAY_PROGRESS_KEY = "japan-trip-day-progress-v1";
/** Dépenses sur place : [{ id, iso, yen, cat, note }] et budget quotidien (¥). */
export const EXPENSES_KEY = "japan-trip-expenses-v1";
export const EXPENSE_BUDGET_KEY = "japan-trip-expense-budget-v1";
export const TILES_WARM_KEY = "japan-trip-tiles-warm-v1";

/* Tuiles de carte : cache séparé conservé entre les versions (cf. map/offline-tiles.js, sw.js). */
export const TILE_CACHE = "japan-tiles-v1";
export const TILE_PROTOCOL = "jtcache";
