// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("seconde ligne du répertoire", () => {
  it("colle le bloc artiste juste après le français, qui seul peut se tronquer", () => {
    document.head.append(Object.assign(document.createElement("style"), { textContent: css }));
    const row = document.createElement("a");
    row.className = "song-row";
    const sub = document.createElement("span");
    sub.className = "song-sub";
    const title = document.createElement("span");
    title.className = "title-fr";
    const byline = document.createElement("span");
    byline.className = "song-byline";
    sub.append(title, byline);
    row.append(sub);
    document.body.append(row);

    const titleStyle = getComputedStyle(title);
    const bylineStyle = getComputedStyle(byline);
    expect(getComputedStyle(sub).display).toBe("flex");
    expect(titleStyle.flexGrow).toBe("0");
    expect(titleStyle.flexShrink).toBe("1");
    expect(titleStyle.flexBasis).toBe("auto");
    expect(titleStyle.whiteSpace).toBe("nowrap");
    expect(titleStyle.textOverflow).toBe("ellipsis");
    expect(bylineStyle.flexGrow).toBe("0");
    expect(bylineStyle.flexShrink).toBe("0");
    expect(bylineStyle.whiteSpace).toBe("nowrap");

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
