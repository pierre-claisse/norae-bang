// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { FAVORITES_STORAGE_KEY, readFavoriteIds, writeFavoriteIds } from "../src/favorites/storage";

beforeEach(() => {
  window.localStorage.clear();
});

describe("favoris", () => {
  it("retient des identifiants, sans paroles", () => {
    expect(readFavoriteIds()).toEqual([]);
    writeFavoriteIds(["ga", "da", "ga"]);
    expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe(JSON.stringify(["da", "ga"]));
    expect(readFavoriteIds()).toEqual(["da", "ga"]);
    expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).not.toMatch(/parole|lyric|예시/u);
  });

  it("ignore un stockage illisible et un échec d’écriture", () => {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, "{");
    expect(readFavoriteIds()).toEqual([]);
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({ id: "x" }));
    expect(readFavoriteIds()).toEqual([]);
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(["ok", 1, "", "ok", "z"]));
    expect(readFavoriteIds()).toEqual(["ok", "z"]);

    const storage = {
      setItem() {
        throw new Error("quota");
      },
    } as unknown as Storage;
    expect(() => writeFavoriteIds(["a"], storage)).not.toThrow();
  });
});
