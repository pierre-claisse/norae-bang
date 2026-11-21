import type { Song } from "./schema";
import type { SongSort } from "./sections";

export type { SongSort } from "./sections";

export type ListQuery = {
  q: string;
  tri: SongSort;
  artiste: string | null;
};

export type ArtistChoice = {
  name: string;
  count: number;
};

export function artistChoices(songs: readonly Song[]): ArtistChoice[] {
  const counts = new Map<string, number>();
  for (const song of songs) {
    counts.set(song.artist, (counts.get(song.artist) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export function filterSongs(songs: readonly Song[], query: string, artist: string | null = null): Song[] {
  const scoped = artist ? songs.filter((song) => song.artist === artist) : songs;
  const needle = fold(query.trim());
  if (!needle) return [...scoped];
  return scoped.filter((song) => haystack(song).includes(needle));
}

export function parseSort(value: string | null): SongSort {
  switch (value) {
    case "titre-desc":
    case "artiste":
    case "artiste-desc":
    case "annee":
    case "annee-desc":
      return value;
    case "titre":
    case null:
      return "titre";
    default:
      return "titre";
  }
}

export function listQueryFromParams(params: URLSearchParams): ListQuery {
  const artist = params.get("artiste");
  return {
    q: params.get("q") ?? "",
    tri: parseSort(params.get("tri")),
    artiste: artist && artist.trim() !== "" ? artist : null,
  };
}

export function listSearchParams(query: ListQuery): URLSearchParams {
  const params = new URLSearchParams();
  const q = query.q.trim();
  if (q) params.set("q", q);
  if (query.tri !== "titre") params.set("tri", query.tri);
  if (query.artiste) params.set("artiste", query.artiste);
  return params;
}

export function listPath(query: ListQuery): string {
  const text = listSearchParams(query).toString();
  return text ? `/?${text}` : "/";
}

export function songPath(songId: string, query: ListQuery): string {
  const text = listSearchParams(query).toString();
  return text ? `/chanson/${songId}?${text}` : `/chanson/${songId}`;
}

export function listScrollKey(pathname: string, query: ListQuery): string {
  const text = listSearchParams(query).toString();
  return text ? `${pathname}?${text}` : pathname;
}

export function artistListPath(artist: string | null): string {
  return listPath({ q: "", tri: "titre", artiste: artist });
}

function haystack(song: Song): string {
  return fold(
    [song.title, song.titleFr, song.artist].filter(Boolean).join(" "),
  );
}

function fold(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
