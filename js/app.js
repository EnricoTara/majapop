// ============================================================
// Kode bersama semua halaman: header, footer, stepper alur,
// dan penyimpanan progres tim di localStorage.
// ============================================================

const STORE_KEY = 'majapop';

// Alur petualangan (urutan permainan).
const LANGKAH = [
  { id: 'tim', label: 'Bagi Tim', ikon: '👥', href: 'masuk.html' },
  { id: 'putar', label: 'Putar Lagu', ikon: '🎵', href: 'lagu.html' },
  { id: 'identifikasi', label: 'Identifikasi Majas', ikon: '🔍', href: 'lagu.html#identifikasi' },
  { id: 'puzzle', label: 'Susun Puzzle', ikon: '🧩', href: 'puzzle.html' },
  { id: 'cipta', label: 'Cipta Majas', ikon: '✍️', href: 'cipta.html' },
  { id: 'unggah', label: 'Unggah Hasil', ikon: '📤', href: 'unggah.html' },
];

// Menu fitur (sesuai kartu "Jangan lupa jelajahi fitur menunya!").
const FITUR = [
  { label: 'E Modul', judul: 'Jelajahi dan Pahami Materi Dalam E Modul', ikon: '📘', href: 'emodul.html' },
  { label: 'Pemantik', judul: 'Jelajahi Peta Sastrawan Indonesia', ikon: '🗺️', href: 'pemantik.html' },
  { label: 'Daftar Lagu', judul: 'Dengarkan dan Identifikasi Majas dalam Lagu', ikon: '🎧', href: 'lagu.html' },
  { label: 'Papan Puzzle', judul: 'Susun Rangkaian Potongan Puzzle secara Tepat', ikon: '🧩', href: 'puzzle.html' },
  { label: 'Isi Potongan Puzzle', judul: 'Pilih Kepingan Puzzle dan Isi dengan Kalimat Majas Buatanmu', ikon: '✍️', href: 'cipta.html' },
  { label: 'Google Form', judul: 'Unggah Hasil Belajar yang Telah Kalian Lakukan', ikon: '📤', href: 'unggah.html' },
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
  return { tim: '', kelas: '', absen: '', anggota: [], peran: {}, selesai: [], lagu: {}, puzzle: null, ciptaan: [], sesi: null, waktuSoal: null };
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
        <a class="btn btn-kecil btn-kuning" href="masuk.html">${state.tim ? (sesiIndividu(state) ? '👤 ' : '👥 ') + esc(state.tim) : 'Masuk'}</a>
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
      <p class="kecil"><a class="link-guru" href="guru.html">Untuk guru → Dashboard Sesi Kelas</a></p>
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
    const terbuka = i === 0 || state.selesai.includes(LANGKAH[i - 1].id) || selesai;
    const kelas = [selesai ? 'selesai' : '', l.id === aktif ? 'aktif' : '', terbuka ? '' : 'terkunci'].join(' ');
    return `<a class="step ${kelas}" href="${l.href}" title="${esc(l.label)}">
      <span class="step-ikon">${selesai ? '✓' : l.ikon}</span>
      <span class="step-label">${i + 1}. ${esc(l.label)}</span>
    </a>`;
  }).join('<span class="step-garis" aria-hidden="true"></span>');

  // Di layar sempit stepper bisa digeser: posisikan langkah aktif di tengah.
  const aktifEl = el.querySelector('.step.aktif');
  if (aktifEl) el.scrollLeft = aktifEl.offsetLeft - (el.clientWidth - aktifEl.offsetWidth) / 2;
}

function refreshStepper() { renderStepper(); }

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
  musikAwal();
});

// Service worker: agar bisa dipasang di layar utama HP dan tetap terbuka saat sinyal hilang.
// Hanya berjalan lewat http(s), tidak saat file dibuka langsung (file://).
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
