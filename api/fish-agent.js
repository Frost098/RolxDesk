// Fish Audio Agent session proxy
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const auth = String(req.headers.authorization || "");
  const clientKey = auth.replace(/^Bearer\s+/i, "").trim();
  const apiKey = clientKey || String(process.env.FISH_AUDIO_API_KEY || "").trim();
  if (!apiKey) {
    return res.status(401).json({ error: "Fish Audio key belum diisi di RD atau FISH_AUDIO_API_KEY." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const agentId = String(body.agent_id || "4093e6030a994ab5b5f0dbbbd430e142").trim();

  try {
    const upstream = await fetch("https://api.fish.audio/v1/agent/sessions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ agent_id: agentId })
    });
    const text = await upstream.text();
    let json;
    try { json = JSON.parse(text); } catch (e) { json = { raw: text }; }
    res.status(upstream.status).json(json);
  } catch (err) {
    res.status(502).json({ error: String(err && err.message ? err.message : err) });
  }
}
