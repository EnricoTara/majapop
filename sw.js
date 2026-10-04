// Service worker MajaPOP!
// - File web sendiri: ambil dari jaringan dulu (perubahan guru langsung terlihat),
//   pakai salinan cache saat offline.
// - Google Fonts & Leaflet: pakai cache dulu.
// - YouTube dan gambar peta tidak disimpan.
// Naikkan nomor versi jika daftar file INTI berubah.
const CACHE = 'majapop-v1';

const INTI = [
  './',
  'index.html', 'masuk.html', 'emodul.html', 'pemantik.html',
  'lagu.html', 'puzzle.html', 'cipta.html', 'unggah.html',
  'css/style.css',
  'js/data.js', 'js/app.js', 'js/lagu.js', 'js/puzzle.js', 'js/cipta.js', 'js/pemantik.js',
  'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(INTI)));
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

  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req)
        .then((res) => simpan(req, res))
        .catch(() => caches.match(req, { ignoreSearch: true })
          .then((r) => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
    );
    return;
  }

  if (/^(fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com)$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => simpan(req, res))));
  }
});
