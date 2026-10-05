// POST /api/nvidia-chat — proxy to integrate.api.nvidia.com (no browser CORS)
// Client sends Authorization: Bearer <user nvidia key> + OpenAI-style body
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const auth = req.headers.authorization || "";
    const body = req.body || {};
    let key = "";
    if (/^Bearer\s+/i.test(auth)) key = auth.replace(/^Bearer\s+/i, "").trim();
    if (!key && body.apiKey) key = String(body.apiKey).trim();
    if (!key) key = process.env.NVIDIA_API_KEY || process.env.NVIDIA_KEY || "";

    if (!key) {
      return res.status(401).json({
        error: "NVIDIA key kosong — isi di Settings atau set NVIDIA_API_KEY di Vercel"
      });
    }

    const model = String(body.model || "").trim();
    if (!model) return res.status(400).json({ error: "model required" });

    const messages = Array.isArray(body.messages) ? body.messages.slice(-24) : [];
    const temperature = body.temperature != null ? body.temperature : 0.7;
    const max_tokens = Math.min(parseInt(body.max_tokens, 10) || 1024, 2048);

    const upstream = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({
          role: m.role,
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content)
        })),
        temperature,
        max_tokens,
        stream: false
      })
    });

    const raw = await upstream.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { error: raw.slice(0, 400) };
    }

    if (!upstream.ok) {
      const msg =
        (data.error && (data.error.message || data.error)) ||
        data.message ||
        ("NVIDIA HTTP " + upstream.status);
      return res.status(upstream.status).json({ error: String(msg), provider: "nvidia" });
    }
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message || "nvidia-chat proxy error" });
  }
}
