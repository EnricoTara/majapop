// ============================================================
// KONTEN MajaPOP!
// Ubah isi file ini untuk mengganti materi, lagu, data sastrawan,
// pertanyaan pemantik, waktu puzzle, dan tautan Google Form.
// ============================================================

const PENGATURAN = {
  // Lama waktu Papan Puzzle (detik). 300 = 5 menit.
  waktuPuzzleDetik: 300,
  // Banyak baris puzzle per permainan (tiap baris = 1 majas = 4 kepingan).
  jumlahBarisPuzzle: 4,
  // Ganti dengan tautan Google Form milik guru.
  googleFormUrl: 'https://forms.gle/GANTI_DENGAN_LINK_GOOGLE_FORM',
};

// Delapan jenis majas yang dipelajari (sesuai Petunjuk Permainan).
const MAJAS = [
  {
    id: 'personifikasi',
    jenis: 'Personifikasi',
    penjelasan: 'Memberikan sifat atau perilaku manusia kepada benda mati, tumbuhan, atau hewan.',
    ciri: 'Benda bukan manusia seolah bisa berbicara, menangis, menari, berbisik, atau berpikir.',
    contoh: 'Angin malam berbisik lembut di telingaku.',
  },
  {
    id: 'metafora',
    jenis: 'Metafora',
    penjelasan: 'Membandingkan dua hal secara langsung tanpa memakai kata pembanding.',
    ciri: 'Tidak ada kata seperti/bagai; sering memakai kata "adalah" atau langsung menyebut bandingannya.',
    contoh: 'Ibu adalah matahari dalam keluarga kami.',
  },
  {
    id: 'simile',
    jenis: 'Simile',
    penjelasan: 'Membandingkan dua hal secara tersurat dengan kata pembanding.',
    ciri: 'Memakai kata seperti, bagai, bagaikan, laksana, bak, atau umpama.',
    contoh: 'Wajahnya pucat seperti kapas.',
  },
  {
    id: 'hiperbola',
    jenis: 'Hiperbola',
    penjelasan: 'Melebih-lebihkan suatu keadaan dari kenyataannya untuk memberi kesan kuat.',
    ciri: 'Ungkapannya berlebihan dan tidak mungkin terjadi jika diartikan secara harfiah.',
    contoh: 'Tangisnya membanjiri seluruh kota.',
  },
  {
    id: 'repetisi',
    jenis: 'Repetisi',
    penjelasan: 'Mengulang kata, frasa, atau kalimat untuk menegaskan maksud.',
    ciri: 'Ada bagian yang diulang beberapa kali dalam satu bait atau kalimat.',
    contoh: 'Aku rindu, aku rindu, aku rindu kampung halaman.',
  },
  {
    id: 'ironi',
    jenis: 'Ironi',
    penjelasan: 'Sindiran halus dengan menyatakan sesuatu yang berlawanan dengan maksud sebenarnya.',
    ciri: 'Terdengar memuji atau membanggakan, padahal sebenarnya menyindir atau mengkritik.',
    contoh: 'Rapi sekali kamarmu, sampai lantainya tidak kelihatan.',
  },
  {
    id: 'antitesis',
    jenis: 'Antitesis',
    penjelasan: 'Memadukan dua kata atau hal yang maknanya berlawanan dalam satu ungkapan.',
    ciri: 'Ada pasangan kata berlawanan, misalnya tua–muda, kaya–miskin, kanan–kiri.',
    contoh: 'Tua muda, kaya miskin, semua datang ke pesta rakyat.',
  },
  {
    id: 'sinekdoke',
    jenis: 'Sinekdoke',
    penjelasan: 'Menyebut sebagian untuk keseluruhan (pars pro toto) atau keseluruhan untuk sebagian (totum pro parte).',
    ciri: 'Satu bagian mewakili keseluruhan, atau nama yang luas dipakai untuk bagian kecilnya.',
    contoh: 'Sudah seminggu dia tidak menampakkan batang hidungnya.',
  },
];

