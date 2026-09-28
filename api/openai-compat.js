// Proxy OpenAI-compatible. Body JSON: { baseUrl, apiKey, path, method, body }
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    let baseUrl, apiKey, subPath, method, body;
    if (req.method === "GET") {
      baseUrl = req.query.baseUrl;
      apiKey = req.query.apiKey;
      subPath = req.query.path || "/models";
      method = "GET";
      body = null;
    } else {
      const b = req.body || {};
      baseUrl = b.baseUrl;
      apiKey = b.apiKey;
      subPath = b.path || "/chat/completions";
      method = (b.method || "POST").toUpperCase();
      body = b.body;
    }

    if (!baseUrl || !String(baseUrl).trim()) {
      return res.status(400).json({ error: "baseUrl required — isi Base URL di Settings" });
    }

    let base = String(baseUrl).trim().replace(/\/$/, "");
    if (/localhost|127\.0\.0\.1/i.test(base)) {
      return res.status(400).json({
        error: "localhost tidak bisa diproxy dari Vercel. Pakai URL relay publik 9router."
      });
    }

    let p = String(subPath || "/chat/completions").trim();
    if (!p.startsWith("/")) p = "/" + p;
    if (base.endsWith("/v1") && p.startsWith("/v1/")) {
      p = p.slice(3);
    }

    const url = base + p;
    const headers = { Accept: "application/json" };
    if (method !== "GET" && method !== "HEAD") headers["Content-Type"] = "application/json";
    if (apiKey) headers["Authorization"] = "Bearer " + apiKey;

    const upstream = await fetch(url, {
      method,
      headers,
      body: method === "GET" || method === "HEAD" ? undefined : JSON.stringify(body ?? {})
    });

    const rawText = await upstream.text();
    let data;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = { raw: rawText.slice(0, 500) };
    }

    if (!upstream.ok) {
      const msg =
        (data.error && (data.error.message || data.error)) ||
        data.message ||
        ("Upstream HTTP " + upstream.status + " — " + url);
      return res.status(upstream.status).json({ error: String(msg), url, status: upstream.status });
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message || "proxy error" });
  }
}
