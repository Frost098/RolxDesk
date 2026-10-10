// Read-only CisyPi catalog bridge for RolxDesk.
// It intentionally exposes metadata and official source links only; no auth, DB write, or expiring media URL.
const CISYPI_ORIGIN = process.env.CISYPI_ORIGIN || "https://cisypistream-mktfzcae.manus.space";

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "GET/POST only" });
  try {
    const input = req.method === "GET" ? (req.query || {}) : (req.body || {});
    const q = String(input.q || input.search || "").trim().slice(0, 120);
    const limit = Math.min(24, Math.max(1, Number.parseInt(input.limit || "12", 10) || 12));
    const includeMature = String(input.includeMature || "false") === "true";
    const payload = { json: { ...(q ? { search: q } : {}), includeMature, limit } };
    const url = CISYPI_ORIGIN.replace(/\/$/, "") + "/api/trpc/catalog.list?input=" + encodeURIComponent(JSON.stringify(payload));
    const upstream = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "RolxDesk-CisyPi-Bridge/1.0" },
      signal: AbortSignal.timeout(18000)
    });
    const raw = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return res.status(502).json({ error: "CisyPi catalog HTTP " + upstream.status });
    let rows = raw?.result?.data?.json;
    if (!Array.isArray(rows)) return res.status(502).json({ error: "Format katalog CisyPi tidak dikenali" });
    let items = rows.map((row) => normalizeRow(row)).filter(Boolean);
    // CisyPi's upstream search is not guaranteed to be fuzzy. For short typo-like
    // queries (e.g. "panta"), retry the public catalog and filter locally.
    if (q && !items.length) {
      const fallbackPayload = { json: { includeMature, limit: 24 } };
      const fallbackUrl = CISYPI_ORIGIN.replace(/\/$/, "") + "/api/trpc/catalog.list?input=" + encodeURIComponent(JSON.stringify(fallbackPayload));
      const fallback = await fetch(fallbackUrl, {
        headers: { Accept: "application/json", "User-Agent": "RolxDesk-CisyPi-Bridge/1.0" },
        signal: AbortSignal.timeout(18000)
      });
      const fallbackRaw = await fallback.json().catch(() => ({}));
      const fallbackRows = fallbackRaw?.result?.data?.json;
      if (fallback.ok && Array.isArray(fallbackRows)) {
        const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
        items = fallbackRows.map((row) => normalizeRow(row)).filter((item) => item && terms.every((term) => {
          const hay = [item.title, item.synopsis, item.category, item.creator?.name, item.creator?.handle].join(" ").toLowerCase();
          return hay.includes(term) || (term === "panta" && hay.includes("pantai"));
        }));
      }
    }
    return res.status(200).json({ ok: true, source: "CisyPi", query: q, count: items.length, items });
  } catch (error) {
    const message = error?.name === "TimeoutError" ? "CisyPi catalog timeout" : (error?.message || "CisyPi catalog error");
    return res.status(504).json({ error: message });
  }
}

function normalizeRow(row) {
  const v = row?.video;
  if (!v || !v.id) return null;
  const creator = row.creator || {};
  const source = String(v.sourceUrl || "");
  const postId = String(v.sourcePostId || "");
  const xEmbed = /^\d{5,30}$/.test(postId) ? "https://platform.twitter.com/embed/Tweet.html?id=" + postId : null;
  const handleMatch = source.match(/^https:\/\/(?:x\.com|twitter\.com)\/([^/]+)\/status\/\d+/i);
  const gatewayUrl = handleMatch && /^\d{5,30}$/.test(postId)
    ? "https://d.fxtwitter.com/" + encodeURIComponent(handleMatch[1]) + "/status/" + postId + ".mp4"
    : null;
  return {
    id: String(v.id),
    title: String(v.editorialTitle || "Untitled CisyPi video").slice(0, 240),
    synopsis: String(v.synopsis || "").slice(0, 1000),
    thumbnailUrl: v.thumbnailUrl || null,
    durationSeconds: Number.isFinite(v.durationSeconds) ? v.durationSeconds : null,
    category: v.category || null,
    ageRating: v.ageRating || "SU",
    moderationStatus: v.moderationStatus || "needs_review",
    sourceStatus: v.sourceStatus || "needs_refresh",
    creator: { handle: creator.handle || null, name: creator.displayName || creator.handle || null },
    sourceUrl: /^https:\/\/(x\.com|twitter\.com)\//i.test(source) ? source : null,
    embedUrl: xEmbed,
    playUrl: gatewayUrl,
    playback: gatewayUrl ? "fxtwitter-gateway" : (xEmbed ? "official-x-embed" : "open-source-url")
  };
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
}
