# norae-bang

PWA de lecture : répertoire de chansons coréennes, paroles vérifiées, traduction française.

Les paroles ne sont pas dans ce dépôt. Au premier lancement, collez un jeton GitHub fine-grained (lecture **Contents**, dépôt `pierre-claisse/norae-bang-data` uniquement). Il reste dans le navigateur. Sans jeton, seul l’écran de connexion s’affiche.

```bash
npm ci
npm run dev
```

Ouvrir `http://localhost:5173/norae-bang/`. Vérification : `npm run typecheck`, `npm test`, `npm run build`.

Publication : GitHub Pages, base `/norae-bang/` (workflow Pages). L’activation dans les réglages du dépôt demande un droit administrateur.