// Daftar lagu (urutan = urutan kartu "Lagu 1, Lagu 2, …" di halaman Daftar Lagu).
// CATATAN UNTUK GURU:
// - kutipan : potongan lirik pendek (1–2 baris) yang mengandung majas.
// - majasId : jenis majasnya, harus salah satu id di MAJAS di atas
//             (personifikasi, metafora, simile, hiperbola, repetisi, ironi, antitesis, sinekdoke).
// - makna   : makna lirik untuk kunci jawaban diskusi & kepingan puzzle.
// Lagu yang kutipan/majasId-nya masih kosong tetap tampil, tetapi belum bisa
// dipakai untuk tebak majas dan puzzle (ditandai "Lirik belum diisi").
// Mohon cocokkan kutipan dengan lirik resmi sebelum dipakai di kelas.
// - youtubeId : ID video YouTube (teks setelah "v=" pada URL video). Kosong = tombol "Cari di YouTube".
// - cover     : gambar sampul (opsional), misalnya 'img/teh-hijau.jpg'. Kosong = warna + ikon.
// - ikon      : emoji pada lingkaran kecil di kartu.
const LAGU = [
  {
    id: 'teh-hijau',
    judul: 'Teh Hijau',
    penyanyi: 'Tulus',
    ikon: '🍵',
    cover: '',
    youtubeId: '',
    kutipan: 'Di tengah seram sedih yang menghantamku',
    majasId: 'personifikasi',
    makna: 'Rasa sedih digambarkan seperti sosok yang bisa "menghantam" layaknya manusia. Kesedihan datang tiba-tiba dan terasa berat, lalu secangkir teh hijau di tangan menjadi penenang di masa sulit.',
  },
  {
    id: 'ada-titik-titik-di-ujung-doa',
    judul: 'Ada Titik Titik di Ujung Doa',
    penyanyi: 'Sal Priadi',
    ikon: '📝',
    cover: '',
    youtubeId: '',
    kutipan: 'Ingat hatiku dihancurkan jadi berkeping-keping',
    majasId: 'hiperbola',
    makna: 'Rasa sakit hati dilebih-lebihkan seolah hati benar-benar pecah berkeping-keping. Kini ia belajar memaafkan dan perlahan memulihkan dirinya.',
  },
  {
    id: 'laskar-pelangi',
    judul: 'Laskar Pelangi',
    penyanyi: 'Nidji',
    ikon: '🌈',
    cover: '',
    youtubeId: '',
    kutipan: 'Mimpi adalah kunci untuk kita menaklukkan dunia',
    majasId: 'metafora',
    makna: 'Mimpi diibaratkan kunci yang membuka jalan menuju keberhasilan. Kita diajak berani bermimpi dan berusaha meraihnya.',
  },
  {
    id: 'bertaut',
    judul: 'Bertaut',
    penyanyi: 'Nadin Amizah',
    ikon: '🌸',
    cover: '',
    youtubeId: '',
    kutipan: 'Bun, hidup berjalan seperti bajingan / Seperti landak yang tak punya teman',
    majasId: 'simile',
    makna: 'Hidup disamakan dengan "bajingan" dan "landak yang tak punya teman" memakai kata pembanding "seperti": terasa kejam dan sepi. Sang anak mengadu kepada ibunya tentang beratnya hidup.',
  },
  {
    id: 'mbg',
    judul: 'MBG',
    penyanyi: 'Maman Fvndy Remix',
    ikon: '😄',
    cover: '',
    youtubeId: '',
    kutipan: 'My little bolu ketan',
    majasId: 'metafora',
    makna: 'Seseorang langsung disebut "bolu ketan" sebagai panggilan gemas: manis dan lembut seperti kue. Majas ternyata juga muncul di lagu jenaka yang viral di media sosial.',
  },
  {
    id: 'arungi',
    judul: 'Arungi',
    penyanyi: 'Romantic Echoes',
    ikon: '🎺',
    cover: '',
    youtubeId: '',
    kutipan: 'Rasa sedih bahagia',
    majasId: 'antitesis',
    makna: 'Dua perasaan yang berlawanan, sedih dan bahagia, hadir bersamaan dalam perjalanan hidup bersama ibu yang berjuang membesarkan anaknya.',
  },
  {
    id: 'hati-hati-di-jalan',
    judul: 'Hati-Hati di Jalan',
    penyanyi: 'Tulus',
    ikon: '💙',
    cover: '',
    youtubeId: '',
    kutipan: 'Kukira kita asam dan garam, dan kita bertemu di belanga',
    majasId: 'metafora',
    makna: 'Dua orang diibaratkan asam dan garam yang ditakdirkan bertemu di belanga (dari peribahasa). Ternyata harapan itu keliru: mereka tidak berjodoh dan harus berpisah.',
  },
  {
    id: 'everything-u-are',
    judul: 'Everything u are',
    penyanyi: 'Hindia',
    ikon: '🕊️',
    cover: '',
    youtubeId: '',
    kutipan: 'Kita hampir mati dan kau selamatkan aku',
    majasId: 'hiperbola',
    makna: 'Beratnya cobaan hidup dilebih-lebihkan seakan hampir mati. Kehadiran orang tersayang menjadi penyelamat yang menerima kita apa adanya.',
  },
];

