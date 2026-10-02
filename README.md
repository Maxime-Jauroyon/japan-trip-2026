# Voyage au Japon · 8–29 nov 2026

Carnet de voyage interactif : carte 3D du Japon, cartes des villes, programme jour par jour,
préparatifs, outils sur place. Site statique publié sur **GitHub Pages**, installable sur iPhone
(écran d’accueil) et utilisable **hors ligne**.

- Aucune étape de build : HTML + CSS + JavaScript en modules ES natifs.
- Toutes les infos du voyage sont dans `data/*.json` — le code ne contient aucun contenu de voyage.
- Carte : [MapLibre GL](https://maplibre.org) (vendorisé dans `lib/`), tuiles OpenFreeMap, relief AWS Terrain Tiles — sans clé API.

## Lancer en local

```sh
npm run serve        # → http://localhost:8000 (python3 -m http.server)
npm run check        # données + architecture + tests unitaires
```

Node ≥ 20 suffit pour les scripts et tests (aucune dépendance npm).

## Arborescence

```
index.html            page unique (structure HTML, aucun contenu de voyage)
sw.js                 service worker : cache hors ligne de l’app
data/                 ← CONTENU DU VOYAGE (JSON)
  trip.json             titre, dates du voyage, voyageurs, taux ¥/€ par défaut
  cities.json           villes : hôtels/séjours (+ plages de jours), emprise de carte, quartiers, étiquette, climat
  days.json             programme jour par jour (déplacements, idées, consignes)
  legs.json             trajets (horaires, statut, réservations, tracé sur la carte)
  journeys.json         trajets en plusieurs étapes (ex. Fuji → Tokyo → Kanazawa)
  prep.json             checklist, budget, rappels billets
  phrases.json          phrases utiles (générales + par contexte)
  places-meta.json      horaires / durées des activités
  practical.json        infos pratiques
  photos.json           photo d’une activité d’après son titre (motif → img/activities/<slug>.jpg)
src/                  code (modules ES)
  main.js               point d’entrée : charge data/ puis démarre carte + interface
  config.js             version de l’app, clés localStorage
  core/                 données chargées, état partagé, dates, DOM, environnement
  shared/               icônes SVG
  domain/               logique métier pure (jours, trajets, réservations, lieux, photos)
  map/                  carte MapLibre (contrôleur, styles, trajets, villes, hors ligne)
  ui/                   onglets, panneaux, vues (Préparatifs, Sur place, Réglages), alertes
  pwa/                  enregistrement du service worker
styles/               CSS par thème (tokens → base → … → mobile → standalone)
lib/maplibre/         MapLibre GL JS 5.24 (UMD, global `maplibregl`)
img/                  photos des hôtels et activités, logo
scripts/              outils Node (validation, précache, version, architecture)
tests/                tests unitaires (node:test)
```

## Modifier le voyage

1. Éditer le fichier JSON concerné dans `data/` (ex. ajouter une idée dans `days.json`,
   passer un trajet à `"status": "paid"` dans `legs.json`).
2. `npm run validate` — vérifie identifiants, références (villes, trajets, jours), coordonnées, dates.
3. Publier (voir plus bas).

Repères :
- **Coordonnées** : `lat` / `lng` en degrés décimaux. Une idée sans coordonnées n’a pas de pin.
- **Références** : un trajet pointe une ville par `{ "city": "tokyo" }` ou un point précis par
  `{ "id": "tokyo", "lat": …, "lng": … }` ; un jour référence ses trajets par `"leg": "<id>"`.
- **Statuts** : `paid`, `reserved`, `placeholder`.
- **Dates de réservation** : `openFrom` / `remindFrom` au format `AAAA-MM-JJ`.
- **Photos** : `img/activities/<slug>.jpg` (+ `-2.jpg`…) — choisies par `"slug"` sur l’idée ou par
  les motifs de `photos.json` ; photos d’hôtels listées dans `cities.json`.

## Publier une nouvelle version

```sh
npm run check
npm run version:bump      # v164 → v165 dans config.js, sw.js, index.html + précache
git commit -am "…" && git push
```

GitHub Pages sert la branche publiée telle quelle (`.nojekyll`). Sur l’iPhone, l’app se met à
jour toute seule à l’ouverture ; sinon **Réglages → Rafraîchir l’application** (les cartes
hors ligne sont conservées).

## Architecture du code

Dépendances **vers le bas uniquement** (vérifié par `npm run architecture`) :

```
config · core · shared   →   domain   →   map   →   ui · pwa   →   main.js
```

- **core/data.js** charge `data/*.json` et expose les structures (`CITIES`, `DAYS`, `LEGS`…) en
  liaisons « live » : à n’utiliser qu’après `loadData()`, jamais au chargement d’un module.
- **domain/** : fonctions pures sans DOM, testées dans `tests/`.
- **map/controller.js** est l’API de la carte pour l’UI (création, thème, relief, passage
  Japon 3D ↔ ville 2D, cadrage des trajets). La carte n’importe jamais l’UI : les actions
  (ouvrir une ville, un trajet, un pin) passent par `core/hooks.js`, relié dans `main.js`.
- **core/state.js** : seul état partagé entre modules (`currentCity`, `panelContext`,
  `lastFocusAct`). Le reste de l’état appartient à son module ; l’état de la carte se modifie via
  les setters de `map/map-view.js`.
- Aucun module n’exécute de code au chargement (sauf `main.js`) : tout démarre par une fonction `init…`.

### Hors ligne

- `sw.js` met en cache l’app (code, styles, données, images) — liste générée par `npm run precache`.
- Les tuiles de carte passent par le protocole `jtcache://` (`src/map/offline-tiles.js`) : cache
  d’abord, réseau ensuite, dans un cache séparé (`japan-tiles-v1`) conservé entre les versions.
  **Réglages → Télécharger les cartes hors ligne** pré-charge le Japon et les 8 villes.
