export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { apiKey, prompt } = req.body || {};
    if (!apiKey) return res.status(400).json({ error: "apiKey required — isi Manus key di Settings" });
    if (!prompt) return res.status(400).json({ error: "prompt required" });
    const profiles = ["manus-1.5-lite", "manus-1.5", "manus-1.6-lite"];
    let createData = null;
    let lastErr = "create failed";
    for (const profile of profiles) {
      const r = await fetch("https://api.manus.ai/v1/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", "API_KEY": apiKey },
        body: JSON.stringify({ prompt: String(prompt).slice(0, 12000), agentProfile: profile, taskMode: "chat" })
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && (data.task_id || data.id)) { createData = data; break; }
      lastErr = data.message || data.error?.message || data.error || ("Manus create " + r.status);
    }
    if (!createData) {
      const r2 = await fetch("https://api.manus.ai/v2/task.create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-manus-api-key": apiKey },
        body: JSON.stringify({ message: { content: String(prompt).slice(0, 12000) } })
      });
      const d2 = await r2.json().catch(() => ({}));
      if (r2.ok && (d2.task_id || d2.id)) createData = d2;
      else lastErr = d2.error?.message || d2.message || lastErr;
    }
    if (!createData) return res.status(502).json({ error: String(lastErr) + " — cek API key Manus" });
    const taskId = createData.task_id || createData.id;
    let outputText = createData.task_title ? ("Task: " + createData.task_title + (createData.task_url ? "\n" + createData.task_url : "")) : "";
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 2500));
      try {
        const gr = await fetch("https://api.manus.ai/v1/tasks/" + encodeURIComponent(taskId), { headers: { "API_KEY": apiKey } });
        if (gr.status === 404) continue;
        const gd = await gr.json().catch(() => ({}));
        const status = gd.status || gd.agent_status || "";
        const parts = [];
        if (Array.isArray(gd.output)) {
          gd.output.forEach((o) => {
            if (o.role === "assistant" || o.type === "message") {
              (o.content || []).forEach((c) => { if (c && c.text) parts.push(c.text); });
            }
          });
        }
        if (parts.length) outputText = parts.join("\n\n");
        if (status === "completed" || status === "failed" || status === "stopped") break;
      } catch (_) {}
    }
    if (!outputText) {
      outputText = "Task Manus dikirim (id: " + taskId + ")." + (createData.task_url ? " Buka: " + createData.task_url : "");
    }
    return res.status(200).json({ reply: outputText, task_id: taskId, task_url: createData.task_url || null, raw: createData });
  } catch (e) {
    return res.status(500).json({ error: e.message || "proxy error" });
  }
}
