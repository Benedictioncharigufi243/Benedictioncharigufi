import axios from "axios";

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "").trim().replace(/\/+$/, "").replace(/\/api$/, "");
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, withCredentials: true });

// Cache memoire + sessionStorage : un seul appel reseau par ressource, partage entre composants.
const store = {};
const inflight = {};
const KEY = (p) => `api:${p}`;
const readCache = (p) => {
  if (store[p]) return store[p];
  try {
    const s = sessionStorage.getItem(KEY(p));
    if (s) return (store[p] = JSON.parse(s));
  } catch {}
  return null;
};
export const peekCache = (p) => readCache(p)?.data ?? null;
export const clearApiCache = () => {
  Object.keys(store).forEach((k) => delete store[k]);
  try {
    Object.keys(sessionStorage).filter((k) => k.startsWith("api:")).forEach((k) => sessionStorage.removeItem(k));
  } catch {}
};
export const cachedGet = (path, ttl = 120000) => {
  const hit = readCache(path);
  if (hit && Date.now() - hit.t < ttl) return Promise.resolve(hit.data);
  if (inflight[path]) return inflight[path];
  inflight[path] = api
    .get(path)
    .then(({ data }) => {
      const e = { t: Date.now(), data };
      store[path] = e;
      try { sessionStorage.setItem(KEY(path), JSON.stringify(e)); } catch {}
      return data;
    })
    .finally(() => { delete inflight[path]; });
  return inflight[path];
};

let refreshing = null;
api.interceptors.response.use(
  (r) => {
    const m = (r.config?.method || "get").toLowerCase();
    if (m !== "get" && /^\/(content|scenarios)/.test(r.config?.url || "")) clearApiCache();
    return r;
  },
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

const isLocal = (p) => p && !p.startsWith("http") && !p.startsWith("data:");
// w = largeur demandee : le serveur renvoie une version WebP redimensionnee et mise en cache.
export const imgSrc = (p, w) => {
  if (!p) return "";
  if (!isLocal(p)) return p;
  return `${API}/files/${p}${w ? `?w=${w}` : ""}`;
};
export const imgSet = (p, widths = [400, 800, 1200, 1600]) =>
  isLocal(p) ? widths.map((w) => `${API}/files/${p}?w=${w} ${w}w`).join(", ") : undefined;

export const youtubeEmbed = (url) => {
  if (!url) return "";
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
};

export const waLink = (number, text) =>
  `https://wa.me/${(number || "243990604665").replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
