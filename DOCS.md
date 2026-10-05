# RolxDesk Wiki

Panduan lengkap — dari “baru buka tab” sampai “kenapa YouTuber diem” dan “cara pakai NVIDIA key di Settings”.

**Live:** https://rolxdesk.vercel.app  
**Repo:** https://github.com/Frost098/RolxDesk  
**Ringkas:** [README.md](./README.md)

---

## Daftar isi

1. [Apa itu RolxDesk](#1-apa-itu-rolxdesk)
2. [Tour UI](#2-tour-ui)
3. [API keys di Settings](#3-api-keys-di-settings)
4. [NVIDIA (key sendiri)](#4-nvidia-key-sendiri)
5. [RD Hosted (key owner di Vercel)](#5-rd-hosted-key-owner-di-vercel)
6. [Mode Normal / Debat / Teamwork](#6-mode-normal--debat--teamwork)
7. [Tools & tag](#7-tools--tag)
8. [YouTube & mini-player](#8-youtube--mini-player)
9. [YouTuber Upload (otomasi)](#9-youtuber-upload-otomasi)
10. [Kamera & vision](#10-kamera--vision)
11. [Voice](#11-voice)
12. [Sandbox kode](#12-sandbox-kode)
13. [Custom / 9router](#13-custom--9router)
14. [Deploy & batas Vercel](#14-deploy--batas-vercel)
15. [Troubleshooting](#15-troubleshooting)
16. [Struktur repo](#16-struktur-repo)
17. [Roadmap jujur](#17-roadmap-jujur)

---

## 1. Apa itu RolxDesk

RolxDesk adalah **meja kerja multi-LLM** di satu deploy Vercel:

- Model menjawab teks **dan** boleh mengeluarkan **tool tags**.
- Client (dan beberapa API) **mengeksekusi** tag itu: putar video, ambil teks situs, hitung hash, jalankan JS/Python terbatas, dll.
- Ada panel **Working** biar kelihatan proses tool — bukan “magic black box”.

Filosofi: **jangan bilang tidak bisa** kalau tool-nya ada. Kalau batas teknis (Pyodide, Hobby limit), bilang batasnya, jangan pura-pura sukses.

---

## 2. Tour UI

| Bagian | Fungsi |
|--------|--------|
| Header | Family, model, mode (Normal/Debat/Teamwork), Test Key |
| Chat | Bubble + tool results |
| Hamburger ☰ | Sessions, Plugins, Connector, **YouTuber Upload**, **Kamera (voice vision)**, Sandbox, Hub, Settings |
| Mini-player | YouTube embed — geser, minimize, tutup |
| Settings | API keys (termasuk **NVIDIA**), Spotify, temperature, max tokens |

Tombol bulat mengambang di pojok **sengaja dihapus** (menghalangi header di mobile).

---

## 3. API keys di Settings

Buka **Settings** (sidebar atau tombol Settings).

| Field | Dipakai untuk |
|-------|----------------|
| OpenRouter | Hampir semua family OpenRouter |
| Google AI Studio | Family Google + vision bridge |
| Venice / Manus | Provider khusus |
| **NVIDIA API Key** | Family **Nvidia** / model `nv:…` lewat `integrate.api.nvidia.com` |
| Custom Base URL + key | 9router, LiteLLM, vLLM, dll |
| Spotify tokens | Embed / search (sering 403 tanpa setup developer) |

Keys disimpan di **browser** (`localStorage` key `rd_keys`). Tidak otomatis dikirim ke repo GitHub.

Setelah isi NVIDIA key → **Simpan**.

---

## 4. NVIDIA (key sendiri)

Ini yang dimaksud “bukan hosted”:

1. Daftar / buat key di [build.nvidia.com](https://build.nvidia.com).
2. Settings → **NVIDIA API Key** → tempel → Simpan.
3. Pilih family **Nvidia** (atau model dengan id `nv:…` / `nvidia/…`).
4. Chat biasa. RD memanggil `https://integrate.api.nvidia.com/v1/chat/completions` dengan **Bearer key kamu**.

**Mapping:** beberapa slug OpenRouter `:free` dipetakan ke model Integrate yang mirip. Kalau 404, ganti model ke slug yang aktif di dashboard NVIDIA kamu.

| Cara | Siapa kuota | Di mana key |
|------|-------------|-------------|
| Settings → NVIDIA | Kamu | Browser |
| Vercel `NVIDIA_API_KEY` | Owner (shared) | Server → RD Hosted |

Keduanya bisa hidup bareng.

---

## 5. RD Hosted (key owner di Vercel)

Owner set di Vercel:

- `OPENROUTER_API_KEY` → model free OpenRouter  
- `NVIDIA_API_KEY` → model `nv:…` di daftar hosted  

Visitor pilih family **RD Hosted (gratis)** tanpa isi key.  
Cek: `GET /api/hosted-models` → `"hosted": true`.

Risiko: rate limit bersama, 429 saat rame.

---

## 6. Mode Normal / Debat / Teamwork

- **Normal** — satu model, satu alur.  
- **Debat** — beberapa persona/model saling respons.  
- **Teamwork** — pembagian tugas (leader / worker style).

---

## 7. Tools & tag

```
[[PLAY: query lagu]]
[[YOUTUBE: channel atau query]]
[[BROWSE: https://...]]
[[SEARCH: query]]
[[IMG: prompt gambar]]
[[HTTP: GET https://...]]
[[FETCH_JSON: https://api...]]
[[RUN_PY]]print(2+2)[[/RUN_PY]]
[[RUN_JS]]console.log(1+1)[[/RUN_JS]]
[[CALC: 2**10]]
[[TIME]] [[UUID]]
[[HASH: teks]] [[B64ENC: t]] [[B64DEC: t]]
[[REGEX: \\d+|abc 123]]
[[SLUG: Judul Artikel]]
[[UNIT: 100 km to mi]]
[[COLOR: #76B900]]
[[QR: https://rolxdesk.vercel.app]]
[[DIFF: lama|||baru]]
```

**Aturan:** jangan browse `youtube.com/results` — pakai PLAY / YOUTUBE. Research = SEARCH lalu BROWSE link nyata.

---

## 8. YouTube & mini-player

Query → `/api/yt-search` (Piped/Invidious) → embed `youtube-nocookie.com`.  
Mini-player: drag, minimize, close.

---

## 9. YouTuber Upload (otomasi)

Hamburger → **YouTuber Upload** → nama channel → Tambah.  
Butuh request `channel: true` (extras-ui ≥ 5.8).  
Notifikasi hanya saat tab RD terbuka.

---

## 10. Kamera & vision

Hamburger → **Kamera (voice vision)** → Ambil foto → antrean gambar chat.  
Paste gambar ke input juga didukung.

---

## 11. Voice

STT: Web Speech API (mobile kadang flaky — ada debounce).  
TTS: tergantung voice chip / provider.

---

## 12. Sandbox kode

| Runtime | Di mana | Bisa |
|---------|---------|------|
| Python | Pyodide browser | stdlib, pure wheels |
| JS | `/api/run-js` | JS murni, tanpa require/fs |

`apt-get` / OpenCV native **tidak** di Hobby.

---

## 13. Custom / 9router

Settings → Custom Base URL (HTTPS tunnel).  
Browser di produksi **tidak** bisa hit `localhost` tanpa tunnel + CORS.

---

## 14. Deploy & batas Vercel

Max **12** Serverless Functions.  
`hosted-models` → rewrite ke `hosted-chat`.  
`yt-channel` → rewrite ke `yt-search`.  
Setelah ubah env → **Redeploy**.

---

## 15. Troubleshooting

| Gejala | Coba |
|--------|------|
| Tambah YouTuber diem | Hard refresh; extras-ui ≥ 5.8 |
| Field NVIDIA tidak ada | Hard refresh setelah deploy v5.9 |
| NVIDIA 401/403 | Key salah / expired |
| NVIDIA 404 model | Ganti slug di dashboard NVIDIA |
| Hosted offline | Env + redeploy |
| Spotify 403 | Kebijakan API / Premium app |
| CORS localhost | Tunnel HTTPS |
| Tombol kirim freeze | Refresh; cek Working panel |
| AI ngarang web | Paksa BROWSE; jangan percaya tanpa tool |

---

## 16. Struktur repo

```
index.html / ui.p*.b64 / extras.js / extras-ui.js
api/hosted-chat.js  api/yt-search.js  api/browse.js
DOCS.md  README.md  SOURCE.md
```

---

## 17. Roadmap jujur

Nice-to-have: Service Worker notif, CLI RD, lebih banyak connector skills.  
Prioritas tetap: tools jalan, UI tidak nutup header, error jujur.

---

*Open source — issue/PR welcome.*
