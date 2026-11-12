import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { artistChoices, artistQuery, filterSongs } from "../domain/filter";
import { frenchTypography } from "../domain/french";
import type { Song } from "../domain/schema";
import { statusLabel } from "../domain/status";
import { useDocumentTitle } from "./useDocumentTitle";

export function SongListPage({ songs }: { songs: readonly Song[] }) {
  const [query, setQuery] = useState("");
  const [params, setParams] = useSearchParams();
  const artistParam = params.get("artiste");
  const artist = artistParam && artistParam.trim() !== "" ? artistParam : null;
  const artists = useMemo(() => artistChoices(songs), [songs]);
  const filtered = useMemo(() => filterSongs(songs, query, artist), [songs, query, artist]);
  useDocumentTitle("Répertoire · norae-bang");
  const searching = query.trim().length > 0;
  const rowRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    let cancelled = false;
    const center = () => {
      if (cancelled || !artist) return;
      row.querySelector<HTMLElement>(".artist-chip[aria-pressed='true']")?.scrollIntoView({
        block: "nearest",
        inline: "center",
      });
    };
    const update = () => {
      const last = row.lastElementChild;
      const rowBox = row.getBoundingClientRect();
      const end = last ? last.getBoundingClientRect().right > rowBox.right + 1 : false;
      setEdges({ start: row.scrollLeft > 1, end });
    };
    center();
    update();
    void document.fonts?.ready.then(() => {
      center();
      update();
    });
    row.addEventListener("scroll", update, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(row);
    return () => {
      cancelled = true;
      row.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [artist, artists]);

  function chooseArtist(next: string | null) {
    const updated = new URLSearchParams(params);
    if (next) updated.set("artiste", next);
    else updated.delete("artiste");
    setParams(updated, { replace: true });
  }

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
      <div className="artist-scroller">
        <div className="artist-row" role="group" aria-label="Filtrer par artiste" ref={rowRef}>
          <button type="button" className="artist-chip" aria-pressed={artist === null} onClick={() => chooseArtist(null)}>
            Tous
          </button>
          {artists.map((choice) => (
            <button
              key={choice.name}
              type="button"
              className="artist-chip"
              lang="ko"
              aria-pressed={artist === choice.name}
              aria-label={artistChipLabel(choice.name, choice.count)}
              onClick={() => chooseArtist(choice.name)}
            >
              <span>{choice.name}</span>
              {choice.count >= 2 ? <span className="artist-count">{choice.count}</span> : null}
            </button>
          ))}
        </div>
        <span className="artist-fade artist-fade-start" data-more={edges.start ? "true" : "false"} aria-hidden="true" />
        <span className="artist-fade artist-fade-end" data-more={edges.end ? "true" : "false"} aria-hidden="true" />
      </div>
      {filtered.length > 0 ? (
        <p className="count" aria-live="polite">
          <span>{countLabel(filtered.length)}</span>
          {artist ? (
            <>
              <span> · </span>
              <span lang="ko">{artist}</span>
            </>
          ) : null}
        </p>
      ) : (
        <p className="count" aria-live="polite">
          {emptyLabel(searching, artist !== null)}
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
              <Link to={`/chanson/${song.id}${artistQuery(artist)}`} className="song-card">
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
                      {frenchTypography(song.titleFr)}
                    </span>
                  ) : null}
                  <span className="meta">
                    <span lang="ko">{song.artist}</span>
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

function artistChipLabel(name: string, count: number): string {
  if (count < 2) return name;
  return `${name}, ${countLabel(count)}`;
}

function emptyLabel(searching: boolean, filteringArtist: boolean): string {
  if (searching) return "Aucune chanson ne correspond à cette recherche.";
  if (filteringArtist) return "Aucune chanson pour cet artiste.";
  return "Le répertoire ne contient encore aucune chanson.";
}
