// ============================================================
// Kode bersama semua halaman: header, footer, stepper alur,
// dan penyimpanan progres tim di localStorage.
// ============================================================

const STORE_KEY = 'majapop';
// Penanda perangkat yang sedang login sebagai guru (diisi js/sesi.js), hanya untuk tampilan header.
const TANDA_GURU = 'majapop-guru-masuk';

// Alur petualangan (urutan permainan): satu sesi berisi lagu, puzzle, dan Cipta Majas.
const LANGKAH = [
  { id: 'tim', label: 'Masukkan Kode', ikon: '🔑', href: 'masuk.html' },
  { id: 'putar', label: 'Putar Lagu', ikon: '🎵', href: 'lagu.html' },
  { id: 'identifikasi', label: 'Identifikasi Majas', ikon: '🔍', href: 'lagu.html#identifikasi' },
  { id: 'puzzle', label: 'Susun Puzzle', ikon: '🧩', href: 'puzzle.html' },
  { id: 'cipta', label: 'Cipta Majas', ikon: '✍️', href: 'cipta.html' },
  { id: 'unggah', label: 'Kirim Hasil', ikon: '📤', href: 'unggah.html' },
];

function daftarLangkah() {
  return LANGKAH;
}

// Data lama dari masa Cipta Majas masih menjadi sesi terpisah (jawaban/entri nilai ber-aktivitas 'majas').
function sesiMajas(x) {
  return Boolean(x && x.aktivitas === 'majas');
}

// Menu fitur (sesuai kartu "Jangan lupa jelajahi fitur menunya!").
const FITUR = [
  { label: 'Materi', judul: 'Jelajahi dan Pahami Materi Majas', ikon: '📘', href: 'emodul.html' },
  { label: 'Pemantik', judul: 'Jelajahi Peta Sastrawan Indonesia', ikon: '🗺️', href: 'pemantik.html' },
  { label: 'Daftar Lagu', judul: 'Dengarkan dan Identifikasi Majas dalam Lagu', ikon: '🎧', href: 'lagu.html' },
  { label: 'Papan Puzzle', judul: 'Susun Rangkaian Potongan Puzzle secara Tepat', ikon: '🧩', href: 'puzzle.html' },
  { label: 'Cipta Majas', judul: 'Pilih Kepingan Puzzle dan Isi dengan Kalimat Majas Buatanmu', ikon: '✍️', href: 'cipta.html' },
  { label: 'Kirim Hasil', judul: 'Kirim Hasil Belajar ke Guru', ikon: '📤', href: 'unggah.html' },
  { label: 'Refleksi', judul: 'Putar Roda dan Renungkan Perjalanan Belajarmu', ikon: '🎡', href: 'refleksi.html' },
];

const PERAN = [
  { id: 'dengar', label: 'Pendengar Lagu', ikon: '🎧' },
  { id: 'tebak', label: 'Penebak Majas', ikon: '🔍' },
  { id: 'makna', label: 'Penemu Makna', ikon: '💡' },
  { id: 'puzzle', label: 'Penyusun Puzzle', ikon: '🧩' },
];

// ---------- State ----------
function stateAwal() {
  // sesi: { kode, kelompokId, mode } jika bergabung ke Sesi Kelas (lihat js/sesi.js).
  // Pada sesi individu, tim = nama siswa dan absen = nomor absen.
  // waktuSoal: { awal, akhir } untuk durasi mengerjakan soal (lihat mulaiSoal / catatJawaban).
  // dikirim: waktu siswa menekan "Kirim ke Guru" di halaman Kirim Hasil (0 = belum).
  return { tim: '', kelas: '', absen: '', anggota: [], peran: {}, selesai: [], lagu: {}, puzzle: null, ciptaan: [], sesi: null, waktuSoal: null, dikirim: 0 };
}

