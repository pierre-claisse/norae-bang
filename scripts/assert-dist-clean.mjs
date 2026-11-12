import { readdir, readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const textExtensions = new Set([".html", ".js", ".css", ".json", ".webmanifest", ".svg", ".txt", ".map"]);
const forbidden = [
  { name: "jeton fine-grained", pattern: /github_pat_[A-Za-z0-9_]{16,}/ },
  { name: "jeton classique", pattern: /ghp_[A-Za-z0-9]{16,}/ },
  { name: "fixture de test", pattern: /Chanson exemple/ },
];

const files = await walk("dist");
const index = await readFile("dist/index.html", "utf8");
const fallback = await readFile("dist/404.html", "utf8");
if (index !== fallback) {
  console.error("dist/404.html doit être une copie de dist/index.html");
  process.exit(1);
}
if (!index.includes("/norae-bang/")) {
  console.error("Le build doit utiliser la base /norae-bang/.");
  process.exit(1);
}

for (const required of [
  "dist/sw.js",
  "dist/manifest.webmanifest",
  "dist/favicon.svg",
  "dist/favicon-16.png",
  "dist/favicon-32.png",
  "dist/favicon-192.png",
  "dist/favicon-512.png",
  "dist/apple-touch-icon.png",
]) {
  await readFile(required);
}

const sw = await readFile("dist/sw.js", "utf8");
if (!sw.includes("url.origin !== self.location.origin") || !sw.includes('pathname.endsWith("/songs.json")')) {
  console.error("Le service worker doit ignorer l’API et songs.json.");
  process.exit(1);
}
if (sw.includes("api.github.com")) {
  console.error("Le service worker ne doit pas cibler l’API GitHub.");
  process.exit(1);
}

const bundled = [];
for (const file of files) {
  if (!textExtensions.has(extname(file))) continue;
  const text = await readFile(file, "utf8");
  bundled.push(text);
  for (const rule of forbidden) {
    if (rule.pattern.test(text)) {
      console.error(`${file} contient un ${rule.name}.`);
      process.exit(1);
    }
  }
}

const appCode = bundled.join("\n");
if (!appCode.includes("serviceWorker") || !appCode.includes("norae-bang-data")) {
  console.error("Le build doit enregistrer le service worker et lire norae-bang-data.");
  process.exit(1);
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(path)));
    else found.push(path);
  }
  return found;
}
