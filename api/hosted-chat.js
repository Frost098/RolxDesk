// RD Hosted — dual OpenRouter keys + free catalog fallback
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

  const orKeys = [
    process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || "",
    process.env.OPENROUTER_API_KEY_2 || process.env.OPENROUTER_KEY_2 || ""
  ].map((k) => String(k || "").trim()).filter(Boolean);
  const orKey = orKeys[0] || "";
  const nvKey = process.env.NVIDIA_API_KEY || process.env.NVIDIA_KEY || "";

  if (req.method === "GET") {
    const models = [];
    if (orKey) models.push(...(await getFreeCatalog(orKey)));
    if (nvKey) models.push(...nvidiaCatalog());
    return res.status(200).json({
      hosted: !!(orKey || nvKey),
      models: uniqueModels(models),
      providers: { openrouter: !!orKey, nvidia: !!nvKey, openrouter_keys: orKeys.length },
      generated_at: new Date().toISOString(),
      note: orKey || nvKey
        ? ("Katalog free aktif" + (orKeys.length > 1 ? " · dual OpenRouter keys" : ""))
        : "Set OPENROUTER_API_KEY (+ optional OPENROUTER_API_KEY_2) dan/atau NVIDIA_API_KEY di Vercel"
    });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "GET/POST only" });
  const body = parseBody(req.body);
  let requested = String(body.model || "openrouter/free").slice(0, 160);
  const messages = Array.isArray(body.messages) ? body.messages.slice(-24) : [];
  if (!messages.length) return res.status(400).json({ error: "messages required" });
  const temperature = clamp(body.temperature, 0, 2, 0.7);
  const max_tokens = clamp(body.max_tokens, 64, 4096, 1024);

  const nvidia = /^nvidia\//i.test(requested) || requested.startsWith("nv:");
  if (nvidia) {
    if (!nvKey) return res.status(503).json({ error: "NVIDIA Hosted offline — NVIDIA_API_KEY belum di-set di Vercel" });
    const model = requested.startsWith("nv:") ? requested.slice(3) : requested;
    const data = await upstreamJson(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      { Authorization: "Bearer " + nvKey, "Content-Type": "application/json" },
      completionBody(model, messages, temperature, max_tokens)
    );
    return res.status(data.status).json(data.status >= 200 && data.status < 300 ? normalizeCompletion(data.body) : providerError(data.body, "nvidia", data.status));
  }

  if (!orKeys.length) return res.status(503).json({ error: "Hosted OpenRouter offline — set OPENROUTER_API_KEY (opsional OPENROUTER_API_KEY_2) di Vercel" });
  const catalog = await getFreeCatalog(orKeys[0]);
  const allowed = new Set(catalog.map((m) => m.id));
  if (requested !== "openrouter/free" && !allowed.has(requested)) {
    return res.status(400).json({ error: "Model tidak tersedia di katalog free saat ini", model: requested, models: catalog });
  }

  async function tryKeys(model) {
    let last = { status: 502, body: { error: { message: "no key" } } };
    for (let i = 0; i < orKeys.length; i++) {
      const r = await openrouter(orKeys[i], model, messages, temperature, max_tokens);
      last = r;
      if (r.status >= 200 && r.status < 300) {
        const n = normalizeCompletion(r.body);
        if (hasFinalText(n) || model !== "openrouter/free") {
          if (i > 0) n.rd_key = "secondary";
          return { ok: true, status: 200, body: n };
        }
        last = { status: 200, body: n, empty: true };
        continue;
      }
      const em = errorMessage(r.body, r.status);
      if (/rate.?limit|429|402|credits|temporar|overload|capacity/i.test(em) || r.status === 429 || r.status === 402) {
        continue;
      }
      if (/auth|api key|unauthorized|401|403/i.test(em) && i === 0 && orKeys.length > 1) continue;
      return { ok: false, status: r.status || 502, body: { error: em, hosted: true, model } };
    }
    if (last.empty) return { ok: true, status: 200, body: last.body };
    return { ok: false, status: last.status || 502, body: { error: errorMessage(last.body, last.status), hosted: true, model } };
  }

  const first = await tryKeys(requested);
  if (first.ok) {
    if (hasFinalText(first.body) || requested !== "openrouter/free") return res.status(200).json(first.body);
    const alternate = pickAlternateFree(catalog, requested);
    if (alternate) {
      const alt = await tryKeys(alternate);
      if (alt.ok && hasFinalText(alt.body)) {
        alt.body.rd_fallback = { requested, used: alternate, reason: "empty final content" };
        return res.status(200).json(alt.body);
      }
    }
    return res.status(200).json(first.body);
  }

  const msg = first.body && first.body.error ? String(first.body.error) : errorMessage(first.body, first.status);
  if (requested !== "openrouter/free" && /unavailable|not found|provider|timeout|rate.?limit|temporar|credits|429/i.test(msg)) {
    const fallback = await tryKeys("openrouter/free");
    if (fallback.ok) {
      fallback.body.rd_fallback = { requested, used: "openrouter/free" };
      return res.status(200).json(fallback.body);
    }
  }
  return res.status(first.status || 502).json({ error: msg, hosted: true, model: requested, keys_tried: orKeys.length });
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}
function parseBody(b) {
  if (!b) return {};
  if (typeof b === "string") { try { return JSON.parse(b); } catch (_) { return {}; } }
  return b;
}
function clamp(v, lo, hi, d) {
  const n = Number(v);
  if (!Number.isFinite(n)) return d;
  return Math.min(hi, Math.max(lo, n));
}
function completionBody(model, messages, temperature, max_tokens) {
  return { model, messages, temperature, max_tokens, stream: false };
}
async function upstreamJson(url, headers, body) {
  try {
    const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const text = await r.text();
    let json = {};
    try { json = text ? JSON.parse(text) : {}; } catch (_) { json = { error: { message: text.slice(0, 400) } }; }
    return { status: r.status, body: json };
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
  if (catalogCache.at && Date.now() - catalogCache.at < 10 * 60 * 1000 && catalogCache.models.length) return catalogCache.models;
  try {
    const r = await fetch("https://openrouter.ai/api/v1/models", { headers: { Authorization: "Bearer " + key, Accept: "application/json" } });
    const j = await r.json();
    const models = (j.data || [])
      .filter((m) => m && m.id && (/:free$/i.test(m.id) || (m.pricing && String(m.pricing.prompt) === "0")))
      .map((m) => ({ id: m.id, name: m.name || m.id }))
      .slice(0, 80);
    if (models.length) {
      catalogCache = { at: Date.now(), models: uniqueModels([{ id: "openrouter/free", name: "RD Free Auto" }, ...models]) };
      return catalogCache.models;
    }
  } catch (_) {}
  return FALLBACK_FREE.slice();
}
function nvidiaCatalog() {
  return [
    { id: "nvidia/nemotron-3.5-lightning:free", name: "Nemotron 3.5 Lightning" },
    { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "Nemotron 3 Super" }
  ];
}
function uniqueModels(arr) {
  const seen = new Set();
  return arr.filter((m) => m && m.id && !seen.has(m.id) && seen.add(m.id));
}
function normalizeCompletion(body) {
  if (!body || typeof body !== "object") return { choices: [{ message: { role: "assistant", content: String(body || "") } }] };
  if (body.choices) return body;
  if (body.message) return { choices: [{ message: body.message }] };
  if (body.content) return { choices: [{ message: { role: "assistant", content: body.content } }] };
  return body;
}
function hasFinalText(body) {
  try {
    const c = body?.choices?.[0]?.message?.content;
    return typeof c === "string" && c.trim().length > 0;
  } catch (_) { return false; }
}
function errorMessage(body, status) {
  if (!body) return "HTTP " + status;
  if (typeof body === "string") return body;
  const e = body.error;
  if (typeof e === "string") return e;
  if (e && e.message) return e.message;
  if (body.message) return body.message;
  return "HTTP " + status;
}
function providerError(body, provider, status) {
  return { error: errorMessage(body, status), provider, status };
}
function pickAlternateFree(catalog, requested) {
  for (const m of catalog) {
    if (m.id !== requested && m.id !== "openrouter/free") return m.id;
  }
  return null;
}