// Durasi mengerjakan soal: dari soal pertama dibuka sampai jawaban terakhir.
// Memakai jam perangkat sendiri, jadi selisihnya tetap tepat walau jam HP tidak pas.
function mulaiSoal(s) {
  if (!s.waktuSoal) s.waktuSoal = { awal: Date.now(), akhir: 0 };
}

function catatJawaban(s) {
  mulaiSoal(s);
  s.waktuSoal.akhir = Date.now();
}

function sesiIndividu(state) {
  return Boolean(state.sesi && state.sesi.mode === 'individu');
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return Object.assign(stateAwal(), JSON.parse(raw));
  } catch (e) { /* localStorage tidak tersedia */ }
  return stateAwal();
}

function saveState(state) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* abaikan */ }
  // Kirim progress ke dashboard guru jika kelompok tergabung dalam Sesi Kelas.
  if (state.sesi && typeof SESI !== 'undefined') SESI.kirimProgress(state);
}

function updateState(fn) {
  const state = loadState();
  fn(state);
  saveState(state);
  return state;
}

function tandaiSelesai(id) {
  const state = updateState((s) => { if (!s.selesai.includes(id)) s.selesai.push(id); });
  refreshStepper();
  return state;
}

function resetState() {
  try { localStorage.removeItem(STORE_KEY); } catch (e) { /* abaikan */ }
}

// Hapus progres permainan, identitas dan sesi tetap (dipakai saat pindah ke kode sesi lain).
function resetProgres(s) {
  const awal = stateAwal();
  ['selesai', 'lagu', 'puzzle', 'ciptaan', 'waktuSoal', 'dikirim'].forEach((k) => { s[k] = awal[k]; });
}

// ---------- Utilitas ----------
function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function acak(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function majasById(id) {
  return MAJAS.find((m) => m.id === id);
}

// Lagu siap dimainkan jika kutipan lirik dan jenis majasnya sudah diisi guru.
function laguSiap(l) {
  return Boolean(l.kutipan && l.kutipan.trim() && majasById(l.majasId));
}

function daftarLaguSiap() {
  return LAGU.filter(laguSiap);
}

// ---------- Lagu tambahan guru ----------
// Guru bisa menambah lagu di Portal Guru › Lagu (lagu/<uid guru> di Firebase). Lagu itu
// dimasukkan ke akhir LAGU (setelah lagu dasar), jadi semua kode yang membaca LAGU ikut memakainya.
// Cache di localStorage membuat halaman langsung lengkap saat dibuka (dan tetap jalan offline);
// SESI.pantauLaguGuru memperbaruinya dari Firebase.
const JUMLAH_LAGU_DASAR = LAGU.length;
const CACHE_LAGU_GURU = 'majapop-lagu-guru';
const MAKS_LAGU_GURU = 20;

// obj: { <id>: { judul, penyanyi, kutipan, majasId, makna, youtubeId?, dibuat } } dari Firebase.
function pasangLaguGuru(obj) {
  LAGU.length = JUMLAH_LAGU_DASAR;
  Object.entries(obj || {})
    .map(([id, l]) => ({ ...l, id }))
    .sort((a, b) => (a.dibuat || 0) - (b.dibuat || 0))
    .forEach((l) => LAGU.push({
      id: l.id, judul: l.judul || '', penyanyi: l.penyanyi || '', ikon: '🎵', cover: '',
      youtubeId: l.youtubeId || '', kutipan: l.kutipan || '', majasId: l.majasId || '', makna: l.makna || '',
      dibuat: l.dibuat || 0, tambahan: true,
    }));
}

// Kunci cache: 'guru' di perangkat guru, atau kode sesi yang diikuti siswa.
function kunciLaguGuru() {
  if (guruTercatat()) return 'guru';
  const s = loadState().sesi;
  return s && s.kode ? String(s.kode) : '';
}

function simpanCacheLaguGuru(kunci, obj) {
  try {
    if (kunci) localStorage.setItem(CACHE_LAGU_GURU, JSON.stringify({ kunci, lagu: obj || {} }));
    else localStorage.removeItem(CACHE_LAGU_GURU);
  } catch (e) { /* abaikan */ }
}

(function pakaiCacheLaguGuru() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_LAGU_GURU) || 'null');
    if (c && c.kunci && c.kunci === kunciLaguGuru()) pasangLaguGuru(c.lagu);
  } catch (e) { /* abaikan */ }
})();

