/* Configuration de l’app (pas de contenu de voyage) : version, clés de stockage local, cache des tuiles. */

/** Version affichée — garder en sync avec sw.js (scripts/bump-version.mjs). */
export const APP_VERSION = "v164";

/* Clés localStorage (préfixe japan-trip-, suffixe -vN pour migrer un format). */
export const CHECK_KEY = "japan-trip-check-v1";
export const FX_KEY = "japan-trip-fx-rate-v1";
export const THEME_KEY = "japan-trip-theme-v1";
export const MAP_RELIEF_KEY = "japan-trip-map-relief-v1";
export const WEATHER_CACHE_KEY = "japan-trip-weather-v1";
export const IOS_INSTALL_KEY = "japan-trip-ios-install-dismiss-v1";
export const BOOKING_ALERT_KEY = "japan-trip-booking-alert-dismiss-v1";
export const REMINDER_ALERT_KEY = "japan-trip-reminder-alert-dismiss-v1";
export const OFFLINE_MAPS_KEY = "japan-trip-offline-maps-v1";

/* Tuiles de carte : cache séparé conservé entre les versions (cf. map/offline-tiles.js, sw.js). */
export const TILE_CACHE = "japan-tiles-v1";
export const TILE_PROTOCOL = "jtcache";
