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
  return { tim: '', kelas: '', anggota: [], peran: {}, selesai: [], lagu: {}, puzzle: null, ciptaan: [] };
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
        <a class="btn btn-kecil btn-kuning" href="masuk.html">${state.tim ? '👥 ' + esc(state.tim) : 'Masuk'}</a>
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
        <span>👥 Kelompok kalian belum terdaftar. Bentuk tim dulu yuk, supaya hasil belajar tersimpan!</span>
        <a class="btn btn-kecil" href="masuk.html">Bagi Tim</a>
      </div>`;
  }
  return false;
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  renderStepper();
});

// Service worker: agar bisa dipasang di layar utama HP dan tetap terbuka saat sinyal hilang.
// Hanya berjalan lewat http(s), tidak saat file dibuka langsung (file://).
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
