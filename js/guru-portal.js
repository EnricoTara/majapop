// ============================================================
// Portal guru: menu Dashboard / Kelas / Materi / Lagu / Akun, ringkasan di Dashboard,
// bank materi majas, bank lagu, dan profil akun. Dimulai oleh js/guru.js setelah login guru terverifikasi.
// Data diambil dari GURU_DATA (js/guru-data.js); menu Kelas ada di js/guru-kelas.js.
// ============================================================

const PORTAL = (() => {
  const MENU = ['dashboard', 'kelas', 'materi', 'lagu', 'akun'];
  const $ = (id) => document.getElementById(id);
  let data = {};
  let profilDiubah = false;

  // ---------- Navigasi menu ----------
  function pilihMenu(id, gulir = true) {
    if (!MENU.includes(id)) id = 'dashboard';
    MENU.forEach((m) => {
      $(`menu-${m}`).hidden = m !== id;
      $(`tab-${m}`).setAttribute('aria-selected', String(m === id));
    });
    try { history.replaceState(null, '', id === 'dashboard' ? location.pathname : `#${id}`); } catch (e) { /* abaikan */ }
    if (gulir) window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // Panah atas/bawah (atau kiri/kanan di HP) berpindah menu, seperti tablist pada umumnya.
  function navKeyboard(e) {
    const arah = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!arah) return;
    e.preventDefault();
    const i = MENU.indexOf(e.target.dataset.menu);
    const ke = MENU[(i + arah + MENU.length) % MENU.length];
    pilihMenu(ke);
    $(`tab-${ke}`).focus();
  }

  // ---------- Profil ----------
  function profil() {
    return data.profil || {};
  }

  function namaTampil() {
    return (profil().nama || '').trim() || SESI.namaGuru();
  }

  function inisial(nama) {
    return nama.trim().charAt(0).toUpperCase() || 'G';
  }

  // ---------- Dashboard ----------
  function renderDashboard() {
    const kelas = GURU_DATA.kelasList();
    $('stat-kelas').textContent = kelas.length;
    $('stat-siswa').textContent = kelas.reduce((n, k) => n + Object.keys(k.siswa || {}).length, 0);
    $('stat-materi').textContent = Object.keys(data.materi || {}).length;
    $('banner-kelas').hidden = kelas.length > 0;

    // Dropdown kelas di form "Mulai sesi baru"; pilihan yang sedang dipilih dipertahankan.
    const pilih = $('pilih-kelas');
    const lama = pilih.value;
    pilih.innerHTML = '<option value="">– Tanpa kelas –</option>' + kelas.map((k) =>
      `<option value="${esc(k.id)}">${esc(k.nama)} · ${k.jenis === 'individu' ? '👤 Individu' : '👥 Kelompok'}</option>`).join('');
    pilih.value = kelas.some((k) => k.id === lama) ? lama : '';
  }

  // Memilih kelas mengisi nama kelas dan jenis sesinya (masih bisa diubah guru).
  function terapkanKelas() {
    const k = GURU_DATA.kelas($('pilih-kelas').value);
    if (!k) return;
    $('nama-kelas').value = k.nama.slice(0, 40);
    const radio = document.querySelector(`input[name="mode"][value="${k.jenis === 'individu' ? 'individu' : 'kelompok'}"]`);
    if (radio) radio.checked = true;
  }

  // Tombol "Gunakan untuk Sesi" di menu Kelas.
  function pakaiKelas(kelasId) {
    pilihMenu('dashboard');
    $('pilih-kelas').value = kelasId;
    terapkanKelas();
    if ($('layar-mulai').hidden) {
      toast('Masih ada sesi yang terbuka. Tekan "Sesi baru" setelah sesi diakhiri, kelasnya sudah terpilih.');
    } else {
      $('layar-mulai').scrollIntoView({ behavior: 'smooth', block: 'start' });
      toast(`Kelas "${GURU_DATA.kelas(kelasId).nama}" dipilih. Periksa jenis sesi, lalu buat kode sesi.`);
    }
  }

  // ---------- Materi ----------
  function renderMateri() {
    const cari = GURU_DATA.samakan($('cari-materi').value);
    const cocok = (...teks) => !cari || GURU_DATA.samakan(teks.join(' ')).includes(cari);
    const dasar = MAJAS.filter((m) => cocok(m.jenis, m.penjelasan, m.ciri, m.contoh)).map((m) => `
      <article class="kartu-isi">
        <span class="tag">Materi dasar</span>
        <h3>${esc(m.jenis)}</h3>
        <p>${esc(m.penjelasan)}</p>
        <p class="kecil"><b>Ciri:</b> ${esc(m.ciri)}</p>
        <p class="kecil"><b>Contoh:</b> <i>${esc(m.contoh)}</i></p>
      </article>`);
    const tambahan = GURU_DATA.daftar(data.materi)
      .sort((a, b) => (b.dibuat || 0) - (a.dibuat || 0))
      .filter((m) => cocok(m.judul, m.isi)).map((m) => `
      <article class="kartu-isi">
        <span class="tag tag-pink">Materi guru</span>
        <h3>${esc(m.judul)}</h3>
        <p class="isi-panjang">${esc(m.isi)}</p>
        <div class="aksi"><button type="button" class="btn btn-kecil btn-garis" data-ubah-materi="${esc(m.id)}">Edit</button><button type="button" class="btn btn-kecil btn-garis btn-hapus-teks" data-hapus-materi="${esc(m.id)}">Hapus</button></div>
      </article>`);
    const semua = [...tambahan, ...dasar];
    $('daftar-materi').innerHTML = semua.length ? semua.join('') : '<div class="kosong-kartu">Tidak ada materi yang cocok dengan pencarian.</div>';
  }

  // ---------- Lagu ----------
  // ID video dari link YouTube (youtu.be/…, watch?v=…, shorts/…, embed/…) atau ID mentah.
  // '' = kosong, null = link tidak dikenali.
  function idYoutube(teks) {
    const t = String(teks || '').trim();
    if (!t) return '';
    const cocok = t.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{6,20})/);
    if (cocok) return cocok[1];
    return /^[A-Za-z0-9_-]{6,20}$/.test(t) ? t : null;
  }

  function laguTambahan() {
    return GURU_DATA.daftar(data.lagu).sort((a, b) => (a.dibuat || 0) - (b.dibuat || 0));
  }

  function renderLagu() {
    const cari = GURU_DATA.samakan($('cari-lagu').value);
    const jenis = (id) => (majasById(id) || {}).jenis || '-';
    const cocok = (l) => !cari || GURU_DATA.samakan([l.judul, l.penyanyi, jenis(l.majasId), l.kutipan].join(' ')).includes(cari);
    const kartu = (l, no, tambahan) => `
      <article class="kartu-isi">
        <span class="tag ${tambahan ? 'tag-pink' : ''}">Lagu ${no} · ${tambahan ? 'Lagu guru' : 'Lagu dasar'}</span>
        <h3>${esc(l.judul)}</h3>
        <p class="kecil">${esc(l.penyanyi)} · Majas <b>${esc(jenis(l.majasId))}</b>${l.youtubeId ? ' · ▶ YouTube' : ''}</p>
        <p class="isi-panjang"><i>“${esc(l.kutipan)}”</i></p>
        <p class="kecil isi-panjang"><b>Makna:</b> ${esc(l.makna)}</p>
        ${tambahan ? `<div class="aksi"><button type="button" class="btn btn-kecil btn-garis" data-ubah-lagu="${esc(l.id)}">Edit</button><button type="button" class="btn btn-kecil btn-garis btn-hapus-teks" data-hapus-lagu="${esc(l.id)}">Hapus</button></div>` : ''}
      </article>`;
    const dasar = LAGU.slice(0, JUMLAH_LAGU_DASAR);
    const tambahan = laguTambahan();
    const semua = [
      ...tambahan.map((l, i) => cocok(l) && kartu(l, JUMLAH_LAGU_DASAR + i + 1, true)),
      ...dasar.map((l, i) => cocok(l) && kartu(l, i + 1, false)),
    ].filter(Boolean);
    $('daftar-lagu').innerHTML = semua.length ? semua.join('') : '<div class="kosong-kartu">Tidak ada lagu yang cocok dengan pencarian.</div>';
    const penuh = tambahan.length >= MAKS_LAGU_GURU;
    $('tambah-lagu').disabled = penuh;
    $('info-lagu').textContent = `${tambahan.length}/${MAKS_LAGU_GURU} lagu tambahan${penuh ? ' · batas tercapai, hapus lagu lama untuk menambah yang baru' : ''}.`;
  }

  // ---------- Akun ----------
  function isiFormProfil() {
    const p = profil();
    $('profil-nama').value = p.nama || '';
    $('profil-email').value = p.email || '';
    $('profil-sekolah').value = p.sekolah || '';
    $('profil-mapel').value = p.mapel || '';
    $('profil-bio').value = p.bio || '';
    profilDiubah = false;
  }

  function renderAkun() {
    const nama = namaTampil();
    const p = profil();
    [$('portal-avatar'), $('akun-avatar')].forEach((e) => { e.textContent = inisial(nama); });
    $('portal-nama').textContent = nama;
    $('akun-nama').textContent = nama;
    $('akun-sekolah').textContent = p.sekolah || 'Lengkapi profil untuk mengenalkan diri kepada kelasmu.';
    $('akun-mapel').textContent = `👩‍🏫 Guru ${p.mapel || 'Bahasa Indonesia'}`;
    if (!profilDiubah) isiFormProfil();
  }

  async function simpanProfil(e) {
    e.preventDefault();
    const isi = {
      nama: $('profil-nama').value.trim(),
      email: $('profil-email').value.trim(),
      sekolah: $('profil-sekolah').value.trim(),
      mapel: $('profil-mapel').value.trim(),
      bio: $('profil-bio').value.trim(),
    };
    if (isi.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(isi.email)) {
      $('status-profil').textContent = 'Format email belum benar.';
      $('profil-email').focus();
      return;
    }
    try {
      await GURU_DATA.simpanProfil(isi);
      profilDiubah = false;
      $('status-profil').textContent = '✓ Profil tersimpan.';
    } catch (err) {
      $('status-profil').textContent = 'Gagal menyimpan. Periksa koneksi internet.';
    }
  }

  async function gantiSandi(e) {
    e.preventDefault();
    const status = $('status-sandi');
    const lama = $('sandi-lama').value;
    const baru = $('sandi-baru').value;
    if (!lama || !baru) { status.textContent = 'Isi password lama dan password baru.'; return; }
    if (baru.length < 6) { status.textContent = 'Password baru minimal 6 karakter.'; $('sandi-baru').focus(); return; }
    if (baru !== $('sandi-ulang').value) { status.textContent = 'Ulangi password baru belum sama.'; $('sandi-ulang').focus(); return; }
    if (baru === lama) { status.textContent = 'Password baru sama dengan password lama.'; return; }
    const tombol = $('ganti-sandi');
    tombol.disabled = true;
    status.textContent = 'Mengganti password…';
    try {
      await SESI.gantiPassword(lama, baru);
      e.target.reset();
      status.textContent = '✓ Password berhasil diganti. Pakai password baru saat masuk berikutnya.';
    } catch (err) {
      status.textContent = err.message;
    }
    tombol.disabled = false;
  }

  async function keluar() {
    if (!confirm('Keluar dari akun guru? Sesi yang sedang berjalan tetap berjalan dan bisa dibuka lagi setelah masuk.')) return;
    try { await SESI.keluarGuru(); } catch (e) { toast('Gagal keluar. Periksa koneksi internet.'); return; }
    location.replace('masuk.html?peran=guru');
  }

  function render(d) {
    data = d;
    renderDashboard();
    renderMateri();
    renderLagu();
    renderAkun();
  }

  // ---------- Mulai ----------
  function mulai() {
    document.body.classList.add('portal-siap');
    ['portal-menu', 'ringkasan-guru', 'field-pilih-kelas'].forEach((id) => { $(id).hidden = false; });
    $('stat-majas').textContent = MAJAS.length;
    document.querySelectorAll('.nama-login').forEach((e) => { e.textContent = SESI.namaGuru(); });
    document.querySelectorAll('.nama-login-isian').forEach((e) => { e.value = SESI.namaGuru(); });

    document.querySelectorAll('.portal-nav [data-menu]').forEach((b) => {
      b.addEventListener('click', () => pilihMenu(b.dataset.menu));
      b.addEventListener('keydown', navKeyboard);
    });
    document.addEventListener('click', (e) => {
      const ke = e.target.closest('[data-ke-menu]');
      if (ke) pilihMenu(ke.dataset.keMenu);
    });
    pilihMenu(location.hash.slice(1), false);

    $('pilih-kelas').addEventListener('change', terapkanKelas);

    // Materi
    $('cari-materi').addEventListener('input', renderMateri);
    // Form yang sama dipakai untuk materi baru dan edit; idUbah = materi yang sedang diedit.
    const formMateri = $('form-materi');
    let idUbah = null;
    const bukaFormMateri = (id) => {
      const m = id ? (data.materi || {})[id] : null;
      idUbah = m ? id : null;
      $('judul-form-materi').textContent = m ? 'Edit materi' : 'Materi baru';
      $('simpan-materi').textContent = m ? 'Simpan Perubahan' : 'Simpan Materi';
      $('materi-judul').value = m ? m.judul : '';
      $('materi-isi').value = m ? m.isi : '';
      formMateri.hidden = false;
      formMateri.scrollIntoView({ behavior: 'smooth', block: 'start' });
      $('materi-judul').focus();
    };
    const tutupFormMateri = () => { formMateri.reset(); formMateri.hidden = true; idUbah = null; };
    $('tambah-materi').addEventListener('click', () => bukaFormMateri(null));
    formMateri.querySelector('[data-batal]').addEventListener('click', tutupFormMateri);
    formMateri.addEventListener('submit', async (e) => {
      e.preventDefault();
      const judul = $('materi-judul').value.trim();
      const isi = $('materi-isi').value.trim();
      if (!judul) { toast('Judul materi belum diisi.'); $('materi-judul').focus(); return; }
      if (!isi) { toast('Isi materi belum diisi.'); $('materi-isi').focus(); return; }
      try {
        if (idUbah) await GURU_DATA.ubahMateri(idUbah, judul, isi);
        else await GURU_DATA.tambahMateri(judul, isi);
        tutupFormMateri();
        toast('Materi tersimpan dan tampil di halaman Materi siswa yang mengikuti sesimu.');
      } catch (err) { toast('Gagal menyimpan materi.'); }
    });
    $('daftar-materi').addEventListener('click', async (e) => {
      const ubah = e.target.closest('[data-ubah-materi]');
      if (ubah) { bukaFormMateri(ubah.dataset.ubahMateri); return; }
      const b = e.target.closest('[data-hapus-materi]');
      if (!b) return;
      const m = (data.materi || {})[b.dataset.hapusMateri];
      if (!m || !confirm(`Hapus materi "${m.judul}"?`)) return;
      try {
        await GURU_DATA.hapusMateri(b.dataset.hapusMateri);
        if (idUbah === b.dataset.hapusMateri) tutupFormMateri();
      } catch (err) { toast('Gagal menghapus materi.'); }
    });

    // Lagu: form yang sama untuk lagu baru dan edit; idUbahLagu = lagu yang sedang diedit.
    $('lagu-majas').innerHTML = '<option value="">– Pilih jenis majas –</option>'
      + MAJAS.map((m) => `<option value="${m.id}">${esc(m.jenis)}</option>`).join('');
    $('cari-lagu').addEventListener('input', renderLagu);
    const formLagu = $('form-lagu');
    let idUbahLagu = null;
    const bukaFormLagu = (id) => {
      const l = id ? (data.lagu || {})[id] : null;
      idUbahLagu = l ? id : null;
      $('judul-form-lagu').textContent = l ? 'Edit lagu' : 'Lagu baru';
      $('simpan-lagu').textContent = l ? 'Simpan Perubahan' : 'Simpan Lagu';
      $('lagu-judul').value = l ? l.judul : '';
      $('lagu-penyanyi').value = l ? l.penyanyi : '';
      $('lagu-youtube').value = l && l.youtubeId ? `https://www.youtube.com/watch?v=${l.youtubeId}` : '';
      $('lagu-kutipan').value = l ? l.kutipan : '';
      $('lagu-majas').value = l ? l.majasId : '';
      $('lagu-makna').value = l ? l.makna : '';
      formLagu.hidden = false;
      formLagu.scrollIntoView({ behavior: 'smooth', block: 'start' });
      $('lagu-judul').focus();
    };
    const tutupFormLagu = () => { formLagu.reset(); formLagu.hidden = true; idUbahLagu = null; };
    $('tambah-lagu').addEventListener('click', () => bukaFormLagu(null));
    formLagu.querySelector('[data-batal]').addEventListener('click', tutupFormLagu);
    formLagu.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nilai = (id) => $(id).value.trim();
      const wajib = [['lagu-judul', 'Judul lagu'], ['lagu-penyanyi', 'Penyanyi'], ['lagu-kutipan', 'Kutipan lirik'], ['lagu-majas', 'Jenis majas'], ['lagu-makna', 'Makna lirik']];
      const kosong = wajib.find(([id]) => !nilai(id));
      if (kosong) { toast(`${kosong[1]} belum diisi.`); $(kosong[0]).focus(); return; }
      const youtubeId = idYoutube(nilai('lagu-youtube'));
      if (youtubeId === null) { toast('Link YouTube tidak dikenali. Salin link dari tombol Bagikan di YouTube.'); $('lagu-youtube').focus(); return; }
      if (!idUbahLagu && laguTambahan().length >= MAKS_LAGU_GURU) { toast(`Maksimal ${MAKS_LAGU_GURU} lagu tambahan.`); return; }
      const lagu = {
        judul: nilai('lagu-judul'), penyanyi: nilai('lagu-penyanyi'), kutipan: nilai('lagu-kutipan'),
        majasId: nilai('lagu-majas'), makna: nilai('lagu-makna'), youtubeId,
      };
      try {
        if (idUbahLagu) await GURU_DATA.ubahLagu(idUbahLagu, lagu);
        else await GURU_DATA.tambahLagu(lagu);
        tutupFormLagu();
        toast('Lagu tersimpan dan tampil di Daftar Lagu siswa yang mengikuti sesimu.');
      } catch (err) { toast('Gagal menyimpan lagu.'); }
    });
    $('daftar-lagu').addEventListener('click', async (e) => {
      const ubah = e.target.closest('[data-ubah-lagu]');
      if (ubah) { bukaFormLagu(ubah.dataset.ubahLagu); return; }
      const b = e.target.closest('[data-hapus-lagu]');
      if (!b) return;
      const l = (data.lagu || {})[b.dataset.hapusLagu];
      if (!l || !confirm(`Hapus lagu "${l.judul}"? Lagu ini juga hilang dari Daftar Lagu siswa.`)) return;
      try {
        await GURU_DATA.hapusLagu(b.dataset.hapusLagu);
        if (idUbahLagu === b.dataset.hapusLagu) tutupFormLagu();
      } catch (err) { toast('Gagal menghapus lagu.'); }
    });

    // Akun
    $('form-profil').addEventListener('input', () => { profilDiubah = true; $('status-profil').textContent = ''; });
    $('form-profil').addEventListener('submit', simpanProfil);
    $('batal-profil').addEventListener('click', () => { isiFormProfil(); $('status-profil').textContent = 'Perubahan dibatalkan.'; });
    $('form-sandi').addEventListener('submit', gantiSandi);
    $('keluar-akun').addEventListener('click', keluar);

    KELAS.mulai();
    GURU_DATA.pantau(render);
  }

  return { mulai, pilihMenu, pakaiKelas, keluar };
})();