// Satu baris puzzle = satu jenis majas dari lagu yang siap (dipakai Papan Puzzle & nilai sesi guru).
function jumlahBarisTersedia() {
  return new Set(daftarLaguSiap().map((l) => l.majasId)).size;
}

// Rincian nilai sesi, masing-masing 0–100, lalu nilai pokok = rata-rata Lagu, Puzzle, dan Majas:
// Lagu = lagu benar ÷ (jumlah lagu + tebakan salah),
// Puzzle = kepingan benar ÷ (total kepingan + kepingan salah) (belum main = 0),
// Majas = nilai rubrik guru untuk kalimat majas buatan (lihat nilaiMajas).
// Setiap kesalahan menambah pembagi, jadi nilai turun tetapi tidak pernah minus.
// Selama guru belum menilai kalimat majas (majas null), nilai pokok sementara = rata-rata Lagu & Puzzle.
// Dipakai halaman Kirim Hasil siswa, kartu peserta di Dashboard, dan nilai yang tersimpan ke Kelas.
function nilaiRinci({ benar = 0, totalLagu = 0, salahLagu = 0, puzzleBenar = -1, puzzleTotal = -1, puzzleSalah = 0, majas = null } = {}) {
  const persen = (a, b) => (b > 0 ? Math.min(100, Math.round((Math.max(0, a) / b) * 100)) : 0);
  const salah = (n) => Math.max(0, Number(n) || 0);
  const lagu = persen(benar, (totalLagu > 0 ? totalLagu : daftarLaguSiap().length) + salah(salahLagu));
  const puzzle = persen(puzzleBenar, (puzzleTotal > 0 ? puzzleTotal : jumlahBarisTersedia() * 4) + salah(puzzleSalah));
  const m = majas === null || majas === undefined ? null : majas;
  return { lagu, puzzle, majas: m, pokok: pokokDari(lagu, puzzle, m) };
}

// Nilai pokok dari nilai bagian (majas null = belum dinilai guru).
function pokokDari(lagu, puzzle, majas) {
  return majas === null || majas === undefined
    ? Math.round((lagu + puzzle) / 2)
    : Math.round((lagu + puzzle + majas) / 3);
}

// Rubrik penilaian kalimat majas buatan siswa (dinilai guru). Setiap indikator diberi skor 1–4:
// 1 kurang, 2 cukup, 3 baik, 4 sangat baik. Nilai kalimat = Σ (skor ÷ 4 × bobot), 0–100.
const SKOR_RUBRIK = [
  { skor: 1, label: 'Kurang' },
  { skor: 2, label: 'Cukup' },
  { skor: 3, label: 'Baik' },
  { skor: 4, label: 'Sangat baik' },
];
const RUBRIK_MAJAS = [
  { id: 'jenis', label: 'Ketepatan jenis majas', fokus: 'Kesesuaian kalimat dengan ciri jenis majas yang ditugaskan atau dinyatakan siswa.', bobot: 30 },
  { id: 'makna', label: 'Kejelasan makna', fokus: 'Kejelasan hubungan makna figuratif dan pesan yang ingin disampaikan.', bobot: 25 },
  { id: 'diksi', label: 'Ketepatan diksi', fokus: 'Ketepatan dan kecermatan pilihan kata dalam membentuk ungkapan.', bobot: 20 },
  { id: 'kreatif', label: 'Kreativitas ungkapan', fokus: 'Kemampuan mengembangkan ungkapan sendiri melalui perbandingan, penggambaran, atau permainan bahasa.', bobot: 15 },
  { id: 'tema', label: 'Kesesuaian dengan pengalaman atau tema', fokus: 'Keterhubungan kalimat majas dengan pengalaman, situasi, atau tema yang dipilih.', bobot: 10 },
];

