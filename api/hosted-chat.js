// RD Hosted — live free catalog, normalized responses, bounded fallback
const FALLBACK_FREE = [
  { id: "openrouter/free", name: "RD Free Auto" },
  { id: "nvidia/nemotron-3.5-lightning:free", name: "Nemotron 3.5 Lightning (free)" },
  { id: "cohere/north-mini-code:free", name: "North Mini Code (free)" },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B (free)" }
];

let catalogCache = { at: 0, models: [] };

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  const orKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || "";
  const nvKey = process.env.NVIDIA_API_KEY || process.env.NVIDIA_KEY || "";

  if (req.method === "GET") {
    const models = [];
    if (orKey) models.push(...(await getFreeCatalog(orKey)));
    if (nvKey) models.push(...nvidiaCatalog());
    return res.status(200).json({
      hosted: !!(orKey || nvKey),
      models: uniqueModels(models),
      providers: { openrouter: !!orKey, nvidia: !!nvKey },
      generated_at: new Date().toISOString(),
      note: orKey || nvKey ? "Katalog free aktif" : "Set OPENROUTER_API_KEY dan/atau NVIDIA_API_KEY di Vercel"
    });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "GET/POST only" });
  const body = parseBody(req.body);
  let requested = String(body.model || "openrouter/free").slice(0, 160);
  const messages = Array.isArray(body.messages) ? body.messages.slice(-24) : [];
  if (!messages.length) return res.status(400).json({ error: "messages required" });

  const temperature = clampNumber(body.temperature, 0.7, 0, 2);
  const max_tokens = clampInt(body.max_tokens, 1024, 64, 3072);
  const nvidia = requested.startsWith("nv:");

  if (nvidia) {
    if (!nvKey) return res.status(503).json({ error: "NVIDIA Hosted offline — NVIDIA_API_KEY belum di-set di Vercel" });
    const model = requested.slice(3);
    const data = await upstreamJson(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      { Authorization: "Bearer " + nvKey, "Content-Type": "application/json" },
      completionBody(model, messages, temperature, max_tokens)
    );
    return res.status(data.status).json(data.status >= 200 && data.status < 300 ? normalizeCompletion(data.body) : providerError(data.body, "nvidia", data.status));
  }

  if (!orKey) return res.status(503).json({ error: "Hosted OpenRouter offline — OPENROUTER_API_KEY belum di-set di Vercel" });
  const catalog = await getFreeCatalog(orKey);
  const allowed = new Set(catalog.map((m) => m.id));
  if (requested !== "openrouter/free" && !allowed.has(requested)) {
    return res.status(400).json({ error: "Model tidak tersedia di katalog free saat ini", model: requested, models: catalog });
  }

  const first = await openrouter(orKey, requested, messages, temperature, max_tokens);
  if (first.status >= 200 && first.status < 300) {
    const normalized = normalizeCompletion(first.body);
    if (hasFinalText(normalized) || requested !== "openrouter/free") return res.status(200).json(normalized);
    const alternate = pickAlternateFree(catalog, requested);
    if (alternate) {
      const alt = await openrouter(orKey, alternate, messages, temperature, max_tokens);
      if (alt.status >= 200 && alt.status < 300) {
        const altNormalized = normalizeCompletion(alt.body);
        if (hasFinalText(altNormalized)) {
          altNormalized.rd_fallback = { requested, used: alternate, reason: "empty final content" };
          return res.status(200).json(altNormalized);
        }
      }
    }
    return res.status(200).json(normalized);
  }

  // Hanya fallback untuk model upstream yang mati/limit; jangan menyamarkan error auth atau input.
  const msg = errorMessage(first.body, first.status);
  if (requested !== "openrouter/free" && /unavailable|not found|provider|timeout|rate.?limit|temporar/i.test(msg)) {
    const fallback = await openrouter(orKey, "openrouter/free", messages, temperature, max_tokens);
    if (fallback.status >= 200 && fallback.status < 300) {
      const out = normalizeCompletion(fallback.body);
      out.rd_fallback = { requested, used: "openrouter/free" };
      return res.status(200).json(out);
    }
  }
  return res.status(first.status || 502).json({ error: msg, hosted: true, model: requested });
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
}
function parseBody(body) {
  if (!body) return {};
  if (typeof body === "string") { try { return JSON.parse(body); } catch (_) { return {}; } }
  return body;
}
function clampNumber(v, fallback, min, max) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
function clampInt(v, fallback, min, max) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
function completionBody(model, messages, temperature, max_tokens) {
  return {
    model,
    messages,
    temperature,
    max_tokens,
    stream: false,
    // Free reasoning models otherwise spend the visible response budget thinking.
    reasoning: { exclude: true }
  };
}
async function upstreamJson(url, headers, body) {
  try {
    const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    return { status: r.status, body: await r.json().catch(() => ({})) };
  } catch (e) {
    return { status: 502, body: { error: { message: e.message || "upstream fetch failed" } } };
  }
}
async function openrouter(key, model, messages, temperature, max_tokens) {
  return upstreamJson(
    "https://openrouter.ai/api/v1/chat/completions",
    { Authorization: "Bearer " + key, "Content-Type": "application/json", "HTTP-Referer": "https://rolxdesk.vercel.app", "X-Title": "RolxDesk Hosted" },
    completionBody(model, messages, temperature, max_tokens)
  );
}
async function getFreeCatalog(key) {
  if (catalogCache.models.length && Date.now() - catalogCache.at < 5 * 60 * 1000) return catalogCache.models;
  try {
    const r = await fetch("https://openrouter.ai/api/v1/models", { headers: { Authorization: "Bearer " + key, Accept: "application/json" } });
    const j = await r.json().catch(() => ({}));
    const list = Array.isArray(j.data) ? j.data : [];
    const free = list.filter((m) => {
      const p = m && m.pricing || {};
      return m && m.id && (m.id === "openrouter/free" || (String(p.prompt) === "0" && String(p.completion) === "0"));
    }).map((m) => ({ id: m.id, name: (m.name || m.id) + " (free)", context_length: m.context_length || null }));
    const models = uniqueModels([{ id: "openrouter/free", name: "RD Free Auto" }, ...free]).slice(0, 40);
    if (models.length) { catalogCache = { at: Date.now(), models }; return models; }
  } catch (_) {}
  return FALLBACK_FREE;
}
function nvidiaCatalog() {
  return [
    { id: "nv:nvidia/nemotron-3.5-lightning-30b-a3b", name: "NVIDIA Nemotron 3.5 Lightning" },
    { id: "nv:nvidia/nemotron-3-nano-30b-a3b", name: "NVIDIA Nemotron Nano" }
  ];
}
function uniqueModels(list) {
  const seen = new Set();
  return (list || []).filter((m) => m && m.id && !seen.has(m.id) && seen.add(m.id));
}
function pickAlternateFree(catalog, requested) {
  return catalog.find((m) => m.id !== requested && m.id !== "openrouter/free" && !/safety|guard|moderation/i.test(m.id))?.id || null;
}
function hasFinalText(data) {
  const c = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (typeof c !== "string" || !c.trim() || /^Model (tidak|selesai)/i.test(c.trim())) return false;
  return !/(thinking process|chain of thought|reasoning process|analisis internal|let me think|\b1\.\s+\*\*analy[sz]e user)/i.test(c);
}
function errorMessage(body, status) {
  return String((body && body.error && (body.error.message || body.error)) || (body && body.message) || "HTTP " + status);
}
function providerError(body, provider, status) {
  return { error: errorMessage(body, status), provider, status };
}
function normalizeCompletion(data) {
  const out = data && typeof data === "object" ? data : {};
  if (!Array.isArray(out.choices)) return out;
  out.choices = out.choices.map((choice) => {
    if (!choice || !choice.message) return choice;
    const msg = choice.message;
    let content = toText(msg.content || msg.text || "");
    const reasoning = toText(msg.reasoning || msg.reasoning_content || "");
    // Never expose a long chain of thought as if it were the final answer.
    if (!content.trim() && reasoning.trim()) content = "Model selesai berpikir, tetapi tidak mengirim jawaban teks. Coba Free Auto atau model free lain.";
    if (!content.trim()) content = "Model tidak mengembalikan teks. Coba model free lain.";
    choice.message = { ...msg, content, reasoning: reasoning || undefined };
    return choice;
  });
  return out;
}
function toText(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((x) => typeof x === "string" ? x : x && x.text ? x.text : "").join("\n");
  if (value && typeof value === "object") return String(value.text || value.content || "");
  return value == null ? "" : String(value);
}
