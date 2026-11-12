import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { LyricLine, Song } from "../domain/schema";
import { statusLabel } from "../domain/status";
import { readShowFlag, SHOW_ROMANIZATION_KEY, SHOW_TRANSLATION_KEY, writeShowFlag } from "./lyricPrefs";
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
      <div className="song-title-row">
        <h1 lang="ko">{song.title}</h1>
        <span className="badge" data-status={song.lyricsStatus}>
          {statusLabel(song.lyricsStatus)}
        </span>
      </div>
      {song.titleRomanized ? <p className="romanized">{song.titleRomanized}</p> : null}
      {song.titleFr ? (
        <p className="title-fr" lang="fr">
          {song.titleFr}
        </p>
      ) : null}
      <p className="meta">
        <span lang="ko">{song.artist}</span>
        {song.artistRomanized ? <span> ({song.artistRomanized})</span> : null}
        {song.year !== null ? <span> · {song.year}</span> : null}
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
  const [romanization, setRomanization] = useState(() => readShowFlag(SHOW_ROMANIZATION_KEY));
  const [translation, setTranslation] = useState(() => readShowFlag(SHOW_TRANSLATION_KEY));
  const columns = columnKey(romanization, translation);

  function toggleRomanization() {
    setRomanization((value) => {
      const next = !value;
      writeShowFlag(SHOW_ROMANIZATION_KEY, next);
      return next;
    });
  }

  function toggleTranslation() {
    setTranslation((value) => {
      const next = !value;
      writeShowFlag(SHOW_TRANSLATION_KEY, next);
      return next;
    });
  }

  return (
    <>
      <div className="lyric-toggles" role="group" aria-label="Affichage des paroles">
        <button type="button" className="toggle" aria-pressed={romanization} onClick={toggleRomanization}>
          Romanisation
        </button>
        <button type="button" className="toggle" aria-pressed={translation} onClick={toggleTranslation}>
          Traduction
        </button>
      </div>
      <div className="lyrics" data-columns={columns}>
        <div className="lyric-head">
          <span>Coréen</span>
          {romanization ? <span>Romanisation</span> : null}
          {translation ? <span lang="fr">Français</span> : null}
        </div>
        {lines.map((line, index) => (
          <div className="lyric-line" key={`${line.ko}-${index}`}>
            <span className="lyric-cell lyric-ko" lang="ko">
              {line.ko}
            </span>
            {romanization ? (
              <span className="lyric-cell lyric-romanized">
                <OptionalText value={line.romanized} />
              </span>
            ) : null}
            {translation ? (
              <span className="lyric-cell lyric-fr" lang="fr">
                <OptionalText value={line.fr} />
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </>
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
type ColumnKey = "all" | "ko-ro" | "ko-fr" | "ko";

function columnKey(romanization: boolean, translation: boolean): ColumnKey {
  if (romanization && translation) return "all";
  if (romanization) return "ko-ro";
  if (translation) return "ko-fr";
  return "ko";
}

function lyricView(song: Song): LyricView {
  if (song.lyricsStatus === "missing") return "missing";
  if (song.lines.length === 0) return "empty";
  return "lyrics";
}
