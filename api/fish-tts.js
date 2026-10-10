// Fish Audio TTS proxy: keeps the browser away from api.fish.audio CORS.
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const auth = String(req.headers.authorization || "");
  const clientKey = auth.replace(/^Bearer\s+/i, "").trim();
  const apiKey = clientKey || String(process.env.FISH_AUDIO_API_KEY || "").trim();
  if (!apiKey) return res.status(401).json({ error: "Fish Audio key belum diisi di RD atau FISH_AUDIO_API_KEY." });

  let body = req.body;
  try { if (typeof body === "string") body = JSON.parse(body || "{}"); } catch (_) { body = {}; }
  body = body && typeof body === "object" ? body : {};
  const text = String(body.text || "").trim();
  if (!text) return res.status(400).json({ error: "text wajib diisi" });

  const payload = {
    text: text.slice(0, 1200),
    model: String(body.model || "s2.1-pro-free"),
    format: "mp3",
    latency: "balanced",
    normalize: true,
    prosody: { speed: 1, volume: 0, normalize_loudness: true }
  };
  if (body.reference_id) payload.reference_id = String(body.reference_id).slice(0, 200);

  try {
    const upstream = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json", model: payload.model },
      body: JSON.stringify(payload)
    });
    const type = upstream.headers.get("content-type") || "";
    if (!upstream.ok) {
      const detail = type.includes("json") ? await upstream.json().catch(() => ({})) : await upstream.text().catch(() => "");
      return res.status(upstream.status).json({ error: detail?.message || detail?.error || "Fish Audio TTS gagal", upstream_status: upstream.status });
    }
    const audio = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Type", type.includes("audio") ? type : "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(audio);
  } catch (error) {
    return res.status(502).json({ error: error?.message || "Fish Audio proxy gagal" });
  }
}
