// Service worker MajaPOP!
// - File web sendiri: ambil dari jaringan dulu (perubahan guru langsung terlihat),
//   pakai salinan cache saat offline.
// - Google Fonts & Leaflet: pakai cache dulu.
// - YouTube, gambar peta, dan musik MP3 tidak disimpan.
// Naikkan nomor versi jika daftar file INTI berubah.
const CACHE = 'majapop-v4';

const INTI = [
  './',
  'index.html', 'masuk.html', 'emodul.html', 'pemantik.html',
  'lagu.html', 'puzzle.html', 'cipta.html', 'unggah.html', 'guru.html',
  'css/style.css',
  'js/data.js', 'js/app.js', 'js/lagu.js', 'js/puzzle.js', 'js/cipta.js', 'js/pemantik.js',
  'js/firebase-config.js', 'js/sesi.js', 'js/guru.js',
  'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(INTI.map((u) => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

function simpan(req, res) {
  if (res && (res.ok || res.type === 'opaque')) {
    const salinan = res.clone();
    caches.open(CACHE).then((c) => c.put(req, salinan));
  }
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Musik (MP3) diputar langsung dari jaringan: respons sebagian (206) tidak bisa disimpan di cache.
  if (req.headers.has('range') || url.pathname.endsWith('.mp3')) return;

  if (url.origin === location.origin) {
    // cache: 'no-cache' = selalu tanya server dulu (cache HTTP GitHub Pages 10 menit tidak dipakai mentah-mentah).
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => simpan(req, res))
        .catch(() => caches.match(req, { ignoreSearch: true })
          .then((r) => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
    );
    return;
  }

  // Pustaka dari CDN (font, peta, Firebase SDK, QR) disimpan agar cepat dibuka lagi.
  // Koneksi database Firebase sendiri (firebaseio.com / firebasedatabase.app) tidak di-cache.
  if (/^(fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com|cdnjs\.cloudflare\.com)$/.test(url.hostname)
    || (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/'))) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => simpan(req, res))));
  }
});
