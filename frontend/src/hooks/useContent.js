import { useEffect, useState } from "react";
import { cachedGet, peekCache } from "@/lib/api";

const EMPTY_OBJ = {};
const EMPTY_LIST = [];

export function useResource(path, fallback) {
  // Valeur deja en cache = affichage immediat, puis revalidation silencieuse.
  const [data, setData] = useState(() => peekCache(path));
  useEffect(() => {
    let on = true;
    cachedGet(path)
      .then((d) => on && setData(d))
      .catch(() => on && setData((p) => p ?? fallback));
    return () => {
      on = false;
    };
  }, [path, fallback]);
  return data;
}

export const useContent = () => useResource("/content", EMPTY_OBJ);
export const useScenarios = () => useResource("/scenarios", EMPTY_LIST);
