// Halaman Pemantik: pertanyaan pemantik + Peta Sastrawan Indonesia (Leaflet).

document.getElementById('pemantik-list').innerHTML = PEMANTIK.map((p) => `<li>${esc(p)}</li>`).join('');

const listEl = document.getElementById('sastrawan-list');
listEl.innerHTML = SASTRAWAN.map((s, i) => `
  <button type="button" data-i="${i}">
    <strong>${esc(s.nama)}</strong>📍 ${esc(s.asal)}
  </button>`).join('');

if (window.L) {
  // Di HP, geser satu jari tetap menggulir halaman; perbesar peta dengan dua jari atau tombol +/−.
  const peta = L.map('peta', { scrollWheelZoom: false, dragging: !L.Browser.mobile })
    .setView([-2.5, 117.5], L.Browser.mobile ? 4 : 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 12,
    attribution: '&copy; OpenStreetMap',
  }).addTo(peta);

  const penanda = SASTRAWAN.map((s) => L.marker([s.lat, s.lng]).addTo(peta).bindPopup(`
    <strong style="font-size:1.05rem">${esc(s.nama)}</strong><br>
    📍 ${esc(s.asal)}<br>
    <em>Karya: ${esc(s.karya)}</em>`));

  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const i = Number(btn.dataset.i);
    listEl.querySelectorAll('button').forEach((b) => b.classList.toggle('aktif', b === btn));
    peta.setView([SASTRAWAN[i].lat, SASTRAWAN[i].lng], 8);
    penanda[i].openPopup();
    // Di HP daftar berada di bawah peta: gulir kembali ke peta.
    if (matchMedia('(max-width: 860px)').matches) {
      document.getElementById('peta').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
} else {
  document.getElementById('peta').innerHTML =
    '<p style="padding:20px">Peta tidak bisa dimuat. Periksa koneksi internet, lalu muat ulang halaman.</p>';
}
