# RolxDesk Docs

Panduan lengkap RolxDesk — multi-model AI desk dengan tools yang benar-benar jalan.

**Live:** https://rolxdesk.vercel.app  
**Repo:** https://github.com/Frost098/RolxDesk

---

## Daftar isi

1. [Apa itu RolxDesk](#apa-itu-rolxdesk)
2. [Cara pakai cepat](#cara-pakai-cepat)
3. [Model & family](#model--family)
4. [Mode chat](#mode-chat)
5. [Tools (tag)](#tools-tag)
6. [YouTuber Upload](#youtuber-upload)
7. [Kamera & voice vision](#kamera--voice-vision)
8. [RD Hosted (gratis)](#rd-hosted-gratis)
9. [Deploy & env](#deploy--env)
10. [Batas teknis](#batas-teknis)
11. [Struktur repo](#struktur-repo)

---

## Apa itu RolxDesk

RolxDesk bukan chatbot biasa. Model diminta **emit tool tags**; client/server mengeksekusi (play YouTube, browse web, jalankan kode, dll). Ada mode Debat / Teamwork, voice, camera, mini-player, dan model hosted lewat key owner.

---

## Cara pakai cepat

1. Buka https://rolxdesk.vercel.app
2. Pilih **family** + **model** di header
3. Chat biasa, atau minta: *putar lagu…*, *research situs…*, *jalankan python…*
4. Buka **hamburger (☰)** untuk:
   - Plugins / Connector
   - **YouTuber Upload** — pantau channel + notifikasi
   - **Kamera (voice vision)** — ambil foto untuk model vision
   - Chat session / Sandbox / Hub / Settings

---

## Model & family

| Family | Keterangan |
|--------|------------|
| Persona | Claude / GPT / Grok / Kimi style (via OpenRouter dll) |
| Vision | Model yang bisa lihat gambar |
| GPT / North | North Mini Code & sejenis |
| Qwen / DeepSeek / Nvidia | Family OpenRouter |
| Google AI Studio | Butuh key Gemini user |
| Venice / Manus | Provider khusus |
| **RD Hosted (gratis)** | Pakai `OPENROUTER_API_KEY` owner — visitor tanpa key |
| Custom | 9router / base URL sendiri |

Slug free berubah sering. RD memetakan model mati ke free terdekat (mis. Grok-like → Inkling, bukan DeepSeek berbayar).

---

## Mode chat

- **Normal** — satu model
- **Debat** — beberapa model beradu
- **Teamwork** — kolaborasi multi-model

---

## Tools (tag)

Model (atau force-patch) boleh menulis:

```
[[PLAY: diri tulus]]
[[YOUTUBE: dadylocky]]
[[BROWSE: https://example.com]]
[[SEARCH: cara rig vtuber cubism]]
[[IMG: sunset jakarta cyberpunk]]
[[RUN_PY]]print(2+2)[[/RUN_PY]]
[[RUN_JS]]console.log(1+1)[[/RUN_JS]]
[[CALC: 2**10]]
[[TIME]] [[UUID]]
[[HASH: hello]] [[B64ENC: hi]] [[B64DEC: aGk=]]
[[FETCH_JSON: https://api.github.com/zen]]
[[HTTP: GET https://example.com]]
[[WEATHER: jakarta]]
[[TRANSLATE: en|halo dunia]]
[[REGEX: \\d+|abc 123]]
[[SLUG: Judul Artikel Keren]]
[[UNIT: 100 km to mi]]
[[COLOR: #1a73e8]]
[[QR: https://rolxdesk.vercel.app]]
[[DIFF: teks lama|||teks baru]]
```

**Aturan:** jangan browse `youtube.com/results` — pakai `PLAY` / `YOUTUBE`. Research = SEARCH lalu BROWSE link nyata.

---

## YouTuber Upload

Hamburger → **YouTuber Upload**

1. Ketik nama channel → Tambah  
2. Muncul **foto profil + nama**  
3. Selama tab RD terbuka, cek berkala  
4. Video baru / live → notifikasi browser (izin diminta sekali)

Batasan: bukan push 24/7 OS; hanya saat tab aktif.

---

## Kamera & voice vision

Hamburger → **Kamera (voice vision)**

- Buka kamera depan/belakang  
- **Ambil foto** → masuk antrean gambar chat (untuk model vision)  
- Tidak ada tombol bulat mengambang di pojok (mengganggu UI)

---

## RD Hosted (gratis)

Owner set di Vercel:

| Variable | Wajib |
|----------|--------|
| `OPENROUTER_API_KEY` | Ya, untuk hosted |

Setelah **Redeploy**, `/api/hosted-models` mengembalikan `"hosted": true`.

Pool contoh: Qwen3.8, Gemma 4, Nemotron, North Mini Code, Inkling, `openrouter/free`.

Rate limit shared — traffic tinggi = 429.

---

## Deploy & env

```bash
git clone https://github.com/Frost098/RolxDesk.git
cd RolxDesk
npx vercel
```

**Hobby limit:** max **12** Serverless Functions. Jangan tambah file `api/*.js` tanpa merge dulu.

---

## Batas teknis

| Fitur | Realita |
|-------|---------|
| Python | Pyodide di browser — bukan server full Linux |
| `apt` / OpenCV native | Tidak di Vercel free |
| Spotify Web API | Sering 403 |
| YouTube | Embed / Piped search |
| Background notif YT | Hanya saat tab RD dibuka |

---

## Struktur repo

```
index.html       loader + splash R/D
extras.js        tools, force tags, player
extras-ui.js     sidebar tools, camera panel
api/             serverless (≤12 Hobby)
DOCS.md          dokumen ini
README.md        ringkas
```

---

## Kontribusi

Issue / PR welcome. Utamakan: jangan lewat 12 function Hobby, jujur soal batas sandbox, update free model slug saat OpenRouter berubah.
