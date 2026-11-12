import { Link, useParams } from "react-router-dom";
import type { LyricLine, LyricUnit, Song } from "../domain/schema";
import { statusLabel } from "../domain/status";
import { useDocumentTitle } from "./useDocumentTitle";

export function SongPage({ songs }: { songs: readonly Song[] }) {
  const { songId } = useParams();
  const song = songs.find((item) => item.id === songId);
  useDocumentTitle(song ? `${song.titleFr ?? song.title} · norae-bang` : "Chanson introuvable · norae-bang");
  if (!song) {
    return (
      <>
        <BackLink />
        <h1>Cette chanson n’est pas dans le répertoire.</h1>
      </>
    );
  }
  return <SongDetail song={song} />;
}

function SongDetail({ song }: { song: Song }) {
  const view = lyricView(song);
  return (
    <article className="song">
      <BackLink />
      <header className="song-banner">
        <div className="song-title-row">
          <h1 lang="ko">{song.title}</h1>
          <span className="badge" data-status={song.lyricsStatus}>
            {statusLabel(song.lyricsStatus)}
          </span>
        </div>
        {song.titleFr ? (
          <p className="title-fr" lang="fr">
            {song.titleFr}
          </p>
        ) : null}
        <p className="meta">
          <span lang="ko">{song.artist}</span>
          {song.year !== null ? <span> · {song.year}</span> : null}
        </p>
        {song.context ? (
          <p className="song-context" lang="fr">
            {song.context}
          </p>
        ) : null}
      </header>
      <section className="lyrics-sheet" aria-labelledby="paroles">
        <h2 id="paroles">Paroles</h2>
        {song.lyricsStatus === "draft" && view === "lyrics" ? (
          <p className="banner">Brouillon : ces paroles n’ont pas encore été vérifiées.</p>
        ) : null}
        <LyricBody song={song} view={view} />
      </section>
      <Sources song={song} />
    </article>
  );
}

function Sources({ song }: { song: Song }) {
  const legacyNotes = song.context == null && song.sourcesNote == null ? (song.notes ?? null) : null;
  const note = song.sourcesNote ?? legacyNotes;
  if (!note && song.sources.length === 0) return null;
  return (
    <section className="sources" aria-labelledby="sources-titre">
      <h2 id="sources-titre">Sources</h2>
      {note ? <p className="sources-note">{note}</p> : null}
      {song.sources.length > 0 ? (
        <ul>
          {song.sources.map((source) => (
            <li key={`${source.label}-${source.url}`}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function BackLink() {
  return (
    <p>
      <Link className="back" to="/">
        <span aria-hidden="true">←</span>
        Retour au répertoire
      </Link>
    </p>
  );
}

function LyricBody({ song, view }: { song: Song; view: LyricView }) {
  switch (view) {
    case "lyrics":
      return song.units.length === 0 ? <PlainLines lines={song.lines} /> : <Units lines={song.lines} units={song.units} />;
    case "missing":
      return <p className="empty-lyrics">Les paroles de cette chanson ne sont pas encore disponibles.</p>;
    case "empty":
      return <p className="empty-lyrics">Cette fiche ne contient aucune ligne de paroles.</p>;
    default: {
      const unexpected: never = view;
      return unexpected;
    }
  }
}

function PlainLines({ lines }: { lines: readonly LyricLine[] }) {
  return <div className="plain-lyrics">{lineGroups(lines)}</div>;
}

function Units({ lines, units }: { lines: readonly LyricLine[]; units: readonly LyricUnit[] }) {
  const indexById = new Map(lines.map((line, index) => [line.id, index]));
  return (
    <div className="units">
      {units.map((unit) => {
        const start = indexById.get(unit.from) ?? 0;
        const end = indexById.get(unit.to) ?? start;
        const slice = lines.slice(start, end + 1);
        return (
          <article className="unit" key={`${unit.from}-${unit.to}`}>
            {lineGroups(slice)}
            <div className="unit-fr" lang="fr">
              <p>{unit.fr}</p>
              {unit.note ? <p className="unit-note">Note : {unit.note}</p> : null}
              {unit.variant ? <p className="unit-variant">Variante : {unit.variant}</p> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function lineGroups(lines: readonly LyricLine[]) {
  const groups: LyricLine[][] = [];
  for (const line of lines) {
    const current = groups[groups.length - 1];
    if (!current || current[0]?.stanza !== line.stanza) groups.push([line]);
    else current.push(line);
  }
  return (
    <div className="unit-lines">
      {groups.flatMap((group, index) => {
        const stanza = (
          <div className="stanza" key={group[0]?.id}>
            {group.map((line) => (
              <p className="lyric-ko" lang="ko" key={line.id}>
                {line.ko}
              </p>
            ))}
          </div>
        );
        if (index === 0 || !group[0]) return [stanza];
        return [
          <span className="stanza-mark" aria-hidden="true" key={`couplet-${group[0].id}`} />,
          stanza,
        ];
      })}
    </div>
  );
}

type LyricView = "lyrics" | "missing" | "empty";

function lyricView(song: Song): LyricView {
  if (song.lyricsStatus === "missing") return "missing";
  if (song.lines.length === 0) return "empty";
  return "lyrics";
}
