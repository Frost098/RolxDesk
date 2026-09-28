export default async function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).send("<h1>Error</h1><p>Set SPOTIFY_CLIENT_ID dan SPOTIFY_CLIENT_SECRET di Vercel, lalu Redeploy.</p>");
  }
  if (req.query.error) {
    return res.status(400).send("<h1>Ditolak</h1><p>" + (req.query.error_description || req.query.error) + "</p>");
  }
  const code = req.query.code;
  if (!code) return res.status(400).send("<h1>Error</h1><p>Tidak ada code. Mulai dari /api/spotify-login</p>");
  const host = req.headers["x-forwarded-host"] || req.headers.host || "rolxdesk.vercel.app";
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const redirectUri = proto + "://" + host + "/api/spotify-callback";
  try {
    const body = new URLSearchParams({ grant_type: "authorization_code", code: String(code), redirect_uri: redirectUri });
    const basic = Buffer.from(clientId + ":" + clientSecret).toString("base64");
    const r = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: "Basic " + basic },
      body
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).send("<h1>Gagal</h1><p>" + (data.error_description || data.error || r.status) + "</p><p>Redirect URI harus: <code>" + redirectUri + "</code></p>");
    }
    const access = data.access_token || "";
    const refresh = data.refresh_token || "";
    return res.status(200).send(`<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Spotify OK</title>
<style>body{font-family:system-ui;background:#111;color:#eee;max-width:640px;margin:40px auto;padding:16px}textarea{width:100%;background:#1a1a1a;color:#eee;border:1px solid #333;border-radius:8px;padding:10px;margin:6px 0}button{background:#1db954;color:#000;border:0;padding:8px 14px;border-radius:8px;font-weight:600;cursor:pointer;margin-right:8px}code{background:#222;padding:2px 6px;border-radius:4px;word-break:break-all}a{color:#1db954}</style></head><body>
<h1>Spotify token siap</h1>
<p>Salin <b>Refresh Token</b> ke RolxDesk Settings.</p>
<label>Access Token</label><textarea id="at" rows="3">${access}</textarea>
<button type="button" onclick="navigator.clipboard.writeText(document.getElementById('at').value)">Copy access</button>
<label>Refresh Token</label><textarea id="rt" rows="3">${refresh}</textarea>
<button type="button" onclick="navigator.clipboard.writeText(document.getElementById('rt').value)">Copy refresh</button>
<p>Redirect: <code>${redirectUri}</code></p>
<p><a href="/">Kembali ke RolxDesk</a></p></body></html>`);
  } catch (e) {
    return res.status(500).send("<h1>Error</h1><p>" + (e.message || e) + "</p>");
  }
}
