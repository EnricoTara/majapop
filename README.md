# MajaPOP!

**Ketika Lagu dan Puzzle Lebih dari Sekadar Hiburan**

MajaPOP! adalah media belajar majas dalam puisi lewat lagu pop dan puzzle interaktif yang dimainkan berkelompok.

🌐 **Buka web:** https://majapop.web.app/

## Alur permainan

Masukkan Kode → Putar Lagu → Identifikasi Majas → Susun Puzzle → Cipta Majas → Unggah Hasil

## Mengubah isi

Semua konten ada di satu file: [`js/data.js`](js/data.js).

| Yang ingin diubah | Bagian di `js/data.js` |
|---|---|
| Link Google Form untuk unggah hasil | `PENGATURAN.googleFormUrl` |
| Lama waktu puzzle (detik); jumlah baris otomatis mengikuti jumlah jenis majas di `LAGU` | `PENGATURAN.waktuPuzzleDetik` |
| Materi 8 jenis majas | `MAJAS` |
| Daftar lagu, kutipan lirik, makna, video YouTube | `LAGU` (isi `youtubeId` dengan teks setelah `v=` pada URL video) |
| Pertanyaan pemantik | `PEMANTIK` |
| Peta sastrawan | `SASTRAWAN` |
| Musik pengiring beranda dan nada peringkat, serta volumenya | `PENGATURAN.musikBeranda`, `PENGATURAN.musikPeringkat`, `PENGATURAN.volumeMusik` (file MP3 di folder `music/`) |
| Video pengenalan MajaPOP di Beranda | `PENGATURAN.videoPengenalan` (ID YouTube, teks setelah `v=` atau `youtu.be/`) |
| Gambar infografis di bawah video | `PENGATURAN.infografis` (daftar file di folder `img/materi/`) |

**Video pengenalan:** unggah videonya ke YouTube dengan visibilitas **Tidak publik**, lalu isi ID-nya. Jangan menaruh file video di folder web: GitHub menolak file di atas 100 MB, dan kuota transfer gratis Firebase Hosting (sekitar 360 MB/hari) bisa habis hanya dalam beberapa kali tonton sehingga web ikut mati. Bagian video juga tertaut dari halaman Masukkan Kode, untuk siswa yang masuk lewat QR guru.

**Musik:** lagu beranda berputar saat siswa membuka web (termasuk di ruang tunggu) dan berhenti perlahan saat guru menekan **🚀 Mulai Sesi**. Siswa bisa mematikannya lewat tombol 🔊 di pojok kiri bawah. Browser HP baru mengizinkan suara setelah layar disentuh pertama kali, jadi musik mulai pada sentuhan pertama. Nada peringkat diputar sekali saat papan peringkat akhir muncul di HP siswa. Gunakan musik yang boleh dipakai (bebas royalti atau milik sendiri) karena web ini publik.

Setelah mengubah file, simpan lalu upload ulang: `git add -A && git commit -m "Perbarui konten" && git push`, lalu `firebase deploy --only hosting` agar web di majapop.web.app ikut ter-update.

## Sesi Kelas: progress live per kelompok (seperti Quizizz)

Siswa dan guru masuk lewat pintu yang sama: tombol **Belajar** di pojok kanan atas (halaman `masuk.html`), lalu memilih **🎒 Saya Siswa** atau **👩‍🏫 Saya Guru**.

- **Siswa** memasukkan kode sesi dari guru, seperti biasa. Link/QR dari guru langsung membuka pilihan Siswa.
- **Guru** login dengan username **Rediva Novalisty** dan password akun guru, lalu diarahkan ke **Dashboard** (`guru.html`). Dashboard tidak bisa dibuka tanpa login. Selama masih login, tombol pojok kanan atas berubah menjadi **📡 Dashboard**. Tombol **🚪 Keluar** ada di bawah judul Dashboard.

Di Dashboard, guru memilih jenis sesi lalu menekan **Buat Kode Sesi**:

- **👥 Kelompok**: siswa mengisi nama kelompok, anggota, dan pembagian peran.
- **👤 Individu**: setiap siswa mengisi nama, kelas, dan no. absen.

