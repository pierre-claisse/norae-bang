import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { filterSongs } from "../domain/filter";
import type { Song } from "../domain/schema";
import { statusLabel } from "../domain/status";
import { useDocumentTitle } from "./useDocumentTitle";

export function SongListPage({ songs }: { songs: readonly Song[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => filterSongs(songs, query), [songs, query]);
  useDocumentTitle("Répertoire · norae-bang");
  const searching = query.trim().length > 0;

  return (
    <>
      <h1>Répertoire</h1>
      <p className="lede">Chansons coréennes, paroles vérifiées, traduction française.</p>
      <div className="search">
        <label htmlFor="recherche">Rechercher</label>
        <div className="search-field">
          <input
            id="recherche"
            type="search"
            value={query}
            placeholder="Titre (hangeul ou français), artiste"
            onChange={(event) => setQuery(event.target.value)}
          />
          {searching ? (
            <button type="button" className="clear-search" aria-label="Effacer la recherche" onClick={() => setQuery("")}>
              <span aria-hidden="true">×</span>
            </button>
          ) : null}
        </div>
      </div>
      {filtered.length > 0 ? (
        <p className="count" aria-live="polite">
          {countLabel(filtered.length)}
        </p>
      ) : (
        <p className="count" aria-live="polite">
          {searching ? "Aucune chanson ne correspond à cette recherche." : "Le répertoire ne contient encore aucune chanson."}
        </p>
      )}
      {filtered.length === 0 && searching ? (
        <button type="button" className="text-link" onClick={() => setQuery("")}>
          Effacer la recherche
        </button>
      ) : null}
      {filtered.length > 0 ? (
        <ul className="songs">
          {filtered.map((song) => (
            <li key={song.id}>
              <Link to={`/chanson/${song.id}`} className="song-card">
                <span className="song-body">
                  <span className="song-heading">
                    <span className="song-title" lang="ko">
                      {song.title}
                    </span>
                    <span className="badge" data-status={song.lyricsStatus}>
                      {statusLabel(song.lyricsStatus)}
                    </span>
                  </span>
                  {song.titleFr ? (
                    <span className="title-fr" lang="fr">
                      {song.titleFr}
                    </span>
                  ) : null}
                  <span className="meta">
                    <span lang="ko">{song.artist}</span>
                    {song.artistLatin ? <span> ({song.artistLatin})</span> : null}
                    {song.year !== null ? <span> · {song.year}</span> : null}
                  </span>
                </span>
                <Chevron />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function Chevron() {
  return (
    <svg className="chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 6.5 15 12l-6 5.5" />
    </svg>
  );
}

function countLabel(count: number): string {
  if (count === 1) return "1 chanson";
  return `${count} chansons`;
}
