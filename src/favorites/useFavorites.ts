import { useCallback, useRef, useState } from "react";
import { readFavoriteIds, writeFavoriteIds } from "./storage";

export function useFavorites() {
  const [ids, setIds] = useState<ReadonlySet<string>>(() => new Set(readFavoriteIds()));
  const idsRef = useRef(ids);
  idsRef.current = ids;

  const toggle = useCallback((id: string) => {
    const next = new Set(idsRef.current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    idsRef.current = next;
    writeFavoriteIds([...next]);
    setIds(next);
  }, []);

  return { ids, toggle };
}
