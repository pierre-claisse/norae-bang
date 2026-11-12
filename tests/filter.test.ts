import { describe, expect, it } from "vitest";
import { filterSongs } from "../src/domain/filter";
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
      "sans-paroles",
    ]);
    expect(filterSongs(songs, "artiste")).toEqual([]);
    expect(filterSongs(songs, "한글만").map((song) => song.id)).toEqual(["sans-traduction"]);
  });
});
