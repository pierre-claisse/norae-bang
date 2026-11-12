# Architecture

Site statique public (React, Vite, TypeScript, GitHub Pages, base `/norae-bang/`). Il affiche le répertoire. Il ne contient aucune parole, aucune traduction et aucune clé.

## Données

Lecture seule de `songs.json` à la racine du dépôt privé `pierre-claisse/norae-bang-data`, branche `main` :

`GET https://api.github.com/repos/pierre-claisse/norae-bang-data/contents/songs.json?ref=main`

L’appel envoie `Authorization: Bearer`, `Accept: application/vnd.github+json`, `cache: no-store`, `credentials: omit`, `redirect: error`. Le client n’a pas de méthode d’écriture. `User-Agent` n’est pas fixé : c’est un en-tête interdit dans un navigateur, qui fournit déjà le sien.

Le jeton est un PAT fine-grained collé par l’utilisateur (`github_pat_…`). Il est stocké dans `localStorage` sous la clé `norae-bang.token`. Le lien « Jeton » ouvre une confirmation avant de l’effacer et de revenir à l’écran de connexion. Un jeton au mauvais format, refusé ou sans accès au dépôt, ramène à ce champ avec la cause. Le site ne traduit rien : il affiche les unités déjà enregistrées.

Sans jeton valide, l’arbre React s’arrête à l’écran de connexion : pas de route, pas de requête. `npm run check-dist` refuse un jeton ou la fixture de test dans `dist/`.

## Validation

Le fichier est parsé puis passé à `parseCatalog` (`docs/data-schema.md`). Toute erreur s’affiche en entier. Aucune liste partielle n’est montrée.

## Écrans

- Connexion : lien de création du jeton, dépôt unique, permission Contents en lecture.
- `/` : liste (titre hangeul, titre français, artiste en hangeul seul, badge), recherche locale, filtre par artiste (`?artiste=`). Sur un écran étroit, les puces défilent sans barre, avec un fondu à droite. Sur un écran large, elles passent à la ligne. Le filtre se combine avec la recherche. Arriver avec `?artiste` centre la puce active.
- `/chanson/:songId` : hangeul par couplet. Si des unités existent, le français est affiché à côté (ou dessous en mobile), avec la note sous le paragraphe, puis la variante de texte s’il y en a une. Sans unité, seul le hangeul est montré. Le contexte suit l’artiste et l’année. Le nom de l’artiste ouvre la liste filtrée. Le retour au répertoire conserve `?artiste`. Sources en bas, seulement s’il y a une remarque ou un lien. Message dédié si les paroles manquent.

`BrowserRouter` utilise `basename={import.meta.env.BASE_URL}`. Le build copie `dist/index.html` vers `dist/404.html` pour le repli SPA de GitHub Pages.

## PWA

`manifest.webmanifest` (`display: standalone`, icônes 192 et 512) et `public/sw.js`. Le service worker n’est enregistré que dans le build de production (`updateViaCache: none`). Il ne répond qu’aux GET de la même origine, et ignore un chemin qui se termine par `/songs.json`. `api.github.com` n’est donc jamais intercepté ni mis en cache. Le cache ne contient que le shell (HTML, assets, icônes).

## Thème

Sombre et chaud, façon façade d’ampli. Polices auto-hébergées : Archivo pour les titres, Pretendard pour le reste, y compris le hangeul. Le service worker met ces fichiers en cache avec le shell.

## CI

Le job `verify` lance le typecheck, les tests et le build. Le workflow Pages déploie ce build. Activer GitHub Pages (source : GitHub Actions) se fait dans les réglages du dépôt.
