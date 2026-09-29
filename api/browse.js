// POST /api/browse — server-side fetch (bukan browser HP user)
// Body: { url, mode: "text" | "download" }
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { url, mode } = req.body || {};
    const u = String(url || "").trim();
    if (!/^https?:\/\//i.test(u)) {
      return res.status(400).json({ error: "url harus http(s)://" });
    }
    if (/^(file|javascript|data):/i.test(u)) {
      return res.status(400).json({ error: "skema URL tidak diizinkan" });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const upstream = await fetch(u, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "RolxDeskBot/1.0 (+https://rolxdesk.vercel.app)",
        Accept: mode === "download" ? "*/*" : "text/html,application/xhtml+xml,application/json,text/plain;q=0.9,*/*;q=0.8"
      }
    });
    clearTimeout(timer);

    const ctype = (upstream.headers.get("content-type") || "").toLowerCase();
    const buf = Buffer.from(await upstream.arrayBuffer());
    const bytes = buf.length;
    if (bytes > 8 * 1024 * 1024) {
      return res.status(413).json({ error: "File terlalu besar (max 8MB)" });
    }

    let filename = "download.bin";
    const cd = upstream.headers.get("content-disposition") || "";
    const m = cd.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
    if (m) {
      filename = decodeURIComponent(m[1].replace(/"/g, "").trim());
    } else {
      try {
        const p = new URL(u).pathname.split("/").filter(Boolean).pop() || "download.bin";
        filename = p.slice(0, 120);
      } catch (_) {}
    }

    if (mode === "download") {
      const isText =
        /text\/|json|xml|javascript|csv|markdown|yaml|toml/.test(ctype) ||
        /\.(txt|md|json|csv|js|ts|py|html|css|xml|yml|yaml|toml|log)$/i.test(filename);
      if (isText) {
        return res.status(200).json({
          filename,
          bytes,
          mime: ctype || "text/plain",
          text: buf.toString("utf8").slice(0, 500000)
        });
      }
      return res.status(200).json({
        filename,
        bytes,
        mime: ctype || "application/octet-stream",
        base64: buf.toString("base64")
      });
    }

    if (/application\/json/.test(ctype)) {
      return res.status(200).json({
        title: filename,
        text: buf.toString("utf8").slice(0, 12000),
        bytes
      });
    }

    let html = buf.toString("utf8");
    const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleM ? titleM[1].replace(/\s+/g, " ").trim().slice(0, 200) : "";
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12000);

    return res.status(200).json({ title, text, bytes, status: upstream.status });
  } catch (e) {
    const msg = e.name === "AbortError" ? "Timeout fetch (20s)" : (e.message || "browse error");
    return res.status(500).json({ error: msg });
  }
}
