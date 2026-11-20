// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("césure des sources", () => {
  it("réutilise la règle des paroles pour la note et les liens", () => {
    const shared = ruleBlocks(css).filter(
      (block) => /word-break:\s*keep-all/.test(block.body) && /overflow-wrap:\s*anywhere/.test(block.body),
    );
    expect(shared).toHaveLength(1);
    expect(shared[0]?.selectors).toEqual([".lyric-ko", ".sources-note", ".sources a"]);
    expect(shared[0]?.body).not.toMatch(/font-size|padding|text-indent/);

    document.head.append(Object.assign(document.createElement("style"), { textContent: css }));
    const note = document.createElement("p");
    note.className = "sources-note";
    const link = document.createElement("a");
    link.textContent = "Lien factice";
    const item = document.createElement("li");
    item.append(link);
    const list = document.createElement("ul");
    list.append(item);
    const sources = document.createElement("section");
    sources.className = "sources";
    sources.append(note, list);
    const lyric = document.createElement("p");
    lyric.className = "lyric-ko";
    document.body.append(sources, lyric);

    for (const element of [note, link, lyric]) {
      const style = getComputedStyle(element);
      expect(style.wordBreak).toBe("keep-all");
      expect(style.overflowWrap).toBe("anywhere");
    }
    expect(getComputedStyle(note).fontSize).not.toBe(getComputedStyle(lyric).fontSize);
  });
});

function ruleBlocks(source: string): Array<{ selectors: string[]; body: string }> {
  const blocks: Array<{ selectors: string[]; body: string }> = [];
  for (const match of source.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = match[1]?.split(",").map((selector) => selector.trim()).filter((selector) => selector.startsWith("."));
    if (!selectors?.length) continue;
    blocks.push({ selectors, body: match[2] ?? "" });
  }
  return blocks;
}
