import type { Song } from "./schema";

export const SONG_SORTS = ["titre", "titre-desc", "artiste", "artiste-desc", "annee", "annee-desc"] as const;
export type SongSort = (typeof SONG_SORTS)[number];
export type SortKey = "titre" | "artiste" | "annee";
export type SortDirection = "asc" | "desc";

export const UNKNOWN_YEAR_LABEL = "Année inconnue";

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
  lang?: "ko" | "fr";
  songs: Song[];
};

export function titleInitial(title: string): string {
  const code = title.codePointAt(0);
  if (code === undefined || code < 0xac00 || code > 0xd7a3) return "#";
  const index = Math.floor((code - 0xac00) / 588);
  return CHOSEONG[index] ?? "#";
}

export function sortKey(sort: SongSort): SortKey {
  switch (sort) {
    case "titre":
    case "titre-desc":
      return "titre";
    case "artiste":
    case "artiste-desc":
      return "artiste";
    case "annee":
    case "annee-desc":
      return "annee";
    default: {
      const unexpected: never = sort;
      return unexpected;
    }
  }
}

export function sortDirection(sort: SongSort): SortDirection {
  switch (sort) {
    case "titre":
    case "artiste":
    case "annee":
      return "asc";
    case "titre-desc":
    case "artiste-desc":
    case "annee-desc":
      return "desc";
    default: {
      const unexpected: never = sort;
      return unexpected;
    }
  }
}

export function nextSort(current: SongSort, key: SortKey): SongSort {
  if (sortKey(current) !== key || sortDirection(current) === "desc") return ascending(key);
  return descending(key);
}

export function groupSongs(songs: readonly Song[], sort: SongSort): SongSection[] {
  const direction = sortDirection(sort);
  const key = sortKey(sort);
  switch (key) {
    case "titre":
      return groupByInitial(songs, direction);
    case "artiste":
      return groupByArtist(songs, direction);
    case "annee":
      return groupByDecade(songs, direction);
    default: {
      const unexpected: never = key;
      return unexpected;
    }
  }
}

function groupByInitial(songs: readonly Song[], direction: SortDirection): SongSection[] {
  const buckets = new Map<string, Song[]>();
  for (const song of [...songs].sort((a, b) => byTitle(a, b, direction))) {
    const label = titleInitial(song.title);
    const list = buckets.get(label);
    if (list) list.push(song);
    else buckets.set(label, [song]);
  }
  const letters = SECTION_ORDER.filter((label) => label !== "#" && buckets.has(label));
  const ordered = direction === "asc" ? letters : [...letters].reverse();
  const labels = buckets.has("#") ? [...ordered, "#"] : ordered;
  return labels.map((label) => ({
    id: label,
    label,
    ...(label === "#" ? {} : { lang: "ko" as const }),
    songs: buckets.get(label) ?? [],
  }));
}

function groupByArtist(songs: readonly Song[], direction: SortDirection): SongSection[] {
  const buckets = new Map<string, Song[]>();
  for (const song of songs) {
    const list = buckets.get(song.artist);
    if (list) list.push(song);
    else buckets.set(song.artist, [song]);
  }
  const names = [...buckets.keys()].sort((a, b) => a.localeCompare(b, "ko"));
  const ordered = direction === "asc" ? names : [...names].reverse();
  return ordered.map((artist) => ({
    id: artist,
    label: artist,
    lang: "ko" as const,
    songs: [...(buckets.get(artist) ?? [])].sort((a, b) => byTitle(a, b, "asc")),
  }));
}

function groupByDecade(songs: readonly Song[], direction: SortDirection): SongSection[] {
  const buckets = new Map<number, Song[]>();
  const unknown: Song[] = [];
  for (const song of songs) {
    if (song.year === null) {
      unknown.push(song);
      continue;
    }
    const decade = Math.floor(song.year / 10) * 10;
    const list = buckets.get(decade);
    if (list) list.push(song);
    else buckets.set(decade, [song]);
  }
  const decades = [...buckets.keys()].sort((a, b) => a - b);
  const ordered = direction === "asc" ? decades : [...decades].reverse();
  const sections: SongSection[] = ordered.map((decade) => ({
    id: `annees-${decade}`,
    label: `années ${decade}`,
    lang: "fr" as const,
    songs: [...(buckets.get(decade) ?? [])].sort((a, b) => byYearThenTitle(a, b, direction)),
  }));
  if (unknown.length > 0) {
    sections.push({
      id: "annee-inconnue",
      label: UNKNOWN_YEAR_LABEL,
      lang: "fr",
      songs: [...unknown].sort((a, b) => byTitle(a, b, "asc")),
    });
  }
  return sections;
}

function ascending(key: SortKey): SongSort {
  switch (key) {
    case "titre":
      return "titre";
    case "artiste":
      return "artiste";
    case "annee":
      return "annee";
    default: {
      const unexpected: never = key;
      return unexpected;
    }
  }
}

function descending(key: SortKey): SongSort {
  switch (key) {
    case "titre":
      return "titre-desc";
    case "artiste":
      return "artiste-desc";
    case "annee":
      return "annee-desc";
    default: {
      const unexpected: never = key;
      return unexpected;
    }
  }
}

function byYearThenTitle(a: Song, b: Song, direction: SortDirection): number {
  const yearA = a.year ?? 0;
  const yearB = b.year ?? 0;
  if (yearA !== yearB) return direction === "asc" ? yearA - yearB : yearB - yearA;
  return byTitle(a, b, "asc");
}

function byTitle(a: Song, b: Song, direction: SortDirection): number {
  const title = a.title.localeCompare(b.title, "ko");
  if (title !== 0) return direction === "asc" ? title : -title;
  return a.id.localeCompare(b.id, "ko");
}
