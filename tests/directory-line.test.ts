// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("tuiles du répertoire", () => {
  it("aligne deux colonnes, laisse une tuile seule à gauche et coupe le hangeul à deux lignes", () => {
    document.head.append(Object.assign(document.createElement("style"), { textContent: css }));
    const list = document.createElement("ol");
    list.className = "songs tiles";
    const heading = document.createElement("h2");
    const section = document.createElement("section");
    section.className = "directory-section";
    const cell = document.createElement("li");
    const tile = document.createElement("a");
    tile.className = "tile";
    const title = document.createElement("span");
    title.className = "tile-title has-badge";
    const meta = document.createElement("span");
    meta.className = "tile-meta";
    const year = document.createElement("span");
    year.className = "song-year";
    meta.append(year);
    const badge = document.createElement("span");
    badge.className = "row-status";
    tile.append(title, meta, badge);
    cell.append(tile);
    list.append(cell);
    section.append(heading, list);
    document.body.append(section);

    expect(getComputedStyle(list).gridTemplateColumns).toBe("1fr 1fr");
    expect(getComputedStyle(list).alignItems).toBe("stretch");
    expect(getComputedStyle(cell).gridColumn).not.toBe("1 / -1");
    expect(heading.parentElement).toBe(section);
    expect(getComputedStyle(tile).minHeight).toBe("52px");
    expect(css).toMatch(/\.tile-title\s*\{[^}]*-webkit-line-clamp:\s*2/);
    expect(css).toMatch(/\.tile-title\s*\{[^}]*word-break:\s*keep-all/);
    expect(getComputedStyle(title).wordBreak).toBe("keep-all");
    expect(getComputedStyle(title).paddingRight).toBe("72px");
    const longTitle = document.createElement("span");
    longTitle.className = "tile-title has-badge has-badge-long";
    tile.append(longTitle);
    expect(getComputedStyle(longTitle).paddingRight).toBe("94px");
    const badgeStyle = getComputedStyle(badge);
    expect(badgeStyle.position).toBe("absolute");
    expect(badgeStyle.color.replace(/\s/g, "").toLowerCase()).toMatch(/b8ac98|184,172,152/);
    expect(badgeStyle.borderTopWidth).toBe("1px");
    const headingStyle = getComputedStyle(heading);
    expect(headingStyle.fontSize).toBe("15px");
    expect(headingStyle.lineHeight).toBe("20px");
    expect(headingStyle.position).toBe("sticky");
    expect(Number.parseFloat(headingStyle.fontSize)).toBeLessThanOrEqual(16);
    expect(getComputedStyle(year).fontVariantNumeric).toContain("tabular-nums");
  });
});
