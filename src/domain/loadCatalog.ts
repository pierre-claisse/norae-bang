import { GitHubRequestError } from "../github/client";
import { CatalogValidationError, parseCatalog, type Catalog } from "./schema";

export const CATALOG_PATH = "songs.json";

export type TextFileSource = {
  getFile(path: string, signal?: AbortSignal): Promise<{ text: string } | null>;
};

export async function loadCatalog(source: TextFileSource, signal?: AbortSignal): Promise<Catalog> {
  const file = await source.getFile(CATALOG_PATH, signal);
  if (!file) throw new GitHubRequestError("not_found", 404);
  let json: unknown;
  try {
    json = JSON.parse(file.text.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("songs.json n’est pas un JSON valide.");
  }
  return parseCatalog(json);
}

export function catalogErrorMessage(error: unknown): string {
  if (error instanceof CatalogValidationError || error instanceof GitHubRequestError || error instanceof Error) {
    return error.message || "Lecture du répertoire impossible.";
  }
  return "Lecture du répertoire impossible.";
}
