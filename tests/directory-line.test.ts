// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("ligne du répertoire", () => {
  it("met le titre à gauche et l’artiste à droite sur 48 px", () => {
    document.head.append(Object.assign(document.createElement("style"), { textContent: css }));
    const row = document.createElement("a");
    row.className = "song-row";
    const line = document.createElement("span");
    line.className = "song-line";
    const sub = document.createElement("span");
    sub.className = "song-sub";
    const artist = document.createElement("span");
    artist.lang = "ko";
    const year = document.createElement("span");
    year.className = "song-year";
    sub.append(artist, year);
    row.append(line, sub);
    document.body.append(row);

    const rowStyle = getComputedStyle(row);
    const subStyle = getComputedStyle(sub);
    expect(rowStyle.display).toBe("flex");
    expect(rowStyle.minHeight).toBe("48px");
    expect(rowStyle.paddingTop).toBe("13px");
    expect(rowStyle.paddingBottom).toBe("13px");
    expect(getComputedStyle(line).flexGrow).toBe("1");
    expect(subStyle.flexGrow).toBe("0");
    expect(subStyle.flexShrink).toBe("0");
    expect(subStyle.whiteSpace).toBe("nowrap");
    expect(getComputedStyle(year).fontVariantNumeric).toContain("tabular-nums");

    const heading = document.createElement("h2");
    const section = document.createElement("section");
    section.className = "directory-section";
    section.append(heading);
    document.body.append(section);
    const headingStyle = getComputedStyle(heading);
    expect(headingStyle.fontSize).toBe("15px");
    expect(headingStyle.lineHeight).toBe("20px");
    expect(Number.parseFloat(headingStyle.fontSize)).toBeLessThanOrEqual(16);
  });
});
