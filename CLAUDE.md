# CLAUDE.md

Carnet de voyage Japon (PWA statique, GitHub Pages). Lire `README.md` pour l’arborescence.

## Règles

- **Pas de build, pas de dépendance npm** : modules ES natifs servis tels quels. MapLibre est
  un script global (`maplibregl`) chargé avant `src/main.js`.
- **Contenu du voyage = `data/*.json` uniquement.** Ne jamais coder en dur un lieu, une date,
  un hôtel, un prix dans `src/`. Nouveau type de donnée → nouveau champ JSON + `hydrate()` dans
  `src/core/data.js` + contrôle dans `scripts/validate-data.mjs`.
- **Couches** : `config/core/shared → domain → map → ui/pwa → main.js`, sans cycle
  (`npm run architecture`). La carte appelle l’UI via `core/hooks.js`.
- **Pas d’effet de bord au chargement d’un module** (sauf `main.js`) : exposer une fonction
  `init…()` et l’appeler depuis `main.js`.
- Un import ES est en lecture seule : pour modifier l’état d’un autre module, passer par
  `core/state.js` ou par un setter exporté par le module propriétaire.
- `domain/` reste pur (pas de DOM, pas de `state`) et testé dans `tests/`.
- Textes de l’interface et commentaires en **français**.
- CSS : variables de `styles/tokens.css` (thèmes sombre/clair) — pas de couleur en dur pour
  fonds/textes. Ordre des feuilles = ordre de cascade (voir `index.html`).

## Vérifier

```sh
npm run check            # validation des données + architecture + tests
npm run serve            # test manuel → http://localhost:8000
```

Les tuiles OpenFreeMap peuvent être bloquées dans un bac à sable : la carte affiche alors
seulement le relief, les trajets et les marqueurs.

## Publier — à chaque changement terminé, sans demander

Le propriétaire teste directement sur son iPhone (GitHub Pages sert `main`). Donc, à la fin de
chaque changement :

1. `npm run check` (doit être vert) ;
2. `npm run version:bump` (version + précache du service worker — sinon les iPhones gardent
   l’ancienne version en cache) ;
3. commit + push de la branche de travail, ouvrir la PR vers `main` et **la merger tout de suite**,
   sans attendre de validation ;
4. une PR mergée ne reçoit plus de commits : repartir de `main` à jour pour le changement suivant.
