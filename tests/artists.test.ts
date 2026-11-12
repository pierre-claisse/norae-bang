import { describe, expect, it } from "vitest";
import { artistChoices } from "../src/domain/filter";
import { parseCatalog } from "../src/domain/schema";
import fixture from "./fixtures/many-artists.json";

describe("fixture de nombreux artistes", () => {
  const catalog = parseCatalog(fixture);

  it("contient vingt artistes factices, sans paroles", () => {
    expect(catalog.songs).toHaveLength(20);
    expect(artistChoices(catalog.songs)).toHaveLength(20);
    for (const song of catalog.songs) {
      expect(song.artist).toMatch(/^[가-힣\s]+$/);
      expect(song.lines).toEqual([]);
      expect(song.units).toEqual([]);
      expect(song.lyricsStatus).toBe("missing");
    }
  });

  it("trie le dernier artiste vers la fin de l’alphabet", () => {
    const names = artistChoices(catalog.songs).map((choice) => choice.name);
    expect(names.at(-1)).toBe("그룹 허");
    expect(names.at(-2)).toBe("그룹 하");
  });
});
