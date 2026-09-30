// POST /api/spotify-search  { q: "lagu" }
// Env: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
// Pakai Client Credentials — tidak perlu user token (untuk search saja)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: "Set SPOTIFY_CLIENT_ID dan SPOTIFY_CLIENT_SECRET di Vercel Environment Variables, lalu Redeploy."
    });
  }

  let q = "";
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    q = String(body.q || body.query || "").trim();
  } catch (_) {}
  if (!q) return res.status(400).json({ error: "q kosong" });

  try {
    const basic = Buffer.from(clientId + ":" + clientSecret).toString("base64");
    const tokRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + basic,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });
    const tok = await tokRes.json().catch(function () { return {}; });
    if (!tokRes.ok || !tok.access_token) {
      return res.status(tokRes.status || 502).json({
        error: tok.error_description || tok.error || "Gagal client_credentials — cek Client ID/Secret"
      });
    }

    const searchUrl =
      "https://api.spotify.com/v1/search?type=track&limit=1&q=" + encodeURIComponent(q);
    const sRes = await fetch(searchUrl, {
      headers: { Authorization: "Bearer " + tok.access_token }
    });
    const data = await sRes.json().catch(function () { return {}; });
    if (!sRes.ok) {
      return res.status(sRes.status).json({
        error: (data.error && data.error.message) || ("Spotify search " + sRes.status)
      });
    }

    const track = data.tracks && data.tracks.items && data.tracks.items[0];
    if (!track) return res.status(404).json({ error: "Track tidak ditemukan: " + q });

    return res.status(200).json({
      id: track.id,
      name: track.name,
      artists: (track.artists || []).map(function (a) { return a.name; }).join(", "),
      uri: track.uri,
      external_url: track.external_urls && track.external_urls.spotify,
      image: track.album && track.album.images && track.album.images[0] && track.album.images[0].url
    });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
