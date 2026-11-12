import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("service worker", () => {
  it("ne met en cache ni une autre origine ni songs.json", () => {
    const source = readFileSync("public/sw.js", "utf8");
    const guard = source.indexOf("url.origin !== self.location.origin");
    const data = source.indexOf('pathname.endsWith("/songs.json")');
    const put = source.indexOf("cache.put");
    expect(guard).toBeGreaterThan(-1);
    expect(data).toBeGreaterThan(guard);
    expect(put).toBeGreaterThan(data);
    expect(source).not.toContain("api.github.com");
  });
});
