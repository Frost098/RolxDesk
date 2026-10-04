// POST { code } — limited JS sandbox (no require/fs/net/fetch)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  let code = "";
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    code = String(b.code || "").slice(0, 8000);
  } catch (_) {}
  if (!code.trim()) return res.status(400).json({ error: "code kosong" });

  if (/\b(require|import\s|process\.|child_process|fs\.|net\.|http\.|eval\(|Function\(|fetch\s*\()/i.test(code)) {
    return res.status(400).json({
      error: "Blocked: no require/import/process/fs/net/fetch/eval in server JS sandbox"
    });
  }

  const logs = [];
  const sandboxConsole = {
    log: (...a) => logs.push(a.map(String).join(" ")),
    error: (...a) => logs.push("[err] " + a.map(String).join(" ")),
    warn: (...a) => logs.push("[warn] " + a.map(String).join(" "))
  };

  try {
    const fn = new Function(
      "console", "Math", "JSON", "Date", "Array", "Object", "String", "Number", "Boolean", "Map", "Set", "Promise",
      `"use strict";\n${code}`
    );
    const result = fn(sandboxConsole, Math, JSON, Date, Array, Object, String, Number, Boolean, Map, Set, Promise);
    const out = logs.join("\n") + (result !== undefined ? (logs.length ? "\n" : "") + String(result) : "");
    return res.status(200).json({ ok: true, output: out.slice(0, 12000) || "(ok, no output)" });
  } catch (e) {
    return res.status(200).json({ ok: false, output: "Error: " + (e.message || e) });
  }
}
