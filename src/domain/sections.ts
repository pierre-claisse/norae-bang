import type { Song } from "./schema";

export const SONG_SORTS = ["titre", "artiste"] as const;
export type SongSort = (typeof SONG_SORTS)[number];

const CHOSEONG = [
  "ㄱ",
  "ㄱ",
  "ㄴ",
  "ㄷ",
  "ㄷ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅂ",
  "ㅅ",
  "ㅅ",
  "ㅇ",
  "ㅈ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
] as const;

const SECTION_ORDER = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ", "#"] as const;

export type SongSection = {
  id: string;
  label: string;
  songs: Song[];
};

export function titleInitial(title: string): string {
  const code = title.codePointAt(0);
  if (code === undefined || code < 0xac00 || code > 0xd7a3) return "#";
  const index = Math.floor((code - 0xac00) / 588);
  return CHOSEONG[index] ?? "#";
}

export function groupSongs(songs: readonly Song[], sort: SongSort): SongSection[] {
  switch (sort) {
    case "titre":
      return groupByInitial(songs);
    case "artiste":
      return groupByArtist(songs);
    default: {
      const unexpected: never = sort;
      return unexpected;
    }
  }
}

function groupByInitial(songs: readonly Song[]): SongSection[] {
  const buckets = new Map<string, Song[]>();
  for (const song of [...songs].sort(byTitle)) {
    const label = titleInitial(song.title);
    const list = buckets.get(label);
    if (list) list.push(song);
    else buckets.set(label, [song]);
  }
  return SECTION_ORDER.filter((label) => buckets.has(label)).map((label) => ({
    id: label,
    label,
    songs: buckets.get(label) ?? [],
  }));
}

function groupByArtist(songs: readonly Song[]): SongSection[] {
  const buckets = new Map<string, Song[]>();
  for (const song of songs) {
    const list = buckets.get(song.artist);
    if (list) list.push(song);
    else buckets.set(song.artist, [song]);
  }
  return [...buckets.keys()].sort((a, b) => a.localeCompare(b, "ko")).map((artist) => ({
    id: artist,
    label: artist,
    songs: [...(buckets.get(artist) ?? [])].sort(byTitle),
  }));
}

function byTitle(a: Song, b: Song): number {
  return a.title.localeCompare(b.title, "ko") || a.id.localeCompare(b.id, "ko");
}
