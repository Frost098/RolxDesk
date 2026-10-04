// POST /api/yt-search { q }
// Piped/Invidious — rank by title/uploader match; prefer channel latest
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

  const raw = q;
  const wantsLatest = /\b(terbaru|latest|newest|baru)\b/i.test(q);
  let channelHint = "";
  const chM =
    q.match(/(?:terbaru|latest)\s+(?:oleh|dari|by|channel)?\s*([A-Za-z0-9_.\- ]{2,40})/i) ||
    q.match(/(?:oleh|dari|by|channel)\s+([A-Za-z0-9_.\- ]{2,40})/i) ||
    q.match(/video\s+terbaru\s+([A-Za-z0-9_.\- ]{2,40})/i);
  if (chM) channelHint = chM[1].replace(/\b(video|lagu|song|official)\b/gi, "").trim();

  let searchQ = q
    .replace(/^(putar|play)\s+(video\s+)?/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (wantsLatest && channelHint) {
    searchQ = channelHint + " ";
  } else if (wantsLatest) {
    searchQ = searchQ.replace(/\b(terbaru|latest|newest)\b/gi, "").trim();
  }
  if (/\blagu\b|\bsong\b|official audio/i.test(q) && !/official/i.test(searchQ)) {
    searchQ = searchQ + " official audio";
  }

  const tokens = searchQ
    .toLowerCase()
    .split(/[^a-z0-9_\u00c0-\u024f]+/i)
    .filter((t) => t.length > 1 && !/^(the|and|official|video|audio|lyric|lyrics|mv|hq)$/i.test(t));

  const qq = encodeURIComponent(searchQ.trim() || q);
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
    if (it.id && typeof it.id === "object" && validId(it.id.videoId)) return it.id.videoId;
    if (typeof it.url === "string") {
      const m2 = it.url.match(/[?&]v=([A-Za-z0-9_-]{11})/) || it.url.match(/\/watch\?v=([A-Za-z0-9_-]{11})/);
      if (m2 && validId(m2[1])) return m2[1];
      const bare = it.url.replace(/^\//, "").replace(/^watch\?v=/, "");
      if (validId(bare)) return bare;
    }
    return null;
  }
  function scoreItem(it) {
    const title = String(it.title || it.name || "").toLowerCase();
    const uploader = String(
      it.uploaderName || it.author || it.ownerName || it.channel || it.channelName || it.uploader || ""
    ).toLowerCase();
    let score = 0;
    const ch = (channelHint || "").toLowerCase().replace(/\s+/g, "");
    if (ch) {
      const up = uploader.replace(/\s+/g, "");
      if (up.includes(ch) || ch.includes(up)) score += 50;
      if (title.replace(/\s+/g, "").includes(ch)) score += 20;
    }
    for (const tok of tokens) {
      if (title.includes(tok)) score += 8;
      if (uploader.includes(tok)) score += 12;
    }
    if (title.length < 80) score += 2;
    return score;
  }

  const tried = [];
  const candidates = [];

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
      let items = Array.isArray(data) ? data : data.items || data.results || [];
      let n = 0;
      for (const it of items) {
        if (n >= 12) break;
        const type = (it.type || it.kind || "").toLowerCase();
        if (type && type !== "video" && type !== "stream" && type !== "short") continue;
        const id = pickId(it);
        if (!id || !validId(id)) continue;
        n++;
        candidates.push({
          id,
          title: it.title || it.name || searchQ,
          uploader: it.uploaderName || it.author || it.channelName || "",
          score: scoreItem(it),
          source: src.kind
        });
      }
      if (candidates.some((c) => c.score >= 50)) break;
    } catch (e) {
      tried.push(src.kind + ":err");
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  if (channelHint && candidates.length) {
    const best = candidates[0];
    const ch = channelHint.toLowerCase();
    const blob = (best.title + " " + best.uploader).toLowerCase();
    if (best.score < 12 && !blob.includes(ch.split(/\s+/)[0])) {
      return res.status(404).json({
        error: "Tidak ketemu video cocok untuk channel/query",
        search: "https://www.youtube.com/results?search_query=" + encodeURIComponent(searchQ),
        query: searchQ,
        channelHint,
        bestTitle: best.title,
        bestScore: best.score,
        tried
      });
    }
  }

  if (candidates.length) {
    const best = candidates[0];
    return res.status(200).json({
      id: best.id,
      title: best.title,
      uploader: best.uploader,
      url: "https://youtu.be/" + best.id,
      source: best.source,
      score: best.score,
      query: searchQ,
      raw,
      tried
    });
  }

  return res.status(404).json({
    error: "Tidak ketemu video valid",
    search: "https://www.youtube.com/results?search_query=" + encodeURIComponent(searchQ),
    query: searchQ,
    tried
  });
}
