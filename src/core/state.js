/* État partagé de l’interface (lu/écrit par plusieurs modules).
   Le reste de l’état vit dans le module qui le possède. */
export const state = {
  /** Ville ouverte sur la carte (id) ou null en vue Japon. */
  currentCity: null,
  /** Contenu du panneau : { type: "city" | "leg" | "journey", … } ou null. */
  panelContext: null,
  /** Jour affiché dans le panneau ville (n°) ou null (aperçu) — la carte le suit. */
  selectedDay: null,
  /** Dernier lieu mis en avant (pin sélectionné) — garde la caméra dessus. */
  lastFocusAct: null,
  /** Ma position (bouton 📍) : { lat, lng, acc, at } ou null. */
  userPos: null
};
