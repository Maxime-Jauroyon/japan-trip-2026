/* Lien « Itinéraire » Google Maps. Pur : pas de DOM.
   Un lieu peut avoir `mapsQuery` (nom + adresse, ex. en japonais) : Google l’affiche alors comme le lieu exact (fiche, horaires, photos)
   au lieu d’un simple point de coordonnées. Pour une étape d’itinéraire, `mapsQuery` est lu sur l’idée d’origine (`ref`). */
export function mapsDirectionsUrl(act, mode = "walking"){
  if (!act) return null;
  const q = [act.mapsQuery, act.ref && act.ref.mapsQuery].find((s) => typeof s === "string" && s.trim());
  let dest = q ? q.trim() : null;
  if (!dest) {
    if (act.lat == null || act.lng == null) return null;
    dest = `${act.lat},${act.lng}`;   // origine omise → Google Maps utilise la position actuelle sur le téléphone
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=${mode}`;
}
