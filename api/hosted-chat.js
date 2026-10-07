// GET  = list hosted models
// POST = chat via OPENROUTER_API_KEY and/or NVIDIA_API_KEY
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  const orKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || "";
  const nvKey = process.env.NVIDIA_API_KEY || process.env.NVIDIA_KEY || "";

  // Hanya model free yang terbukti content-nya keluar (okt 2026)
  const orModels = [
    { id: "openrouter/free", name: "RD Free Auto" },
    { id: "cohere/north-mini-code:free", name: "RD North Mini Code" },
    { id: "google/gemma-4-26b-a4b-it:free", name: "RD Gemma 4 26B" },
    { id: "inclusionai/ling-3.0-flash-sante:free", name: "RD Ling 3.0 Flash" },
    { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "RD Nemotron Super" },
    { id: "nvidia/nemotron-3.5-lightning:free", name: "RD Nemotron Lightning" },
    { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", name: "RD Nemotron Nano Omni" }
  ];

  const nvModels = [
    { id: "nv:meta/llama-3.1-8b-instruct", name: "NVIDIA Llama 3.1 8B" },
    { id: "nv:meta/llama-3.1-70b-instruct", name: "NVIDIA Llama 3.1 70B" },
    { id: "nv:nvidia/llama-3.3-nemotron-super-49b-v1", name: "NVIDIA Nemotron Super 49B" },
    { id: "nv:google/gemma-2-9b-it", name: "NVIDIA Gemma 2 9B" },
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
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch (_) {}

  let model = String(body.model || "openrouter/free").slice(0, 160);
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) return res.status(400).json({ error: "messages required" });

  const temperature = body.temperature ?? 0.7;
  const max_tokens = Math.min(Math.max(parseInt(body.max_tokens || 1024, 10) || 1024, 64), 4096);

  // Map dead free slugs → working ones
  const remap = {
    "qwen/qwen3.8-27b:free": "openrouter/free",
    "google/gemma-4-31b-it:free": "google/gemma-4-26b-a4b-it:free",
    "thinkingmachines/inkling:free": "inclusionai/ling-3.0-flash-sante:free",
    "thinkingmachines/inkling-small:free": "inclusionai/ling-3.0-flash-sante:free",
    "nvidia/nemotron-3.5-lightning:free": "nvidia/nemotron-3.5-lightning:free"
  };
  if (remap[model]) model = remap[model];

  // NVIDIA direct (server key)
  if (model.startsWith("nv:") || /^nvidia\//i.test(model) && nvKey && !model.includes(":free")) {
    if (!nvKey) {
      return res.status(503).json({ error: "NVIDIA_API_KEY belum di-set di Vercel" });
    }
    const nvidiaModel = model.startsWith("nv:") ? model.slice(3) : model;
    try {
      const upstream = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + nvKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: nvidiaModel,
          messages: messages.slice(-24),
          temperature,
          max_tokens,
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
      return res.status(200).json(normalizeCompletion(data));
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
    "openrouter/free",
    "nvidia/",
    "google/gemma",
    "deepseek/",
    "meta-llama/",
    "qwen/",
    "mistralai/",
    "inclusionai/",
    "nex-agi/",
    "poolside/",
    "cohere/",
    "thinkingmachines/",
    ":free"
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
        temperature,
        max_tokens,
        stream: false
      })
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const msg =
        (data.error && (data.error.message || data.error)) ||
        data.message ||
        "HTTP " + upstream.status;
      // Auto-fallback ke openrouter/free sekali
      if (model !== "openrouter/free" && /unavailable|provider returned|not available/i.test(String(msg))) {
        try {
          const fb = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: "Bearer " + orKey,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://rolxdesk.vercel.app",
              "X-Title": "RolxDesk Hosted"
            },
            body: JSON.stringify({
              model: "openrouter/free",
              messages: messages.slice(-24),
              temperature,
              max_tokens,
              stream: false
            })
          });
          const fd = await fb.json().catch(() => ({}));
          if (fb.ok) return res.status(200).json(normalizeCompletion(fd));
        } catch (_) {}
      }
      return res.status(upstream.status).json({ error: String(msg), hosted: true, model });
    }
    return res.status(200).json(normalizeCompletion(data));
  } catch (e) {
    return res.status(500).json({ error: e.message || "hosted-chat error" });
  }
}

/** Pastikan message.content tidak null (beberapa model free cuma isi reasoning) */
function normalizeCompletion(data) {
  try {
    if (!data || !Array.isArray(data.choices)) return data;
    data.choices = data.choices.map(function (ch) {
      if (!ch || !ch.message) return ch;
      var msg = ch.message;
      var content = msg.content;
      if (content == null || (typeof content === "string" && !content.trim())) {
        var r = msg.reasoning || msg.reasoning_content || "";
        if (typeof r === "string" && r.trim()) {
          // Ambil kalimat terakhir yang mirip jawaban, atau potong reasoning
          var lines = r.split(/\n+/).map(function (s) {
            return s.trim();
          }).filter(Boolean);
          var last = lines[lines.length - 1] || r.slice(0, 500);
          // Hindari menampilkan seluruh chain-of-thought panjang
          if (last.length > 600) last = last.slice(0, 600) + "…";
          msg.content = last;
        } else {
          msg.content = "(model tidak mengembalikan teks — coba model Hosted lain / Free Auto)";
        }
      }
      ch.message = msg;
      return ch;
    });
  } catch (_) {}
  return data;
}