// Pertanyaan pemantik sebelum bermain.
const PEMANTIK = [
  'Lagu apa yang paling sering kalian dengarkan minggu ini? Kalimat mana dari liriknya yang paling kalian ingat?',
  'Pernahkah sebuah lirik lagu terasa "menggambarkan" perasaan kalian? Mengapa bisa begitu?',
  'Apa persamaan dan perbedaan lirik lagu dengan puisi? Bisakah lirik lagu disebut puisi?',
  'Siapa sastrawan yang berasal dari daerah kalian atau dekat dengan daerah kalian? Temukan di peta!',
];

// Peta Sastrawan Indonesia (titik = daerah kelahiran).
const SASTRAWAN = [
  { nama: 'Chairil Anwar', asal: 'Medan, Sumatera Utara', lat: 3.5952, lng: 98.6722, karya: 'Aku; Krawang-Bekasi; Derai-Derai Cemara' },
  { nama: 'Amir Hamzah', asal: 'Tanjung Pura, Langkat, Sumatera Utara', lat: 3.9136, lng: 98.4222, karya: 'Nyanyi Sunyi; Buah Rindu' },
  { nama: 'Sitor Situmorang', asal: 'Harianboho, Samosir, Sumatera Utara', lat: 2.6136, lng: 98.6333, karya: 'Surat Kertas Hijau; Dalam Sajak' },
  { nama: 'Taufiq Ismail', asal: 'Bukittinggi, Sumatera Barat', lat: -0.3055, lng: 100.3692, karya: 'Tirani dan Benteng; Malu (Aku) Jadi Orang Indonesia' },
  { nama: 'Sutardji Calzoum Bachri', asal: 'Rengat, Riau', lat: -0.4083, lng: 102.5494, karya: 'O Amuk Kapak' },
  { nama: 'Joko Pinurbo', asal: 'Pelabuhan Ratu, Jawa Barat', lat: -6.9876, lng: 106.5508, karya: 'Celana; Di Bawah Kibaran Sarung' },
  { nama: 'Toeti Heraty', asal: 'Bandung, Jawa Barat', lat: -6.9175, lng: 107.6191, karya: 'Sajak-Sajak 33; Mimpi dan Pretensi' },
  { nama: 'Sapardi Djoko Damono', asal: 'Surakarta, Jawa Tengah', lat: -7.5755, lng: 110.8243, karya: 'Hujan Bulan Juni; Aku Ingin' },
  { nama: 'W.S. Rendra', asal: 'Surakarta, Jawa Tengah', lat: -7.5600, lng: 110.8000, karya: 'Balada Orang-Orang Tercinta; Sajak Sebatang Lisong' },
  { nama: 'Wiji Thukul', asal: 'Surakarta, Jawa Tengah', lat: -7.5900, lng: 110.8450, karya: 'Peringatan; Aku Ingin Jadi Peluru' },
  { nama: 'Pramoedya Ananta Toer', asal: 'Blora, Jawa Tengah', lat: -6.9698, lng: 111.4183, karya: 'Bumi Manusia; Anak Semua Bangsa' },
  { nama: 'D. Zawawi Imron', asal: 'Sumenep, Madura, Jawa Timur', lat: -7.0050, lng: 113.8600, karya: 'Celurit Emas; Ibu' },
  { nama: 'Putu Wijaya', asal: 'Tabanan, Bali', lat: -8.5410, lng: 115.1250, karya: 'Telegram; Bila Malam Bertambah Malam' },
  { nama: 'Umbu Landu Paranggi', asal: 'Sumba, Nusa Tenggara Timur', lat: -9.6500, lng: 120.2600, karya: 'Melodia; Apa Ada Angin di Jakarta' },
  { nama: 'Korrie Layun Rampan', asal: 'Samarinda, Kalimantan Timur', lat: -0.5022, lng: 117.1536, karya: 'Upacara; Api Awan Asap' },
  { nama: 'Remy Sylado', asal: 'Makassar, Sulawesi Selatan', lat: -5.1477, lng: 119.4327, karya: 'Ca Bau Kan; Kerudung Merah' },
  { nama: 'M. Aan Mansyur', asal: 'Bone, Sulawesi Selatan', lat: -4.5386, lng: 120.3279, karya: 'Tidak Ada New York Hari Ini; Melihat Api Bekerja' },
];
