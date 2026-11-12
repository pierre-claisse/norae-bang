import type { Song } from "./schema";

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

export function artistQuery(artist: string | null): string {
  if (!artist) return "";
  return `?${new URLSearchParams({ artiste: artist }).toString()}`;
}

export function artistListPath(artist: string | null): string {
  const query = artistQuery(artist);
  return query ? `/${query}` : "/";
}

function haystack(song: Song): string {
  return fold(
    [song.title, song.titleFr, song.artist].filter(Boolean).join(" "),
  );
}

function fold(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
