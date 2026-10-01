# RolxDesk (RD)

**Open-source multi-provider AI chat desk** — multi-model, tools, voice, sandbox.

- **Live:** https://rolxdesk.vercel.app
- **Full source map (raw links):** [SOURCE.md](./SOURCE.md)
- **Repo:** https://github.com/Frost098/RolxDesk (public)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FFrost098%2FRolxDesk)

## For humans & AI crawlers

GitHub HTML pages are often blocked or empty for external AI (Gemini, ChatGPT).
Use **raw** URLs instead, listed in [SOURCE.md](./SOURCE.md).

Examples:

```
https://raw.githubusercontent.com/Frost098/RolxDesk/main/extras.js
https://raw.githubusercontent.com/Frost098/RolxDesk/main/api/yt-search.js
https://raw.githubusercontent.com/Frost098/RolxDesk/main/README.md
```

## What is RolxDesk?

Chat UI + Vercel API proxies. One deploy, models from:

- OpenRouter (including free)
- Google AI Studio / Gemini
- Venice, Manus, custom / 9router (OpenAI-compatible)

| Area | Features |
|------|----------|
| Chat | Sessions, memory, markdown |
| Modes | Normal · Debate · Teamwork |
| Tools | Browse, search, YouTube mini player, Working panel |
| Code | Python (Pyodide) + JS sandbox |
| Media | `/img` Gemini, `/song` `/video` |
| Connectors | Spotify, GitHub, Vercel tokens in Settings |

## Deploy

1. Deploy button above, or import `Frost098/RolxDesk` on Vercel
2. Optional env: `OPENROUTER_API_KEY`, `GOOGLE_AI_API_KEY`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`
3. Open the Vercel URL

```bash
git clone https://github.com/Frost098/RolxDesk.git
cd RolxDesk
npx vercel
```

## Layout

```
index.html     loader (ui.p0…p7 chunks)
extras.js      modular tools (v4.7+) — Working panel, YT, img, anti-sticky
api/           serverless: browse, yt-search, spotify-search, …
ui.p*.b64      gzip+base64 UI chunks
SOURCE.md      raw link map for AI / offline reading
```

New features go in `extras.js` so the large UI blob does not need re-upload.

## License

Open source — fork and modify freely. Credit: RolxDesk / Frost098
