// POST { q } or { channelId } — resolve channel + latest videos
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  let q = "", channelId = "";
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    q = String(b.q || b.query || b.name || "").trim();
    channelId = String(b.channelId || b.id || "").trim();
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
      const r = await fetch(url, {
        signal: ctrl.signal,
        headers: { Accept: "application/json", "User-Agent": "RolxDesk/1.0" }
      });
      clearTimeout(t);
      if (!r.ok) return null;
      return await r.json();
    } catch {
      clearTimeout(t);
      return null;
    }
  }

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

  if (!channelId) {
    return res.status(404).json({ error: "Channel tidak ketemu", q });
  }

  let channel = { id: channelId, name: q || channelId };
  let videos = [];

  for (const base of bases) {
    const data = await fetchJson(base + "/channel/" + encodeURIComponent(channelId));
    if (!data) continue;
    channel = {
      id: channelId,
      name: data.name || channel.name,
      thumbnail: data.avatarUrl || data.thumbnail || "",
      description: String(data.description || "").slice(0, 200)
    };
    const related = data.relatedStreams || data.videos || [];
    const list = Array.isArray(related) ? related : [];
    videos = list
      .slice(0, 8)
      .map((v) => {
        const url = String(v.url || "");
        const idm =
          url.match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
          url.match(/\/watch\?v=([A-Za-z0-9_-]{11})/) ||
          url.match(/([A-Za-z0-9_-]{11})$/);
        const isLive =
          v.isLive ||
          v.livestream ||
          /live/i.test(String(v.type || "")) ||
          v.duration === -1;
        return {
          id: v.videoId || (idm && idm[1]) || "",
          title: v.title || "Untitled",
          isLive: !!isLive,
          uploaded: v.uploadedDate || v.uploaded || "",
          views: v.views,
          thumbnail: v.thumbnail || ""
        };
      })
      .filter((v) => v.id);
    if (videos.length) break;
  }

  return res.status(200).json({ channel, videos, latest: videos[0] || null });
}
