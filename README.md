# RolxDesk (RD)

**Open-source multi-provider AI chat desk** — single deploy, multi-model, tools, voice, sandbox.

Live: [rolxdesk.vercel.app](https://rolxdesk.vercel.app)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FFrost098%2FRolxDesk)

## Apa itu RolxDesk?

RolxDesk adalah chat UI + API proxy yang jalan di **Vercel** (atau static host + serverless).
Satu repo, deploy sekali, pakai model dari:

- OpenRouter (termasuk `:free`)
- Google AI Studio / Gemini
- Venice
- Manus
- Custom / 9router (OpenAI-compatible)

Fitur inti:

| Area | Fitur |
|------|--------|
| Chat | Sesi, rename, memory, markdown, file card |
| Mode | Normal \u00b7 Debat \u00b7 Teamwork (multi-model chips) |
| Tools | Browse, download, search, YouTube mini player |
| Code | Python (Pyodide) + JS sandbox, bisa di-peek |
| Voice | SpeechRecognition + TTS (Fish / speechSynthesis) |
| Vision | Upload gambar + bridge Gemini |
| Slash | `/img` `/song` `/video` (via `extras.js`) |
| Konektor | Spotify OAuth, GitHub label, custom base URL |

## Install / Deploy (seperti Download dari Vercel)

### Opsi A — Deploy ke Vercel (paling gampang)

1. Klik tombol **Deploy with Vercel** di atas
2. Atau: [vercel.com/new](https://vercel.com/new) → Import `Frost098/RolxDesk`
3. Set env (opsional, sesuai provider):

```
OPENROUTER_API_KEY=
GOOGLE_AI_API_KEY=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

4. Deploy → URL `https://xxx.vercel.app`

### Opsi B — Clone lokal

```bash
git clone https://github.com/Frost098/RolxDesk.git
cd RolxDesk
npx vercel dev
```

### Opsi C — Fork lalu Deploy

Fork repo ini → Vercel pilih fork kamu → Deploy.
Update = `git pull` di fork + redeploy.

## Struktur

```
index.html          → loader kecil (fetch ui.p0…p7 + gunzip)
ui.p0.b64 … p7.b64  → UI penuh (gzip+base64 chunk)
extras.js           → fitur modular (/img /song /video, peek)
api/                → serverless proxies
vercel.json
```

Fitur baru taruh di `extras.js` supaya tidak perlu upload UI 170KB lagi.

## Slash

```
/img sunset over jakarta
/song lo-fi hujan
/video drone pantai senja
```

## Lisensi

Open source — pakai, fork, modifikasi bebas.
Credit: RolxDesk / Frost098
