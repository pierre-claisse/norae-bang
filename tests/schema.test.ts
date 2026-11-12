import { describe, expect, it } from "vitest";
import { CatalogValidationError, parseCatalog, type Catalog } from "../src/domain/schema";
import fixture from "./fixtures/catalog.json";

const catalog = fixture as Catalog;

describe("schéma songs.json", () => {
  it("accepte la fixture factice", () => {
    expect(parseCatalog(catalog)).toEqual(catalog);
  });

  it("refuse une racine qui n’est pas un objet", () => {
    expect(issues(null)).toEqual(["racine : un objet est attendu."]);
  });

  it("signale chaque écart sans accepter un catalogue partiel", () => {
    const input = structuredClone(catalog) as Catalog & { extra?: boolean };
    input.schemaVersion = 2 as unknown as 1;
    input.extra = true;
    input.songs[0]!.id = "Chanson exemple";
    const found = issues(input);
    expect(found.some((issue) => issue.includes("schemaVersion"))).toBe(true);
    expect(found.some((issue) => issue.includes("clé inconnue"))).toBe(true);
    expect(found.some((issue) => issue.includes("slug"))).toBe(true);
    expect(() => parseCatalog(input)).toThrow(CatalogValidationError);
  });

  const cases: Array<{ name: string; change: (copy: Catalog) => unknown; fragment: string }> = [
    {
      name: "refuse une version de schéma textuelle",
      change: (copy) => ({ ...copy, schemaVersion: "1" }),
      fragment: "nombre 1",
    },
    {
      name: "refuse un autre identifiant de playlist",
      change: (copy) => ({ ...copy, playlist: { ...copy.playlist, spotifyId: "0123456789abcdefghijkl" } }),
      fragment: "playlist.spotifyId",
    },
    {
      name: "refuse un autre nom de playlist",
      change: (copy) => ({ ...copy, playlist: { ...copy.playlist, name: "autre" } }),
      fragment: "playlist.name",
    },
    {
      name: "refuse une clé de chanson inconnue",
      change: (copy) => {
        const song = { ...copy.songs[0], paroles: "interdit" };
        return { ...copy, songs: [song] };
      },
      fragment: "clé inconnue",
    },
    {
      name: "refuse un identifiant dupliqué",
      change: (copy) => ({ ...copy, songs: [copy.songs[0], { ...copy.songs[1], id: copy.songs[0]!.id }] }),
      fragment: "déjà utilisé",
    },
    {
      name: "refuse un identifiant Spotify mal formé",
      change: (copy) => ({ ...copy, songs: [{ ...copy.songs[0], spotifyTrackId: "trop-court" }] }),
      fragment: "22 caractères",
    },
    {
      name: "refuse une chaîne vide à la place de null",
      change: (copy) => ({ ...copy, songs: [{ ...copy.songs[0], titleFr: "" }] }),
      fragment: "chaîne vide",
    },
    {
      name: "refuse un champ nullable omis",
      change: (copy) => {
        const song = { ...copy.songs[0] } as Partial<Catalog["songs"][number]>;
        delete song.notes;
        return { ...copy, songs: [song] };
      },
      fragment: "notes : clé absente",
    },
    {
      name: "refuse un statut inconnu",
      change: (copy) => ({ ...copy, songs: [{ ...copy.songs[0], lyricsStatus: "pret" }] }),
      fragment: "missing",
    },
    {
      name: "refuse une année hors limites",
      change: (copy) => ({ ...copy, songs: [{ ...copy.songs[0], year: 1899 }] }),
      fragment: "1900",
    },
    {
      name: "refuse une année textuelle",
      change: (copy) => ({ ...copy, songs: [{ ...copy.songs[0], year: "2020" }] }),
      fragment: "entier",
    },
    {
      name: "refuse une clé inconnue sur une ligne",
      change: (copy) => {
        const song = {
          ...copy.songs[0],
          lines: [{ ...copy.songs[0]!.lines[0], en: "no" }],
        };
        return { ...copy, songs: [song] };
      },
      fragment: "clé inconnue",
    },
    {
      name: "refuse une URL qui n’est pas http(s)",
      change: (copy) => ({
        ...copy,
        songs: [{ ...copy.songs[0], sources: [{ label: "Source exemple", url: "javascript:alert(1)" }] }],
      }),
      fragment: "URL http(s)",
    },
    {
      name: "refuse un tableau de chansons absent",
      change: (copy) => {
        const next = { ...copy } as Partial<Catalog>;
        delete next.songs;
        return next;
      },
      fragment: "songs : clé absente",
    },
  ];

  for (const item of cases) {
    it(item.name, () => {
      const copy = structuredClone(catalog);
      expect(issues(item.change(copy)).some((issue) => issue.includes(item.fragment))).toBe(true);
    });
  }

  it("accepte un identifiant Spotify et une URL http", () => {
    const copy = structuredClone(catalog);
    copy.songs = [
      {
        ...copy.songs[0]!,
        spotifyTrackId: "0123456789abcdefghijkl",
        sources: [{ label: "Source exemple", url: "http://example.com/source-exemple" }],
      },
    ];
    expect(parseCatalog(copy).songs[0]?.spotifyTrackId).toBe("0123456789abcdefghijkl");
  });
});

function issues(input: unknown): readonly string[] {
  try {
    parseCatalog(input);
  } catch (error) {
    expect(error).toBeInstanceOf(CatalogValidationError);
    return (error as CatalogValidationError).issues;
  }
  throw new Error("validation inattendue");
}
