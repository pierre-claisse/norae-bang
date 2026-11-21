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

  it("laisse la hauteur d’une tuile identique avec ou sans cœur en filigrane", () => {
    document.head.append(Object.assign(document.createElement("style"), { textContent: css }));
    const list = document.createElement("ol");
    list.className = "songs tiles";
    list.style.width = "380px";
    const plain = sampleTile(false);
    const marked = sampleTile(true);
    list.append(plain, marked);
    document.body.append(list);

    const plainTile = plain.querySelector(".tile");
    const markedTile = marked.querySelector(".tile");
    const heart = marked.querySelector(".tile-heart");
    const plainTitle = plainTile?.querySelector(".tile-title");
    const plainMeta = plainTile?.querySelector(".tile-meta");
    if (!plainTile || !markedTile || !heart || !plainTitle || !plainMeta) throw new Error("tuile introuvable");

    expect(getComputedStyle(plainTile).minHeight).toBe("52px");
    expect(getComputedStyle(markedTile).minHeight).toBe("52px");
    expect(markedTile.getBoundingClientRect().height).toBe(plainTile.getBoundingClientRect().height);
    expect(Number.parseFloat(getComputedStyle(plainTitle).paddingRight) || 0).toBe(0);
    expect(Number.parseFloat(getComputedStyle(plainMeta).paddingRight) || 0).toBe(0);

    const heartStyle = getComputedStyle(heart);
    const tileStyle = getComputedStyle(markedTile);
    expect(heartStyle.position).toBe("absolute");
    expect(heartStyle.pointerEvents).toBe("none");
    expect(heartStyle.transform).toBe("none");
    expect(Number.parseFloat(heartStyle.top)).toBe(-1);
    expect(Number.parseFloat(heartStyle.left)).toBe(-8);
    expect(heartStyle.width).toBe("54px");
    expect(heartStyle.height).toBe("54px");
    expect(tileStyle.overflow).toBe("hidden");
    expect(tileStyle.userSelect).toBe("none");
    expect(heartStyle.color.replace(/\s/g, "").toLowerCase()).toMatch(/e86a78|232,106,120/);
    expect(Number.parseFloat(heartStyle.opacity)).toBe(0.3);
    expect(heart.getAttribute("aria-hidden")).toBe("true");
    expect(css).toContain("-webkit-touch-callout: none");
    expect(css).toMatch(/button\.song-favorite::after\s*\{[^}]*inset:\s*-6px 0/);
  });
});

function sampleTile(favorite: boolean): HTMLLIElement {
  const cell = document.createElement("li");
  const tile = document.createElement("a");
  tile.className = "tile";
  if (favorite) {
    tile.classList.add("is-favorite");
    const heart = document.createElement("span");
    heart.className = "tile-heart";
    heart.setAttribute("aria-hidden", "true");
    tile.append(heart);
  }
  const title = document.createElement("span");
  title.className = "tile-title";
  title.textContent = "가나";
  const meta = document.createElement("span");
  meta.className = "tile-meta";
  meta.textContent = "가수 가 · 1991";
  tile.append(title, meta);
  cell.append(tile);
  return cell;
}
