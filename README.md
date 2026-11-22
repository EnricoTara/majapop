# MajaPOP!

**Ketika Lagu dan Puzzle Lebih dari Sekadar Hiburan**

MajaPOP! adalah media belajar majas dalam puisi lewat lagu pop dan puzzle interaktif yang dimainkan berkelompok.

🌐 **Buka web:** https://majapop.web.app/

## Alur permainan

Satu kode sesi berisi seluruh alur:

**Masukkan Kode → Putar Lagu → Identifikasi Majas → Susun Puzzle → Cipta Majas → Kirim Hasil**

Hasil setiap siswa/kelompok (tebakan majas, makna lirik, puzzle, dan kalimat majas buatan) terkirim otomatis ke Dashboard Guru lewat sesi kelas, dan tersimpan di riwayat nilai menu Kelas setelah sesi diakhiri.

## Mengubah isi

Semua konten ada di satu file: [`js/data.js`](js/data.js).

| Yang ingin diubah | Bagian di `js/data.js` |
|---|---|
| Lama waktu puzzle (detik); jumlah baris otomatis mengikuti jumlah jenis majas di `LAGU` | `PENGATURAN.waktuPuzzleDetik` |
| Materi 8 jenis majas | `MAJAS` |
| Daftar lagu dasar, kutipan lirik, makna, video YouTube | `LAGU` (isi `youtubeId` dengan teks setelah `v=` pada URL video). Lagu tambahan per guru cukup ditambahkan dari Portal Guru › 🎵 Lagu |
| Pertanyaan pemantik | `PEMANTIK` |
| Peta sastrawan | `SASTRAWAN` |
| Pertanyaan Roda Refleksi (menu Refleksi) | `REFLEKSI` |
| Musik pengiring beranda dan nada peringkat, serta volumenya | `PENGATURAN.musikBeranda`, `PENGATURAN.musikPeringkat`, `PENGATURAN.volumeMusik` (file MP3 di folder `music/`) |
| Video pengenalan MajaPOP di halaman Materi | `PENGATURAN.videoPengenalan` (ID YouTube, teks setelah `v=` atau `youtu.be/`) |
| Gambar infografis di bawah video (halaman Materi) | `PENGATURAN.infografis` (daftar file di folder `img/materi/`) |

**Video pengenalan:** unggah videonya ke YouTube dengan visibilitas **Tidak publik**, lalu isi ID-nya. Jangan menaruh file video di folder web: GitHub menolak file di atas 100 MB, dan kuota transfer gratis Firebase Hosting (sekitar 360 MB/hari) bisa habis hanya dalam beberapa kali tonton sehingga web ikut mati. Video dan infografis tampil di halaman Materi (di atas kartu materi), tidak di Beranda; halaman Masukkan Kode juga menautkannya untuk siswa yang masuk lewat QR guru.

**Musik:** lagu beranda berputar saat siswa membuka web (termasuk di ruang tunggu) dan berhenti perlahan saat guru menekan **🚀 Mulai Sesi**. Siswa bisa mematikannya lewat tombol 🔊 di pojok kiri bawah. Browser HP baru mengizinkan suara setelah layar disentuh pertama kali, jadi musik mulai pada sentuhan pertama. Nada peringkat diputar sekali saat papan peringkat akhir muncul di HP siswa. Gunakan musik yang boleh dipakai (bebas royalti atau milik sendiri) karena web ini publik.

Setelah mengubah file, simpan lalu upload ulang: `git add -A && git commit -m "Perbarui konten" && git push`, lalu `firebase deploy --only hosting` agar web di majapop.web.app ikut ter-update.

## Sesi Kelas: progress live per kelompok (seperti Quizizz)

Siswa dan guru masuk lewat pintu yang sama: tombol **Masuk** di pojok kanan atas (halaman `masuk.html`), lalu memilih **🎒 Saya Siswa** atau **👩‍🏫 Saya Guru**.

- **Siswa** memasukkan kode sesi dari guru, seperti biasa. Link/QR dari guru langsung membuka pilihan Siswa.
- **Guru** login dengan username akunnya (lihat tabel di bawah) dan password akun guru, lalu diarahkan ke **Dashboard** (`guru.html`). Dashboard tidak bisa dibuka tanpa login. Selama masih login, tombol pojok kanan atas berubah menjadi **📡 Dashboard**. Tombol **🚪 Keluar** ada di bawah judul Dashboard.

