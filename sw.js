/* RolxDesk service worker — offline shell v119 network-first JS */
const CACHE = "rd-shell-v119";
const PRECACHE = ["/", "/index.html", "/manifest.webmanifest", "/icons/icon-192.svg", "/icons/icon-512.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        PRECACHE.map((url) =>
          fetch(url, { cache: "no-cache" })
            .then((r) => (r.ok ? cache.put(url, r) : null))
            .catch(() => null)
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) return;

  const isVersionedJs =
    /\/extras[^/]*\.js$/i.test(url.pathname) ||
    /[?&]v=\d+/.test(url.search) ||
    url.pathname === "/sw.js";

  event.respondWith(
    (async () => {
      if (isVersionedJs) {
        try {
          const net = await fetch(req, { cache: "no-store" });
          if (net && net.ok) {
            const c = await caches.open(CACHE);
            c.put(req, net.clone()).catch(() => {});
          }
          return net;
        } catch (e) {
          const cached = await caches.match(req);
          return cached || new Response("/* offline */", { status: 503, headers: { "Content-Type": "application/javascript" } });
        }
      }

      const isNav = req.mode === "navigate";
      const isStatic =
        /\.(js|css|b64|webmanifest|svg|png|jpg|woff2?)$/i.test(url.pathname) ||
        url.pathname.startsWith("/extras") ||
        url.pathname.startsWith("/ui.p") ||
        url.pathname.startsWith("/icons");

      if (isStatic) {
        try {
          const r = await fetch(req);
          if (r && r.ok) {
            const c = await caches.open(CACHE);
            c.put(req, r.clone()).catch(() => {});
          }
          return r;
        } catch (e) {
          const cached = await caches.match(req);
          return cached || new Response("", { status: 503 });
        }
      }

      if (isNav) {
        try {
          const net = await fetch(req);
          if (net && net.ok) {
            const c = await caches.open(CACHE);
            c.put(req, net.clone()).catch(() => {});
          }
          return net;
        } catch (e) {
          return (await caches.match("/index.html")) || (await caches.match("/")) || new Response("Offline", { status: 503 });
        }
      }

      try {
        return await fetch(req);
      } catch (e) {
        return (await caches.match(req)) || new Response("", { status: 503 });
      }
    })()
  );
});
