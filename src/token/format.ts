const FINE_GRAINED_TOKEN = /^github_pat_[A-Za-z0-9_]{16,240}$/;

export function isFineGrainedToken(value: string): boolean {
  return FINE_GRAINED_TOKEN.test(value);
}

export const TOKEN_FORMAT_ERROR =
  "Collez un jeton fine-grained (il commence par github_pat_), limité au dépôt norae-bang-data, avec la permission Contents en lecture.";
