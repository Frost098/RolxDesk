/** Unified Spotify API — replaces login/callback/refresh/search (Hobby ≤12 functions) */
export default async function handler(req, res) {
  const url = new URL(req.url || "/", "http://x");
  const action = String(
    (req.query && (req.query.action || req.query.a)) ||
      url.searchParams.get("action") ||
      url.searchParams.get("a") ||
      ""
  ).toLowerCase();

  // Infer action from legacy path when rewritten
  const pathHint = String((req.query && req.query.__path) || "");
  const act =
    action ||
    (pathHint.includes("login")
      ? "login"
      : pathHint.includes("callback")
        ? "callback"
        : pathHint.includes("refresh")
          ? "refresh"
          : pathHint.includes("search")
            ? "search"
            : req.method === "GET" && req.query && req.query.code
              ? "callback"
              : req.method === "GET"
                ? "login"
                : "search");

  if (act === "login") return login(req, res);
  if (act === "callback") return callback(req, res);
  if (act === "refresh") return refresh(req, res);
  if (act === "search") return search(req, res);

  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(400).json({
    error: "Unknown action. Use ?action=login|callback|refresh|search"
  });
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function hostProto(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "rolxdesk.vercel.app";
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  return { host, proto };
}

async function login(req, res) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    return res
      .status(500)
      .send("SPOTIFY_CLIENT_ID belum di-set di Vercel Environment Variables. Set lalu Redeploy.");
  }
  const { host, proto } = hostProto(req);
  const defaultRedirect = proto + "://" + host + "/api/spotify?action=callback";
  const redirectUri = (req.query && req.query.redirect_uri) || defaultRedirect;
  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-top-read",
    "user-read-playback-state",
    "user-modify-playback-state",
    "streaming",
    "playlist-read-private",
    "playlist-read-collaborative"
  ].join(" ");
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: scopes,
    show_dialog: "true"
  });
  res.setHeader("Location", "https://accounts.spotify.com/authorize?" + params.toString());
  return res.status(302).end();
}

async function callback(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res
      .status(500)
      .send("<h1>Error</h1><p>Set SPOTIFY_CLIENT_ID dan SPOTIFY_CLIENT_SECRET di Vercel, lalu Redeploy.</p>");
  }
  if (req.query.error) {
    return res
      .status(400)
      .send("<h1>Ditolak</h1><p>" + (req.query.error_description || req.query.error) + "</p>");
  }
  const code = req.query.code;
  if (!code) {
    return res
      .status(400)
      .send("<h1>Error</h1><p>Tidak ada code. Mulai dari /api/spotify?action=login</p>");
  }
  const { host, proto } = hostProto(req);
  const redirectUri = proto + "://" + host + "/api/spotify?action=callback";
  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: String(code),
      redirect_uri: redirectUri
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
      return res
        .status(r.status)
        .send(
          "<h1>Gagal</h1><p>" +
            (data.error_description || data.error || r.status) +
            "</p><p>Redirect URI harus: <code>" +
            redirectUri +
            "</code></p>"
        );
    }
    const access = data.access_token || "";
    const refreshTok = data.refresh_token || "";
    return res.status(200).send(`<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Spotify OK</title>
<style>body{font-family:system-ui;background:#111;color:#eee;max-width:640px;margin:40px auto;padding:16px}textarea{width:100%;background:#1a1a1a;color:#eee;border:1px solid #333;border-radius:8px;padding:10px;margin:6px 0}button{background:#1db954;color:#000;border:0;padding:8px 14px;border-radius:8px;font-weight:600;cursor:pointer;margin-right:8px}code{background:#222;padding:2px 6px;border-radius:4px;word-break:break-all}a{color:#1db954}</style></head><body>
<h1>Spotify token siap</h1>
<p>Salin <b>Refresh Token</b> ke RolxDesk Settings.</p>
<label>Access Token</label><textarea id="at" rows="3">${access}</textarea>
<button type="button" onclick="navigator.clipboard.writeText(document.getElementById('at').value)">Copy access</button>
<label>Refresh Token</label><textarea id="rt" rows="3">${refreshTok}</textarea>
<button type="button" onclick="navigator.clipboard.writeText(document.getElementById('rt').value)">Copy refresh</button>
<p>Redirect: <code>${redirectUri}</code></p>
<p><a href="/">Kembali ke RolxDesk</a></p></body></html>`);
  } catch (e) {
    return res.status(500).send("<h1>Error</h1><p>" + (e.message || e) + "</p>");
  }
}

async function refresh(req, res) {
  cors(res);
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
      return res
        .status(r.status)
        .json({ error: data.error_description || data.error || "refresh failed" });
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

async function search(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error:
        "Set SPOTIFY_CLIENT_ID dan SPOTIFY_CLIENT_SECRET di Vercel Environment Variables, lalu Redeploy."
    });
  }

  let q = "";
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
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
    const tok = await tokRes.json().catch(function () {
      return {};
    });
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
    const data = await sRes.json().catch(function () {
      return {};
    });
    if (!sRes.ok) {
      return res.status(sRes.status).json({
        error: (data.error && data.error.message) || "Spotify search " + sRes.status
      });
    }

    const track = data.tracks && data.tracks.items && data.tracks.items[0];
    if (!track) return res.status(404).json({ error: "Track tidak ditemukan: " + q });

    return res.status(200).json({
      id: track.id,
      name: track.name,
      artists: (track.artists || []).map(function (a) {
        return a.name;
      }).join(", "),
      uri: track.uri,
      external_url: track.external_urls && track.external_urls.spotify,
      image: track.album && track.album.images && track.album.images[0] && track.album.images[0].url
    });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
