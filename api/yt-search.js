// POST /api/yt-search { q } OR { q, channel:true } OR { channelId }
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch (_) {}

  let q = String(body.q || body.query || "").trim();
  let channelId = String(body.channelId || body.id || "").trim();
  const wantChannel = !!(channelId || body.channel === true || body.action === "channel");

  q = q
    .replace(/^(?:coba\s+)?(?:tolong\s+)?(?:play|putar|tonton)\s+/i, "")
    .replace(/\b(?:video|youtube|yt)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  try {
    if (wantChannel || channelId) {
      const ch = await resolveChannel(q, channelId);
      if (!ch || !ch.id) return res.status(404).json({ error: "Channel tidak ketemu", q });
      const videos = await channelVideos(ch.id, ch.name || q);
      const latest = videos[0] || null;
      return res.status(200).json({
        channel: ch,
        videos,
        latest,
        id: latest && latest.id,
        title: latest && latest.title,
        uploader: ch.name
      });
    }

    if (!q) return res.status(400).json({ error: "q required" });

    const results = await searchVideos(q, 8);
    if (!results.length) {
      return res.status(404).json({ error: "Video tidak ditemukan", query: q, tried: ["innertube"] });
    }
    const best = results[0];
    return res.status(200).json({
      id: best.id,
      title: best.title,
      uploader: best.uploader,
      url: "https://youtu.be/" + best.id,
      results,
      source: best.source || "innertube",
      query: q
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || "yt-search error" });
  }
}

const INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const INNERTUBE_CTX = {
  client: { clientName: "WEB", clientVersion: "2.20240101.00.00", hl: "en", gl: "US" }
};

async function innertube(endpoint, payload) {
  const url =
    "https://www.youtube.com/youtubei/v1/" + endpoint + "?key=" + INNERTUBE_KEY + "&prettyPrint=false";
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    },
    body: JSON.stringify({ context: INNERTUBE_CTX, ...payload })
  });
  if (!r.ok) throw new Error("innertube HTTP " + r.status);
  return r.json();
}

function walkRuns(runs) {
  if (!Array.isArray(runs)) return "";
  return runs.map((r) => r.text || "").join("");
}

function extractVideoFromRenderer(vr) {
  if (!vr) return null;
  const id = vr.videoId;
  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
  const title = walkRuns(vr.title && vr.title.runs) || (vr.title && vr.title.simpleText) || id;
  const uploader =
    walkRuns(vr.ownerText && vr.ownerText.runs) ||
    walkRuns(vr.shortBylineText && vr.shortBylineText.runs) ||
    "";
  return { id, title, uploader, source: "innertube" };
}

function extractChannelFromRenderer(cr) {
  if (!cr) return null;
  const id =
    cr.channelId ||
    (cr.navigationEndpoint &&
      cr.navigationEndpoint.browseEndpoint &&
      cr.navigationEndpoint.browseEndpoint.browseId) ||
    "";
  if (!id || !String(id).startsWith("UC")) return null;
  const name = walkRuns(cr.title && cr.title.runs) || (cr.title && cr.title.simpleText) || id;
  let thumbnail = "";
  try {
    const th = (cr.thumbnail && cr.thumbnail.thumbnails) || [];
    thumbnail = (th[th.length - 1] || th[0] || {}).url || "";
  } catch (_) {}
  return { id, name, thumbnail, source: "innertube" };
}

function sectionItems(data) {
  const sections =
    (data.contents &&
      data.contents.twoColumnSearchResultsRenderer &&
      data.contents.twoColumnSearchResultsRenderer.primaryContents &&
      data.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer &&
      data.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents) ||
    [];
  const items = [];
  for (const sec of sections) {
    const list = (sec.itemSectionRenderer && sec.itemSectionRenderer.contents) || [];
    for (const it of list) items.push(it);
  }
  return items;
}

async function searchVideos(query, limit) {
  const data = await innertube("search", { query });
  const out = [];
  for (const it of sectionItems(data)) {
    const v = extractVideoFromRenderer(it.videoRenderer);
    if (v) out.push(v);
    if (out.length >= (limit || 8)) break;
  }
  const ql = String(query || "")
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);
  out.forEach((v) => {
    let score = 0;
    const t = (v.title + " " + v.uploader).toLowerCase();
    ql.forEach((tok) => {
      if (t.includes(tok)) score += 3;
    });
    v.score = score;
  });
  out.sort((a, b) => (b.score || 0) - (a.score || 0));
  return out;
}

async function searchChannels(query) {
  const data = await innertube("search", { query });
  const out = [];
  for (const it of sectionItems(data)) {
    const c = extractChannelFromRenderer(it.channelRenderer);
    if (c) out.push(c);
  }
  // also from video uploaders — skip
  const ql = String(query || "")
    .toLowerCase()
    .replace(/\s+/g, "");
  out.sort((a, b) => {
    const an = a.name.toLowerCase().replace(/\s+/g, "");
    const bn = b.name.toLowerCase().replace(/\s+/g, "");
    const as = an === ql ? 10 : an.includes(ql) || ql.includes(an) ? 5 : 0;
    const bs = bn === ql ? 10 : bn.includes(ql) || ql.includes(bn) ? 5 : 0;
    return bs - as;
  });
  return out;
}

async function resolveChannel(q, channelId) {
  if (channelId && String(channelId).startsWith("UC")) {
    return { id: channelId, name: q || channelId };
  }
  if (!q) return null;
  const channels = await searchChannels(q);
  if (channels[0]) return channels[0];
  // fallback: ambil channel dari video search pertama
  const vids = await searchVideos(q, 5);
  if (vids[0] && vids[0].uploader) {
    const again = await searchChannels(vids[0].uploader);
    if (again[0]) return again[0];
  }
  return null;
}

async function channelVideos(channelId, name) {
  try {
    const data = await innertube("browse", {
      browseId: channelId,
      params: "EgZ2aWRlb3PyBgQKAjoA"
    });
    const out = [];
    const tabs =
      (data.contents &&
        data.contents.twoColumnBrowseResultsRenderer &&
        data.contents.twoColumnBrowseResultsRenderer.tabs) ||
      [];
    for (const tab of tabs) {
      const content = tab.tabRenderer && tab.tabRenderer.content;
      const rich =
        (content && content.richGridRenderer && content.richGridRenderer.contents) || [];
      for (const item of rich) {
        const vr =
          (item.richItemRenderer &&
            item.richItemRenderer.content &&
            item.richItemRenderer.content.videoRenderer) ||
          null;
        const v = extractVideoFromRenderer(vr);
        if (v) out.push(v);
        if (out.length >= 12) break;
      }
      if (out.length) break;
    }
    if (out.length) return out;
  } catch (_) {}
  if (name) return await searchVideos(name, 8);
  return [];
}
