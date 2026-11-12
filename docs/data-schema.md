# Schéma `songs.json`

Fichier unique à la racine du dépôt privé `pierre-claisse/norae-bang-data`. JSON UTF-8, non chiffré, lisible. L’application n’accepte que la version 1. Une clé inconnue ou absente est une erreur. Les champs nullable sont présents et valent `null` : une chaîne vide est refusée.

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
| `titleRomanized` | chaîne ou `null` | romanisation, non vide si présente |
| `titleFr` | chaîne ou `null` | titre français, non vide si présent |
| `artist` | chaîne | non vide |
| `artistRomanized` | chaîne ou `null` | non vide si présente |
| `year` | nombre ou `null` | `null`, ou entier de 1900 à 2100 |
| `lyricsStatus` | chaîne | `missing`, `draft` ou `verified` |
| `lines` | tableau | voir ci-dessous, peut être vide |
| `sources` | tableau | voir ci-dessous, peut être vide |
| `notes` | chaîne ou `null` | non vide si présente |

## `lines[]`

| Clé | Type | Règle |
| --- | --- | --- |
| `ko` | chaîne | non vide |
| `romanized` | chaîne ou `null` | non vide si présente |
| `fr` | chaîne ou `null` | non vide si présente |

## `sources[]`

| Clé | Type | Règle |
| --- | --- | --- |
| `label` | chaîne | non vide |
| `url` | chaîne | URL absolue `http` ou `https` |

## Statut des paroles

- `missing` : rien n’est affiché comme paroles. L’écran dit qu’elles ne sont pas encore disponibles, même si `lines` n’est pas vide.
- `draft` : les lignes sont affichées avec un avertissement de brouillon. Un tableau vide donne le message « aucune ligne ».
- `verified` : les lignes sont affichées. Un tableau vide donne le même message « aucune ligne ».

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
