import { describe, expect, it } from "vitest";
import {
  artistChoices,
  artistListPath,
  filterSongs,
  listPath,
  listQueryFromParams,
  listScrollKey,
  parseSort,
  songPath,
} from "../src/domain/filter";
import type { Song } from "../src/domain/schema";
import fixture from "./fixtures/catalog.json";

const songs = (fixture as { songs: Song[] }).songs;

describe("recherche", () => {
  it("ignore la casse et les accents", () => {
    const withAccent: Song = { ...songs[0]!, titleFr: "Déjà vu exemple" };
    expect(filterSongs([withAccent], "deja").map((song) => song.id)).toEqual([withAccent.id]);
  });

  it("cherche dans le hangeul, le français et l’artiste", () => {
    expect(filterSongs(songs, "chanson").map((song) => song.id)).toEqual(["chanson-exemple"]);
    expect(filterSongs(songs, "sans paroles").map((song) => song.id)).toEqual(["sans-paroles"]);
    expect(filterSongs(songs, "가수").map((song) => song.id)).toEqual([
      "chanson-exemple",
      "sans-traduction",
      "brouillon-exemple",
    ]);
    expect(filterSongs(songs, "artiste")).toEqual([]);
    expect(filterSongs(songs, "한글만").map((song) => song.id)).toEqual(["sans-traduction"]);
  });

  it("regroupe les artistes en hangeul, triés, avec le nombre de chansons", () => {
    expect(artistChoices(songs)).toEqual([
      { name: "가수 예시", count: 2 },
      { name: "다른 가수", count: 1 },
      { name: "셋째 그룹", count: 1 },
    ]);
  });

  it("combine l’artiste et la recherche", () => {
    expect(filterSongs(songs, "", "가수 예시").map((song) => song.id)).toEqual(["chanson-exemple", "sans-traduction"]);
    expect(filterSongs(songs, "hangeul", "가수 예시").map((song) => song.id)).toEqual(["sans-traduction"]);
    expect(filterSongs(songs, "chanson", "가수 예시").map((song) => song.id)).toEqual(["chanson-exemple"]);
    expect(filterSongs(songs, "brouillon", "가수 예시")).toEqual([]);
    expect(filterSongs(songs, "", "inconnu")).toEqual([]);
  });

  it("écrit le filtre dans le chemin de la liste", () => {
    expect(artistListPath(null)).toBe("/");
    const path = artistListPath("가수 예시");
    expect(path.startsWith("/?artiste=")).toBe(true);
    expect(new URLSearchParams(path.slice(2)).get("artiste")).toBe("가수 예시");
  });

  it("aligne q, tri et artiste sur l’URL, dans cet ordre", () => {
    expect(parseSort(null)).toBe("titre");
    expect(parseSort("titre")).toBe("titre");
    expect(parseSort("titre-desc")).toBe("titre-desc");
    expect(parseSort("artiste")).toBe("artiste");
    expect(parseSort("artiste-desc")).toBe("artiste-desc");
    expect(parseSort("annee")).toBe("annee");
    expect(parseSort("annee-desc")).toBe("annee-desc");
    expect(parseSort("autre")).toBe("titre");
    expect(parseSort("")).toBe("titre");

    const path = listPath({ q: "déjà vu", tri: "artiste", artiste: "가수 예시" });
    const params = new URLSearchParams(path.slice(2));
    expect([...params.keys()]).toEqual(["q", "tri", "artiste"]);
    expect(params.get("q")).toBe("déjà vu");
    expect(params.get("tri")).toBe("artiste");
    expect(params.get("artiste")).toBe("가수 예시");
    expect(listPath({ q: "  ", tri: "titre", artiste: null })).toBe("/");
    expect(listPath({ q: "", tri: "titre-desc", artiste: null })).toBe("/?tri=titre-desc");
    expect(listPath({ q: "", tri: "annee", artiste: null })).toBe("/?tri=annee");
    expect(listPath({ q: "", tri: "annee-desc", artiste: null })).toBe("/?tri=annee-desc");
    const descending = new URLSearchParams(listPath({ q: "a", tri: "artiste-desc", artiste: "가수 예시" }).slice(2));
    expect([...descending.keys()]).toEqual(["q", "tri", "artiste"]);
    expect(descending.get("tri")).toBe("artiste-desc");
    expect(descending.get("artiste")).toBe("가수 예시");
    expect(songPath("chanson-exemple", { q: "a", tri: "titre", artiste: null })).toBe("/chanson/chanson-exemple?q=a");
    expect(songPath("chanson-exemple", { q: "", tri: "annee-desc", artiste: null })).toBe(
      "/chanson/chanson-exemple?tri=annee-desc",
    );
    expect(listScrollKey("/norae-bang/", { q: "a", tri: "artiste", artiste: null })).toBe("/norae-bang/?q=a&tri=artiste");
    expect(listScrollKey("/norae-bang/", { q: "", tri: "annee", artiste: null })).toBe("/norae-bang/?tri=annee");
  });

  it("limite aux favoris et place favoris en dernier dans l’URL", () => {
    const ids = new Set(["chanson-exemple", "sans-paroles"]);
    expect(filterSongs(songs, "", null, ids).map((song) => song.id)).toEqual(["chanson-exemple", "sans-paroles"]);
    expect(filterSongs(songs, "hangeul", null, ids)).toEqual([]);
    expect(filterSongs(songs, "", "가수 예시", ids).map((song) => song.id)).toEqual(["chanson-exemple"]);
    expect(filterSongs(songs, "chanson", "가수 예시", ids).map((song) => song.id)).toEqual(["chanson-exemple"]);
    expect(filterSongs(songs, "", null, new Set())).toEqual([]);
    expect(filterSongs(songs, "", null, null).map((song) => song.id)).toEqual(songs.map((song) => song.id));

    expect(listQueryFromParams(new URLSearchParams("favoris=1")).favoris).toBe(true);
    expect(listQueryFromParams(new URLSearchParams("favoris=oui")).favoris).toBe(false);
    expect(listQueryFromParams(new URLSearchParams()).favoris).toBe(false);

    const path = listPath({ q: "déjà", tri: "annee-desc", artiste: "가수 예시", favoris: true });
    const params = new URLSearchParams(path.slice(2));
    expect([...params.keys()]).toEqual(["q", "tri", "artiste", "favoris"]);
    expect(params.get("favoris")).toBe("1");
    expect(listPath({ q: "", tri: "titre", artiste: null, favoris: false })).toBe("/");
    expect(listPath({ q: "", tri: "titre", artiste: null, favoris: true })).toBe("/?favoris=1");
    expect(songPath("chanson-exemple", { q: "", tri: "titre", artiste: null, favoris: true })).toBe(
      "/chanson/chanson-exemple?favoris=1",
    );
    expect(listScrollKey("/norae-bang/", { q: "", tri: "titre", artiste: null, favoris: true })).toBe(
      "/norae-bang/?favoris=1",
    );
  });
});
