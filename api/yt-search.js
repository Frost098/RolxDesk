// POST /api/yt-search  { q: "lagu" }
// Gratis: Piped / Invidious — ambil videoId pertama (tanpa YouTube Data API key)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  let q = "";
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    q = String(body.q || body.query || "").trim();
  } catch (_) {}
  if (!q) return res.status(400).json({ error: "q kosong" });

  const qq = encodeURIComponent(q);
  const sources = [
    "https://pipedapi.kavin.rocks/search?q=" + qq + "&filter=videos",
    "https://pipedapi.adminforge.de/search?q=" + qq + "&filter=videos",
    "https://invidious.nerdvpn.de/api/v1/search?q=" + qq + "&type=video",
    "https://yt.artemislena.eu/api/v1/search?q=" + qq + "&type=video"
  ];

  for (const url of sources) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(url, {
        signal: ctrl.signal,
        headers: { Accept: "application/json", "User-Agent": "RolxDesk/1.0" }
      });
      clearTimeout(t);
      if (!r.ok) continue;
      const data = await r.json().catch(() => null);
      if (!data) continue;

      let items = Array.isArray(data) ? data : (data.items || data.results || []);
      for (const it of items) {
        const id =
          it.videoId ||
          it.id ||
          (typeof it.url === "string" && (it.url.match(/[?&]v=([A-Za-z0-9_-]{6,})/) || [])[1]) ||
          (typeof it.url === "string" && it.url.replace(/^\//, "").length === 11 ? it.url.replace(/^\//, "") : null);
        const title = it.title || it.name || q;
        if (id && /^[A-Za-z0-9_-]{6,15}$/.test(id)) {
          return res.status(200).json({
            id: id,
            title: title,
            url: "https://youtu.be/" + id
          });
        }
      }
    } catch (_) {}
  }

  return res.status(404).json({
    error: "Tidak ketemu video",
    search: "https://www.youtube.com/results?search_query=" + qq
  });
}
