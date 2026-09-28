export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const { refresh_token } = req.body || {};
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "SPOTIFY_CLIENT_ID/SECRET belum di-set di Vercel env" });
    }
    if (!refresh_token) return res.status(400).json({ error: "refresh_token required" });

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: String(refresh_token)
    });
    const basic = Buffer.from(clientId + ":" + clientSecret).toString("base64");
    const r = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + basic
      },
      body
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data.error_description || data.error || "refresh failed" });
    }
    return res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      refresh_token: data.refresh_token || refresh_token,
      token_type: data.token_type
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || "proxy error" });
  }
}
