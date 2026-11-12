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
  "titleFr",
  "artist",
  "year",
  "lyricsStatus",
  "lines",
  "units",
  "sources",
  "context",
  "sourcesNote",
  "notes",
] as const;
const LINE_KEYS = ["id", "stanza", "ko"] as const;
const UNIT_KEYS = ["from", "to", "fr", "note"] as const;
const SOURCE_KEYS = ["label", "url"] as const;

export type LyricLine = {
  id: string;
  stanza: number;
  ko: string;
};

export type LyricUnit = {
  from: string;
  to: string;
  fr: string;
  note: string | null;
};

export type Source = {
  label: string;
  url: string;
};

export type Song = {
  id: string;
  spotifyTrackId: string | null;
  title: string;
  titleFr: string | null;
  artist: string;
  year: number | null;
  lyricsStatus: LyricsStatus;
  lines: LyricLine[];
  units: LyricUnit[];
  sources: Source[];
  context: string | null;
  sourcesNote: string | null;
  notes?: string | null;
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

const CONTEXT_MAX_LENGTH = 200;

export type CatalogRead = {
  catalog: Catalog;
  warnings: readonly string[];
};

export function parseCatalog(input: unknown): Catalog {
  const read = readCatalog(input);
  for (const warning of read.warnings) console.warn(warning);
  return read.catalog;
}

export function readCatalog(input: unknown): CatalogRead {
  if (!isRecord(input)) {
    throw new CatalogValidationError(["racine : un objet est attendu."]);
  }

  const issues: string[] = [];
  const warnings: string[] = [];
  rejectUnknown(input, ROOT_KEYS, "racine", issues);

  if (!Object.prototype.hasOwnProperty.call(input, "schemaVersion")) {
    issues.push("racine.schemaVersion : clé absente.");
  } else if (input.schemaVersion !== 1) {
    issues.push("racine.schemaVersion : la valeur doit être le nombre 1.");
  }

  const playlist = parsePlaylist(take(input, "playlist", "racine", issues), issues);
  const songs = parseSongs(take(input, "songs", "racine", issues), issues, warnings);

  if (!playlist || !songs || issues.length > 0) {
    throw new CatalogValidationError(issues.length > 0 ? issues : ["racine : catalogue illisible."]);
  }

  return {
    catalog: {
      schemaVersion: 1,
      playlist,
      songs,
    },
    warnings,
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

function parseSongs(value: unknown, issues: string[], warnings: string[]): Song[] | null {
  if (value === undefined) return null;
  if (!Array.isArray(value)) {
    issues.push("songs : un tableau est attendu.");
    return null;
  }
  const ids = new Set<string>();
  const songs: Song[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const song = parseSong(value[index], index, ids, issues, warnings);
    if (song) songs.push(song);
  }
  return songs;
}

function parseSong(value: unknown, index: number, ids: Set<string>, issues: string[], warnings: string[]): Song | null {
  const path = `songs[${index}]`;
  if (!isRecord(value)) {
    issues.push(`${path} : un objet est attendu.`);
    return null;
  }
  const before = issues.length;
  rejectUnknown(value, SONG_KEYS, path, issues, warnings, DEPRECATED_SONG_KEYS);

  const id = parseSlug(take(value, "id", path, issues), `${path}.id`, issues);
  if (id) {
    if (ids.has(id)) issues.push(`${path}.id : identifiant déjà utilisé (${id}).`);
    ids.add(id);
  }

  const spotifyTrackId = parseSpotifyTrackId(take(value, "spotifyTrackId", path, issues), `${path}.spotifyTrackId`, issues);
  const title = parseRequiredText(take(value, "title", path, issues), `${path}.title`, issues);
  const titleFr = parseNullableText(take(value, "titleFr", path, issues), `${path}.titleFr`, issues);
  const artist = parseRequiredText(take(value, "artist", path, issues), `${path}.artist`, issues);
  const year = parseYear(take(value, "year", path, issues), `${path}.year`, issues);
  const lyricsStatus = parseLyricsStatus(take(value, "lyricsStatus", path, issues), `${path}.lyricsStatus`, issues);
  const parsedLines = parseLines(take(value, "lines", path, issues), `${path}.lines`, issues);
  const units = parseUnits(take(value, "units", path, issues), `${path}.units`, issues);
  const sources = parseSources(take(value, "sources", path, issues), `${path}.sources`, issues);
  const prose = parseSongProse(value, path, issues, warnings);

  if (parsedLines && units && issues.length === before) {
    checkUnits(parsedLines.lines, units, `${path}.units`, issues);
  }

  if (
    issues.length !== before ||
    !id ||
    spotifyTrackId === undefined ||
    !title ||
    titleFr === undefined ||
    !artist ||
    year === undefined ||
    !lyricsStatus ||
    !parsedLines ||
    !units ||
    !sources ||
    !prose
  ) {
    return null;
  }

  return {
    id,
    spotifyTrackId,
    title,
    titleFr,
    artist,
    year,
    lyricsStatus,
    lines: parsedLines.lines,
    units,
    sources,
    context: prose.context,
    sourcesNote: prose.sourcesNote,
    ...(prose.notes !== undefined ? { notes: prose.notes } : {}),
  };
}

function parseSongProse(
  value: Record<string, unknown>,
  path: string,
  issues: string[],
  warnings: string[],
): { context: string | null; sourcesNote: string | null; notes?: string | null } | null {
  const hasContext = Object.prototype.hasOwnProperty.call(value, "context");
  const hasSourcesNote = Object.prototype.hasOwnProperty.call(value, "sourcesNote");
  const hasNotes = Object.prototype.hasOwnProperty.call(value, "notes");
  let context: string | null | undefined;
  let sourcesNote: string | null | undefined;
  let notes: string | null | undefined;

  if (!hasContext && !hasSourcesNote) {
    if (!hasNotes) {
      issues.push(`${path}.context : clé absente.`);
      issues.push(`${path}.sourcesNote : clé absente.`);
    } else {
      notes = parseNullableText(value.notes, `${path}.notes`, issues);
      context = null;
      sourcesNote = null;
      if (notes !== undefined) warnings.push(notesDeprecation(path));
    }
  } else {
    context = parseContext(take(value, "context", path, issues), `${path}.context`, issues);
    sourcesNote = parseNullableText(take(value, "sourcesNote", path, issues), `${path}.sourcesNote`, issues);
    if (hasNotes) {
      notes = parseNullableText(value.notes, `${path}.notes`, issues);
      if (notes !== undefined) warnings.push(notesDeprecation(path));
    }
  }

  if (context === undefined || sourcesNote === undefined || (hasNotes && notes === undefined)) return null;
  return hasNotes ? { context, sourcesNote, notes } : { context, sourcesNote };
}

function notesDeprecation(path: string): string {
  return `${path}.notes : clé dépréciée, utiliser context et sourcesNote.`;
}

function parseContext(value: unknown, path: string, issues: string[]): string | null | undefined {
  const text = parseNullableText(value, path, issues);
  if (typeof text === "string" && [...text].length > CONTEXT_MAX_LENGTH) {
    issues.push(`${path} : 200 caractères au plus.`);
    return undefined;
  }
  return text;
}

function parseLines(value: unknown, path: string, issues: string[]): { lines: LyricLine[] } | null {
  if (value === undefined) return null;
  if (!Array.isArray(value)) {
    issues.push(`${path} : un tableau est attendu.`);
    return null;
  }
  const before = issues.length;
  const lines: LyricLine[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < value.length; index += 1) {
    const line = parseLine(value[index], `${path}[${index}]`, issues);
    if (!line) continue;
    if (seen.has(line.id)) issues.push(`${path}[${index}].id : identifiant déjà utilisé (${line.id}).`);
    seen.add(line.id);
    if (lines.length === 0 && line.stanza !== 1) {
      issues.push(`${path}[${index}].stanza : le premier couplet doit être 1.`);
    } else if (lines.length > 0) {
      const previous = lines[lines.length - 1]?.stanza ?? line.stanza;
      if (line.stanza < previous) {
        issues.push(`${path}[${index}].stanza : le numéro de couplet doit être croissant.`);
      } else if (line.stanza > previous + 1) {
        issues.push(`${path}[${index}].stanza : le numéro de couplet doit augmenter d’un seul cran.`);
      }
    }
    lines.push(line);
  }
  if (issues.length !== before) return null;
  return { lines };
}

function parseLine(value: unknown, path: string, issues: string[]): LyricLine | null {
  if (!isRecord(value)) {
    issues.push(`${path} : un objet est attendu.`);
    return null;
  }
  const before = issues.length;
  rejectUnknown(value, LINE_KEYS, path, issues);
  const id = parseRequiredText(take(value, "id", path, issues), `${path}.id`, issues);
  const stanza = parseStanza(take(value, "stanza", path, issues), `${path}.stanza`, issues);
  const ko = parseRequiredText(take(value, "ko", path, issues), `${path}.ko`, issues);
  if (issues.length !== before || !id || stanza === undefined || !ko) return null;
  return { id, stanza, ko };
}

function parseUnits(value: unknown, path: string, issues: string[]): LyricUnit[] | null {
  if (value === undefined) return null;
  if (!Array.isArray(value)) {
    issues.push(`${path} : un tableau est attendu.`);
    return null;
  }
  const before = issues.length;
  const units: LyricUnit[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const unit = parseUnit(value[index], `${path}[${index}]`, issues);
    if (unit) units.push(unit);
  }
  if (issues.length !== before) return null;
  return units;
}

function parseUnit(value: unknown, path: string, issues: string[]): LyricUnit | null {
  if (!isRecord(value)) {
    issues.push(`${path} : un objet est attendu.`);
    return null;
  }
  const before = issues.length;
  rejectUnknown(value, UNIT_KEYS, path, issues);
  const from = parseRequiredText(take(value, "from", path, issues), `${path}.from`, issues);
  const to = parseRequiredText(take(value, "to", path, issues), `${path}.to`, issues);
  const fr = parseRequiredText(take(value, "fr", path, issues), `${path}.fr`, issues);
  const note = parseNullableText(take(value, "note", path, issues), `${path}.note`, issues);
  if (issues.length !== before || !from || !to || !fr || note === undefined) return null;
  return { from, to, fr, note };
}

function checkUnits(lines: readonly LyricLine[], units: readonly LyricUnit[], path: string, issues: string[]) {
  if (units.length === 0) return;
  const indexById = new Map(lines.map((line, index) => [line.id, index]));
  const spans: Array<{ from: number; to: number }> = [];
  units.forEach((unit, index) => {
    const from = indexById.get(unit.from);
    const to = indexById.get(unit.to);
    if (from === undefined) issues.push(`${path}[${index}].from : identifiant de ligne inconnu (${unit.from}).`);
    if (to === undefined) issues.push(`${path}[${index}].to : identifiant de ligne inconnu (${unit.to}).`);
    if (from !== undefined && to !== undefined && from > to) {
      issues.push(`${path}[${index}] : from est après to (ordre inversé).`);
    }
    if (from !== undefined && to !== undefined && from <= to) spans.push({ from, to });
  });
  if (spans.length !== units.length) return;

  for (let index = 1; index < spans.length; index += 1) {
    const current = spans[index];
    const previous = spans[index - 1];
    if (!current || !previous) continue;
    if (current.from < previous.from) {
      issues.push(`${path}[${index}] : les unités ne sont pas dans l’ordre chanté.`);
    }
  }

  const first = spans[0];
  if (first && first.from !== 0) {
    issues.push(`${path} : trou avant la première unité. Les unités ne couvrent pas toutes les lignes.`);
  }
  for (let index = 1; index < spans.length; index += 1) {
    const current = spans[index];
    const previous = spans[index - 1];
    if (!current || !previous) continue;
    if (current.from <= previous.to) {
      issues.push(`${path}[${index}] : cette unité chevauche la précédente.`);
    } else if (current.from > previous.to + 1) {
      issues.push(`${path}[${index}] : trou entre cette unité et la précédente.`);
    }
  }
  const last = spans[spans.length - 1];
  if (last && last.to !== lines.length - 1) {
    issues.push(`${path} : les unités ne couvrent pas toutes les lignes.`);
  }
}

function parseStanza(value: unknown, path: string, issues: string[]): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    issues.push(`${path} : un entier supérieur ou égal à 1 est attendu.`);
    return undefined;
  }
  return value;
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

const DEPRECATED_SONG_KEYS = ["artistLatin"] as const;

function rejectUnknown(
  record: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: string[],
  warnings?: string[],
  deprecated: readonly string[] = [],
) {
  for (const key of Object.keys(record)) {
    if (allowed.includes(key)) continue;
    if (deprecated.includes(key)) {
      warnings?.push(`${path}.${key} : clé dépréciée, ignorée.`);
      continue;
    }
    issues.push(`${path}.${key} : clé inconnue.`);
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
