import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { isFineGrainedToken, TOKEN_FORMAT_ERROR } from "./format";
import { browserTokenStorage, type TokenStorage } from "./storage";

type TokenContextValue = {
  current: string | null;
  save: (raw: string) => string | null;
  forget: () => void;
};

const TokenContext = createContext<TokenContextValue | null>(null);

export function TokenProvider({ storage, children }: { storage?: TokenStorage; children: ReactNode }) {
  const [store] = useState(() => storage ?? browserTokenStorage());
  const [current, setCurrent] = useState<string | null>(() => readValid(store));

  const save = useCallback(
    (raw: string) => {
      const value = raw.trim();
      if (!isFineGrainedToken(value)) return TOKEN_FORMAT_ERROR;
      try {
        store.write(value);
      } catch {
        return "Impossible d’enregistrer le jeton dans ce navigateur.";
      }
      setCurrent(value);
      return null;
    },
    [store],
  );

  const forget = useCallback(() => {
    try {
      store.clear();
    } catch {
      // L’écran de connexion se réaffiche même si le navigateur refuse l’effacement.
    }
    setCurrent(null);
  }, [store]);

  return <TokenContext.Provider value={{ current, save, forget }}>{children}</TokenContext.Provider>;
}

export function useToken(): TokenContextValue {
  const value = useContext(TokenContext);
  if (!value) throw new Error("Jeton hors contexte.");
  return value;
}

function readValid(store: TokenStorage): string | null {
  const value = store.read();
  if (value === null) return null;
  if (isFineGrainedToken(value)) return value;
  try {
    store.clear();
  } catch {
    return null;
  }
  return null;
}
