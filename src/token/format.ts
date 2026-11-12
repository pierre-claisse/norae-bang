const FINE_GRAINED_TOKEN = /^github_pat_[A-Za-z0-9_]{16,240}$/;

export function isFineGrainedToken(value: string): boolean {
  return FINE_GRAINED_TOKEN.test(value);
}

export const TOKEN_FORMAT_ERROR = "Ce jeton ne commence pas par github_pat_";
