export const PLAYLIST_SPOTIFY_ID = "47pICnNxleDOtiYrOcEeiM";
export const PLAYLIST_NAME = "norae-bang";

export const LYRICS_STATUSES = ["missing", "draft", "verified"] as const;
export type LyricsStatus = (typeof LYRICS_STATUSES)[number];

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SPOTIFY_TRACK_ID = /^[A-Za-z0-9]{22}$/;

const ROOT_KEYS = ["schemaVersion", "playlist", "songs"] as const;
const PLAYLIST_KEYS = ["spotifyId", "name"] as const;
const SONG_KEYS = [
  "id",
  "spotifyTrackId",
  "title",
  "titleRomanized",
  "titleFr",
  "artist",
  "artistRomanized",
  "year",
  "lyricsStatus",
  "lines",
  "sources",
  "notes",
] as const;
const LINE_KEYS = ["ko", "romanized", "fr"] as const;
const SOURCE_KEYS = ["label", "url"] as const;

export type LyricLine = {
  ko: string;
  romanized: string | null;
  fr: string | null;
};

export type Source = {
  label: string;
  url: string;
};

export type Song = {
  id: string;
  spotifyTrackId: string | null;
  title: string;
  titleRomanized: string | null;
  titleFr: string | null;
  artist: string;
  artistRomanized: string | null;
  year: number | null;
  lyricsStatus: LyricsStatus;
  lines: LyricLine[];
  sources: Source[];
  notes: string | null;
};

export type Catalog = {
  schemaVersion: 1;
  playlist: {
    spotifyId: typeof PLAYLIST_SPOTIFY_ID;
    name: typeof PLAYLIST_NAME;
  };
  songs: Song[];
};

export class CatalogValidationError extends Error {
  readonly name = "CatalogValidationError";

  constructor(readonly issues: readonly string[]) {
    super(issues.join("\n"));
  }
}

export function parseCatalog(input: unknown): Catalog {
  if (!isRecord(input)) {
    throw new CatalogValidationError(["racine : un objet est attendu."]);
  }

  const issues: string[] = [];
  rejectUnknown(input, ROOT_KEYS, "racine", issues);

  if (!Object.prototype.hasOwnProperty.call(input, "schemaVersion")) {
    issues.push("racine.schemaVersion : clé absente.");
  } else if (input.schemaVersion !== 1) {
    issues.push("racine.schemaVersion : la valeur doit être le nombre 1.");
  }

  const playlist = parsePlaylist(take(input, "playlist", "racine", issues), issues);
  const songs = parseSongs(take(input, "songs", "racine", issues), issues);

  if (!playlist || !songs || issues.length > 0) {
    throw new CatalogValidationError(issues.length > 0 ? issues : ["racine : catalogue illisible."]);
  }

  return {
    schemaVersion: 1,
    playlist,
    songs,
  };
}

function parsePlaylist(value: unknown, issues: string[]): Catalog["playlist"] | null {
  if (value === undefined) return null;
  if (!isRecord(value)) {
    issues.push("playlist : un objet est attendu.");
    return null;
  }
  rejectUnknown(value, PLAYLIST_KEYS, "playlist", issues);
  const hasSpotifyId = Object.prototype.hasOwnProperty.call(value, "spotifyId");
  const hasName = Object.prototype.hasOwnProperty.call(value, "name");
  const spotifyId = take(value, "spotifyId", "playlist", issues);
  const name = take(value, "name", "playlist", issues);
  if (hasSpotifyId && spotifyId !== PLAYLIST_SPOTIFY_ID) {
    issues.push(`playlist.spotifyId : valeur attendue « ${PLAYLIST_SPOTIFY_ID} ».`);
  }
  if (hasName && name !== PLAYLIST_NAME) {
    issues.push(`playlist.name : valeur attendue « ${PLAYLIST_NAME} ».`);
  }
  if (spotifyId !== PLAYLIST_SPOTIFY_ID || name !== PLAYLIST_NAME) return null;
  return { spotifyId: PLAYLIST_SPOTIFY_ID, name: PLAYLIST_NAME };
}

function parseSongs(value: unknown, issues: string[]): Song[] | null {
  if (value === undefined) return null;
  if (!Array.isArray(value)) {
    issues.push("songs : un tableau est attendu.");
    return null;
  }
  const ids = new Set<string>();
  const songs: Song[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const song = parseSong(value[index], index, ids, issues);
    if (song) songs.push(song);
  }
  return songs;
}

function parseSong(value: unknown, index: number, ids: Set<string>, issues: string[]): Song | null {
  const path = `songs[${index}]`;
  if (!isRecord(value)) {
    issues.push(`${path} : un objet est attendu.`);
    return null;
  }
  const before = issues.length;
  rejectUnknown(value, SONG_KEYS, path, issues);

  const id = parseSlug(take(value, "id", path, issues), `${path}.id`, issues);
  if (id) {
    if (ids.has(id)) issues.push(`${path}.id : identifiant déjà utilisé (${id}).`);
    ids.add(id);
  }

  const spotifyTrackId = parseSpotifyTrackId(take(value, "spotifyTrackId", path, issues), `${path}.spotifyTrackId`, issues);
  const title = parseRequiredText(take(value, "title", path, issues), `${path}.title`, issues);
  const titleRomanized = parseNullableText(take(value, "titleRomanized", path, issues), `${path}.titleRomanized`, issues);
  const titleFr = parseNullableText(take(value, "titleFr", path, issues), `${path}.titleFr`, issues);
  const artist = parseRequiredText(take(value, "artist", path, issues), `${path}.artist`, issues);
  const artistRomanized = parseNullableText(take(value, "artistRomanized", path, issues), `${path}.artistRomanized`, issues);
  const year = parseYear(take(value, "year", path, issues), `${path}.year`, issues);
  const lyricsStatus = parseLyricsStatus(take(value, "lyricsStatus", path, issues), `${path}.lyricsStatus`, issues);
  const lines = parseLines(take(value, "lines", path, issues), `${path}.lines`, issues);
  const sources = parseSources(take(value, "sources", path, issues), `${path}.sources`, issues);
  const notes = parseNullableText(take(value, "notes", path, issues), `${path}.notes`, issues);

  if (
    issues.length !== before ||
    !id ||
    spotifyTrackId === undefined ||
    !title ||
    titleRomanized === undefined ||
    titleFr === undefined ||
    !artist ||
    artistRomanized === undefined ||
    year === undefined ||
    !lyricsStatus ||
    !lines ||
    !sources ||
    notes === undefined
  ) {
    return null;
  }

  return {
    id,
    spotifyTrackId,
    title,
    titleRomanized,
    titleFr,
    artist,
    artistRomanized,
    year,
    lyricsStatus,
    lines,
    sources,
    notes,
  };
}

