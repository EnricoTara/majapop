// Halaman Daftar Lagu: putar lagu, identifikasi majas, diskusikan makna.

cekTim(document.getElementById('banner-tim'));

const gridEl = document.getElementById('lagu-grid');
const detailEl = document.getElementById('identifikasi');
let laguAktif = null;

function dataLagu(state, id) {
  return state.lagu[id] || { diputar: false, benar: false, percobaan: 0, makna: '' };
}

function renderGrid() {
  const state = loadState();
  gridEl.innerHTML = LAGU.map((l) => {
    const d = dataLagu(state, l.id);
    const status = d.benar ? '✅' : d.diputar ? '🎵' : '';
    return `<button type="button" class="lagu-kartu ${l.id === laguAktif ? 'aktif' : ''}" data-id="${l.id}">
      <span class="status" aria-hidden="true">${status}</span>
      <span class="judul">${esc(l.judul)}</span>
      <span class="penyanyi">${esc(l.penyanyi)}</span>
    </button>`;
  }).join('');

  const benar = LAGU.filter((l) => dataLagu(state, l.id).benar).length;
  const pertama = LAGU.filter((l) => { const d = dataLagu(state, l.id); return d.benar && d.percobaan === 1; }).length;
  document.getElementById('progres-teks').textContent = `${benar}/${LAGU.length} majas teridentifikasi`;
  document.getElementById('progres-pertama').textContent = benar ? `Tepat di tebakan pertama: ${pertama}` : '';
  document.getElementById('progres-isi').style.width = `${(benar / LAGU.length) * 100}%`;
  document.getElementById('lanjut').hidden = benar < LAGU.length;
}

