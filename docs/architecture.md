# Architecture

Site statique public (React, Vite, TypeScript, GitHub Pages, base `/norae-bang/`). Il affiche le répertoire. Il ne contient aucune parole, aucune traduction et aucune clé.

## Données

Lecture seule de `songs.json` à la racine du dépôt privé `pierre-claisse/norae-bang-data`, branche `main` :

`GET https://api.github.com/repos/pierre-claisse/norae-bang-data/contents/songs.json?ref=main`

L’appel envoie `Authorization: Bearer`, `Accept: application/vnd.github+json`, `cache: no-store`, `credentials: omit`, `redirect: error`. Le client n’a pas de méthode d’écriture. `User-Agent` n’est pas fixé : c’est un en-tête interdit dans un navigateur, qui fournit déjà le sien.

Le jeton est un PAT fine-grained collé par l’utilisateur (`github_pat_…`). Il est stocké dans `localStorage` sous la clé `norae-bang.token`. Le lien « Jeton » ouvre une confirmation avant de l’effacer et de revenir à l’écran de connexion. Un jeton au mauvais format est effacé sans appel réseau. Les bascules « Romanisation » et « Traduction » sont mémorisées dans `norae-bang.show-romanization` et `norae-bang.show-translation`.

Sans jeton valide, l’arbre React s’arrête à l’écran de connexion : pas de route, pas de requête. `npm run check-dist` refuse un jeton ou la fixture de test dans `dist/`.

## Validation

Le fichier est parsé puis passé à `parseCatalog` (`docs/data-schema.md`). Toute erreur s’affiche en entier. Aucune liste partielle n’est montrée.

## Écrans

- Connexion : lien de création du jeton, dépôt unique, permission Contents en lecture.
- `/` : liste (titre hangeul, romanisation, titre français, artiste, badge), recherche locale.
- `/chanson/:songId` : paroles ligne à ligne. Trois colonnes à partir de 800 px, empilées en dessous. Sources en bas. Message dédié si les paroles manquent.

`BrowserRouter` utilise `basename={import.meta.env.BASE_URL}`. Le build copie `dist/index.html` vers `dist/404.html` pour le repli SPA de GitHub Pages.

## PWA

`manifest.webmanifest` (`display: standalone`, icônes 192 et 512) et `public/sw.js`. Le service worker n’est enregistré que dans le build de production (`updateViaCache: none`). Il ne répond qu’aux GET de la même origine, et ignore un chemin qui se termine par `/songs.json`. `api.github.com` n’est donc jamais intercepté ni mis en cache. Le cache ne contient que le shell (HTML, assets, icônes).

## Thème

Clair uniquement.

## CI

Le job `verify` lance le typecheck, les tests et le build. Le workflow Pages déploie ce build. Activer GitHub Pages (source : GitHub Actions) se fait dans les réglages du dépôt.
