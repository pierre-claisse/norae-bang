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
    expect(getComputedStyle(tile).minHeight).toBe("72px");
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

  it("souligne le libellé du tri actif, pas la flèche", () => {
    document.head.append(Object.assign(document.createElement("style"), { textContent: css }));
    const button = document.createElement("button");
    button.className = "sort-option";
    button.setAttribute("aria-pressed", "true");
    const label = document.createElement("span");
    label.className = "sort-label";
    const arrow = document.createElement("span");
    arrow.className = "sort-arrow";
    button.append(label, arrow);
    document.body.append(button);

    expect(getComputedStyle(button).textDecorationLine).not.toBe("underline");
    const labelStyle = getComputedStyle(label);
    expect(labelStyle.textDecorationLine).toBe("underline");
    expect(labelStyle.textDecorationThickness).toBe("2px");
    expect(getComputedStyle(arrow).textDecorationLine).not.toBe("underline");
  });

  it("donne au cœur favori une cible de 44px, rose seulement lorsqu’il est rempli", () => {
    document.head.append(Object.assign(document.createElement("style"), { textContent: css }));
    const pressed = document.createElement("button");
    pressed.className = "tile-favorite";
    pressed.setAttribute("aria-pressed", "true");
    const idle = document.createElement("button");
    idle.className = "tile-favorite";
    idle.setAttribute("aria-pressed", "false");
    document.body.append(pressed, idle);

    const pressedStyle = getComputedStyle(pressed);
    expect(pressedStyle.width).toBe("44px");
    expect(pressedStyle.height).toBe("44px");
    expect(pressedStyle.color.replace(/\s/g, "").toLowerCase()).toMatch(/e86a78|232,106,120/);
    expect(getComputedStyle(idle).color.replace(/\s/g, "").toLowerCase()).toMatch(/b8ac98|184,172,152/);
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--brass\)/);
    expect(css).not.toMatch(/button\.tile-favorite[^{]*\{[^}]*outline:\s*none/);
  });
});
