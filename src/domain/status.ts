import type { LyricsStatus } from "./schema";

export function statusLabel(status: LyricsStatus): string {
  switch (status) {
    case "verified":
      return "Paroles vérifiées";
    case "draft":
      return "Brouillon";
    case "missing":
      return "Paroles manquantes";
    default: {
      const unexpected: never = status;
      return unexpected;
    }
  }
}
