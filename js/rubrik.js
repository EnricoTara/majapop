// ============================================================
// Modal penilaian kalimat majas dengan RUBRIK_MAJAS (js/app.js): setiap kalimat diberi skor 1–4
// untuk lima indikator berbobot. Dipakai di Dashboard sesi dan Riwayat nilai menu Kelas.
// ============================================================

const RUBRIK = (() => {
  const jenis = (id) => (majasById(id) || {}).jenis || id;
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

  function teksNilai(n) {
    return n === null ? '–' : String(Math.round(n));
  }

  // judul: nama peserta; ciptaan: [{ id, majasId, tema, kalimat }];
  // skorAwal: { <kunciKalimat>: { jenis, makna, … } } (lihat kunciKalimat di js/app.js);
  // onSimpan(skor) → Promise; skor = { <kunciKalimat>: { … } } hanya untuk kalimat yang punya skor.
  function buka({ judul, ciptaan = [], skorAwal = {}, onSimpan }) {
    tutup();
    // skor[i] mengikuti urutan kalimat di layar; kuncinya baru dipakai saat disimpan.
    const kunci = ciptaan.map((c, i) => kunciKalimat(c, i));
    const skor = {};
    kunci.forEach((k, i) => { skor[i] = { ...((skorAwal || {})[k] || {}) }; });

    modalEl = document.createElement('div');
    modalEl.className = 'modal buka modal-jawaban modal-rubrik';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-labelledby', 'rb-judul');
    const kartu = ciptaan.map((c, i) => `
      <section class="rb-kalimat" data-i="${i}">
        <div class="rb-kepala">
          <span class="jw-label">${i + 1}. ${esc(jenis(c.majasId))}${c.tema ? ` · ${esc(c.tema)}` : ''}</span>
          <span class="rb-nilai">Nilai <b data-nilai="${i}">–</b></span>
        </div>
        <p class="rb-teks">“${esc(c.kalimat)}”</p>
        <div class="rb-tabel">
          ${RUBRIK_MAJAS.map((r) => `
            <fieldset class="rb-baris">
              <legend><b>${esc(r.label)}</b> <span class="rb-bobot">${r.bobot}%</span><span class="kecil rb-fokus">${esc(r.fokus)}</span></legend>
              <div class="rb-pilihan">
                ${SKOR_RUBRIK.map((s) => `
                  <label title="${esc(s.label)}">
                    <input type="radio" name="rb-${i}-${r.id}" value="${s.skor}" data-i="${i}" data-r="${r.id}" ${Number(skor[i][r.id]) === s.skor ? 'checked' : ''}>
                    <span><b>${s.skor}</b><small>${esc(s.label)}</small></span>
                  </label>`).join('')}
              </div>
            </fieldset>`).join('')}
        </div>
      </section>`).join('');
    modalEl.innerHTML = `
      <div class="modal-isi">
        <button type="button" class="ps-tutup" aria-label="Tutup penilaian">✕</button>
        <h2 id="rb-judul">✍️ Nilai Majas · ${esc(judul)}</h2>
        <p class="kecil">Skor 1–4 per indikator (1 kurang, 2 cukup, 3 baik, 4 sangat baik). Nilai kalimat = Σ (skor ÷ 4 × bobot); nilai majas = rata-rata kalimat yang sudah lengkap dinilai.</p>
        ${ciptaan.length ? kartu : '<p class="kecil jw-kosong">Belum ada kalimat majas yang dikirim.</p>'}
        <div class="rb-kaki">
          <span>⭐ Nilai majas <b id="rb-total">–</b></span>
          <span class="aksi">
            <button type="button" class="btn btn-garis btn-kecil" data-batal>Batal</button>
            <button type="button" class="btn btn-kecil" data-simpan ${ciptaan.length ? '' : 'disabled'}>💾 Simpan nilai</button>
          </span>
        </div>
      </div>`;

    function perbarui() {
      ciptaan.forEach((_, i) => {
        modalEl.querySelector(`[data-nilai="${i}"]`).textContent = teksNilai(nilaiKalimat(skor[i]));
      });
      const total = nilaiMajas(Object.values(skor));
      modalEl.querySelector('#rb-total').textContent = total === null ? 'belum dinilai' : total;
    }

    modalEl.addEventListener('change', (e) => {
      const r = e.target.closest('input[type="radio"]');
      if (!r) return;
      skor[r.dataset.i][r.dataset.r] = Number(r.value);
      perbarui();
    });
    modalEl.addEventListener('click', async (e) => {
      if (e.target === modalEl || e.target.closest('.ps-tutup') || e.target.closest('[data-batal]')) { tutup(); return; }
      const tombol = e.target.closest('[data-simpan]');
      if (!tombol) return;
      const kirim = {};
      Object.entries(skor).forEach(([i, s]) => {
        const bersih = {};
        RUBRIK_MAJAS.forEach((r) => { if (Number(s[r.id]) >= 1 && Number(s[r.id]) <= 4) bersih[r.id] = Number(s[r.id]); });
        if (Object.keys(bersih).length) kirim[kunci[i]] = bersih;
      });
      tombol.disabled = true;
      tombol.textContent = 'Menyimpan…';
      try {
        await onSimpan(kirim);
        toast('💾 Nilai majas tersimpan.');
        tutup();
      } catch (err) {
        tombol.disabled = false;
        tombol.textContent = '💾 Simpan nilai';
        toast('Nilai belum tersimpan. Periksa koneksi lalu coba lagi.');
      }
    });
    document.addEventListener('keydown', escTutup);
    document.body.appendChild(modalEl);
    perbarui();
    modalEl.querySelector('.ps-tutup').focus();
  }

  return { buka, tutup };
})();
