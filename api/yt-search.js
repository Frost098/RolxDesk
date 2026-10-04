// POST /api/yt-search { q } OR { channelId } / { q, channel:true }
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  let q = "", channelId = "", wantChannel = false;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    q = String(body.q || body.query || body.name || "").trim();
    channelId = String(body.channelId || body.id || "").trim();
    wantChannel = !!(channelId || body.channel === true || body.action === "channel");
  } catch (_) {}

  const bases = [
    "https://api.piped.private.coffee",
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de"
  ];
  async function fetchJson(url) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    try {
      const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json", "User-Agent": "RolxDesk/1.0" } });
      clearTimeout(t);
      if (!r.ok) return null;
      return await r.json();
    } catch { clearTimeout(t); return null; }
  }

  if (wantChannel || channelId) {
    if (!channelId && q) {
      for (const base of bases) {
        const data = await fetchJson(base + "/search?q=" + encodeURIComponent(q) + "&filter=channels");
        const items = Array.isArray(data) ? data : data?.items || [];
        const ch = items.find((it) => (it.type || "").toLowerCase() === "channel") || items[0];
        if (ch) {
          const url = String(ch.url || ch.id || "");
          const m = url.match(/channel\/(UC[\w-]+)/) || url.match(/(UC[\w-]{20,})/);
          channelId = m ? m[1] : String(ch.id || "").replace(/^\/channel\//, "");
          if (channelId) break;
        }
      }
    }
    if (!channelId) return res.status(404).json({ error: "Channel tidak ketemu", q });
    let channel = { id: channelId, name: q || channelId };
    let videos = [];
    for (const base of bases) {
      const data = await fetchJson(base + "/channel/" + encodeURIComponent(channelId));
      if (!data) continue;
      channel = { id: channelId, name: data.name || channel.name, thumbnail: data.avatarUrl || data.thumbnail || "", description: String(data.description || "").slice(0, 200) };
      const related = data.relatedStreams || data.videos || [];
      const list = Array.isArray(related) ? related : [];
      videos = list.slice(0, 8).map((v) => {
        const url = String(v.url || "");
        const idm = url.match(/[?&]v=([A-Za-z0-9_-]{11})/) || url.match(/\/watch\?v=([A-Za-z0-9_-]{11})/) || url.match(/([A-Za-z0-9_-]{11})$/);
        const isLive = v.isLive || v.livestream || /live/i.test(String(v.type || "")) || v.duration === -1;
        return { id: v.videoId || (idm && idm[1]) || "", title: v.title || "Untitled", isLive: !!isLive, uploaded: v.uploadedDate || v.uploaded || "", views: v.views, thumbnail: v.thumbnail || "" };
      }).filter((v) => v.id);
      if (videos.length) break;
    }
    return res.status(200).json({ channel, videos, latest: videos[0] || null });
  }

  if (!q) return res.status(400).json({ error: "q kosong" });

  const raw = q;
  const wantsLatest = /\b(terbaru|latest|newest|baru)\b/i.test(q);
  let channelHint = "";
  const chM =
    q.match(/(?:terbaru|latest)\s+(?:oleh|dari|by|channel)?\s*([A-Za-z0-9_.\- ]{2,40})/i) ||
    q.match(/(?:oleh|dari|by|channel)\s+([A-Za-z0-9_.\- ]{2,40})/i) ||
    q.match(/video\s+terbaru\s+([A-Za-z0-9_.\- ]{2,40})/i);
  if (chM) channelHint = chM[1].replace(/\b(video|lagu|song|official)\b/gi, "").trim();

  let searchQ = q.replace(/^(putar|play)\s+(video\s+)?/i, "").replace(/\s+/g, " ").trim();
  if (wantsLatest && channelHint) searchQ = channelHint + " ";
  else if (wantsLatest) searchQ = searchQ.replace(/\b(terbaru|latest|newest)\b/gi, "").trim();
  if (/\blagu\b|\bsong\b|official audio/i.test(q) && !/official/i.test(searchQ)) searchQ = searchQ + " official audio";

  const tokens = searchQ.toLowerCase().split(/[^a-z0-9_\u00c0-\u024f]+/i).filter((t) => t.length > 1 && !/^(the|and|official|video|audio|lyric|lyrics|mv|hq)$/i.test(t));
  const qq = encodeURIComponent(searchQ.trim() || q);
  const sources = [
    { url: bases[0] + "/search?q=" + qq + "&filter=videos", kind: "piped" },
    { url: bases[1] + "/search?q=" + qq + "&filter=videos", kind: "piped" },
    { url: "https://invidious.flokinet.to/api/v1/search?q=" + qq + "&type=video", kind: "invidious" }
  ];

  function validId(id) { return typeof id === "string" && /^[A-Za-z0-9_-]{11}$/.test(id); }
  function pickId(it) {
    if (!it || typeof it !== "object") return null;
    if (validId(it.videoId)) return it.videoId;
    if (validId(it.id)) return it.id;
    if (typeof it.url === "string") {
      const m2 = it.url.match(/[?&]v=([A-Za-z0-9_-]{11})/) || it.url.match(/\/watch\?v=([A-Za-z0-9_-]{11})/);
      if (m2 && validId(m2[1])) return m2[1];
    }
    return null;
  }
  function scoreItem(it) {
    const title = String(it.title || "").toLowerCase();
    const uploader = String(it.uploaderName || it.author || it.channelName || "").toLowerCase();
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
    return score;
  }

  const tried = [];
  const candidates = [];
  for (const src of sources) {
    try {
      const data = await fetchJson(src.url);
      tried.push(src.kind);
      if (!data) continue;
      let items = Array.isArray(data) ? data : data.items || data.results || [];
      for (const it of items.slice(0, 12)) {
        const type = (it.type || "").toLowerCase();
        if (type && type !== "video" && type !== "stream") continue;
        const id = pickId(it);
        if (!id) continue;
        candidates.push({ id, title: it.title || searchQ, uploader: it.uploaderName || it.author || "", score: scoreItem(it), source: src.kind });
      }
      if (candidates.some((c) => c.score >= 50)) break;
    } catch (e) { tried.push(src.kind + ":err"); }
  }
  candidates.sort((a, b) => b.score - a.score);
  if (candidates.length) {
    const best = candidates[0];
    return res.status(200).json({ id: best.id, title: best.title, uploader: best.uploader, url: "https://youtu.be/" + best.id, source: best.source, score: best.score, query: searchQ, raw, tried });
  }
  return res.status(404).json({ error: "Tidak ketemu video valid", search: "https://www.youtube.com/results?search_query=" + encodeURIComponent(searchQ), query: searchQ, tried });
}
