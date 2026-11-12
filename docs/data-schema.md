# Schéma `songs.json`

Fichier unique à la racine du dépôt privé `pierre-claisse/norae-bang-data`. JSON UTF-8, non chiffré, lisible. L’application n’accepte que la version 1. Une clé inconnue ou absente est une erreur, sauf les exceptions décrites plus bas (`notes`, `artistLatin`, `units[].variant`). Les champs nullable sont présents et valent `null` : une chaîne vide est refusée.

L’API GitHub Contents ne renvoie pas un fichier de plus de 1 Mo. `songs.json` doit rester sous cette limite. Il n’y a pas de fichier par chanson.

## Racine

| Clé | Type | Règle |
| --- | --- | --- |
| `schemaVersion` | nombre | exactement `1` |
| `playlist` | objet | voir ci-dessous |
| `songs` | tableau | peut être vide |

## `playlist`

| Clé | Règle |
| --- | --- |
| `spotifyId` | exactement `47pICnNxleDOtiYrOcEeiM` |
| `name` | exactement `norae-bang` |

## `songs[]`

| Clé | Type | Règle |
| --- | --- | --- |
| `id` | chaîne | slug stable, unique : `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Ne change pas quand le titre est corrigé. |
| `spotifyTrackId` | chaîne ou `null` | `null`, ou 22 caractères `[A-Za-z0-9]` |
| `title` | chaîne | titre en hangeul, non vide |
| `titleFr` | chaîne ou `null` | titre français, non vide si présent |
| `artist` | chaîne | hangeul, non vide. Seul nom affiché, dans la liste et sur la fiche. Identifie le chanteur ou le groupe : le filtre de la liste s’appuie sur cette chaîne, sans nom latin |
| `year` | nombre ou `null` | `null`, ou entier de 1900 à 2100 |
| `lyricsStatus` | chaîne | `missing`, `draft` ou `verified` |
| `lines` | tableau | voir ci-dessous, peut être vide, dans l’ordre chanté |
| `units` | tableau | voir ci-dessous, peut être vide |
| `sources` | tableau | voir ci-dessous, peut être vide |
| `context` | chaîne ou `null` | phrase courte, 140 caractères au plus. Non vide si présente |
| `sourcesNote` | chaîne ou `null` | remarques de vérification. Non vide si présente |
| `notes` | chaîne ou `null`, clé optionnelle | déprécié. Voir ci-dessous |

`context` et `sourcesNote` sont les champs courants. Ils sont présents et valent `null` quand il n’y a rien à dire. `notes` peut être absent. S’il est présent, le validateur accepte la chanson et émet un avertissement de dépréciation (`clé dépréciée, utiliser context et sourcesNote`). Si `context` et `sourcesNote` sont tous les deux absents, `notes` suffit et les deux nouveaux champs valent `null`. S’il manque les trois, la validation échoue.

Ce remplacement ne change pas `schemaVersion` : ce n’est pas un corpus publié.

Affichage : `context` suit le titre coréen, le titre français, puis l’artiste et l’année, en entier. `sourcesNote` est montré en bas, dans la section « Sources », en texte secondaire, avec les liens `sources`. La section n’apparaît que si `sourcesNote`, `sources` ou un `notes` encore affiché a un contenu. Si `context` et `sourcesNote` sont vides et que `notes` a un texte, ce texte est affiché dans « Sources ».

`artistLatin` n’est plus un champ. S’il est encore présent, le validateur l’ignore et émet un avertissement de dépréciation (`clé dépréciée, ignorée`), sans échouer. L’artiste s’affiche en hangeul seul.

Il n’y a pas de romanisation. Le site n’en affiche pas et n’en produit pas.

## `lines[]`

| Clé | Type | Règle |
| --- | --- | --- |
| `id` | chaîne | stable, unique dans la chanson, non vide |
| `stanza` | nombre | entier ≥ 1. Le premier vers est le couplet 1. Ensuite le numéro reste égal ou augmente d’exactement 1 |
| `ko` | chaîne | hangeul, non vide |

## `units[]`

Une unité de sens couvre une suite de lignes consécutives, parfois à cheval sur deux couplets. Le français est préparé à l’avance : le site ne traduit rien.

| Clé | Type | Règle |
| --- | --- | --- |
| `from` | chaîne | `id` de la première ligne de l’unité |
| `to` | chaîne | `id` de la dernière ligne. `from` est avant ou égal à `to` dans l’ordre chanté |
| `fr` | chaîne | traduction française, non vide |
| `note` | chaîne ou `null` | jeu de mots, niveau de politesse, référence. Non vide si présente |
| `variant` | chaîne, `null`, ou absente | variante de texte entre éditions, qui change ce qu’on chante. L’absence équivaut à `null`. Chaîne vide refusée. Non vide si présente |

Un tableau `units` vide est valide : la chanson n’a pas de traduction, et l’écran ne propose pas d’en créer une. S’il y a des unités, elles sont dans l’ordre chanté, ne se chevauchent pas, n’ont pas de trou, et couvrent toutes les lignes.

`variant` est facultative. `null` et l’absence de la clé sont acceptés : pas de variante. Une chaîne vide, ou faite seulement d’espaces, est refusée. Quand le texte est présent, il s’affiche sous l’unité, après la note de sens, préfixé « Variante : ».

Exemple factice d’une unité qui commence au couplet 1 et finit au couplet 2 :

```json
{
  "lines": [
    { "id": "a", "stanza": 1, "ko": "라라 가가" },
    { "id": "b", "stanza": 2, "ko": "나나 다다" }
  ],
  "units": [
    { "from": "a", "to": "b", "fr": "Unité inventée à cheval sur deux couplets.", "note": null }
  ]
}
```

## `sources[]`

| Clé | Type | Règle |
| --- | --- | --- |
| `label` | chaîne | non vide |
| `url` | chaîne | URL absolue `http` ou `https` |

## Statut des paroles

- `missing` : rien n’est affiché comme paroles. L’écran dit qu’elles ne sont pas encore disponibles, même si `lines` n’est pas vide.
- `draft` : les lignes sont affichées avec un avertissement de brouillon. Un tableau vide donne le message « aucune ligne ».
- `verified` : les lignes sont affichées. Si `units` est vide, seul le hangeul est montré. Un tableau de lignes vide donne le message « aucune ligne ».

## Exemple minimal valide

```json
{
  "schemaVersion": 1,
  "playlist": {
    "spotifyId": "47pICnNxleDOtiYrOcEeiM",
    "name": "norae-bang"
  },
  "songs": []
}
```

Les tests utilisent une fixture inventée (`tests/fixtures/catalog.json`, titre français « Chanson exemple »). Elle n’est pas embarquée dans le site. Les paroles réelles restent dans le dépôt privé.
