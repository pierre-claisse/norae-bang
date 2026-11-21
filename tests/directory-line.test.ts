// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("seconde ligne du répertoire", () => {
  it("laisse la seconde ligne en artiste et année, sans retrait", () => {
    document.head.append(Object.assign(document.createElement("style"), { textContent: css }));
    const row = document.createElement("a");
    row.className = "song-row";
    const sub = document.createElement("span");
    sub.className = "song-sub";
    const artist = document.createElement("span");
    artist.lang = "ko";
    const year = document.createElement("span");
    year.className = "song-year";
    sub.append(artist, year);
    row.append(sub);
    document.body.append(row);

    const subStyle = getComputedStyle(sub);
    expect(subStyle.display).toBe("flex");
    expect(subStyle.whiteSpace).toBe("nowrap");
    expect(getComputedStyle(artist).flexShrink).toBe("0");
    expect(getComputedStyle(year).flexShrink).toBe("0");

    const list = document.createElement("ol");
    list.className = "songs tiles";
    const span = document.createElement("li");
    span.className = "tile-section";
    const cell = document.createElement("li");
    list.append(span, cell);
    document.body.append(list);
    expect(getComputedStyle(list).gridTemplateColumns).toBe("1fr 1fr");
    expect(getComputedStyle(span).gridColumn).toBe("1 / -1");
    expect(getComputedStyle(cell).gridColumn).not.toBe("1 / -1");

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