function playerHtml(l) {
  if (l.youtubeId) {
    return `<iframe class="player" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(l.youtubeId)}"
      title="${esc(l.judul)} – ${esc(l.penyanyi)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  }
  const cari = encodeURIComponent(`${l.judul} ${l.penyanyi}`);
  return `<div class="player-kosong">
    <div><div class="besar">🎵</div>
    <p style="margin:8px 0 14px"><strong>${esc(l.judul)}</strong><br>${esc(l.penyanyi)}</p>
    <a class="btn btn-kuning btn-kecil" href="https://www.youtube.com/results?search_query=${cari}" target="_blank" rel="noopener">▶ Cari di YouTube</a></div>
  </div>`;
}

function pilihLagu(id, gulir) {
  laguAktif = id;
  const l = LAGU.find((x) => x.id === id);
  const state = updateState((s) => { s.lagu[id] = Object.assign(dataLagu(s, id), { diputar: true }); });
  if (!state.selesai.includes('putar')) tandaiSelesai('putar');
  const d = dataLagu(state, id);
  const peran = state.peran || {};

  detailEl.innerHTML = `
    <div class="kartu detail-grid">
      <div>
        ${playerHtml(l)}
        <h3 style="margin-top:16px">${esc(l.judul)} <span class="kecil">— ${esc(l.penyanyi)}</span></h3>
        ${peran.dengar ? `<p class="kecil">🎧 Pendengar lagu: <strong>${esc(peran.dengar)}</strong> · 🔍 Penebak majas: <strong>${esc(peran.tebak)}</strong> · 💡 Penemu makna: <strong>${esc(peran.makna)}</strong></p>` : ''}
      </div>
      <div>
        <p class="kecil" style="margin-bottom:6px">Kutipan lirik:</p>
        <blockquote class="kutipan">“${esc(l.kutipan)}”</blockquote>
        <h3>Majas apa yang ada pada kutipan lirik ini?</h3>
        <div class="pilihan-grid" id="pilihan">
          ${MAJAS.map((m) => `<button type="button" class="pilihan" data-majas="${m.id}">${esc(m.jenis)}</button>`).join('')}
        </div>
        <div id="umpan"></div>
        <div id="diskusi" ${d.benar ? '' : 'hidden'} style="margin-top:18px">
          <label for="makna">💡 Diskusikan: apa makna lirik ini menurut kelompokmu?</label>
          <textarea id="makna" placeholder="Tulis hasil diskusi kelompok di sini…">${esc(d.makna)}</textarea>
          <div class="aksi aksi-penuh" style="margin-top:10px">
            <button type="button" class="btn btn-kecil btn-garis" id="lihat-makna">Bandingkan dengan makna</button>
            <button type="button" class="btn btn-kecil" id="lagu-berikut">Lagu berikutnya →</button>
          </div>
          <div id="makna-asli" class="umpan benar" hidden>${esc(l.makna)}</div>
        </div>
      </div>
    </div>`;

  if (d.benar) tampilkanBenar(l);

  detailEl.querySelector('#pilihan').addEventListener('click', (e) => {
    const btn = e.target.closest('.pilihan');
    if (!btn || btn.disabled) return;
    jawab(l, btn);
  });
  detailEl.querySelector('#makna').addEventListener('input', (e) => {
    updateState((s) => { s.lagu[id].makna = e.target.value; });
  });
  detailEl.querySelector('#lihat-makna').addEventListener('click', () => {
    detailEl.querySelector('#makna-asli').hidden = false;
  });
  detailEl.querySelector('#lagu-berikut').addEventListener('click', () => {
    const s = loadState();
    const sisa = LAGU.filter((x) => !dataLagu(s, x.id).benar);
    const idx = LAGU.findIndex((x) => x.id === id);
    const berikut = sisa.find((x) => LAGU.indexOf(x) > idx) || sisa[0] || LAGU[(idx + 1) % LAGU.length];
    pilihLagu(berikut.id, true);
  });

  renderGrid();
  // Di HP daftar lagu berupa chip yang digeser ke samping: tampilkan chip aktif di tengah.
  const chip = gridEl.querySelector('.lagu-kartu.aktif');
  if (chip && gridEl.scrollWidth > gridEl.clientWidth) {
    gridEl.scrollTo({ left: chip.offsetLeft - (gridEl.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
  }
  if (gulir) (gridEl.scrollWidth > gridEl.clientWidth ? gridEl : detailEl).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function jawab(l, btn) {
  const benar = btn.dataset.majas === l.majasId;
  const state = updateState((s) => {
    const d = s.lagu[l.id];
    d.percobaan += 1;
    if (benar) d.benar = true;
  });
  const umpan = detailEl.querySelector('#umpan');
  if (benar) {
    tampilkanBenar(l);
    detailEl.querySelector('#diskusi').hidden = false;
    const semua = LAGU.every((x) => dataLagu(state, x.id).benar);
    if (semua && !state.selesai.includes('identifikasi')) {
      tandaiSelesai('identifikasi');
      toast('🎉 Semua majas berhasil diidentifikasi!');
    }
    renderGrid();
  } else {
    btn.classList.add('salah');
    btn.disabled = true;
    umpan.innerHTML = `<div class="umpan salah">Belum tepat. Dengarkan lagi dan perhatikan ciri majasnya, lalu coba lagi!</div>`;
  }
}

function tampilkanBenar(l) {
  const m = majasById(l.majasId);
  detailEl.querySelectorAll('.pilihan').forEach((b) => {
    b.disabled = true;
    if (b.dataset.majas === l.majasId) b.classList.add('benar');
  });
  detailEl.querySelector('#umpan').innerHTML =
    `<div class="umpan benar"><strong>Tepat! Majas ${esc(m.jenis)}.</strong> ${esc(m.penjelasan)}</div>`;
}

gridEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.lagu-kartu');
  if (btn) pilihLagu(btn.dataset.id, true);
});

// Buka lagu pertama yang belum teridentifikasi.
const awal = loadState();
const pertamaBelum = LAGU.find((l) => !dataLagu(awal, l.id).benar) || LAGU[0];
renderGrid();
detailEl.innerHTML = `<div class="kartu tengah"><p style="margin:0">👆 Pilih salah satu lagu di atas untuk mulai mendengarkan.</p></div>`;
if (location.hash === '#identifikasi') pilihLagu(pertamaBelum.id, true);
window.addEventListener('hashchange', () => {
  if (location.hash === '#identifikasi' && !laguAktif) pilihLagu(pertamaBelum.id, true);
});
