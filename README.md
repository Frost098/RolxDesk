# RolxDesk

> Multi-model AI desk that **runs tools for real** — play YouTube, browse the web, execute code, voice, camera — not a fancy textarea that only pretends.

**Live:** [rolxdesk.vercel.app](https://rolxdesk.vercel.app)  
**Docs:** [DOCS.md](./DOCS.md) (wiki-style guide)  
**Source map for external AIs:** [SOURCE.md](./SOURCE.md)

---

## Why RolxDesk exists

Most “ChatGPT clones” stop at: box + API key + stream tokens.  
RolxDesk is built so the model **emits tool tags** (`[[PLAY]]`, `[[BROWSE]]`, `[[RUN_PY]]`, …) and the **desk executes them** — mini player, Working panel, sandbox output, session titles.

If a model says “I can’t access the internet,” that’s a bug in the prompt path. The desk has tools; force-routing and TOOL_LAW exist to keep models honest.

---

## What you can do

| Area | Capability |
|------|------------|
| **Chat modes** | Normal · Debate · Teamwork |
| **Providers** | OpenRouter families, Google AI Studio, Venice, Manus, **Custom / 9router**, **NVIDIA (your key)**, **RD Hosted** (owner env keys) |
| **Media** | YouTube search → embed mini-player (drag, minimize, close); play-as-audio fallback |
| **Vision** | Paste image · camera from sidebar · optional Gemini vision bridge |
| **Voice** | STT + TTS (mobile mic debounced) |
| **Automations** | **YouTuber Upload** — track channels, browser notify on new video / live (while tab open) |
| **Tools** | PLAY, YOUTUBE, BROWSE, SEARCH, IMG, RUN_PY, RUN_JS, CALC, HASH, B64, FETCH_JSON, HTTP, REGEX, SLUG, UNIT, COLOR, QR, DIFF, … |
| **Style** | Grok-like: direct, dry humor, anti-corporate filler |

### Honest limits

| Claim | Reality |
|-------|---------|
| “Full Linux Python” | **No** — browser **Pyodide** (stdlib + pure micropip) |
| `apt-get` / native OpenCV | **No** on Vercel Hobby |
| Spotify Web API | Often **403** without Premium developer setup |
| YouTuber push 24/7 | Only while the RD tab is open |
| Hosted free models | Shared rate limits; slugs change when OpenRouter rotates free tier |

---

## Quick start

1. Open **[rolxdesk.vercel.app](https://rolxdesk.vercel.app)** or deploy your fork.
2. **Settings → API Keys** — paste what you use:
   - OpenRouter, Google, Venice, Manus, **NVIDIA**, Spotify tokens, Custom base URL…
3. Pick family + model → chat. Try: *putar lagu Diri Tulus*, *research https://…*, *jalankan python print(2+2)*.
4. Hamburger (☰): YouTuber Upload · Kamera (voice vision) · Connector · Sandbox · Settings.

### Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FFrost098%2FRolxDesk)

```bash
git clone https://github.com/Frost098/RolxDesk.git
cd RolxDesk
npx vercel
```

### Owner env (optional, Vercel)

| Variable | Effect |
|----------|--------|
| `OPENROUTER_API_KEY` | **RD Hosted** free models for visitors |
| `NVIDIA_API_KEY` | Hosted `nv:…` models via NVIDIA Integrate API |
| `GOOGLE_AI_API_KEY` | Server-side Gemini (optional) |
| `SPOTIFY_CLIENT_ID` / `SECRET` | Token refresh helper |

**Hobby plan:** max **12** Serverless Functions — don’t add `api/*.js` without merging.

---

## NVIDIA API key (Settings)

1. Get a key from [build.nvidia.com](https://build.nvidia.com) / NVIDIA NGC.  
2. RolxDesk → **Settings → NVIDIA API Key**.  
3. Choose family **Nvidia** (or a `nv:…` hosted model).  
4. Key stays in **your browser** (`localStorage` / `rd_keys`) — not uploaded to RD’s server unless you use host-only routes.

Owner can *also* set `NVIDIA_API_KEY` on Vercel so **RD Hosted** lists NVIDIA models for everyone (shared quota).

---

## Architecture (short)

```
index.html          loader + splash R/D + ui.p0…p7.b64 chunks
extras.js           tool tags, force-play, YT player, Grok style, hosted bridge
extras-ui.js        sidebar (YouTuber, camera), NVIDIA settings field, hosted family
api/
  yt-search.js      video search + channel monitor (merged)
  browse.js         page text extract
  hosted-chat.js    OpenRouter + NVIDIA env keys
  openai-compat.js  custom / 9router base URL
  run-js.js         limited server JS
DOCS.md             full wiki
README.md           this file
SOURCE.md           raw links for external AIs
```

---

## Tool tags (cheat sheet)

```
[[PLAY: diri tulus]]
[[YOUTUBE: dadylocky]]
[[BROWSE: https://example.com]]
[[SEARCH: cara rig vtuber cubism]]
[[RUN_PY]]print(2+2)[[/RUN_PY]]
[[RUN_JS]]console.log(1+1)[[/RUN_JS]]
[[HASH: hello]]  [[QR: https://rolxdesk.vercel.app]]
[[UNIT: 100 km to mi]]  [[COLOR: #76B900]]
```

Full list, modes, troubleshooting → **[DOCS.md](./DOCS.md)**.

---

## Contributing

PRs welcome. Please:

- Stay under **12** API functions on Hobby.  
- Prefer **honest errors** over fake “success”.  
- When free model slugs die, map to a **similar** free model — not a random unrelated one.  
- Keep mobile UI free of floating orbs that block the header.

---

## License

Open source. Fork it, break it, ship a better desk.
