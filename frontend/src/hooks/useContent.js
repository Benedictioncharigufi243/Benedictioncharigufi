import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function useContent() {
  const [content, setContent] = useState(null);
  useEffect(() => {
    let on = true;
    api
      .get("/content")
      .then((r) => on && setContent(r.data))
      .catch(() => on && setContent({}));
    return () => {
      on = false;
    };
  }, []);
  return content;
}
