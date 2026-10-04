# RolxDesk

**Multi-model AI desk that actually runs tools** — not just talks about them.

Live: [rolxdesk.vercel.app](https://rolxdesk.vercel.app) · Repo: [Frost098/RolxDesk](https://github.com/Frost098/RolxDesk)

Chat, debate, teamwork, voice, camera, YouTube mini-player, browse, code sandboxes, hosted free models (owner key). One Vercel deploy.

---

## Why this exists

Most “AI chat” clones are a textarea + API key form. RolxDesk wires **real side-effects**: play media, fetch pages, run code, name sessions, show a Working panel while tools run. Models are instructed (and force-patched) to emit tool tags instead of inventing “I can’t access that.”

## Features (honest list)

| Area | What you get |
|------|----------------|
| **Models** | OpenRouter, Gemini, Venice, Manus, Custom/9router, **RD Hosted** (owner `OPENROUTER_API_KEY`) |
| **Modes** | Normal · Debate · Teamwork |
| **Media** | YouTube search→embed (drag / minimize / close), play-as-audio fallback |
| **Voice** | STT + TTS; mobile mic debounced |
| **Vision** | Paste image · camera (left) · pending files |
| **Tools** | `PLAY` `YOUTUBE` `BROWSE` `SEARCH` `IMG` `RUN_PY` `RUN_JS` `CALC` `HASH` `B64` `FETCH_JSON` `HTTP` `TIME` `UUID` |
| **Style** | Grok-like: direct, dry humor, anti-corporate |
| **Sessions** | Auto-title from topic |

### Sandbox reality check

- **Python** = browser **Pyodide** (stdlib + pure micropip wheels).
- **JS** = `/api/run-js` (no `require` / `fs` / `fetch`).
- **Not on free Vercel:** `apt-get`, `libzbar`, native OpenCV. RD will say the limit instead of faking success.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FFrost098%2FRolxDesk)

```bash
git clone https://github.com/Frost098/RolxDesk.git
cd RolxDesk
npx vercel
```

### Env vars (owner)

| Var | Purpose |
|-----|---------|
| `OPENROUTER_API_KEY` | Enables **RD Hosted** free models for visitors |
| `GOOGLE_AI_API_KEY` | Gemini / image (optional) |
| `SPOTIFY_CLIENT_ID` / `SECRET` | Spotify (often 403 without Premium app) |

Hosted models = convenience + **shared rate limits**. Expect 429 under load.

## Architecture

```
index.html          bootloader → ui.p0…p7.b64
extras.js           tools, force-tags, YT player, hosted bridge, Grok style
extras-ui.js        camera, mobile mic
api/
  yt-search.js      Piped/Invidious + score
  browse.js         page text
  openai-compat.js  custom baseUrl (9router /v1)
  hosted-chat.js    owner OpenRouter key
  hosted-models.js  list hosted models
  run-js.js         limited server JS
SOURCE.md           raw links for external AIs
```

## Tool tags

```
[[PLAY: diri tulus]]
[[YOUTUBE: dadylocky]]
[[BROWSE: https://example.com]]
[[RUN_PY]]print(2+2)[[/RUN_PY]]
[[RUN_JS]]console.log(1+1)[[/RUN_JS]]
[[HASH: hello]]
[[FETCH_JSON: https://api.github.com/zen]]
```

## License

Open source. Fork it, break it, ship a better desk.
