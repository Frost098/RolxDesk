

## 24. v13 — direct CisyPi intent

CisyPi requests are now executed before the model call whenever the user message mentions CisyPi, even without `putar`, `play`, or a literal tool tag. For example, `cari CisyPi pantai` is converted by the send flow to `[[CISYPI: pantai]]` and opens the picker directly. The adapter also retries the public catalog without upstream search when a short typo-like query returns no rows, including the common `panta` → `pantai` normalization in the direct route.

## 25. v15 — CisyPi action final dan playback gateway

CisyPi intent sekarang selesai sebagai aksi final setelah picker dibuka: RD tidak lagi memanggil model kedua kali, sehingga picker tidak dobel dan provider tidak timeout hanya karena command media. Auto-search Wikipedia juga dilewati untuk pesan CisyPi.

Adapter menambahkan gateway playback `d.fxtwitter.com/{handle}/status/{id}.mp4`, mengikuti resolver playback internal CisyPi. Player mencoba video element nyata lebih dulu dan hanya memakai official X embed sebagai fallback jika gateway gagal. Gateway dapat kedaluwarsa; UI tidak menganggap playback berhasil sebelum elemen video/source tersedia.