// Nilai satu kalimat (0–100, belum dibulatkan), atau null jika ada indikator yang belum diberi skor.
function nilaiKalimat(skor) {
  if (!skor) return null;
  let total = 0;
  for (const r of RUBRIK_MAJAS) {
    const n = Number(skor[r.id]);
    if (!(n >= 1 && n <= 4)) return null;
    total += (n / 4) * r.bobot;
  }
  return total;
}

// Kunci skor rubrik satu kalimat: id kalimat (tetap walau kalimat lain dihapus siswa),
// atau urutannya untuk jawaban lama yang belum menyimpan id.
function kunciKalimat(c, i) {
  return c && c.id ? `k${c.id}` : `i${i}`;
}

// Nilai majas peserta (0–100, dibulatkan) = rata-rata kalimat yang sudah lengkap dinilai.
// rubrik: { <kunciKalimat>: skor }. Jika ciptaan diberikan, hanya kalimat yang masih ada yang dihitung.
// null jika belum ada kalimat yang dinilai.
function nilaiMajas(rubrik, ciptaan) {
  const r = rubrik || {};
  const daftar = ciptaan ? ciptaan.map((c, i) => r[kunciKalimat(c, i)]) : Object.values(r);
  const nilai = daftar.map(nilaiKalimat).filter((n) => n !== null);
  return nilai.length ? Math.round(nilai.reduce((a, b) => a + b, 0) / nilai.length) : null;
}

// Unduh tabel sebagai CSV yang langsung rapi di Excel berbahasa Indonesia (BOM + titik koma).
// Sel yang diawali = + - @ diberi tanda kutip agar tidak dijalankan sebagai rumus Excel.
function unduhCsv(namaFile, baris) {
  const sel = (v) => {
    let t = String(v ?? '');
    if (/^[=+\-@]/.test(t)) t = `'${t}`;
    return `"${t.replace(/"/g, '""')}"`;
  };
  const csv = '\ufeff' + baris.map((r) => r.map(sel).join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = namaFile;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

function toast(pesan) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = pesan;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2400);
}

// ---------- Header & footer ----------
function guruTercatat() {
  try { return localStorage.getItem(TANDA_GURU) === '1'; } catch (e) { return false; }
}

function renderHeader() {
  const el = document.getElementById('site-header');
  if (!el) return;
  const state = loadState();
  const halaman = location.pathname.split('/').pop() || 'index.html';
  const menu = FITUR.map((f) => `<a href="${f.href}" class="${f.href === halaman ? 'aktif' : ''}">${f.ikon} ${esc(f.label)}</a>`).join('');
  el.className = 'site-header';
  el.innerHTML = `
    <div class="container nav">
      <a class="brand" href="index.html">Maja<span>POP!</span></a>
      <button class="nav-toggle" aria-expanded="false" aria-label="Buka menu">☰</button>
      <nav class="nav-links">
        <a href="index.html" class="${halaman === 'index.html' ? 'aktif' : ''}">Beranda</a>
        <a href="index.html#kenalan">Kenalan Yuk!</a>
        <div class="dropdown">
          <button class="dropdown-btn" aria-expanded="false">Menu ▾</button>
          <div class="dropdown-menu">${menu}</div>
        </div>
        ${guruTercatat()
    ? `<a class="btn btn-kecil btn-kuning" href="guru.html">📡 Dashboard</a>`
    : `<a class="btn btn-kecil btn-kuning" href="masuk.html"${state.tim ? ` title="${esc(state.tim)}"` : ''}>${state.tim ? (sesiIndividu(state) ? '👤 ' : '👥 ') : ''}Masuk</a>`}
      </nav>
    </div>`;

  const toggle = el.querySelector('.nav-toggle');
  const links = el.querySelector('.nav-links');
  toggle.addEventListener('click', () => {
    const buka = links.classList.toggle('buka');
    toggle.setAttribute('aria-expanded', buka);
    toggle.textContent = buka ? '✕' : '☰';
  });
  // Tutup menu HP setelah link diketuk (termasuk link ke bagian di halaman yang sama).
  links.addEventListener('click', (e) => {
    if (!e.target.closest('a')) return;
    links.classList.remove('buka');
    toggle.setAttribute('aria-expanded', false);
    toggle.textContent = '☰';
  });
  const ddBtn = el.querySelector('.dropdown-btn');
  const dd = el.querySelector('.dropdown');
  ddBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const buka = dd.classList.toggle('buka');
    ddBtn.setAttribute('aria-expanded', buka);
  });
  document.addEventListener('click', () => { dd.classList.remove('buka'); ddBtn.setAttribute('aria-expanded', false); });
}

function renderFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;
  el.className = 'site-footer';
  el.innerHTML = `
    <div class="container">
      <p><strong>MajaPOP!</strong> Ketika Lagu dan Puzzle Lebih dari Sekadar Hiburan</p>
      <p class="kecil">Media belajar majas dalam puisi melalui lagu pop dan puzzle interaktif.</p>
    </div>`;
}

// ---------- Musik ----------
// Lagu pengiring beranda (berhenti saat guru memulai sesi) dan nada saat peringkat akhir muncul.
// Browser baru mengizinkan suara setelah pengunjung menyentuh layar, jadi play() dicoba ulang
// pada sentuhan/tombol pertama. File diunduh hanya saat dibutuhkan.
const HALAMAN_SOAL = ['lagu.html', 'puzzle.html', 'cipta.html', 'unggah.html'];

const MUSIK = (() => {
  const KUNCI_MUTE = 'majapop-musik';
  const KUNCI_POSISI = 'majapop-musik-posisi';
  const SENTUHAN = ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click'];
  const volume = () => Math.min(1, Math.max(0, PENGATURAN.volumeMusik ?? 0.4));
  let latarEl = null;
  let tombol = null;
  let boleh = false;
  let timerFade = null;
  let menungguSentuh = false;

  function dimatikan() {
    try { return localStorage.getItem(KUNCI_MUTE) === 'mati'; } catch (e) { return false; }
  }

  function simpanMute(mati) {
    try { localStorage.setItem(KUNCI_MUTE, mati ? 'mati' : 'nyala'); } catch (e) { /* abaikan */ }
  }

  function perbaruiTombol() {
    if (!tombol) return;
    const bunyi = Boolean(latarEl && !latarEl.paused);
    tombol.hidden = !boleh;
    tombol.textContent = bunyi ? '🔊' : '🔇';
    tombol.setAttribute('aria-pressed', String(bunyi));
    tombol.setAttribute('aria-label', bunyi ? 'Matikan musik' : 'Nyalakan musik');
    tombol.title = bunyi ? 'Matikan musik' : 'Nyalakan musik';
  }

  function siapkan() {
    if (latarEl || !PENGATURAN.musikBeranda) return Boolean(latarEl);
    latarEl = new Audio(encodeURI(PENGATURAN.musikBeranda));
    latarEl.loop = true;
    latarEl.volume = volume();
    // Lanjutkan dari posisi di halaman sebelumnya, bukan dari awal.
    let posisi = 0;
    try { posisi = Number(sessionStorage.getItem(KUNCI_POSISI)) || 0; } catch (e) { /* abaikan */ }
    if (posisi) latarEl.addEventListener('loadedmetadata', () => { latarEl.currentTime = posisi % (latarEl.duration || Infinity); }, { once: true });
    latarEl.addEventListener('play', () => { lepasSentuhan(); perbaruiTombol(); });
    latarEl.addEventListener('pause', perbaruiTombol);
    window.addEventListener('pagehide', () => {
      try { sessionStorage.setItem(KUNCI_POSISI, String(latarEl.currentTime || 0)); } catch (e) { /* abaikan */ }
    });

    tombol = document.createElement('button');
    tombol.type = 'button';
    tombol.className = 'btn-musik';
    tombol.addEventListener('click', () => {
      if (latarEl.paused) { simpanMute(false); putar(); } else { simpanMute(true); latarEl.pause(); perbaruiTombol(); }
    });
    document.body.appendChild(tombol);
    return true;
  }

  function sentuhan(e) {
    if (e.target.closest && e.target.closest('.btn-musik')) return; // tombol musik punya aksinya sendiri
    putar();
  }

  function lepasSentuhan() {
    if (!menungguSentuh) return;
    menungguSentuh = false;
    SENTUHAN.forEach((t) => document.removeEventListener(t, sentuhan, true));
  }

  function putar() {
    if (!boleh || !latarEl) return;
    clearInterval(timerFade);
    latarEl.volume = volume();
    latarEl.play().catch(() => {
      // Diblokir browser: tunggu sentuhan pertama.
      if (menungguSentuh || dimatikan()) return;
      menungguSentuh = true;
      SENTUHAN.forEach((t) => document.addEventListener(t, sentuhan, true));
    });
  }

  // Nyalakan (true) atau hentikan perlahan (false) lagu pengiring.
  function latar(nyala) {
    boleh = Boolean(nyala) && Boolean(PENGATURAN.musikBeranda);
    if (boleh) {
      siapkan();
      if (!dimatikan()) putar();
      perbaruiTombol();
      return;
    }
    lepasSentuhan();
    perbaruiTombol();
    if (!latarEl || latarEl.paused) return;
    clearInterval(timerFade);
    timerFade = setInterval(() => {
      latarEl.volume = Math.max(0, latarEl.volume - volume() / 10);
      if (latarEl.volume <= 0.001) {
        clearInterval(timerFade);
        latarEl.pause();
        latarEl.volume = volume();
      }
    }, 100);
  }

  // Nada singkat saat peringkat akhir muncul (mengikuti pilihan mute).
  function peringkat() {
    latar(false);
    if (!PENGATURAN.musikPeringkat || dimatikan()) return;
    const nada = new Audio(encodeURI(PENGATURAN.musikPeringkat));
    nada.volume = volume();
    nada.play().catch(() => { /* diblokir browser: lewati */ });
  }

  return { latar, peringkat };
})();

