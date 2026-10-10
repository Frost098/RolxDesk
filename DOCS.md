

## 24. v13 — direct CisyPi intent

CisyPi requests are now executed before the model call whenever the user message mentions CisyPi, even without `putar`, `play`, or a literal tool tag. For example, `cari CisyPi pantai` is converted by the send flow to `[[CISYPI: pantai]]` and opens the picker directly. The adapter also retries the public catalog without upstream search when a short typo-like query returns no rows, including the common `panta` → `pantai` normalization in the direct route.

## 25. v15 — CisyPi action final dan playback gateway

CisyPi intent sekarang selesai sebagai aksi final setelah picker dibuka: RD tidak lagi memanggil model kedua kali, sehingga picker tidak dobel dan provider tidak timeout hanya karena command media. Auto-search Wikipedia juga dilewati untuk pesan CisyPi.

Adapter menambahkan gateway playback `d.fxtwitter.com/{handle}/status/{id}.mp4`, mengikuti resolver playback internal CisyPi. Player mencoba video element nyata lebih dulu dan hanya memakai official X embed sebagai fallback jika gateway gagal. Gateway dapat kedaluwarsa; UI tidak menganggap playback berhasil sebelum elemen video/source tersedia.

## 26. v16 — Astra-style code blocks

Code fences now render as one focused dark code panel inspired by Astra Companion: compact language/file header, Copy and Download actions, mobile-safe horizontal scrolling, and no duplicate file card. Spotify upstream 401/403 responses are normalized into an actionable configuration message instead of a generic playback failure.

## 27. v17 — code block render hotfix

Restored the encoded code payload declaration needed by Copy/Download after the Astra-style renderer refactor. Full UI source and gzip chunks pass round-trip validation.

## 28. v18 — Fish Audio CORS proxy

Voice TTS no longer calls `api.fish.audio` directly from the browser. The client sends the request to `/api/fish-tts`; the server-side function forwards it to Fish Audio and returns the MP3 response. This removes the browser preflight/CORS failure and keeps the Fish key out of the third-party request path visible to the page.

## 29. v19 — exact character voices and karaoke subtitles

Fish Audio reference IDs are mapped explicitly: Ibuki, Alya, Koro Sensei, Verity, Zeta, and Prabowo. Alya is now available in the voice picker. Voice response text stays hidden until audio playback begins; the overlay then reveals words one at a time with fade-in/fade-out styling. Timing is estimated from the returned audio duration and word/punctuation weights because Fish TTS returns audio bytes, not word-level alignment timestamps.
