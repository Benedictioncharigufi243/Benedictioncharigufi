import axios from "axios";

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "").trim().replace(/\/+$/, "").replace(/\/api$/, "");
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, withCredentials: true });

let refreshing = null;
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config || {};
    if (err.response?.status === 401 && !orig._retry && !(orig.url || "").includes("/auth/")) {
      orig._retry = true;
      refreshing = refreshing || api.post("/auth/refresh").finally(() => { refreshing = null; });
      try {
        await refreshing;
        return api(orig);
      } catch (e) {
        // fall through
      }
    }
    return Promise.reject(err);
  }
);

export const imgSrc = (p) => {
  if (!p) return "";
  if (p.startsWith("http") || p.startsWith("data:")) return p;
  return `${API}/files/${p}`;
};

export const youtubeEmbed = (url) => {
  if (!url) return "";
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
};

export const waLink = (number, text) =>
  `https://wa.me/${(number || "243990604665").replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const streamPost = async (path, body, onDelta) => {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.detail === "string" ? err.detail : "Erreur réseau");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop();
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const { delta } = JSON.parse(payload);
        if (delta) {
          full += delta;
          onDelta(full);
        }
      } catch {
        // ignore malformed chunk
      }
    }
  }
  return full;
};