// Keputusan awal berdasarkan status sesi terakhir yang tersimpan; halaman dengan badge sesi
// akan memperbaruinya secara live (lihat js/sesi.js).
function musikAwal() {
  const halaman = location.pathname.split('/').pop() || 'index.html';
  if (halaman === 'guru.html') return;
  const sesi = loadState().sesi;
  const status = sesi && sesi.status;
  const soal = HALAMAN_SOAL.includes(halaman);
  MUSIK.latar(status === 'menunggu' || (status !== 'berjalan' && !soal));
}

// ---------- Stepper alur ----------
function renderStepper() {
  const el = document.getElementById('stepper');
  if (!el) return;
  const state = loadState();
  const aktif = el.dataset.aktif;
  el.className = 'stepper';
  el.innerHTML = LANGKAH.map((l, i) => {
    const selesai = state.selesai.includes(l.id);
    const terbuka = langkahTerbuka(state, i) && (i === 0 || !sesiTidakBerjalan(state));
    const kelas = [selesai ? 'selesai' : '', l.id === aktif ? 'aktif' : '', terbuka ? '' : 'terkunci'].join(' ');
    const isi = `<span class="step-ikon">${selesai ? '✓' : terbuka ? l.ikon : '🔒'}</span>
      <span class="step-label">${i + 1}. ${esc(l.label)}</span>`;
    return terbuka
      ? `<a class="step ${kelas}" href="${l.href}" title="${esc(l.label)}">${isi}</a>`
      : `<span class="step ${kelas}" title="${esc(l.label)} (terkunci)" aria-disabled="true">${isi}</span>`;
  }).join('<span class="step-garis" aria-hidden="true"></span>');

  // Di layar sempit stepper bisa digeser: posisikan langkah aktif di tengah.
  const aktifEl = el.querySelector('.step.aktif');
  if (aktifEl) el.scrollLeft = aktifEl.offsetLeft - (el.clientWidth - aktifEl.offsetWidth) / 2;
}

