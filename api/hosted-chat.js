// GET  = list hosted models
// POST = chat via OPENROUTER_API_KEY and/or NVIDIA_API_KEY
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  const orKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || "";
  const nvKey = process.env.NVIDIA_API_KEY || process.env.NVIDIA_KEY || "";

  const orModels = [
    { id: "qwen/qwen3.8-27b:free", name: "RD Qwen3.8 27B" },
    { id: "google/gemma-4-31b-it:free", name: "RD Gemma 4 31B" },
    { id: "google/gemma-4-26b-a4b-it:free", name: "RD Gemma 4 26B" },
    { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "RD Nemotron Super (OR)" },
    { id: "nvidia/nemotron-3.5-lightning:free", name: "RD Nemotron Lightning (OR)" },
    { id: "cohere/north-mini-code:free", name: "RD North Mini Code" },
    { id: "thinkingmachines/inkling:free", name: "RD Inkling" },
    { id: "openrouter/free", name: "RD Free Auto" }
  ];

  const nvModels = [
    { id: "nv:meta/llama-3.1-8b-instruct", name: "NVIDIA Llama 3.1 8B" },
    { id: "nv:meta/llama-3.1-70b-instruct", name: "NVIDIA Llama 3.1 70B" },
    { id: "nv:nvidia/llama-3.3-nemotron-super-49b-v1", name: "NVIDIA Nemotron Super 49B" },
    { id: "nv:google/gemma-2-9b-it", name: "NVIDIA Gemma 2 9B" },
    { id: "nv:google/gemma-2-27b-it", name: "NVIDIA Gemma 2 27B" },
    { id: "nv:mistralai/mistral-nemotron", name: "NVIDIA Mistral Nemotron" },
    { id: "nv:qwen/qwen2.5-7b-instruct", name: "NVIDIA Qwen2.5 7B" }
  ];

  if (req.method === "GET") {
    const models = [];
    if (orKey) models.push(...orModels);
    if (nvKey) models.push(...nvModels);
    const hosted = !!(orKey || nvKey);
    return res.status(200).json({
      hosted,
      models,
      providers: { openrouter: !!orKey, nvidia: !!nvKey },
      note: hosted ? "Siap" : "Set OPENROUTER_API_KEY dan/atau NVIDIA_API_KEY di Vercel"
    });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "GET/POST only" });

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  } catch (_) {}

  const model = String(body.model || "").slice(0, 160);
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) return res.status(400).json({ error: "messages required" });
  if (!model) return res.status(400).json({ error: "model required" });

  const useNvidia = model.startsWith("nv:") || body.provider === "nvidia";
  const nvidiaModel = model.startsWith("nv:") ? model.slice(3) : model;

  const clientNv =
    (typeof body.nvidiaKey === "string" && body.nvidiaKey.trim()) ||
    (typeof body.apiKey === "string" && body.provider === "nvidia" && body.apiKey.trim()) ||
    "";
  const effectiveNv = clientNv || nvKey;

  if (useNvidia) {
    if (!effectiveNv) {
      return res.status(503).json({
        error: "NVIDIA offline — set NVIDIA_API_KEY di Vercel atau isi key di Settings"
      });
    }
    try {
      const upstream = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + effectiveNv,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          model: nvidiaModel,
          messages: messages.slice(-24),
          temperature: body.temperature ?? 0.7,
          max_tokens: Math.min(body.max_tokens || 2048, 4096),
          stream: false
        })
      });
      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        const msg =
          (data.error && (data.error.message || data.error)) ||
          data.message ||
          "HTTP " + upstream.status;
        return res.status(upstream.status).json({ error: String(msg), provider: "nvidia" });
      }
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message || "nvidia error", provider: "nvidia" });
    }
  }

  if (!orKey) {
    return res.status(503).json({
      error: "Hosted OpenRouter offline — set OPENROUTER_API_KEY di Vercel"
    });
  }

  const allow = [
    "openrouter/free", "nvidia/", "google/gemma", "deepseek/", "meta-llama/",
    "qwen/", "mistralai/", "inclusionai/", "nex-agi/", "poolside/",
    "cohere/", "thinkingmachines/", ":free"
  ];
  const ok = allow.some((a) => model.includes(a) || model.endsWith(":free"));
  if (!ok) {
    return res.status(400).json({ error: "Model tidak di allowlist hosted: " + model });
  }

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + orKey,
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
      const msg = (data.error && data.error.message) || data.message || "HTTP " + upstream.status;
      return res.status(upstream.status).json({ error: String(msg), hosted: true });
    }
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message || "hosted-chat error" });
  }
}
