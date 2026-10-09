

## 22. Capability hardening v11 — CisyPi, Manus, dan respons kosong

`[[CISYPI: query]]` memanggil endpoint `/api/cisypi-catalog` yang membaca prosedur publik CisyPi `catalog.list`. Adapter ini read-only, hanya mengembalikan metadata dan official source/embed, serta sengaja tidak mengekspos `videoSources.mediaUrl` yang dapat kedaluwarsa. Command natural seperti `putar video Hu Tao yang ada di CisyPi` diarahkan ke picker CisyPi, bukan YouTube atau Spotify.

Parser respons v11 memahami `message.content` berupa array, nested completion object, dan reasoning-only response. Jika provider tidak mengirim jawaban final, RD menampilkan status retry/model switch sehingga bubble tidak menjadi kotak kosong. Model Manus menerima konteks percakapan terbaru dan kontrak tool RD, bukan hanya potongan pesan terakhir.

Voice mobile sekarang memiliki guard awal yang lebih pendek agar ucapan pertama tidak terbuang setelah izin mic. Jika Fish Audio mengembalikan 402/403, RD tidak memalsukan playback; fallback-nya adalah browser speech synthesis. Mode gambar gratis diberi label endpoint publik eksternal dan tidak mengklaim file privat tersimpan.
