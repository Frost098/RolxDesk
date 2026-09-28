// Proxy research (hindari CORS browser)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const q = String((req.query && req.query.q) || "").trim();
  if (!q) return res.status(400).json({ error: "q required", bits: [], text: "" });

  const bits = [];

  for (const lang of ["id", "en"]) {
    try {
      const title = q.split(/\s+/).slice(0, 8).join(" ");
      const wurl = "https://" + lang + ".wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title);
      const wr = await fetch(wurl, { headers: { "User-Agent": "RolxDesk/1.0" } });
      if (wr.ok) {
        const wj = await wr.json();
        if (wj.extract) {
          bits.push("[Wikipedia " + lang + "] " + String(wj.extract).slice(0, 800));
          if (wj.content_urls && wj.content_urls.desktop && wj.content_urls.desktop.page) {
            bits.push("Sumber: " + wj.content_urls.desktop.page);
          }
          break;
        }
      }
    } catch (e) {
      bits.push("Wiki " + lang + ": " + (e.message || "fail"));
    }
  }

  try {
    const ddg = "https://api.duckduckgo.com/?q=" + encodeURIComponent(q) + "&format=json&no_html=1&skip_disambig=1";
    const r = await fetch(ddg, { headers: { "User-Agent": "RolxDesk/1.0" } });
    const raw = await r.text();
    if (raw && raw.trim()) {
      try {
        const data = JSON.parse(raw);
        if (data.AbstractText) bits.push("[DDG] " + data.AbstractText);
        if (data.Heading) bits.push("Topik: " + data.Heading);
        (data.RelatedTopics || []).slice(0, 6).forEach((t) => {
          if (t && t.Text) bits.push(t.Text);
        });
      } catch (_) {}
    }
  } catch (e) {
    bits.push("DDG: " + (e.message || "fail"));
  }

  const unique = [];
  bits.forEach((b) => { if (b && unique.indexOf(b) === -1) unique.push(b); });

  return res.status(200).json({
    bits: unique,
    text: unique.length ? unique.join("\n") : ("Tidak ada hasil ringkas untuk: " + q)
  });
}