function refreshStepper() { renderStepper(); }

// ---------- Urutan langkah ----------
// Sudah memasukkan kode? Dengan Sesi Kelas aktif, wajib tergabung ke sesi guru.
function sudahTerdaftar(state) {
  if (!state.tim || !state.selesai.includes('tim')) return false;
  return typeof SESI === 'undefined' || !SESI.aktif() || Boolean(state.sesi && state.sesi.kode);
}

// Langkah 2 dst. hanya terbuka selama sesi berjalan: belum dimulai guru, sudah diakhiri,
// atau statusnya belum terbaca dari Firebase = terkunci. Status disimpan oleh gabung / aturMusik (js/sesi.js).
function sesiTidakBerjalan(state) {
  if (typeof SESI === 'undefined' || !SESI.aktif() || !state.sesi) return false;
  return state.sesi.status !== 'berjalan';
}

// Langkah ke-i terbuka jika langkah sebelumnya sudah selesai (langkah pertama selalu terbuka).
function langkahTerbuka(state, i) {
  if (i === 0) return true;
  if (!sudahTerdaftar(state)) return false;
  return state.selesai.includes(LANGKAH[i - 1].id) || state.selesai.includes(LANGKAH[i].id);
}

// Halaman permainan → langkah pertama yang dikerjakan di halaman itu.
const LANGKAH_HALAMAN = { 'lagu.html': 'putar', 'puzzle.html': 'puzzle', 'cipta.html': 'cipta', 'unggah.html': 'unggah' };

// Langkah yang harus dikerjakan dulu sebelum halaman ini boleh dibuka, atau null jika sudah terbuka.
function syaratHalaman() {
  const id = LANGKAH_HALAMAN[location.pathname.split('/').pop() || 'index.html'];
  if (!id) return null;
  const state = loadState();
  const i = LANGKAH.findIndex((l) => l.id === id);
  if (langkahTerbuka(state, i)) return null;
  return sudahTerdaftar(state) ? LANGKAH[i - 1] : LANGKAH[0];
}

// Tutup isi halaman permainan bila langkah sebelumnya belum dikerjakan.
function kunciHalaman() {
  const syarat = syaratHalaman();
  const main = document.querySelector('main');
  if (!syarat || !main) return;
  const ke = LANGKAH.indexOf(syarat) + 1;
  main.innerHTML = `
    <div class="kartu kunci-langkah">
      <div class="besar" aria-hidden="true">🔒</div>
      <h2>Tahap ini masih terkunci</h2>
      <p>${syarat.id === 'tim'
        ? 'Masukkan kode sesi dari guru dulu, lalu tunggu guru memulai sesi.'
        : `Selesaikan langkah <b>${ke}. ${esc(syarat.label)}</b> dulu ya, baru tahap ini terbuka.`}</p>
      <a class="btn" href="${syarat.href}">${syarat.ikon} ${esc(syarat.label)}</a>
    </div>`;
}

// Tampilkan peringatan jika tim belum diisi. Mengembalikan true jika tim sudah ada.
function cekTim(container) {
  const state = loadState();
  if (state.tim) return true;
  if (container) {
    container.innerHTML = `
      <div class="banner">
        <span>👥 Kalian belum terdaftar. Masukkan kode sesi dari guru dulu yuk, supaya hasil belajar tersimpan!</span>
        <a class="btn btn-kecil" href="masuk.html">Masuk Sesi</a>
      </div>`;
  }
  return false;
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  renderStepper();
  kunciHalaman();
  musikAwal();
});

// Service worker: agar bisa dipasang di layar utama HP dan tetap terbuka saat sinyal hilang.
// Hanya berjalan lewat http(s), tidak saat file dibuka langsung (file://).
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
