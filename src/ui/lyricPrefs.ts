export const SHOW_ROMANIZATION_KEY = "norae-bang.show-romanization";
export const SHOW_TRANSLATION_KEY = "norae-bang.show-translation";

export function readShowFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) !== "0";
  } catch {
    return true;
  }
}

export function writeShowFlag(key: string, shown: boolean): void {
  localStorage.setItem(key, shown ? "1" : "0");
}
