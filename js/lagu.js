// Halaman Daftar Lagu: putar lagu, identifikasi majas, diskusikan makna.

cekTim(document.getElementById('banner-tim'));

const gridEl = document.getElementById('lagu-grid');
const detailEl = document.getElementById('identifikasi');
let laguAktif = null;

// Warna sampul bila lagu belum punya gambar cover.
const SAMPUL = [
  'linear-gradient(135deg, #A3B84B, #5E7A1F)',
  'linear-gradient(135deg, #E0A36B, #9A5A2E)',
  'linear-gradient(135deg, #FF6FA8, #FFC93C 55%, #18C1B6)',
  'linear-gradient(135deg, #F4B8C8, #B5838D)',
  'linear-gradient(135deg, #8EA6C9, #45618C)',
  'linear-gradient(135deg, #B8452E, #3E5C4A)',
  'linear-gradient(135deg, #2F5BFF, #9DB4FF)',
  'linear-gradient(135deg, #9A9A9A, #2B2B2B)',
];

function dataLagu(state, id) {
  return state.lagu[id] || { diputar: false, benar: false, percobaan: 0, makna: '' };
}

function renderGrid() {
  const state = loadState();
  gridEl.innerHTML = LAGU.map((l, i) => {
    const d = dataLagu(state, l.id);
    const siap = laguSiap(l);
    const status = !siap ? '<span class="lagu-status kosong">Lirik belum diisi</span>'
      : d.benar ? '<span class="lagu-status benar">✓ Teridentifikasi</span>' : '';
    const sampul = l.cover
      ? `<img src="${esc(l.cover)}" alt="" loading="lazy">`
      : `<span class="sampul-ikon" aria-hidden="true">${l.ikon || '🎵'}</span>`;
    return `<button type="button" class="lagu-kartu ${l.id === laguAktif ? 'aktif' : ''} ${siap ? '' : 'belum-siap'}" data-id="${l.id}">
      <span class="sampul" style="background:${SAMPUL[i % SAMPUL.length]}">
        ${sampul}
        <span class="lagu-no">♫ Lagu ${i + 1}</span>
        ${status}
        <span class="lagu-ikon" aria-hidden="true">${l.ikon || '🎵'}</span>
      </span>
      <span class="judul">${esc(l.judul)}</span>
      <span class="penyanyi">${esc(l.penyanyi)}</span>
      <span class="lagu-kaki"><span class="petunjuk">Klik untuk buka Song Card</span><b>Buka →</b></span>
    </button>`;
  }).join('');

  const siap = daftarLaguSiap();
  const benar = siap.filter((l) => dataLagu(state, l.id).benar).length;
  const pertama = siap.filter((l) => { const d = dataLagu(state, l.id); return d.benar && d.percobaan === 1; }).length;
  document.getElementById('progres-teks').textContent = `${benar}/${siap.length} majas teridentifikasi`;
  document.getElementById('progres-pertama').textContent = benar ? `Tepat di tebakan pertama: ${pertama}` : '';
  document.getElementById('progres-isi').style.width = siap.length ? `${(benar / siap.length) * 100}%` : '0';
  document.getElementById('lanjut').hidden = !siap.length || benar < siap.length;
}