Kode 4 angka dan QR akan muncul. Siswa **wajib** memasukkan kode itu di halaman **Masukkan Kode**, lalu form otomatis menyesuaikan jenis sesinya. Setelah mengisi data, siswa masuk ke **ruang tunggu** dan nama mereka muncul di dashboard guru. Guru menekan **🚀 Mulai Sesi** ketika semua sudah bergabung, lalu permainan di semua HP siswa terbuka bersamaan. Siswa yang bergabung setelah sesi dimulai langsung bisa bermain. Peringkat dan langkah setiap kelompok/siswa lalu tampil langsung di dashboard, dan di HP siswa muncul badge "Peringkat X dari Y" dengan tombol **📋 Papan peringkat** untuk melihat seluruh peserta sesi (3 teratas disorot, baris sendiri ditandai "kamu"). Rekap bisa diunduh sebagai CSV (dibuka di Excel). Saat guru menekan **Akhiri sesi**, dashboard menampilkan **podium juara 1-2-3** beranimasi (cocok untuk proyektor), dan di HP siswa papan peringkat akhir terbuka otomatis.

Urutan peringkat: **jawaban benar terbanyak → jawaban salah paling sedikit → durasi mengerjakan tercepat**. Benar/salah dihitung dari tebakan majas (setiap tebakan yang keliru = 1 salah) dan kepingan puzzle. Durasi dihitung dari soal pertama dibuka sampai jawaban terakhir.

Poin (tetap ditampilkan dan ikut di rekap): 10 per majas benar, +5 jika tepat di tebakan pertama, ditambah skor puzzle, dan 20 per kalimat majas buatan (maks. 3 kalimat).

### Mengaktifkan (sekali saja, gratis)

Fitur ini memakai Firebase paket **Spark** (gratis, tanpa kartu kredit). Kalau belum diaktifkan, MajaPOP tetap bisa dimainkan seperti biasa.

1. Buka [console.firebase.google.com](https://console.firebase.google.com), lalu klik **Create a project** dan beri nama `majapop`. Google Analytics boleh dimatikan.
2. **Build → Realtime Database → Create Database**, pilih lokasi **Singapore (asia-southeast1)** dan mode **locked**.
3. **Build → Authentication → Get started → Sign-in method**: aktifkan **Anonymous** (untuk siswa) dan **Email/Password** (untuk guru), lalu **Save**.
   Setelah itu buka tab **Users → Add user**: email `rediva@majapop.web.app`, password akun guru. Email ini tidak perlu ada sungguhan; username "Rediva Novalisty" otomatis dipetakan ke email ini (lihat `AKUN_GURU` di [`js/sesi.js`](js/sesi.js)). Password hanya tersimpan di Firebase, tidak di kode.
4. **Realtime Database → tab Rules**: hapus isinya, tempel seluruh isi file [`database.rules.json`](database.rules.json), lalu klik **Publish**. Atau dari terminal: `firebase deploy --only database`.
5. **Project settings (⚙️) → Your apps → ikon Web `</>`**, daftarkan app bernama `MajaPOP` (tanpa Hosting), lalu salin isi `firebaseConfig`.
6. Tempel ke [`js/firebase-config.js`](js/firebase-config.js) menjadi `const FIREBASE_CONFIG = { apiKey: "...", ... };`, lalu upload ulang.

> Setiap kali `database.rules.json` berubah (misalnya setelah fitur Kelompok/Individu atau ruang tunggu ditambahkan), ulangi langkah 4 agar aturan di Firebase ikut diperbarui.

Isi `firebaseConfig` memang aman untuk publik. Yang melindungi data adalah aturan di langkah 4: siswa hanya bisa mengubah data kelompoknya sendiri, dan hanya akun guru yang bisa membuat, memulai, dan mengakhiri sesi.

**Mengganti password guru:** Firebase Console → Authentication → Users → baris `rediva@majapop.web.app` → menu ⋮ → **Reset password** (atau hapus lalu Add user lagi dengan email yang sama). Untuk mengganti username atau email akun guru, ubah `AKUN_GURU` di `js/sesi.js` **dan** email di `database.rules.json`, lalu deploy keduanya.

## Menjalankan di komputer

Buka `index.html` langsung di browser, atau jalankan `python -m http.server 8000` lalu buka `http://localhost:8000`.
