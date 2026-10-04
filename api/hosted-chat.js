// GET = list models | POST = chat via OPENROUTER_API_KEY
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") {
    const hasKey = !!(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY);
    const models = [
      { id: "qwen/qwen3.8-27b:free", name: "RD Qwen3.8 27B" },
      { id: "google/gemma-4-31b-it:free", name: "RD Gemma 4 31B" },
      { id: "google/gemma-4-26b-a4b-it:free", name: "RD Gemma 4 26B" },
      { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "RD Nemotron Super" },
      { id: "nvidia/nemotron-3.5-lightning:free", name: "RD Nemotron Lightning" },
      { id: "cohere/north-mini-code:free", name: "RD North Mini Code" },
      { id: "thinkingmachines/inkling:free", name: "RD Inkling" },
      { id: "openrouter/free", name: "RD Free Auto" }
    ];
    return res.status(200).json({ hosted: hasKey, models, note: hasKey ? "Siap" : "Set OPENROUTER_API_KEY" });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "GET/POST only" });

  const key = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || "";
  if (!key) {
    return res.status(503).json({
      error: "Hosted models offline — owner belum set OPENROUTER_API_KEY di Vercel"
    });
  }

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  } catch (_) {}

  const model = String(body.model || "openrouter/free").slice(0, 120);
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) return res.status(400).json({ error: "messages required" });

  const allow = [
    "openrouter/free", "nvidia/nemotron", "google/gemma", "deepseek/",
    "meta-llama/", "qwen/", "mistralai/", "inclusionai/", "nex-agi/",
    "poolside/", "thinkingmachines/", "cohere/", ":free"
  ];
  const ok = allow.some((a) => model.includes(a) || model.endsWith(":free"));
  if (!ok) {
    return res.status(400).json({ error: "Model tidak di allowlist hosted: " + model });
  }

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://rolxdesk.vercel.app",
        "X-Title": "RolxDesk Hosted"
      },
      body: JSON.stringify({
        model,
        messages: messages.slice(-24),
        temperature: body.temperature ?? 0.7,
        max_tokens: Math.min(body.max_tokens || 2048, 4096),
        stream: false
      })
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const msg = (data.error && data.error.message) || data.message || ("HTTP " + upstream.status);
      return res.status(upstream.status).json({ error: String(msg), hosted: true });
    }
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message || "hosted-chat error" });
  }
}