Akun guru yang tersedia (setiap guru punya sesi, kelas, nilai, profil, materi tambahan, dan lagu tambahan sendiri; 8 materi dasar dan 8 lagu dasar sama untuk semua guru):

| Username | Email internal (Firebase) |
|---|---|
| Rediva Novalisty | `rediva@majapop.web.app` |
| Endah Purnomosari | `endah@majapop.web.app` |
| User Guru A | `guru.a@majapop.web.app` |
| User Guru B | `guru.b@majapop.web.app` |
| User Guru C | `guru.c@majapop.web.app` |

Di Dashboard, guru memilih jenis sesi, lalu menekan **Buat Kode Sesi**:

- **👥 Kelompok**: siswa mengisi nama kelompok, anggota, dan pembagian peran.
- **👤 Individu**: setiap siswa mengisi nama, kelas, dan no. absen.

Kode 4 angka dan QR akan muncul. Siswa **wajib** memasukkan kode itu di halaman **Masukkan Kode**, lalu form otomatis menyesuaikan jenis sesinya. Setelah mengisi data, siswa masuk ke **ruang tunggu** dan nama mereka muncul di dashboard guru. Guru menekan **🚀 Mulai Sesi** ketika semua sudah bergabung, lalu permainan di semua HP siswa terbuka bersamaan. Siswa yang bergabung setelah sesi dimulai langsung bisa bermain. Peringkat dan langkah setiap kelompok/siswa lalu tampil langsung di dashboard, dan di HP siswa muncul badge "Peringkat X dari Y" dengan tombol **📋 Papan peringkat** untuk melihat seluruh peserta sesi (3 teratas disorot, baris sendiri ditandai "kamu"). Rekap bisa diunduh sebagai CSV (dibuka di Excel). Saat guru menekan **Akhiri sesi**, dashboard menampilkan **podium juara 1-2-3** beranimasi (cocok untuk proyektor), dan di HP siswa papan peringkat akhir terbuka otomatis.

Urutan peringkat: **jawaban benar terbanyak → jawaban salah paling sedikit → durasi mengerjakan tercepat**. Benar/salah dihitung dari tebakan majas (setiap tebakan yang keliru = 1 salah) dan kepingan puzzle. Durasi dihitung dari soal pertama dibuka sampai jawaban terakhir.

Poin (tetap ditampilkan dan ikut di rekap): 10 per majas benar, +5 jika tepat di tebakan pertama, ditambah skor puzzle, +20 per kalimat majas buatan (maks. 3 kalimat).

Setiap baris peserta di Dashboard juga punya tombol **✍️ Nilai kalimat** untuk menilai kalimat majas buatannya dengan rubrik (lihat di bawah).

## Portal Guru: Dashboard, Kelas, Materi, Lagu, Akun

Setelah login, halaman guru punya menu di samping (di HP: berjajar di atas):

- **📡 Dashboard**: ringkasan (jumlah kelas, siswa, materi) dan Sesi Kelas seperti di atas. Saat membuat sesi, guru bisa memilih **Kelas**; nama kelas dan jenis sesinya terisi otomatis.
- **🏫 Kelas**: tambah kelas (kelompok/individu), lalu lihat **Progres & Nilai Kelas**: rata-rata individu dan kelompok, grafik nilai per peserta, grafik perkembangan, rekap, dan riwayat. Guru bisa menambah siswa (satu nama per baris), kelompok, nilai manual (0–100), mengganti kelompok siswa, dan mengunduh CSV per kelas.
- **📘 Materi**: 8 materi dasar (dari `MAJAS` di `js/data.js`) dan materi tambahan buatan guru. Materi tambahan hanya milik akun guru pembuatnya (disimpan di `materi/<uid guru>` di Firebase), tidak muncul di akun guru lain, dan tampil di halaman Materi untuk siswa yang mengikuti sesi guru tersebut. Siswa yang belum pernah masuk sesi hanya melihat 8 materi dasar.
- **🎵 Lagu**: 8 lagu dasar (dari `LAGU` di `js/data.js`, hanya bisa dilihat) dan lagu tambahan buatan guru (maks. 20): judul, penyanyi, link YouTube (opsional), kutipan lirik, jenis majas, dan makna. Lagu tambahan disimpan di `lagu/<uid guru>`, tampil setelah lagu dasar di Daftar Lagu siswa yang mengikuti sesi guru tersebut, dan ikut dipakai untuk tebak majas, kepingan Papan Puzzle, serta nilai Lagu (jumlah lagu = lagu dasar + lagu tambahan). Lagu tanpa gambar sampul menampilkan judulnya di kartu. Perubahan langsung terlihat di HP siswa, termasuk saat sesi berjalan.
- **👤 Akun**: profil guru (nama tampilan, sekolah, mapel, bio), **ganti password**, dan tombol keluar. Username untuk masuk tidak berubah.

