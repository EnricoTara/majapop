# MajaPOP!

**Ketika Lagu dan Puzzle Lebih dari Sekadar Hiburan**

MajaPOP! adalah media belajar majas dalam puisi lewat lagu pop dan puzzle interaktif yang dimainkan berkelompok.

🌐 **Buka web:** https://enricotara.github.io/majapop/

## Alur permainan

Bagi Tim → Putar Lagu → Identifikasi Majas → Susun Puzzle → Cipta Majas → Unggah Hasil

## Mengubah isi

Semua konten ada di satu file: [`js/data.js`](js/data.js).

| Yang ingin diubah | Bagian di `js/data.js` |
|---|---|
| Link Google Form untuk unggah hasil | `PENGATURAN.googleFormUrl` |
| Lama waktu puzzle (detik) dan jumlah baris | `PENGATURAN.waktuPuzzleDetik`, `PENGATURAN.jumlahBarisPuzzle` |
| Materi 8 jenis majas | `MAJAS` |
| Daftar lagu, kutipan lirik, makna, video YouTube | `LAGU` (isi `youtubeId` dengan teks setelah `v=` pada URL video) |
| Pertanyaan pemantik | `PEMANTIK` |
| Peta sastrawan | `SASTRAWAN` |

Setelah mengubah file, simpan lalu upload ulang (`git add -A && git commit -m "Perbarui konten" && git push`). Web akan ikut ter-update dalam sekitar 1 menit.

## Menjalankan di komputer

Buka `index.html` langsung di browser, atau jalankan `python -m http.server 8000` lalu buka `http://localhost:8000`.
