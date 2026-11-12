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

  it("cherche dans le hangeul, le français et le nom latin de l’artiste", () => {
    expect(filterSongs(songs, "chanson").map((song) => song.id)).toEqual(["chanson-exemple"]);
    expect(filterSongs(songs, "sans paroles").map((song) => song.id)).toEqual(["sans-paroles"]);
    expect(filterSongs(songs, "artiste").map((song) => song.id)).toEqual(["chanson-exemple", "brouillon-exemple"]);
    expect(filterSongs(songs, "한글만").map((song) => song.id)).toEqual(["sans-traduction"]);
  });
});
