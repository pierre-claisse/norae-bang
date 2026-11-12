import { describe, expect, it } from "vitest";
import { artistChoices, artistListPath, filterSongs } from "../src/domain/filter";
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
});
