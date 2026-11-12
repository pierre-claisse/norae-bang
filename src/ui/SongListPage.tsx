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

  return (
    <>
      <h1>Répertoire</h1>
      <p className="lede">Chansons coréennes, paroles vérifiées, traduction française.</p>
      <label className="search" htmlFor="recherche">
        Rechercher
        <input
          id="recherche"
          type="search"
          value={query}
          placeholder="Titre, romanisation, artiste"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <p className="count" aria-live="polite">
        {countLabel(filtered.length)}
      </p>
      {filtered.length === 0 ? (
        <p>{query.trim() ? "Aucune chanson ne correspond à cette recherche." : "Le répertoire ne contient encore aucune chanson."}</p>
      ) : (
        <ul className="songs">
          {filtered.map((song) => (
            <li key={song.id}>
              <Link to={`/chanson/${song.id}`} className="song-card">
                <span className="song-heading">
                  <span className="song-title" lang="ko">
                    {song.title}
                  </span>
                  <span className="badge" data-status={song.lyricsStatus}>
                    {statusLabel(song.lyricsStatus)}
                  </span>
                </span>
                {song.titleRomanized ? <span className="romanized">{song.titleRomanized}</span> : null}
                {song.titleFr ? <span className="title-fr">{song.titleFr}</span> : null}
                <span className="meta">{formatArtist(song, song.year)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function formatArtist(song: Song, year: number | null): string {
  const artist = song.artistRomanized ? `${song.artist} (${song.artistRomanized})` : song.artist;
  return year === null ? artist : `${artist} · ${year}`;
}

function countLabel(count: number): string {
  if (count === 0) return "Aucune chanson";
  if (count === 1) return "1 chanson";
  return `${count} chansons`;
}
