export const TOKEN_STORAGE_KEY = "norae-bang.token";

export type TokenStorage = {
  read(): string | null;
  write(token: string): void;
  clear(): void;
};

export function browserTokenStorage(): TokenStorage {
  return {
    read() {
      try {
        const value = localStorage.getItem(TOKEN_STORAGE_KEY);
        return value && value.length > 0 ? value : null;
      } catch {
        return null;
      }
    },
    write(token: string) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    },
    clear() {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    },
  };
}
