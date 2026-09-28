// GET /api/spotify-login → redirect ke Spotify authorize
// Env: SPOTIFY_CLIENT_ID
export default async function handler(req, res) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    return res.status(500).send(
      "SPOTIFY_CLIENT_ID belum di-set di Vercel Environment Variables. Set lalu Redeploy."
    );
  }
  const host = req.headers["x-forwarded-host"] || req.headers.host || "rolxdesk.vercel.app";
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const defaultRedirect = proto + "://" + host + "/api/spotify-callback";
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
