// Vercel Serverless: proxy Venice OpenAI-compatible chat
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { apiKey, model, messages, temperature, max_tokens } = req.body || {};
    if (!apiKey) return res.status(400).json({ error: "apiKey required" });

    const r = await fetch("https://api.venice.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: model || "venice-uncensored",
        messages: messages || [{ role: "user", content: "Hello" }],
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens || 2048,
        stream: false
      })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return res.status(r.status).json({
        error: data.error?.message || data.message || ("Venice " + r.status)
      });
    }
    const content = data.choices?.[0]?.message?.content || data.content || "";
    return res.status(200).json({ content, reply: content, raw: data });
  } catch (e) {
    return res.status(500).json({ error: e.message || "proxy error" });
  }
}
