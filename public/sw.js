// Service Worker for Full Offline PWA Support - Math Lessons Platform
// Version: math-lessons-v4

const CACHE_NAME = "math-lessons-v4";
const IMAGE_CACHE = "math-lessons-images-v4";

const PRECACHE_ASSETS = [
  "/",
  "/calculator",
  "/grades",
  "/rewards",
  "/assessment",
  "/honor",
  "/parents",
  "/year/1",
  "/year/2",
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// 1. Install Event: Pre-cache core shell & critical pages
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("Some pre-cache assets could not be cached immediately:", err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up outdated caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== IMAGE_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event: Multi-tier offline caching strategy
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET and browser extensions
  if (req.method !== "GET" || !url.protocol.startsWith("http")) return;

  // A) Caching strategy for Images (Board snapshots, uploads, icons, vercel blob)
  // Cache-First with background revalidation: once viewed, available offline forever!
  const isImage =
    req.destination === "image" ||
    url.pathname.startsWith("/uploads/") ||
    url.hostname.includes("blob.vercel-storage.com") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/i);

  if (isImage) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;

        try {
          const networkResponse = await fetch(req);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(req, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          // If offline and not in cache, fallback gracefully
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // B) Caching strategy for API calls: Stale-While-Revalidate for lessons API
  if (url.pathname.startsWith("/api/lessons")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(req, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Other APIs: Network first, fallback to cached error
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req).catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        return new Response(
          JSON.stringify({
            error: "أنت في وضع عدم الاتصال (بدون إنترنت)",
            offline: true,
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json; charset=utf-8" },
          }
        );
      })
    );
    return;
  }

  // C) HTML Pages Navigation: Network first, fallback to cache
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(async () => {
          // Fallback to cached route if available
          const cached = await caches.match(req);
          if (cached) return cached;

          // If navigating to year lessons or calculator, match specific precache
          if (url.pathname.startsWith("/year/1")) return (await caches.match("/year/1")) || Response.error();
          if (url.pathname.startsWith("/year/2")) return (await caches.match("/year/2")) || Response.error();
          if (url.pathname.startsWith("/calculator")) return (await caches.match("/calculator")) || Response.error();
          if (url.pathname.startsWith("/grades")) return (await caches.match("/grades")) || Response.error();

          // Ultimate fallback: home page
          return (await caches.match("/")) || Response.error();
        })
    );
    return;
  }

  // D) Static Assets (JS scripts, CSS styles, fonts): Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
