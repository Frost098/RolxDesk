// Fish Audio TTS proxy — model in header; free-tier fallbacks
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const auth = String(req.headers.authorization || "");
  const clientKey = auth.replace(/^Bearer\s+/i, "").trim();
  const apiKey = clientKey || String(process.env.FISH_AUDIO_API_KEY || process.env.FISH_API_KEY || "").trim();
  if (!apiKey) {
    return res.status(401).json({
      error: "Fish key kosong. Isi di Settings RD ATAU set FISH_AUDIO_API_KEY di Vercel."
    });
  }

  let body = req.body;
  try { if (typeof body === "string") body = JSON.parse(body || "{}"); } catch (_) { body = {}; }
  body = body && typeof body === "object" ? body : {};
  const text = String(body.text || "").trim();
  if (!text) return res.status(400).json({ error: "text wajib diisi" });

  const reference_id = body.reference_id ? String(body.reference_id).trim() : "";
  const models = [
    String(body.model || "s2.1-pro-free").trim(),
    "s2.1-pro-free",
    "s1",
    "s2-pro"
  ].filter(function (m, i, a) { return m && a.indexOf(m) === i; });

  const errors = [];
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const payload = {
      text: text.slice(0, 1200),
      format: "mp3",
      latency: "balanced",
      normalize: true
    };
    if (reference_id) payload.reference_id = reference_id.slice(0, 64);

    try {
      const upstream = await fetch("https://api.fish.audio/v1/tts", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
          model: model
        },
        body: JSON.stringify(payload)
      });
      const type = upstream.headers.get("content-type") || "";
      if (!upstream.ok) {
        let detail = "";
        try {
          if (type.includes("json")) {
            const j = await upstream.json();
            detail = j.message || j.error || JSON.stringify(j).slice(0, 200);
          } else {
            detail = (await upstream.text()).slice(0, 200);
          }
        } catch (_) {}
        errors.push(model + ": " + upstream.status + " " + detail);
        continue;
      }
      const audio = Buffer.from(await upstream.arrayBuffer());
      res.setHeader("Content-Type", type.includes("audio") ? type : "audio/mpeg");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-RD-Fish-Model", model);
      return res.status(200).send(audio);
    } catch (error) {
      errors.push(model + ": " + (error && error.message ? error.message : "fetch fail"));
    }
  }

  return res.status(502).json({
    error: "Fish TTS gagal semua model",
    detail: errors.join(" | "),
    tried: models
  });
}
