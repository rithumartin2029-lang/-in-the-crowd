// Service worker for "In the Crowd" — a Progressive Web App shell cache.
// Caches the app shell (HTML, JS, CSS, fonts, icons) so the site can boot
// offline or on a flaky connection. Network-first for HTML (so users get
// fresh content when online), cache-first for static assets.

const VERSION = "itc-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;

const SHELL_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Add shell resources one by one so a single failure doesn't abort the install.
      await Promise.all(
        SHELL_URLS.map(async (url) => {
          try {
            await cache.add(new Request(url, { cache: "reload" }));
          } catch (e) {
            // Ignore individual failures — the SW can still install.
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Only handle same-origin requests; let cross-origin (fonts, analytics) pass through.
  if (url.origin !== self.location.origin) return;

  // Skip Next.js dev-only HMR / RSC requests to avoid interfering with dev.
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;

  // Network-first for navigation (HTML) requests so users always get fresh
  // content when online, but fall back to cached shell when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(SHELL_CACHE);
          cache.put("/", fresh.clone()).catch(() => {});
          return fresh;
        } catch (e) {
          const cache = await caches.open(SHELL_CACHE);
          const cached = await cache.match("/");
          if (cached) return cached;
          throw e;
        }
      })()
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, fonts, icons, images).
  event.respondWith(
    (async () => {
      const cache = await caches.open(ASSET_CACHE);
      const cached = await cache.match(req);
      if (cached) {
        // Refresh in background.
        fetch(req)
          .then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone()).catch(() => {});
          })
          .catch(() => {});
        return cached;
      }
      try {
        const res = await fetch(req);
        if (res && res.status === 200 && (res.type === "basic" || res.type === "default")) {
          cache.put(req, res.clone()).catch(() => {});
        }
        return res;
      } catch (e) {
        // Fall back to /icon.svg for missing image/icon requests.
        if (req.destination === "image") {
          const icon = await caches.match("/icon.svg");
          if (icon) return icon;
        }
        throw e;
      }
    })()
  );
});
