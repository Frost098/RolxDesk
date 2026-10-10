

## 24. v13 — direct CisyPi intent

CisyPi requests are now executed before the model call whenever the user message mentions CisyPi, even without `putar`, `play`, or a literal tool tag. For example, `cari CisyPi pantai` is converted by the send flow to `[[CISYPI: pantai]]` and opens the picker directly. The adapter also retries the public catalog without upstream search when a short typo-like query returns no rows, including the common `panta` → `pantai` normalization in the direct route.

## 25. v15 — CisyPi action final dan playback gateway

CisyPi intent sekarang selesai sebagai aksi final setelah picker dibuka: RD tidak lagi memanggil model kedua kali, sehingga picker tidak dobel dan provider tidak timeout hanya karena command media. Auto-search Wikipedia juga dilewati untuk pesan CisyPi.

Adapter menambahkan gateway playback `d.fxtwitter.com/{handle}/status/{id}.mp4`, mengikuti resolver playback internal CisyPi. Player mencoba video element nyata lebih dulu dan hanya memakai official X embed sebagai fallback jika gateway gagal. Gateway dapat kedaluwarsa; UI tidak menganggap playback berhasil sebelum elemen video/source tersedia.

## 26. v16 — Astra-style code blocks

Code fences now render as one focused dark code panel inspired by Astra Companion: compact language/file header, Copy and Download actions, mobile-safe horizontal scrolling, and no duplicate file card. Spotify upstream 401/403 responses are normalized into an actionable configuration message instead of a generic playback failure.

## 27. v17 — code block render hotfix

Restored the encoded code payload declaration needed by Copy/Download after the Astra-style renderer refactor. Full UI source and gzip chunks pass round-trip validation.
