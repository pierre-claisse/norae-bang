export const FAVORITES_STORAGE_KEY = "norae-bang.favorites";

export function readFavoriteIds(storage: Storage = localStorage): string[] {
  try {
    const raw = storage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const ids: string[] = [];
    for (const item of parsed) {
      if (typeof item === "string" && item.length > 0 && !ids.includes(item)) ids.push(item);
    }
    return ids;
  } catch {
    return [];
  }
}

export function writeFavoriteIds(ids: readonly string[], storage: Storage = localStorage): void {
  const unique = [...new Set(ids)].sort((a, b) => a.localeCompare(b, "en"));
  try {
    storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(unique));
  } catch {
    // Quota ou navigation privée : les favoris restent en mémoire pour l’onglet.
  }
}
