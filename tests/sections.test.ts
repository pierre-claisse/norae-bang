import { describe, expect, it } from "vitest";
import { groupSongs, nextSort, titleInitial } from "../src/domain/sections";
import type { Song } from "../src/domain/schema";

const CHOSEONG = ["ㄱ", "ㄱ", "ㄴ", "ㄷ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅂ", "ㅅ", "ㅅ", "ㅇ", "ㅈ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

describe("sections du répertoire", () => {
  it("calcule la consonne initiale et fusionne les doubles", () => {
    CHOSEONG.forEach((label, index) => {
      expect(titleInitial(String.fromCodePoint(0xac00 + index * 588))).toBe(label);
    });
    expect(titleInitial("ABC")).toBe("#");
    expect(titleInitial("★별")).toBe("#");
    expect(titleInitial("ㄱ시작")).toBe("#");
    expect(titleInitial("")).toBe("#");
  });

  it("regroupe par consonne, omet les vides et place # en dernier", () => {
    const pairs = [
      [0, 1, "ㄱ"],
      [3, 4, "ㄷ"],
      [7, 8, "ㅂ"],
      [9, 10, "ㅅ"],
      [12, 13, "ㅈ"],
    ] as const;

    for (const [single, doubled, label] of pairs) {
      const songs = [
        fake("doubled", syllable(doubled), "가수"),
        fake("latin", "ZZ", "가수"),
        fake("single", syllable(single), "가수"),
      ];
      const sections = groupSongs(songs, "titre");
      expect(sections.map((section) => section.label)).toEqual([label, "#"]);
      expect(sections[0]?.songs.map((song) => song.id)).toEqual(["single", "doubled"]);
      expect(sections[1]?.songs.map((song) => song.id)).toEqual(["latin"]);
    }
  });

  it("trie par artiste, puis par titre dans la section", () => {
    const songs = [
      fake("star", "★별", "가수 하"),
      fake("ha", syllable(18), "가수 하"),
      fake("ga", syllable(0), "가수 가"),
      fake("kka", syllable(1), "가수 가"),
    ];
    expect(groupSongs(songs, "titre").map((section) => section.label)).toEqual(["ㄱ", "ㅎ", "#"]);
    expect(groupSongs(songs, "artiste").map((section) => [section.label, section.songs.map((song) => song.id)])).toEqual([
      ["가수 가", ["ga", "kka"]],
      ["가수 하", ["star", "ha"]],
    ]);
  });

  it("trie titre, artiste et année dans les deux sens", () => {
    const songs = [
      fake("ga-b", "가나", "가수 나", 2000),
      fake("ga-a", "가나", "가수 가", 2000),
      fake("kka", "까나", "가수 가", 1990),
      fake("na", "나나", "가수 하", null),
      fake("star", "★별", "가수 하", 2020),
      fake("abc", "ABC", "가수 다", 2020),
    ];

    expect(idsBySection(songs, "titre")).toEqual([
      ["ㄱ", ["ga-a", "ga-b", "kka"]],
      ["ㄴ", ["na"]],
      ["#", ["star", "abc"]],
    ]);
    expect(idsBySection(songs, "titre-desc")).toEqual([
      ["ㄴ", ["na"]],
      ["ㄱ", ["kka", "ga-a", "ga-b"]],
      ["#", ["abc", "star"]],
    ]);

    expect(idsBySection(songs, "artiste")).toEqual([
      ["가수 가", ["ga-a", "kka"]],
      ["가수 나", ["ga-b"]],
      ["가수 다", ["abc"]],
      ["가수 하", ["star", "na"]],
    ]);
    expect(idsBySection(songs, "artiste-desc")).toEqual([
      ["가수 하", ["star", "na"]],
      ["가수 다", ["abc"]],
      ["가수 나", ["ga-b"]],
      ["가수 가", ["ga-a", "kka"]],
    ]);

    expect(idsBySection(songs, "annee")).toEqual([
      ["années 1990", ["kka"]],
      ["années 2000", ["ga-a", "ga-b"]],
      ["années 2020", ["star", "abc"]],
      ["Année inconnue", ["na"]],
    ]);
    expect(idsBySection(songs, "annee-desc")).toEqual([
      ["années 2020", ["star", "abc"]],
      ["années 2000", ["ga-a", "ga-b"]],
      ["années 1990", ["kka"]],
      ["Année inconnue", ["na"]],
    ]);
  });

  it("trie chaque décennie par année dans le sens du tri, puis par titre et par id", () => {
    const songs = [
      fake("z-91", "가나", "가수", 1991),
      fake("a-91", "가나", "가수", 1991),
      fake("m-91", "다나", "가수", 1991),
      fake("b-95", "나나", "가수", 1995),
      fake("c-99", "가가", "가수", 1999),
      fake("d-03", "라나", "가수", 2003),
      fake("u", "마나", "가수", null),
    ];
    expect(idsBySection(songs, "annee")).toEqual([
      ["années 1990", ["a-91", "z-91", "m-91", "b-95", "c-99"]],
      ["années 2000", ["d-03"]],
      ["Année inconnue", ["u"]],
    ]);
    expect(idsBySection(songs, "annee-desc")).toEqual([
      ["années 2000", ["d-03"]],
      ["années 1990", ["c-99", "b-95", "a-91", "z-91", "m-91"]],
      ["Année inconnue", ["u"]],
    ]);
  });

  it("active un tri inactif en croissant et inverse le tri actif", () => {
    expect(nextSort("titre", "titre")).toBe("titre-desc");
    expect(nextSort("titre-desc", "titre")).toBe("titre");
    expect(nextSort("titre-desc", "artiste")).toBe("artiste");
    expect(nextSort("artiste", "artiste")).toBe("artiste-desc");
    expect(nextSort("artiste-desc", "artiste")).toBe("artiste");
    expect(nextSort("artiste-desc", "annee")).toBe("annee");
    expect(nextSort("annee", "annee")).toBe("annee-desc");
    expect(nextSort("annee-desc", "annee")).toBe("annee");
    expect(nextSort("annee-desc", "titre")).toBe("titre");
  });
});

function idsBySection(songs: Song[], sort: Parameters<typeof groupSongs>[1]): Array<[string, string[]]> {
  return groupSongs(songs, sort).map((section) => [section.label, section.songs.map((song) => song.id)]);
}

function syllable(index: number): string {
  return String.fromCodePoint(0xac00 + index * 588);
}

function fake(id: string, title: string, artist: string, year: number | null = null): Song {
  return {
    id,
    spotifyTrackId: null,
    title,
    titleFr: null,
    artist,
    year,
    lyricsStatus: "missing",
    lines: [],
    units: [],
    sources: [],
    context: null,
    sourcesNote: null,
  };
}
