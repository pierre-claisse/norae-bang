import type { Song } from "./schema";

export function filterSongs(songs: readonly Song[], query: string): Song[] {
  const needle = fold(query.trim());
  if (!needle) return [...songs];
  return songs.filter((song) => haystack(song).includes(needle));
}

function haystack(song: Song): string {
  return fold(
    [song.title, song.titleRomanized, song.titleFr, song.artist, song.artistRomanized].filter(Boolean).join(" "),
  );
}

function fold(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