function parseLines(value: unknown, path: string, issues: string[]): LyricLine[] | null {
  if (value === undefined) return null;
  if (!Array.isArray(value)) {
    issues.push(`${path} : un tableau est attendu.`);
    return null;
  }
  const lines: LyricLine[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const line = parseLine(value[index], `${path}[${index}]`, issues);
    if (line) lines.push(line);
  }
  return lines;
}

function parseLine(value: unknown, path: string, issues: string[]): LyricLine | null {
  if (!isRecord(value)) {
    issues.push(`${path} : un objet est attendu.`);
    return null;
  }
  const before = issues.length;
  rejectUnknown(value, LINE_KEYS, path, issues);
  const ko = parseRequiredText(take(value, "ko", path, issues), `${path}.ko`, issues);
  const romanized = parseNullableText(take(value, "romanized", path, issues), `${path}.romanized`, issues);
  const fr = parseNullableText(take(value, "fr", path, issues), `${path}.fr`, issues);
  if (issues.length !== before || !ko || romanized === undefined || fr === undefined) return null;
  return { ko, romanized, fr };
}

function parseSources(value: unknown, path: string, issues: string[]): Source[] | null {
  if (value === undefined) return null;
  if (!Array.isArray(value)) {
    issues.push(`${path} : un tableau est attendu.`);
    return null;
  }
  const sources: Source[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const source = parseSource(value[index], `${path}[${index}]`, issues);
    if (source) sources.push(source);
  }
  return sources;
}

function parseSource(value: unknown, path: string, issues: string[]): Source | null {
  if (!isRecord(value)) {
    issues.push(`${path} : un objet est attendu.`);
    return null;
  }
  const before = issues.length;
  rejectUnknown(value, SOURCE_KEYS, path, issues);
  const label = parseRequiredText(take(value, "label", path, issues), `${path}.label`, issues);
  const url = parseUrl(take(value, "url", path, issues), `${path}.url`, issues);
  if (issues.length !== before || !label || !url) return null;
  return { label, url };
}

function parseSlug(value: unknown, path: string, issues: string[]): string | undefined {
  const text = parseRequiredText(value, path, issues);
  if (!text) return undefined;
  if (!SLUG.test(text)) {
    issues.push(`${path} : slug attendu (minuscules, chiffres et tirets).`);
    return undefined;
  }
  return text;
}

function parseSpotifyTrackId(value: unknown, path: string, issues: string[]): string | null | undefined {
  const text = parseNullableText(value, path, issues);
  if (text === undefined || text === null) return text;
  if (!SPOTIFY_TRACK_ID.test(text)) {
    issues.push(`${path} : identifiant Spotify de 22 caractères alphanumériques, ou null.`);
    return undefined;
  }
  return text;
}

function parseYear(value: unknown, path: string, issues: string[]): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1900 || value > 2100) {
    issues.push(`${path} : un entier entre 1900 et 2100, ou null.`);
    return undefined;
  }
  return value;
}

function parseLyricsStatus(value: unknown, path: string, issues: string[]): LyricsStatus | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !(LYRICS_STATUSES as readonly string[]).includes(value)) {
    issues.push(`${path} : « missing », « draft » ou « verified ».`);
    return undefined;
  }
  return value as LyricsStatus;
}

function parseUrl(value: unknown, path: string, issues: string[]): string | undefined {
  const text = parseRequiredText(value, path, issues);
  if (!text) return undefined;
  if (!isHttpUrl(text)) {
    issues.push(`${path} : une URL http(s) absolue est attendue.`);
    return undefined;
  }
  return text;
}

function parseRequiredText(value: unknown, path: string, issues: string[]): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") {
    issues.push(`${path} : une chaîne non vide est attendue.`);
    return undefined;
  }
  return value;
}

function parseNullableText(value: unknown, path: string, issues: string[]): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    issues.push(`${path} : une chaîne ou null est attendu.`);
    return undefined;
  }
  if (value.trim() === "") {
    issues.push(`${path} : chaîne vide interdite, utiliser null.`);
    return undefined;
  }
  return value;
}

function take(record: Record<string, unknown>, key: string, path: string, issues: string[]): unknown {
  if (!Object.prototype.hasOwnProperty.call(record, key)) {
    issues.push(`${path}.${key} : clé absente.`);
    return undefined;
  }
  return record[key];
}

function rejectUnknown(record: Record<string, unknown>, allowed: readonly string[], path: string, issues: string[]) {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) issues.push(`${path}.${key} : clé inconnue.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