**Nilai otomatis dari sesi.** Jika sesi dibuat dari sebuah kelas, saat guru menekan **Akhiri sesi** nilai setiap siswa/kelompok langsung tersimpan ke kelas itu (aktivitas "Sesi 1234"). Peserta dicocokkan dengan daftar kelas lewat no. absen atau nama; yang belum ada otomatis ditambahkan, dan anggota kelompok ikut terdaftar sebagai siswa.

Nilai sesi dirinci per bagian, masing-masing 0–100, lalu dirata-rata menjadi **nilai pokok** (nilai yang tersimpan ke kelas dan dipakai untuk rata-rata kelas):

- 🎵 **Lagu** = lagu yang majasnya benar ÷ (jumlah lagu (8 + lagu tambahan guru) + tebakan salah) × 100
- 🧩 **Puzzle** = kepingan benar ÷ (total kepingan (8 baris × 4 = 32) + kepingan salah) × 100; belum dimainkan = 0
- ✍️ **Majas** = nilai rubrik guru untuk kalimat majas buatan (lihat di bawah)
- ⭐ **Nilai pokok** = (Lagu + Puzzle + Majas) ÷ 3. Selama guru belum menilai kalimat majas, nilai pokok sementara = (Lagu + Puzzle) ÷ 2, lalu otomatis diperbarui setelah dinilai.

Setiap kesalahan (tebakan majas yang salah, kepingan yang kembali ke baki saat Periksa) menambah pembagi, sehingga nilai turun tetapi tidak pernah minus.

Contoh: 8 lagu benar dengan 2 tebakan salah (8/10), 32 kepingan benar dengan 10 kepingan salah (32/42) → 80 dan 76 → nilai pokok sementara 78; setelah kalimat majas dinilai 75 → nilai pokok (80 + 76 + 75) ÷ 3 = 77.

**Kalimat majas buatan** dinilai guru per kalimat dengan rubrik berikut (`RUBRIK_MAJAS` di [`js/app.js`](js/app.js)). Setiap indikator diberi skor 1–4 (1 kurang, 2 cukup, 3 baik, 4 sangat baik):

| No. | Indikator | Fokus penilaian | Bobot |
|---|---|---|---|
| 1 | Ketepatan jenis majas | Kesesuaian kalimat dengan ciri jenis majas yang ditugaskan atau dinyatakan siswa. | 30% |
| 2 | Kejelasan makna | Kejelasan hubungan makna figuratif dan pesan yang ingin disampaikan. | 25% |
| 3 | Ketepatan diksi | Ketepatan dan kecermatan pilihan kata dalam membentuk ungkapan. | 20% |
| 4 | Kreativitas ungkapan | Kemampuan mengembangkan ungkapan sendiri melalui perbandingan, penggambaran, atau permainan bahasa. | 15% |
| 5 | Kesesuaian dengan pengalaman atau tema | Keterhubungan kalimat majas dengan pengalaman, situasi, atau tema yang dipilih. | 10% |

- **Nilai kalimat** = Σ (skor ÷ 4 × bobot), 0–100. Contoh: skor 4, 3, 3, 2, 4 → 30 + 18,75 + 15 + 7,5 + 10 = 81.
- **Nilai majas** peserta = rata-rata kalimat yang sudah lengkap dinilai, lalu ikut dirata-rata ke nilai pokok sesi.

