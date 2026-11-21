import { Fragment, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  artistChoices,
  filterSongs,
  listQueryFromParams,
  listScrollKey,
  songPath,
  type ListQuery,
} from "../domain/filter";
import type { LyricsStatus, Song } from "../domain/schema";
import { groupSongs, type SongSection, type SongSort } from "../domain/sections";
import { useDocumentTitle } from "./useDocumentTitle";

const QUERY_DEBOUNCE_MS = 150;

export function SongListPage({ songs }: { songs: readonly Song[] }) {
  const [params, setParams] = useSearchParams();
  const urlQuery = listQueryFromParams(params);
  const search = params.toString();
  const [query, setQuery] = useState(urlQuery.q);
  const artist = urlQuery.artiste;
  const sort = urlQuery.tri;
  const artists = useMemo(() => artistChoices(songs), [songs]);
  const filtered = useMemo(() => filterSongs(songs, query, artist), [songs, query, artist]);
  const sections = useMemo(() => groupSongs(filtered, sort), [filtered, sort]);
  const liveQuery = useMemo<ListQuery>(() => ({ q: query, tri: sort, artiste: artist }), [query, sort, artist]);
  const scrollKey = useRef<string | null>(null);
  if (scrollKey.current === null) {
    scrollKey.current = listScrollKey(window.location.pathname, urlQuery);
  }
  useDocumentTitle("Répertoire · norae-bang");
  const searching = query.trim().length > 0;
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    setQuery(urlQuery.q);
  }, [urlQuery.q]);

  useEffect(() => {
    const trimmed = query.trim();
    const current = new URLSearchParams(search).get("q") ?? "";
    if (trimmed === current) return;
    const handle = window.setTimeout(() => {
      setParams(
        (previous) => {
          const updated = new URLSearchParams(previous);
          if (trimmed) updated.set("q", trimmed);
          else updated.delete("q");
          return updated;
        },
        { replace: true },
      );
    }, QUERY_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query, search, setParams]);

  useEffect(() => {
    // Une seule restauration, au montage : la clé est celle de l’URL d’arrivée.
    const key = scrollKey.current;
    if (!key) return;
    const raw = sessionStorage.getItem(key);
    if (raw === null) return;
    const y = Number(raw);
    if (!Number.isFinite(y)) return;
    window.scrollTo(0, y);
    const frame = window.requestAnimationFrame(() => window.scrollTo(0, y));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const bar = barRef.current;
    const root = rootRef.current;
    if (!bar || !root || typeof ResizeObserver === "undefined") return;
    const apply = () => {
      root.style.setProperty("--bar-h", `${Math.ceil(bar.getBoundingClientRect().height)}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

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
    setParams(
      (previous) => {
        const updated = new URLSearchParams(previous);
        if (next) updated.set("artiste", next);
        else updated.delete("artiste");
        return updated;
      },
      { replace: true },
    );
  }

  function chooseSort(next: SongSort) {
    setParams(
      (previous) => {
        const updated = new URLSearchParams(previous);
        switch (next) {
          case "titre":
            updated.delete("tri");
            break;
          case "artiste":
            updated.set("tri", "artiste");
            break;
          default: {
            const unexpected: never = next;
            return unexpected;
          }
        }
        return updated;
      },
      { replace: true },
    );
  }

  function rememberScroll() {
    const key = listScrollKey(window.location.pathname, liveQuery);
    sessionStorage.setItem(key, String(window.scrollY));
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== key) window.history.replaceState(window.history.state, "", key);
  }

  return (
    <div className="directory" ref={rootRef}>
      <h1 className="directory-title">Répertoire</h1>
      <div className="list-bar" ref={barRef}>
        <div className="search">
          <label className="sr-only" htmlFor="recherche">
            Rechercher
          </label>
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
        <div className="list-tools">
          <p className="count" aria-live="polite">
            {filtered.length > 0 ? (
              <>
                <span>{countLabel(filtered.length)}</span>
                {artist ? (
                  <>
                    <span> · </span>
                    <span lang="ko">{artist}</span>
                  </>
                ) : null}
              </>
            ) : (
              emptyLabel(searching, artist !== null)
            )}
          </p>
          <div className="sort-switch" role="group" aria-label="Trier">
            <button type="button" className="sort-option" aria-pressed={sort === "titre"} onClick={() => chooseSort("titre")}>
              Titre
            </button>
            <button type="button" className="sort-option" aria-pressed={sort === "artiste"} onClick={() => chooseSort("artiste")}>
              Artiste
            </button>
          </div>
        </div>
      </div>
      {filtered.length === 0 && searching ? (
        <button type="button" className="text-link" onClick={() => setQuery("")}>
          Effacer la recherche
        </button>
      ) : null}
      {sections.map((section) => (
        <DirectorySection key={section.id} section={section} sort={sort} liveQuery={liveQuery} onOpen={rememberScroll} />
      ))}
    </div>
  );
}

function DirectorySection({
  section,
  sort,
  liveQuery,
  onOpen,
}: {
  section: SongSection;
  sort: SongSort;
  liveQuery: ListQuery;
  onOpen: () => void;
}) {
  const headingId = useId();
  return (
    <section className="directory-section" aria-labelledby={headingId}>
      <h2 id={headingId} lang={section.label === "#" ? undefined : "ko"}>
        {section.label}
      </h2>
      <ol className="songs tiles">
        {section.songs.map((song) => (
          <li key={song.id}>
            <Tile song={song} sort={sort} to={songPath(song.id, liveQuery)} onOpen={onOpen} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function Tile({ song, sort, to, onOpen }: { song: Song; sort: SongSort; to: string; onOpen: () => void }) {
  const parts = sublineTail(song, sort);
  return (
    <Link to={to} className="tile" onClick={onOpen}>
      <span className={titleClass(song.lyricsStatus)} lang="ko">
        {song.title}
      </span>
      {parts.length > 0 ? (
        <span className="tile-meta">
          {parts.map((part, index) => (
            <Fragment key={part.key}>
              {index > 0 ? <PartSep /> : null}
              {part.node}
            </Fragment>
          ))}
        </span>
      ) : null}
      <RowStatus status={song.lyricsStatus} />
    </Link>
  );
}

function sublineTail(song: Song, sort: SongSort): Array<{ key: string; node: ReactNode }> {
  const parts: Array<{ key: string; node: ReactNode }> = [];
  switch (sort) {
    case "titre":
      parts.push({
        key: "artist",
        node: <span lang="ko">{song.artist}</span>,
      });
      break;
    case "artiste":
      break;
    default: {
      const unexpected: never = sort;
      return unexpected;
    }
  }
  if (song.year !== null) {
    parts.push({
      key: "year",
      node: <span className="song-year">{song.year}</span>,
    });
  }
  return parts;
}

function PartSep() {
  return (
    <>
      <span className="sr-only">, </span>
      <span className="song-sep" aria-hidden="true">
        {" · "}
      </span>
    </>
  );
}

function titleClass(status: LyricsStatus): string {
  switch (status) {
    case "verified":
      return "tile-title";
    case "draft":
      return "tile-title has-badge";
    case "missing":
      return "tile-title has-badge has-badge-long";
    default: {
      const unexpected: never = status;
      return unexpected;
    }
  }
}

function RowStatus({ status }: { status: LyricsStatus }) {
  switch (status) {
    case "verified":
      return <span className="sr-only">paroles vérifiées</span>;
    case "draft":
      return <span className="row-status">brouillon</span>;
    case "missing":
      return <span className="row-status">sans paroles</span>;
    default: {
      const unexpected: never = status;
      return unexpected;
    }
  }
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
