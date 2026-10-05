# RolxDesk

**Multi-model AI desk yang benar-benar menjalankan tools** — play media, browse, kode, voice, kamera.

🌐 **[rolxdesk.vercel.app](https://rolxdesk.vercel.app)** · 📖 **[Dokumentasi lengkap (DOCS.md)](./DOCS.md)** · 📦 [GitHub](https://github.com/Frost098/RolxDesk)

---

## Fitur singkat

| | |
|--|--|
| **Chat** | Normal · Debat · Teamwork |
| **Model** | OpenRouter, Gemini, Venice, Manus, Custom/9router, **RD Hosted** |
| **Media** | YouTube mini-player (drag/minimize/close), play lagu |
| **Tools** | PLAY, YOUTUBE, BROWSE, SEARCH, RUN_PY/JS, HTTP, HASH, REGEX, QR, … |
| **Sidebar** | YouTuber Upload · Kamera (voice vision) · Connector · Sandbox |
| **Voice** | STT + TTS (mobile debounced) |

## Mulai

1. Buka live app atau deploy ke Vercel  
2. (Opsional owner) Set `OPENROUTER_API_KEY` di Vercel → **Settings → Environment Variables** → Redeploy  
3. Pilih model → chat. Minta *putar lagu*, *research url*, *jalankan kode*

## Env

| Key | Fungsi |
|-----|--------|
| `OPENROUTER_API_KEY` | RD Hosted untuk visitor |
| `GOOGLE_AI_API_KEY` | Gemini / image (opsional) |

## Batas jujur

- Python = **Pyodide** (bukan VPS). Tidak ada `apt-get` / OpenCV native di Hobby.  
- Max **12** API functions (Hobby).  
- Notifikasi YouTuber hanya saat tab RD terbuka.

Detail tools, arsitektur, dan troubleshooting → **[DOCS.md](./DOCS.md)**.

## License

Open source — lihat repo untuk isu & PR.
