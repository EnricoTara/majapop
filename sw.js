// Pembersih service worker lama dari alamat GitHub Pages: hapus cache, cabut diri, lalu muat ulang tab
// agar pengalihan ke majapop.web.app berjalan.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url);
})()));