function playerHtml(l) {
  if (l.youtubeId) {
    return `<iframe class="player" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(l.youtubeId)}"
      title="${esc(l.judul)} – ${esc(l.penyanyi)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  }
  const cari = encodeURIComponent(`${l.judul} ${l.penyanyi}`);
  // url() ditulis langsung di style elemen agar path relatif terhadap halaman, bukan terhadap file CSS.
  const latar = l.cover
    ? ` ada-sampul" style="background-image:linear-gradient(rgba(36,19,63,.55),rgba(36,19,63,.75)),url('${encodeURI(l.cover)}')`
    : '';
  return `<div class="player-kosong${latar}">
    <div><div class="besar">${l.cover ? '🎧' : l.ikon || '🎵'}</div>
    <p style="margin:8px 0 14px"><strong>${esc(l.judul)}</strong><br>${esc(l.penyanyi)}</p>
    <a class="btn btn-kuning btn-kecil" href="https://www.youtube.com/results?search_query=${cari}" target="_blank" rel="noopener">▶ Cari di YouTube</a></div>
  </div>`;
}

function laguBerikutnya(id) {
  const s = loadState();
  const siap = daftarLaguSiap();
  const sisa = siap.filter((x) => !dataLagu(s, x.id).benar);
  const idx = LAGU.findIndex((x) => x.id === id);
  return sisa.find((x) => LAGU.indexOf(x) > idx) || sisa[0] || LAGU[(idx + 1) % LAGU.length];
}

function pilihLagu(id, gulir) {
  laguAktif = id;
  const l = LAGU.find((x) => x.id === id);
  const state = updateState((s) => {
    s.lagu[id] = Object.assign(dataLagu(s, id), { diputar: true });
    if (laguSiap(l) && !s.lagu[id].benar) mulaiSoal(s);
  });
  if (!state.selesai.includes('putar')) tandaiSelesai('putar');
  const d = dataLagu(state, id);
  const peran = state.peran || {};
  const siap = laguSiap(l);

  const bagianSoal = siap ? `
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
            <button type="button" class="btn btn-kecil lagu-berikut">Lagu berikutnya →</button>
          </div>
          <div id="makna-asli" class="umpan benar" hidden>${esc(l.makna)}</div>
        </div>` : `
        <div class="banner" style="margin-top:0">
          <span>📝 Kutipan lirik dan jenis majas untuk lagu ini belum diisi oleh guru. Kalian tetap bisa mendengarkan lagunya dulu.</span>
        </div>
        <div class="aksi aksi-penuh"><button type="button" class="btn btn-kecil lagu-berikut">Lagu berikutnya →</button></div>`;

  detailEl.innerHTML = `
    <div class="kartu detail-grid">
      <div>
        ${playerHtml(l)}
        <h3 style="margin-top:16px">${esc(l.judul)} <span class="kecil">— ${esc(l.penyanyi)}</span></h3>
        ${peran.dengar ? `<p class="kecil">🎧 Pendengar lagu: <strong>${esc(peran.dengar)}</strong> · 🔍 Penebak majas: <strong>${esc(peran.tebak)}</strong> · 💡 Penemu makna: <strong>${esc(peran.makna)}</strong></p>` : ''}
      </div>
      <div>${bagianSoal}</div>
    </div>`;

  detailEl.querySelectorAll('.lagu-berikut').forEach((b) => b.addEventListener('click', () => pilihLagu(laguBerikutnya(id).id, true)));

  if (siap) {
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
  }

  renderGrid();
  // Di HP daftar lagu digeser ke samping: tampilkan kartu aktif di tengah.
  const chip = gridEl.querySelector('.lagu-kartu.aktif');
  if (chip && gridEl.scrollWidth > gridEl.clientWidth) {
    gridEl.scrollTo({ left: chip.offsetLeft - (gridEl.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
  }
  if (gulir) detailEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function jawab(l, btn) {
  const benar = btn.dataset.majas === l.majasId;
  const state = updateState((s) => {
    const d = s.lagu[l.id];
    d.percobaan += 1;
    if (benar) d.benar = true;
    catatJawaban(s);
  });
  const umpan = detailEl.querySelector('#umpan');
  if (benar) {
    tampilkanBenar(l);
    detailEl.querySelector('#diskusi').hidden = false;
    const semua = daftarLaguSiap().every((x) => dataLagu(state, x.id).benar);
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

// Buka lagu siap pertama yang belum teridentifikasi.
const awal = loadState();
const pertamaBelum = daftarLaguSiap().find((l) => !dataLagu(awal, l.id).benar) || daftarLaguSiap()[0] || LAGU[0];
renderGrid();
detailEl.innerHTML = `<div class="kartu tengah"><p style="margin:0">👆 Pilih salah satu lagu di atas untuk membuka Song Card.</p></div>`;
if (location.hash === '#identifikasi') pilihLagu(pertamaBelum.id, true);
window.addEventListener('hashchange', () => {
  if (location.hash === '#identifikasi' && !laguAktif) pilihLagu(pertamaBelum.id, true);
});
