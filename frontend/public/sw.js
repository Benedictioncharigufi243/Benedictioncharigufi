/* Service worker : chargement rapide et lecture hors-ligne. Versionner CACHE pour tout vider. */
const VERSION = "v1";
const STATIC = `static-${VERSION}`;
const PAGES = `pages-${VERSION}`;
const DATA = `data-${VERSION}`;
const IMAGES = `images-${VERSION}`;
const KEEP = [STATIC, PAGES, DATA, IMAGES];
const MAX_IMAGES = 80;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(name, max) {
  const c = await caches.open(name);
  const keys = await c.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => c.delete(k)));
}

const networkFirst = async (req, cacheName, fallbackKey) => {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(fallbackKey || req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(fallbackKey || req);
    if (hit) return hit;
    throw err;
  }
};

const cacheFirst = async (req, cacheName) => {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
};

// Affiche tout de suite la copie en cache et la met a jour en arriere-plan.
const staleWhileRevalidate = async (req, cacheName, max) => {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const update = fetch(req)
    .then((res) => {
      if (res.ok || res.type === "opaque") {
        cache.put(req, res.clone());
        if (max) trim(cacheName, max);
      }
      return res;
    })
    .catch(() => hit);
  return hit || update;
};

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Jamais de cache pour l'authentification, les envois ou l'admin.
  if (/\/api\/(auth|upload)/.test(url.pathname) || url.pathname.startsWith("/admin")) return;

  // Pages : reseau d'abord, copie du site si hors-ligne.
  if (req.mode === "navigate") {
    e.respondWith(networkFirst(req, PAGES, "/index.html").catch(() => caches.match("/index.html")));
    return;
  }
  // Fichiers du site (noms uniques) : cache d'abord.
  if (url.origin === self.location.origin && url.pathname.startsWith("/static/")) {
    e.respondWith(cacheFirst(req, STATIC));
    return;
  }
  // Photos et PDF servis par l'API.
  if (url.pathname.includes("/api/files/")) {
    e.respondWith(staleWhileRevalidate(req, IMAGES, MAX_IMAGES));
    return;
  }
  // Contenu du site et scenarios.
  if (/\/api\/(content|scenarios)/.test(url.pathname)) {
    e.respondWith(networkFirst(req, DATA));
  }
});
