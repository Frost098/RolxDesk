// POST /api/yt-search { q }
// Free Piped/Invidious — only valid 11-char IDs
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

  let searchQ = q
    .replace(/^(putar|play)\s+(video\s+)?/i, "")
    .replace(/\b(terbaru|latest|oleh|by|dari|channel)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim() || q;

  const qq = encodeURIComponent(searchQ);
  const sources = [
    { url: "https://api.piped.private.coffee/search?q=" + qq + "&filter=videos", kind: "piped" },
    { url: "https://pipedapi.kavin.rocks/search?q=" + qq + "&filter=videos", kind: "piped" },
    { url: "https://pipedapi.adminforge.de/search?q=" + qq + "&filter=videos", kind: "piped" },
    { url: "https://invidious.flokinet.to/api/v1/search?q=" + qq + "&type=video", kind: "invidious" },
    { url: "https://invidious.nerdvpn.de/api/v1/search?q=" + qq + "&type=video", kind: "invidious" },
    { url: "https://yt.artemislena.eu/api/v1/search?q=" + qq + "&type=video", kind: "invidious" }
  ];

  function validId(id) {
    return typeof id === "string" && /^[A-Za-z0-9_-]{11}$/.test(id);
  }
  function pickId(it) {
    if (!it || typeof it !== "object") return null;
    if (validId(it.videoId)) return it.videoId;
    if (validId(it.id)) return it.id;
    if (typeof it.url === "string") {
      const m2 = it.url.match(/[?&]v=([A-Za-z0-9_-]{11})/) || it.url.match(/\/watch\?v=([A-Za-z0-9_-]{11})/);
      if (m2 && validId(m2[1])) return m2[1];
      const bare = it.url.replace(/^\//, "").replace(/^watch\?v=/, "");
      if (validId(bare)) return bare;
    }
    return null;
  }

  const tried = [];
  for (const src of sources) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(src.url, {
        signal: ctrl.signal,
        headers: { Accept: "application/json", "User-Agent": "RolxDesk/1.0" }
      });
      clearTimeout(t);
      tried.push(src.kind + ":" + r.status);
      if (!r.ok) continue;
      const data = await r.json().catch(() => null);
      if (!data) continue;
      let items = Array.isArray(data) ? data : (data.items || data.results || []);
      for (const it of items) {
        const type = (it.type || it.kind || "").toLowerCase();
        if (type && type !== "video" && type !== "stream") continue;
        let id = pickId(it);
        if (!id && typeof it.url === "string") {
          const pm = it.url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
          if (pm) id = pm[1];
        }
        if (!id || !validId(id)) continue;
        const title = it.title || it.name || searchQ;
        return res.status(200).json({
          id,
          title,
          url: "https://youtu.be/" + id,
          source: src.kind,
          query: searchQ,
          tried
        });
      }
    } catch (e) {
      tried.push(src.kind + ":err");
    }
  }

  return res.status(404).json({
    error: "Tidak ketemu video valid",
    search: "https://www.youtube.com/results?search_query=" + encodeURIComponent(searchQ),
    query: searchQ,
    tried
  });
}
