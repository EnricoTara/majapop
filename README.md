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

## Sesi Kelas: progress live per kelompok (seperti Quizizz)

Guru membuka **Dashboard** (`guru.html`, ada link "Untuk guru" di bagian bawah setiap halaman), memilih jenis sesi, lalu menekan **Mulai Sesi**:

- **👥 Kelompok**: siswa mengisi nama kelompok, anggota, dan pembagian peran.
- **👤 Individu**: setiap siswa mengisi nama, kelas, dan no. absen.

Kode 4 angka dan QR akan muncul. Siswa **wajib** memasukkan kode itu di halaman **Bagi Tim**, lalu form otomatis menyesuaikan jenis sesinya. Setelah mengisi data, siswa masuk ke **ruang tunggu** dan nama mereka muncul di dashboard guru. Guru menekan **🚀 Mulai Sesi** ketika semua sudah bergabung, lalu permainan di semua HP siswa terbuka bersamaan. Siswa yang bergabung setelah sesi dimulai langsung bisa bermain. Peringkat, langkah, dan poin setiap kelompok/siswa lalu tampil langsung di dashboard, dan di HP siswa muncul badge "Peringkat X dari Y". Rekap bisa diunduh sebagai CSV (dibuka di Excel).

Poin: 10 per majas benar, +5 jika tepat di tebakan pertama, ditambah skor puzzle, dan 20 per kalimat majas buatan (maks. 3 kalimat).

### Mengaktifkan (sekali saja, gratis)

Fitur ini memakai Firebase paket **Spark** (gratis, tanpa kartu kredit). Kalau belum diaktifkan, MajaPOP tetap bisa dimainkan seperti biasa.

1. Buka [console.firebase.google.com](https://console.firebase.google.com), lalu klik **Create a project** dan beri nama `majapop`. Google Analytics boleh dimatikan.
2. **Build → Realtime Database → Create Database**, pilih lokasi **Singapore (asia-southeast1)** dan mode **locked**.
3. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable → Save**.
4. **Realtime Database → tab Rules**: hapus isinya, tempel seluruh isi file [`database.rules.json`](database.rules.json), lalu klik **Publish**.
5. **Project settings (⚙️) → Your apps → ikon Web `</>`**, daftarkan app bernama `MajaPOP` (tanpa Hosting), lalu salin isi `firebaseConfig`.
6. Tempel ke [`js/firebase-config.js`](js/firebase-config.js) menjadi `const FIREBASE_CONFIG = { apiKey: "...", ... };`, lalu upload ulang.

> Setiap kali `database.rules.json` berubah (misalnya setelah fitur Kelompok/Individu atau ruang tunggu ditambahkan), ulangi langkah 4 agar aturan di Firebase ikut diperbarui.

Isi `firebaseConfig` memang aman untuk publik. Yang melindungi data adalah aturan di langkah 4: siswa hanya bisa mengubah data kelompoknya sendiri, dan hanya guru pembuat sesi yang bisa mengakhirinya.

## Menjalankan di komputer

Buka `index.html` langsung di browser, atau jalankan `python -m http.server 8000` lalu buka `http://localhost:8000`.
