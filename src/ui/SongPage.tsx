import { Link, useParams } from "react-router-dom";
import type { LyricLine, Song } from "../domain/schema";
import { statusLabel } from "../domain/status";
import { useDocumentTitle } from "./useDocumentTitle";

export function SongPage({ songs }: { songs: readonly Song[] }) {
  const { songId } = useParams();
  const song = songs.find((item) => item.id === songId);
  useDocumentTitle(song ? `${song.titleFr ?? song.title} · norae-bang` : "Chanson introuvable · norae-bang");
  if (!song) {
    return (
      <>
        <p>
          <Link to="/">Retour au répertoire</Link>
        </p>
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
      <p>
        <Link to="/">Retour au répertoire</Link>
      </p>
      <h1 lang="ko">{song.title}</h1>
      {song.titleRomanized ? <p className="romanized">{song.titleRomanized}</p> : null}
      {song.titleFr ? <p className="title-fr">{song.titleFr}</p> : null}
      <p className="meta">
        <span lang="ko">{song.artist}</span>
        {song.artistRomanized ? <span> ({song.artistRomanized})</span> : null}
        {song.year !== null ? <span> · {song.year}</span> : null}
      </p>
      <p>
        <span className="badge" data-status={song.lyricsStatus}>
          {statusLabel(song.lyricsStatus)}
        </span>
      </p>
      {song.notes ? <p className="notes">{song.notes}</p> : null}
      <section aria-labelledby="paroles">
        <h2 id="paroles">Paroles</h2>
        {song.lyricsStatus === "draft" && view === "lyrics" ? (
          <p className="banner">Brouillon : ces paroles n’ont pas encore été vérifiées.</p>
        ) : null}
        <LyricBody song={song} view={view} />
      </section>
      <section className="sources" aria-labelledby="sources-titre">
        <h2 id="sources-titre">Sources</h2>
        {song.sources.length === 0 ? (
          <p>Aucune source indiquée.</p>
        ) : (
          <ul>
            {song.sources.map((source) => (
              <li key={`${source.label}-${source.url}`}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}

function LyricBody({ song, view }: { song: Song; view: LyricView }) {
  switch (view) {
    case "lyrics":
      return <Lyrics lines={song.lines} />;
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

function Lyrics({ lines }: { lines: readonly LyricLine[] }) {
  return (
    <div className="lyrics">
      <div className="lyric-head">
        <span>Coréen</span>
        <span>Romanisation</span>
        <span>Français</span>
      </div>
      {lines.map((line, index) => (
        <div className="lyric-line" key={`${line.ko}-${index}`}>
          <span className="lyric-cell lyric-ko" lang="ko">
            <span className="lyric-label">Coréen</span>
            {line.ko}
          </span>
          <span className="lyric-cell lyric-romanized">
            <span className="lyric-label">Romanisation</span>
            <OptionalText value={line.romanized} />
          </span>
          <span className="lyric-cell lyric-fr">
            <span className="lyric-label">Français</span>
            <OptionalText value={line.fr} />
          </span>
        </div>
      ))}
    </div>
  );
}

function OptionalText({ value }: { value: string | null }) {
  if (value) return value;
  return (
    <span className="missing-text">
      <span aria-hidden="true">—</span>
      <span className="sr-only">non renseigné</span>
    </span>
  );
}

type LyricView = "lyrics" | "missing" | "empty";

function lyricView(song: Song): LyricView {
  if (song.lyricsStatus === "missing") return "missing";
  if (song.lines.length === 0) return "empty";
  return "lyrics";
}