Guru bisa menilai dari Dashboard (selama sesinya masih terbuka) atau kapan saja dari **Riwayat** di menu Kelas (tombol **✍️ Nilai kalimat**); nilai di kelas ikut diperbarui. Skor rubrik tersimpan di `guru/<uid>/rubrik/<kode sesi>`. Sesi tanpa kelas hanya bisa dinilai dari Dashboard. Rinciannya tampil di halaman Kirim Hasil siswa, di kartu peserta pada Dashboard, dan di Riwayat nilai pada menu Kelas. Rumusnya ada di `nilaiRinci` ([`js/app.js`](js/app.js)). Nilai sesi yang tersimpan sebelum rumus ini dipakai tidak dihitung ulang (termasuk nilai lama yang merata-rata Lagu, Puzzle, dan jumlah kalimat majas). Entri lama "Cipta Majas · Sesi 1234" dari masa Cipta Majas masih menjadi sesi terpisah tetap tampil dan masih bisa dinilai dari Riwayat. Nilai kelompok tidak otomatis menjadi nilai anggotanya.

Data portal tersimpan di Firebase (`guru/<uid>`) dan hanya bisa dibaca/diubah akun guru (lihat `database.rules.json`). Jaga kerahasiaan nama dan nilai siswa saat membagikan file CSV.

### Mengaktifkan (sekali saja, gratis)

Fitur ini memakai Firebase paket **Spark** (gratis, tanpa kartu kredit). Kalau belum diaktifkan, MajaPOP tetap bisa dimainkan seperti biasa.

1. Buka [console.firebase.google.com](https://console.firebase.google.com), lalu klik **Create a project** dan beri nama `majapop`. Google Analytics boleh dimatikan.
2. **Build → Realtime Database → Create Database**, pilih lokasi **Singapore (asia-southeast1)** dan mode **locked**.
3. **Build → Authentication → Get started → Sign-in method**: aktifkan **Anonymous** (untuk siswa) dan **Email/Password** (untuk guru), lalu **Save**.
   Setelah itu buka tab **Users → Add user**: email `rediva@majapop.web.app`, password akun guru. Email ini tidak perlu ada sungguhan; username "Rediva Novalisty" otomatis dipetakan ke email ini (lihat `DAFTAR_GURU` di [`js/sesi.js`](js/sesi.js)). Ulangi untuk setiap akun guru di tabel di atas. Password hanya tersimpan di Firebase, tidak di kode.
4. **Realtime Database → tab Rules**: hapus isinya, tempel seluruh isi file [`database.rules.json`](database.rules.json), lalu klik **Publish**. Atau dari terminal: `firebase deploy --only database`.
5. **Project settings (⚙️) → Your apps → ikon Web `</>`**, daftarkan app bernama `MajaPOP` (tanpa Hosting), lalu salin isi `firebaseConfig`.
6. Tempel ke [`js/firebase-config.js`](js/firebase-config.js) menjadi `const FIREBASE_CONFIG = { apiKey: "...", ... };`, lalu upload ulang.

> Setiap kali `database.rules.json` berubah (misalnya setelah fitur Kelompok/Individu atau ruang tunggu ditambahkan), ulangi langkah 4 agar aturan di Firebase ikut diperbarui.

Isi `firebaseConfig` memang aman untuk publik. Yang melindungi data adalah aturan di langkah 4: siswa hanya bisa mengubah data kelompoknya sendiri, dan hanya akun guru yang bisa membuat, memulai, dan mengakhiri sesi.

**Mengganti password guru:** Firebase Console → Authentication → Users → baris email guru (mis. `rediva@majapop.web.app`) → menu ⋮ → **Reset password** (atau hapus lalu Add user lagi dengan email yang sama). Guru juga bisa menggantinya sendiri lewat menu **👤 Akun**.

**Menambah atau mengganti akun guru:** tambahkan `{ nama, email }` di `DAFTAR_GURU` (`js/sesi.js`) **dan** bagian depan email di pola `matches(/^(rediva|endah|...)@majapop\\.web\\.app$/)` pada `database.rules.json` (ada di beberapa tempat, ganti semuanya), buat user-nya di Authentication → Users → Add user, lalu deploy keduanya (`firebase deploy --only database,hosting`). Jangan izinkan seluruh domain `@majapop.web.app`: siapa pun bisa mendaftarkan email apa saja lewat API key publik.

## Menjalankan di komputer

Buka `index.html` langsung di browser, atau jalankan `python -m http.server 8000` lalu buka `http://localhost:8000`.
