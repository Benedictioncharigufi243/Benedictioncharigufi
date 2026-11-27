import { createContext, useCallback, useContext, useRef, useState } from "react";
import { api } from "@/lib/api";

const AuthCtx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const started = useRef(false);

  // Appele uniquement par la page /admin : les visiteurs ne font plus de requetes d'authentification.
  const ensure = useCallback(async () => {
    if (started.current) return;
    started.current = true;
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      try {
        await api.post("/auth/refresh");
        const { data } = await api.get("/auth/me");
        setUser(data);
      } catch {
        setUser(false);
      }
    }
  }, []);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(false);
    }
  };
  return <AuthCtx.Provider value={{ user, setUser, logout, ensure }}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => useContext(AuthCtx);
