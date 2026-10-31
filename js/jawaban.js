// ============================================================
// Tampilan jawaban rinci satu siswa/kelompok (dibuat SESI.jawabanLengkap di js/sesi.js):
// dipakai di halaman Kirim Hasil siswa, dashboard sesi guru, dan riwayat nilai menu Kelas.
// ============================================================

const JAWABAN = (() => {
  const jenis = (id) => (majasById(id) || {}).jenis || id;

  function formatWaktu(detik) {
    return `${Math.floor(detik / 60)}:${String(detik % 60).padStart(2, '0')}`;
  }

  // Urutan tebakan satu lagu, mis. "Metafora ✖ → Personifikasi ✔".
  function teksTebakan(l, d) {
    return (d.tebakan || []).map((t) => `${jenis(t)} ${t === l.majasId ? '✔' : '✖'}`).join(' → ');
  }

  // Untuk kolom CSV: satu baris per lagu yang sudah ditebak.
  function teksLagu(j) {
    const lagu = (j && j.lagu) || {};
    return LAGU.filter((l) => lagu[l.id] && lagu[l.id].percobaan)
      .map((l) => `${l.judul}: ${teksTebakan(l, lagu[l.id]) || (lagu[l.id].benar ? `${jenis(l.majasId)} ✔` : '-')}`).join(' | ');
  }

  function teksMakna(j) {
    const lagu = (j && j.lagu) || {};
    return LAGU.filter((l) => lagu[l.id] && lagu[l.id].makna).map((l) => `${l.judul}: ${lagu[l.id].makna}`).join(' | ');
  }

  function teksPeran(j) {
    const peran = (j && j.peran) || {};
    return PERAN.filter((p) => peran[p.id]).map((p) => `${p.label}: ${peran[p.id]}`).join(', ');
  }

  function html(j) {
    if (!j) return '<p class="kecil jw-kosong">Belum ada jawaban yang tercatat.</p>';
    const lagu = j.lagu || {};
    const barisLagu = daftarLaguSiap().map((l) => {
      const d = lagu[l.id];
      if (!d) return `<li class="jw-lagu belum"><b>${esc(l.judul)}</b> <span class="kecil">· belum dikerjakan</span></li>`;
      const tebakan = (d.tebakan || []).map((t) => `<span class="jw-tebak ${t === l.majasId ? 'benar' : 'salah'}">${esc(jenis(t))} ${t === l.majasId ? '✔' : '✖'}</span>`).join('<span class="jw-panah" aria-hidden="true">→</span>');
      return `<li class="jw-lagu">
        <b>${esc(l.judul)}</b> <span class="kecil">· ${esc(l.penyanyi)}</span>
        <div class="jw-tebakan">${tebakan || (d.benar ? `<span class="jw-tebak benar">${esc(jenis(l.majasId))} ✔</span>` : '<span class="kecil">belum menebak</span>')}</div>
        ${d.makna ? `<p class="jw-makna">💡 ${esc(d.makna)}</p>` : ''}
      </li>`;
    }).join('');
    const peran = teksPeran(j);
    const p = j.puzzle;
    const ciptaan = j.ciptaan || [];
    return `
      ${peran ? `<section class="jw-bagian"><h3>👥 Peran</h3><p>${esc(peran)}</p></section>` : ''}
      <section class="jw-bagian"><h3>🔍 Identifikasi majas & makna lirik</h3><ul class="jw-daftar">${barisLagu}</ul></section>
      <section class="jw-bagian"><h3>🧩 Puzzle</h3>${p
        ? `<p><b>${esc(p.skor)}</b> poin · ${esc(p.benar)}/${esc(p.total)} kepingan benar · ${esc(p.salah)} kesalahan · sisa waktu ${esc(formatWaktu(p.sisaWaktu || 0))}</p>`
        : '<p class="kecil">Belum dimainkan.</p>'}</section>
      <section class="jw-bagian"><h3>✍️ Majas buatan</h3>${ciptaan.length
        ? `<ol class="jw-daftar jw-cipta">${ciptaan.map((c) => `<li><span class="jw-label">${esc(jenis(c.majasId))}${c.tema ? ` · ${esc(c.tema)}` : ''}</span>${esc(c.kalimat)}</li>`).join('')}</ol>`
        : '<p class="kecil">Belum ada.</p>'}</section>`;
  }

  // Modal jawaban (pola sama dengan papan peringkat siswa di js/sesi.js).
  let modalEl = null;

  function tutup() {
    if (!modalEl) return;
    modalEl.remove();
    modalEl = null;
    document.removeEventListener('keydown', escTutup);
  }

  function escTutup(e) {
    if (e.key === 'Escape') tutup();
  }

  function buka(judul, j) {
    tutup();
    modalEl = document.createElement('div');
    modalEl.className = 'modal buka modal-jawaban';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-labelledby', 'jw-judul');
    const status = j && j.dikirim
      ? `✅ Dikirim ${new Date(j.dikirim).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}`
      : '⏳ Belum menekan "Kirim ke Guru" (jawaban tetap tercatat otomatis)';
    modalEl.innerHTML = `
      <div class="modal-isi">
        <button type="button" class="ps-tutup" aria-label="Tutup jawaban">✕</button>
        <h2 id="jw-judul">📝 ${esc(judul)}</h2>
        <p class="kecil jw-status">${esc(status)}</p>
        <div class="jw-isi">${html(j)}</div>
      </div>`;
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl || e.target.closest('.ps-tutup')) tutup();
    });
    document.addEventListener('keydown', escTutup);
    document.body.appendChild(modalEl);
    modalEl.querySelector('.ps-tutup').focus();
  }

  return { html, buka, teksLagu, teksMakna, teksPeran };
})();
