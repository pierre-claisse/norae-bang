import { describe, expect, it } from "vitest";
import { groupSongs, titleInitial } from "../src/domain/sections";
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
});

function syllable(index: number): string {
  return String.fromCodePoint(0xac00 + index * 588);
}

function fake(id: string, title: string, artist: string): Song {
  return {
    id,
    spotifyTrackId: null,
    title,
    titleFr: null,
    artist,
    year: null,
    lyricsStatus: "missing",
    lines: [],
    units: [],
    sources: [],
    context: null,
    sourcesNote: null,
  };
}
