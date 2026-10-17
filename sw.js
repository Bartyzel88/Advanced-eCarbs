// Planer eCarbs: offline copy of the app itself. Nightscout and fonts are never cached or touched.
const CACHE = "planer-ecarbs-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(SHELL.map(url => cache.add(url).catch(() => {})));   // a missing file must not block install
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

// Network first, so a new version on GitHub Pages is used as soon as you are online;
// the cached copy is only a fallback without network.
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    } catch (e) {
      const cached = await caches.match(req, { ignoreSearch: true });
      return cached || (req.mode === "navigate" ? caches.match("./index.html") : Response.error());
    }
  })());
});
