// GripCast service worker — offline-friendly caching.
// App shell + tiles/fonts: cache-first. APIs: network-first with cache fallback
// (so the last-seen conditions still render at the track with no signal).
const CACHE = "gripcast-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isApi = /open-meteo|overpass|photon\.komoot|nominatim/.test(url.hostname);

  if (isApi) {
    e.respondWith(
      fetch(req)
        .then((r) => { const c = r.clone(); caches.open(CACHE).then((ca) => ca.put(req, c)); return r; })
        .catch(() => caches.match(req))
    );
    return;
  }
  // app shell, tiles, fonts → cache-first, fill cache on miss
  e.respondWith(
    caches.match(req).then((hit) =>
      hit || fetch(req).then((r) => { const c = r.clone(); caches.open(CACHE).then((ca) => ca.put(req, c)); return r; }).catch(() => hit)
    )
  );
});
