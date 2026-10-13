// Fish Audio: session create + post-call webhook (same function — Hobby 12 limit)
const g = globalThis;
if (!g.__RD_FISH_WH_EVENTS) g.__RD_FISH_WH_EVENTS = [];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Fish-Signature");
  if (req.method === "OPTIONS") return res.status(204).end();

  const url = String(req.url || "");
  const isWebhook =
    url.includes("mode=webhook") ||
    url.includes("fish-webhook") ||
    String(req.query?.mode || "") === "webhook";

  if (isWebhook || (req.method === "GET" && url.includes("webhook"))) {
    if (req.method === "GET") {
      return res.status(200).json({
        ok: true,
        endpoint: "/api/fish-webhook",
        hint: "Set agent webhooks.post_call.url → https://YOUR_DOMAIN/api/fish-webhook",
        recent: (g.__RD_FISH_WH_EVENTS || []).slice(-10)
      });
    }
    let body = req.body;
    try {
      if (typeof body === "string") body = JSON.parse(body || "{}");
    } catch (_) {
      body = { raw: String(req.body || "") };
    }
    const evt = {
      at: new Date().toISOString(),
      event: body?.event || body?.type || "unknown",
      session_id: body?.session_id || body?.sessionId || null,
      payload: body
    };
    g.__RD_FISH_WH_EVENTS = (g.__RD_FISH_WH_EVENTS || []).concat([evt]).slice(-30);
    return res.status(200).json({ received: true, event: evt.event });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "POST only for sessions" });

  const auth = String(req.headers.authorization || "");
  const clientKey = auth.replace(/^Bearer\s+/i, "").trim();
  const apiKey = clientKey || String(process.env.FISH_AUDIO_API_KEY || process.env.FISH_API_KEY || "").trim();
  if (!apiKey) {
    return res.status(401).json({ error: "Fish Audio key belum diisi di RD atau FISH_AUDIO_API_KEY." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  if (!body.agent_id && (body.event || body.session_id)) {
    const evt = {
      at: new Date().toISOString(),
      event: body.event || body.type || "unknown",
      session_id: body.session_id || null,
      payload: body
    };
    g.__RD_FISH_WH_EVENTS = (g.__RD_FISH_WH_EVENTS || []).concat([evt]).slice(-30);
    return res.status(200).json({ received: true });
  }

  const agentId = String(body.agent_id || "4093e6030a994ab5b5f0dbbbd430e142").trim();
  const timezone = String(body.timezone || "Asia/Jakarta").trim();

  try {
    const upstream = await fetch("https://api.fish.audio/v1/agent/sessions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ agent_id: agentId, timezone: timezone })
    });
    const text = await upstream.text();
    let json;
    try { json = JSON.parse(text); } catch (e) { json = { raw: text }; }
    return res.status(upstream.status).json(json);
  } catch (err) {
    return res.status(502).json({ error: String(err && err.message ? err.message : err) });
  }
}
