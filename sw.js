/* RolxDesk service worker — offline shell v1 */
const CACHE = "rd-shell-v109";
const PRECACHE = ["/", "/index.html", "/manifest.webmanifest"];

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

  event.respondWith(
    (async () => {
      const isNav = req.mode === "navigate";
      const isStatic =
        /\.(js|css|b64|webmanifest|svg|png|jpg|woff2?)$/i.test(url.pathname) ||
        url.pathname.startsWith("/extras") ||
        url.pathname.startsWith("/ui.p");

      if (isStatic) {
        const cached = await caches.match(req);
        if (cached) {
          fetch(req)
            .then(async (r) => {
              if (r && r.ok) {
                const c = await caches.open(CACHE);
                c.put(req, r.clone()).catch(() => {});
              }
            })
            .catch(() => {});
          return cached;
        }
        try {
          const r = await fetch(req);
          if (r && r.ok) {
            const c = await caches.open(CACHE);
            c.put(req, r.clone()).catch(() => {});
          }
          return r;
        } catch (e) {
          return cached || new Response("", { status: 503 });
        }
      }

      try {
        const net = await fetch(req);
        if (net && net.ok && url.origin === self.location.origin) {
          const c = await caches.open(CACHE);
          c.put(req, net.clone()).catch(() => {});
        }
        return net;
      } catch (e) {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (isNav) {
          const shell = (await caches.match("/index.html")) || (await caches.match("/"));
          if (shell) return shell;
          return new Response(
            "<!DOCTYPE html><html><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>RD Offline</title></head>" +
              "<body style='margin:0;background:#070708;color:#eee;font-family:system-ui;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:24px'>" +
              "<div><div style='font-size:48px;font-weight:800;letter-spacing:-.04em;margin-bottom:12px'>RD</div>" +
              "<p>Offline mode</p><p style='opacity:.65;font-size:14px;max-width:280px;margin:8px auto 0'>UI tersimpan di perangkat. Chat AI butuh internet — draft lokal tetap aman.</p></div></body></html>",
            { headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        }
        return new Response("Offline", { status: 503 });
      }
    })()
  );
});
