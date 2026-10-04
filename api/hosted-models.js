export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();
  const hasKey = !!(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY);
  const models = [
    { id: "openrouter/free", name: "RD Free Auto", desc: "Router gratis (owner key)" },
    { id: "google/gemma-3-27b-it:free", name: "RD Gemma 27B", desc: "Hosted free" },
    { id: "deepseek/deepseek-r1:free", name: "RD DeepSeek R1", desc: "Hosted free" },
    { id: "meta-llama/llama-3.3-70b-instruct:free", name: "RD Llama 3.3 70B", desc: "Hosted free" },
    { id: "qwen/qwen-2.5-72b-instruct:free", name: "RD Qwen 2.5 72B", desc: "Hosted free" },
    { id: "mistralai/mistral-small-3.1-24b-instruct:free", name: "RD Mistral Small", desc: "Hosted free" }
  ];
  return res.status(200).json({
    hosted: hasKey,
    models,
    note: hasKey ? "Siap dipakai tanpa key user" : "Owner perlu set OPENROUTER_API_KEY"
  });
}
