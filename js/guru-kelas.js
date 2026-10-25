// ============================================================
// Menu Kelas di portal guru: kelola kelas, lalu Progres & Nilai per kelas
// (ringkasan, grafik batang rata-rata, grafik perkembangan, rekap, riwayat, CSV).
// Data dari GURU_DATA (js/guru-data.js). Nilai sesi masuk otomatis lewat js/guru.js.
// ============================================================

const KELAS = (() => {
  const $ = (id) => document.getElementById(id);
  const KUNCI_PILIHAN = 'majapop-guru-kelas';
  const LABEL = {
    siswa: { satu: 'siswa', judul: 'Siswa', rekap: 'Rekap Nilai Individu', batang: 'Perbandingan Nilai Siswa', jenisNilai: 'Nilai individu' },
    kelompok: { satu: 'kelompok', judul: 'Kelompok', rekap: 'Rekap Nilai Kelompok', batang: 'Perbandingan Nilai Kelompok', jenisNilai: 'Nilai kelompok' },
  };

  let pilihan = null;   // id kelas yang sedang dilihat progresnya
  let mode = 'siswa';   // 'siswa' (Individu) atau 'kelompok'
  let modeUntuk = null; // tab otomatis mengikuti jenis kelas setiap kali kelas lain dipilih
  const fokus = { siswa: null, kelompok: null }; // peserta yang riwayat & grafik garisnya ditampilkan

  try { pilihan = localStorage.getItem(KUNCI_PILIHAN); } catch (e) { /* abaikan */ }

  // ---------- Perhitungan ----------
  const urutPeserta = (a, b) => (a.absen || 100) - (b.absen || 100) || a.nama.localeCompare(b.nama, 'id');

  function pesertaList(k, jenis) {
    return GURU_DATA.daftar(k[jenis]).sort(urutPeserta);
  }

  // Nilai satu peserta, urut dari yang paling lama.
  function riwayat(k, jenis, id) {
    return GURU_DATA.daftar(k.nilai)
      .filter((n) => n.peserta === jenis && n.pesertaId === id)
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || (a.dibuat || 0) - (b.dibuat || 0));
  }

  function ringkas(r) {
    if (!r.length) return null;
    const akhir = r[r.length - 1].nilai;
    return {
      jumlah: r.length,
      rata: Math.round(r.reduce((s, n) => s + n.nilai, 0) / r.length),
      akhir,
      ubah: r.length > 1 ? akhir - r[r.length - 2].nilai : null,
    };
  }

  // Rata-rata semua catatan nilai satu jenis peserta (yang pesertanya masih terdaftar).
  function rataKelas(k, jenis) {
    const ada = k[jenis] || {};
    const n = GURU_DATA.daftar(k.nilai).filter((x) => x.peserta === jenis && ada[x.pesertaId]);
    return n.length ? { rata: Math.round(n.reduce((s, x) => s + x.nilai, 0) / n.length), jumlah: n.length } : null;
  }

  function namaKelompok(k, id) {
    return (k.kelompok && k.kelompok[id] && k.kelompok[id].nama) || '';
  }

  function anggota(k, kelompokId) {
    return pesertaList(k, 'siswa').filter((s) => s.kelompokId === kelompokId);
  }

  // "2026-10-14" → "14 Okt 2026" (dibaca sebagai tanggal lokal).
  function formatTanggal(t) {
    const [y, m, d] = t.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function labelNama(p) {
    return `${p.absen ? `<span class="no-absen">No. ${esc(p.absen)}</span>` : ''}${esc(p.nama)}`;
  }

  function kelasAktif() {
    return GURU_DATA.kelas(pilihan);
  }

  // Peserta fokus: pilihan terakhir jika masih ada; jika belum, nilai rata-rata tertinggi, lalu peserta pertama.
  function pesertaFokus(k) {
    const list = pesertaList(k, mode);
    const lama = list.find((p) => p.id === fokus[mode]);
    if (lama) return lama;
    const terbaik = list.map((p) => ({ p, r: ringkas(riwayat(k, mode, p.id)) })).filter((x) => x.r)
      .sort((a, b) => b.r.rata - a.r.rata)[0];
    const p = terbaik ? terbaik.p : list[0] || null;
    fokus[mode] = p ? p.id : null;
    return p;
  }

  // ---------- Daftar kelas ----------
  function renderDaftar(list) {
    $('daftar-kelas').innerHTML = list.length ? list.map((k) => {
      const nSiswa = Object.keys(k.siswa || {}).length;
      const nKelompok = Object.keys(k.kelompok || {}).length;
      const nNilai = Object.keys(k.nilai || {}).length;
      return `<article class="kartu-isi kartu-kelas${k.id === pilihan ? ' dipilih' : ''}">
        <span class="tag">${k.jenis === 'individu' ? '👤 Individu' : '👥 Kelompok'}</span>
        <h3>${esc(k.nama)}</h3>
        <p>${esc(k.catatan || 'Kelas siap dipakai untuk sesi MajaPOP.')}</p>
        <p class="kecil">🎓 ${nSiswa} siswa · 👥 ${nKelompok} kelompok · 📝 ${nNilai} nilai</p>
        <div class="aksi">
          <button type="button" class="btn btn-kecil" data-progres="${esc(k.id)}">📊 Lihat Progres</button>
          <button type="button" class="btn btn-kecil btn-garis" data-pakai="${esc(k.id)}">▶ Gunakan untuk Sesi</button>
          <button type="button" class="btn btn-kecil btn-garis btn-hapus-teks" data-hapus-kelas="${esc(k.id)}">Hapus</button>
        </div>
      </article>`;
    }).join('') : '<div class="kosong-kartu">Belum ada kelas. Tekan <b>＋ Tambah Kelas</b> untuk membuat kelas pertama.</div>';
  }

  // ---------- Progres ----------
  function stat(ikon, label, nilai, ket, nada) {
    return `<div class="stat-kartu nada-${nada}"><span class="stat-ikon" aria-hidden="true">${ikon}</span><span class="stat-label">${label}</span><b>${nilai}</b><span class="stat-ket">${ket}</span></div>`;
  }

  function renderStat(k) {
    const ri = rataKelas(k, 'siswa');
    const rk = rataKelas(k, 'kelompok');
    $('progres-stat').innerHTML = [
      stat('🎓', 'Jumlah siswa', Object.keys(k.siswa || {}).length, 'Terdaftar di kelas', 'ungu'),
      stat('👥', 'Jumlah kelompok', Object.keys(k.kelompok || {}).length, 'Terdaftar di kelas', 'pink'),
      stat('📘', 'Rata-rata individu', ri ? ri.rata : '–', ri ? `Dari ${ri.jumlah} catatan nilai` : 'Belum ada nilai', 'kuning'),
      stat('🏆', 'Rata-rata kelompok', rk ? rk.rata : '–', rk ? `Dari ${rk.jumlah} catatan nilai` : 'Belum ada nilai', 'toska'),
    ].join('');
  }

  function renderTab() {
    document.querySelectorAll('.tab-progres [data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    $('judul-batang').textContent = LABEL[mode].batang;
    $('judul-rekap').textContent = LABEL[mode].rekap;
  }

  // Grafik batang: satu seri (rata-rata per peserta), batang fokus disorot dan diberi label nilai.
  function renderBatang(k, f) {
    const semua = pesertaList(k, mode);
    const baris = semua.map((p) => ({ p, r: ringkas(riwayat(k, mode, p.id)) })).filter((x) => x.r)
      .sort((a, b) => b.r.rata - a.r.rata);
    const tanpa = semua.length - baris.length;
    if (!baris.length) {
      $('grafik-batang').innerHTML = `<div class="kosong-kartu">Belum ada nilai ${LABEL[mode].satu}. Akhiri sesi dari kelas ini atau tekan <b>＋ Catat Nilai</b>.</div>`;
      return;
    }
    $('grafik-batang').innerHTML = `
      <div class="grafik-batang">
        <div class="gb-sumbu" aria-hidden="true">${[100, 75, 50, 25, 0].map((v) => `<span style="--y:${v}">${v}</span>`).join('')}</div>
        <div class="gb-gulir">
          <div class="gb-plot" style="--n:${baris.length}">
            ${baris.map(({ p, r }) => `<button type="button" class="gb-kolom${f && p.id === f.id ? ' fokus' : ''}" data-fokus="${esc(p.id)}" style="--v:${r.rata}"
                aria-pressed="${Boolean(f && p.id === f.id)}" aria-label="${esc(p.nama)}: rata-rata ${r.rata} dari ${r.jumlah} penilaian">
                <span class="gb-batang"></span>
                <span class="gb-nilai">${r.rata}</span>
                <span class="gb-label">${esc(p.nama)}</span>
                <span class="gb-tip" aria-hidden="true"><b>${esc(p.nama)}</b>Rata-rata ${r.rata} · ${r.jumlah} penilaian</span>
              </button>`).join('')}
          </div>
        </div>
      </div>
      ${tanpa ? `<p class="kecil">${tanpa} ${LABEL[mode].satu} belum punya nilai.</p>` : ''}`;
  }

  // Grafik garis perkembangan nilai peserta fokus (SVG; titik bisa disentuh untuk melihat detailnya).
  function renderGaris(k, f) {
    const wadah = $('grafik-garis');
    $('garis-nama').textContent = f ? f.nama : '';
    if (!f) { wadah.innerHTML = `<div class="kosong-kartu">Belum ada ${LABEL[mode].satu} di kelas ini.</div>`; return; }
    const r = riwayat(k, mode, f.id);
    if (!r.length) { wadah.innerHTML = `<div class="kosong-kartu">Belum ada nilai untuk ${esc(f.nama)}.</div>`; return; }

    const W = 360, H = 200, KIRI = 34, KANAN = 18, ATAS = 18, BAWAH = 30;
    const x = (i) => (r.length === 1 ? (KIRI + W - KANAN) / 2 : KIRI + (i * (W - KANAN - KIRI)) / (r.length - 1));
    const y = (v) => ATAS + ((100 - v) / 100) * (H - ATAS - BAWAH);
    const grid = [0, 25, 50, 75, 100].map((v) => `
      <line class="gg-grid" x1="${KIRI}" x2="${W - KANAN}" y1="${y(v)}" y2="${y(v)}"/>
      <text class="gg-sumbu" x="${KIRI - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('');
    const garis = r.map((n, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(n.nilai).toFixed(1)}`).join(' ');
    const titik = r.map((n, i) => `
      <g class="gg-titik" tabindex="0" data-tip="${esc(`${formatTanggal(n.tanggal)} · ${n.aktivitas}: ${n.nilai}`)}"
         role="img" aria-label="${esc(`${formatTanggal(n.tanggal)}, ${n.aktivitas}: nilai ${n.nilai}`)}">
        <circle class="gg-hit" cx="${x(i)}" cy="${y(n.nilai)}" r="14"/>
        <circle class="gg-dot" cx="${x(i)}" cy="${y(n.nilai)}" r="5"/>
      </g>`).join('');
    const akhir = r.length - 1;
    const sisiAkhir = r.length === 1 ? 'middle' : 'end';
    const s = ringkas(r);
    wadah.innerHTML = `
      <div class="grafik-garis">
        <svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Perkembangan nilai ${esc(f.nama)}">
          ${grid}
          <path class="gg-garis" d="${garis}"/>
          ${titik}
          <text class="gg-nilai" x="${x(akhir) + (r.length === 1 ? 0 : 6)}" y="${y(r[akhir].nilai) - 12}" text-anchor="${sisiAkhir}">${r[akhir].nilai}</text>
          <text class="gg-sumbu" x="${x(0)}" y="${H - 8}" text-anchor="${r.length === 1 ? 'middle' : 'start'}">${esc(formatTanggal(r[0].tanggal))}</text>
          ${r.length > 1 ? `<text class="gg-sumbu" x="${x(akhir)}" y="${H - 8}" text-anchor="end">${esc(formatTanggal(r[akhir].tanggal))}</text>` : ''}
        </svg>
        <div class="gg-tooltip" role="status" hidden></div>
      </div>
      <p class="gg-ringkas"><span><b>${s.rata}</b> rata-rata · ${s.jumlah} penilaian</span><span>Terakhir: <b>${s.akhir}</b></span></p>`;
  }

  function tampilTip(g) {
    const wadah = g.closest('.grafik-garis');
    const tip = wadah.querySelector('.gg-tooltip');
    const dot = g.querySelector('.gg-dot').getBoundingClientRect();
    const box = wadah.getBoundingClientRect();
    tip.textContent = g.dataset.tip;
    tip.hidden = false;
    const kiri = Math.min(Math.max(dot.left + dot.width / 2 - box.left, tip.offsetWidth / 2), box.width - tip.offsetWidth / 2);
    tip.style.left = `${kiri}px`;
    tip.style.top = `${dot.top - box.top}px`;
  }

  function sembunyiTip(e) {
    const wadah = e.target.closest('.grafik-garis');
    if (wadah) wadah.querySelector('.gg-tooltip').hidden = true;
  }

  function ubahLabel(v) {
    if (v === null) return '<span class="ubah">–</span>';
    if (v > 0) return `<span class="ubah naik">▲ +${v}</span>`;
    if (v < 0) return `<span class="ubah turun">▼ ${v}</span>`;
    return '<span class="ubah">0</span>';
  }

  function renderTabel(k, f) {
    const list = pesertaList(k, mode);
    const kolom2 = mode === 'siswa' ? 'Kelompok' : 'Anggota';
    $('tabel-rekap').innerHTML = `
      <thead><tr><th scope="col">Nama ${LABEL[mode].satu}</th><th scope="col">${kolom2}</th><th scope="col">Penilaian</th><th scope="col">Rata-rata</th><th scope="col">Terakhir</th><th scope="col">Perubahan</th><th scope="col"><span class="sr-only">Aksi</span></th></tr></thead>
      <tbody>${list.length ? list.map((p) => {
        const s = ringkas(riwayat(k, mode, p.id));
        const ag = mode === 'kelompok' ? anggota(k, p.id) : [];
        const info = mode === 'siswa'
          ? esc(namaKelompok(k, p.kelompokId) || '–')
          : `<span title="${esc(ag.map((a) => a.nama).join(', '))}">${ag.length} siswa</span>`;
        return `<tr class="${f && p.id === f.id ? 'fokus' : ''}">
          <th scope="row"><button type="button" class="link-nama" data-fokus="${esc(p.id)}">${labelNama(p)}</button></th>
          <td>${info}</td>
          <td>${s ? s.jumlah : 0}</td>
          <td>${s ? `<span class="nilai-pil">${s.rata}</span>` : '–'}</td>
          <td>${s ? s.akhir : '–'}</td>
          <td>${s ? ubahLabel(s.ubah) : '–'}</td>
          <td><button type="button" class="btn-hapus-kecil" data-hapus-peserta="${esc(p.id)}" aria-label="Hapus ${esc(p.nama)}">Hapus</button></td>
        </tr>`;
      }).join('') : `<tr><td colspan="7" class="kosong-sel">Belum ada ${LABEL[mode].satu}. Tekan <b>＋ ${LABEL[mode].judul}</b>, atau buat sesi dari kelas ini: pesertanya otomatis terdaftar.</td></tr>`}</tbody>`;
  }

  function renderRiwayat(k, f) {
    const el = $('riwayat');
    if (!f) { el.innerHTML = ''; return; }
    const r = riwayat(k, mode, f.id).reverse();
    const kelompok = pesertaList(k, 'kelompok');
    const pengaturan = mode === 'siswa'
      ? `<label class="ubah-kelompok">Kelompok
          <select data-ubah-kelompok="${esc(f.id)}">
            <option value="">– Tanpa kelompok –</option>
            ${kelompok.map((g) => `<option value="${esc(g.id)}"${g.id === f.kelompokId ? ' selected' : ''}>${esc(g.nama)}</option>`).join('')}
          </select></label>`
      : `<p class="kecil">Anggota: ${esc(anggota(k, f.id).map((a) => a.nama).join(', ') || 'belum ada')}</p>`;
    el.innerHTML = `
      <div class="riwayat-kepala">
        <div><h4>Riwayat: ${labelNama(f)}</h4><p class="kecil">${LABEL[mode].jenisNilai} · urut terbaru</p></div>
        ${pengaturan}
      </div>
      ${r.length ? `<ul class="riwayat-list">${r.map((n) => `
        <li>
          <span class="rw-tgl">${esc(formatTanggal(n.tanggal))}</span>
          <span class="rw-akt"><b>${esc(n.aktivitas)}</b><small>${n.sumber === 'sesi' ? '📡 Otomatis dari sesi' : '✍️ Dicatat manual'}</small></span>
          <b class="rw-nilai">${n.nilai}</b>
          <button type="button" class="btn-hapus-kecil" data-hapus-nilai="${esc(n.id)}" aria-label="Hapus nilai ${esc(n.aktivitas)}">Hapus</button>
        </li>`).join('')}</ul>` : '<p class="kecil">Belum ada nilai.</p>'}`;
  }

  function render() {
    const list = GURU_DATA.kelasList();
    if (!list.some((k) => k.id === pilihan)) pilihan = list.length ? list[list.length - 1].id : null;
    renderDaftar(list);
    $('progres').hidden = !list.length;
    if (!list.length) { tutupForm(); return; }
    const select = $('progres-kelas');
    select.innerHTML = list.map((k) => `<option value="${esc(k.id)}">${esc(k.nama)} · ${k.jenis === 'individu' ? 'Individu' : 'Kelompok'}</option>`).join('');
    select.value = pilihan;
    const k = kelasAktif();
    if (modeUntuk !== pilihan) {
      mode = k.jenis === 'kelompok' ? 'kelompok' : 'siswa';
      modeUntuk = pilihan;
    }
    const f = pesertaFokus(k);
    renderStat(k);
    renderTab();
    renderBatang(k, f);
    renderGaris(k, f);
    renderTabel(k, f);
    renderRiwayat(k, f);
  }

  function pilihKelas(id) {
    pilihan = id;
    try { localStorage.setItem(KUNCI_PILIHAN, id); } catch (e) { /* abaikan */ }
    tutupForm();
    render();
  }

  // ---------- Form progres: tambah siswa / kelompok, catat nilai ----------
  function tutupForm() {
    const wadah = $('progres-form');
    wadah.hidden = true;
    wadah.innerHTML = '';
  }

  function bukaForm(jenis) {
    const k = kelasAktif();
    if (!k) return;
    const wadah = $('progres-form');
    const kelompok = pesertaList(k, 'kelompok');
    const opsiKelompok = `<option value="">– Tanpa kelompok –</option>${kelompok.map((g) => `<option value="${esc(g.id)}">${esc(g.nama)}</option>`).join('')}`;
    const tombol = (teks) => `<div class="aksi"><button type="submit" class="btn">${teks}</button><button type="button" class="btn btn-garis" data-batal>Batal</button></div>`;
    if (jenis === 'siswa') {
      wadah.innerHTML = `<form data-jenis="siswa" novalidate>
        <h3>Tambah siswa ke ${esc(k.nama)}</h3>
        <div class="field"><label for="f-siswa">Nama siswa <span class="kecil">(satu nama per baris)</span></label>
          <textarea id="f-siswa" maxlength="3000" placeholder="Ayu Lestari&#10;Budi Santoso"></textarea></div>
        <div class="field"><label for="f-siswa-kelompok">Masukkan ke kelompok <span class="kecil">(opsional)</span></label>
          <select id="f-siswa-kelompok">${opsiKelompok}</select></div>
        ${tombol('Simpan Siswa')}</form>`;
    } else if (jenis === 'kelompok') {
      wadah.innerHTML = `<form data-jenis="kelompok" novalidate>
        <h3>Tambah kelompok ke ${esc(k.nama)}</h3>
        <div class="field"><label for="f-kelompok">Nama kelompok</label>
          <input type="text" id="f-kelompok" maxlength="60" placeholder="Contoh: Tim Melodi"></div>
        ${tombol('Simpan Kelompok')}</form>`;
    } else {
      const peserta = pesertaList(k, mode);
      if (!peserta.length) { toast(`Tambah ${LABEL[mode].satu} dulu sebelum mencatat nilai.`); return; }
      const f = pesertaFokus(k);
      wadah.innerHTML = `<form data-jenis="nilai" novalidate>
        <h3>Catat nilai ${LABEL[mode].satu}</h3>
        <div class="dua-kolom">
          <div class="field"><label for="f-peserta">${LABEL[mode].judul}</label>
            <select id="f-peserta">${peserta.map((p) => `<option value="${esc(p.id)}"${f && p.id === f.id ? ' selected' : ''}>${p.absen ? `${esc(p.absen)}. ` : ''}${esc(p.nama)}</option>`).join('')}</select></div>
          <div class="field"><label for="f-tanggal">Tanggal</label>
            <input type="date" id="f-tanggal" value="${GURU_DATA.tanggal()}"></div>
          <div class="field"><label for="f-aktivitas">Aktivitas / sesi</label>
            <input type="text" id="f-aktivitas" maxlength="90" placeholder="Contoh: Latihan Majas 1"></div>
          <div class="field"><label for="f-nilai">Nilai (0–100)</label>
            <input type="number" id="f-nilai" min="0" max="100" step="1" inputmode="numeric" placeholder="85"></div>
        </div>
        ${tombol('Simpan Nilai')}</form>`;
    }
    wadah.hidden = false;
    const pertama = wadah.querySelector('textarea, input[type=text], select');
    if (pertama) pertama.focus();
  }

  async function kirimForm(e) {
    e.preventDefault();
    const form = e.target;
    const k = kelasAktif();
    if (!k) return;
    const nilaiDari = (id) => form.querySelector(`#${id}`).value.trim();
    try {
      if (form.dataset.jenis === 'siswa') {
        const nama = [...new Set(nilaiDari('f-siswa').split('\n').map((n) => n.trim().replace(/\s+/g, ' ').slice(0, 60)).filter(Boolean))];
        if (!nama.length) { toast('Tulis minimal satu nama siswa.'); return; }
        await GURU_DATA.tambahSiswa(k.id, nama, nilaiDari('f-siswa-kelompok'));
        toast(`${nama.length} siswa ditambahkan.`);
      } else if (form.dataset.jenis === 'kelompok') {
        const nama = nilaiDari('f-kelompok').replace(/\s+/g, ' ');
        if (!nama) { toast('Nama kelompok belum diisi.'); return; }
        if (pesertaList(k, 'kelompok').some((g) => GURU_DATA.samakan(g.nama) === GURU_DATA.samakan(nama))) { toast('Nama kelompok sudah ada.'); return; }
        await GURU_DATA.tambahKelompok(k.id, nama);
        toast(`Kelompok "${nama}" ditambahkan.`);
      } else {
        const tanggal = nilaiDari('f-tanggal');
        const aktivitas = nilaiDari('f-aktivitas');
        const teksNilai = nilaiDari('f-nilai');
        const nilai = Number(teksNilai);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) { toast('Tanggal belum diisi.'); return; }
        if (!aktivitas) { toast('Nama aktivitas belum diisi.'); form.querySelector('#f-aktivitas').focus(); return; }
        if (teksNilai === '' || !Number.isInteger(nilai) || nilai < 0 || nilai > 100) { toast('Nilai harus angka bulat 0–100.'); form.querySelector('#f-nilai').focus(); return; }
        const pesertaId = nilaiDari('f-peserta');
        await GURU_DATA.catatNilai(k.id, { peserta: mode, pesertaId, tanggal, aktivitas, nilai });
        fokus[mode] = pesertaId;
        toast('Nilai tersimpan.');
      }
      tutupForm();
    } catch (err) {
      toast('Gagal menyimpan. Periksa koneksi internet.');
    }
  }

  // ---------- CSV per kelas & tab ----------
  function unduh() {
    const k = kelasAktif();
    if (!k) return;
    const indiv = mode === 'siswa';
    const baris = [indiv
      ? ['Nama siswa', 'No. absen', 'Kelompok', 'Tanggal', 'Aktivitas', 'Nilai', 'Sumber']
      : ['Nama kelompok', 'Anggota', 'Tanggal', 'Aktivitas', 'Nilai', 'Sumber']];
    pesertaList(k, mode).forEach((p) => {
      const identitas = indiv
        ? [p.nama, p.absen || '', namaKelompok(k, p.kelompokId)]
        : [p.nama, anggota(k, p.id).map((a) => a.nama).join(', ')];
      riwayat(k, mode, p.id).forEach((n) => {
        baris.push([...identitas, n.tanggal, n.aktivitas, n.nilai, n.sumber === 'sesi' ? 'Sesi' : 'Manual']);
      });
    });
    if (baris.length === 1) { toast('Belum ada nilai untuk diunduh.'); return; }
    const slug = k.nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'kelas';
    unduhCsv(`majapop-nilai-${slug}-${indiv ? 'individu' : 'kelompok'}.csv`, baris);
  }

  // ---------- Mulai ----------
  function mulai() {
    // Tambah kelas
    const formKelas = $('form-kelas');
    $('tambah-kelas').addEventListener('click', () => { formKelas.hidden = false; $('kelas-nama').focus(); });
    formKelas.querySelector('[data-batal]').addEventListener('click', () => { formKelas.reset(); formKelas.hidden = true; });
    formKelas.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nama = $('kelas-nama').value.trim().replace(/\s+/g, ' ');
      if (!nama) { toast('Nama kelas belum diisi.'); $('kelas-nama').focus(); return; }
      if (GURU_DATA.kelasList().some((k) => GURU_DATA.samakan(k.nama) === GURU_DATA.samakan(nama))) { toast('Nama kelas sudah ada.'); return; }
      try {
        const id = await GURU_DATA.tambahKelas({ nama, jenis: $('kelas-jenis').value, catatan: $('kelas-catatan').value.trim() });
        formKelas.reset();
        formKelas.hidden = true;
        pilihKelas(id);
        toast(`Kelas "${nama}" dibuat.`);
      } catch (err) { toast('Gagal menyimpan kelas. Periksa koneksi internet.'); }
    });

    // Kartu kelas
    $('daftar-kelas').addEventListener('click', async (e) => {
      const progres = e.target.closest('[data-progres]');
      const pakai = e.target.closest('[data-pakai]');
      const hapus = e.target.closest('[data-hapus-kelas]');
      if (progres) {
        pilihKelas(progres.dataset.progres);
        $('progres').scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (pakai) {
        PORTAL.pakaiKelas(pakai.dataset.pakai);
      } else if (hapus) {
        const k = GURU_DATA.kelas(hapus.dataset.hapusKelas);
        if (!k || !confirm(`Hapus kelas "${k.nama}" beserta seluruh siswa, kelompok, dan nilainya? Tindakan ini tidak bisa dibatalkan.`)) return;
        try { await GURU_DATA.hapusKelas(k.id); toast('Kelas dihapus.'); } catch (err) { toast('Gagal menghapus kelas.'); }
      }
    });

    $('progres-kelas').addEventListener('change', (e) => pilihKelas(e.target.value));
    document.querySelectorAll('.tab-progres [data-mode]').forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.mode;
      tutupForm();
      render();
    }));
    document.querySelectorAll('.progres-alat [data-form]').forEach((b) => b.addEventListener('click', () => bukaForm(b.dataset.form)));
    $('progres-form').addEventListener('submit', kirimForm);
    $('progres-form').addEventListener('click', (e) => { if (e.target.closest('[data-batal]')) tutupForm(); });
    $('unduh-nilai').addEventListener('click', unduh);

    // Grafik, tabel & riwayat: pilih peserta, hapus, ubah kelompok.
    $('progres').addEventListener('click', async (e) => {
      const pilih = e.target.closest('[data-fokus]');
      const hapusPeserta = e.target.closest('[data-hapus-peserta]');
      const hapusNilai = e.target.closest('[data-hapus-nilai]');
      const titik = e.target.closest('.gg-titik');
      const k = kelasAktif();
      if (titik) { tampilTip(titik); return; }
      if (!k) return;
      if (pilih) {
        fokus[mode] = pilih.dataset.fokus;
        render();
        if (pilih.classList.contains('link-nama')) $('riwayat').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else if (hapusPeserta) {
        const p = (k[mode] || {})[hapusPeserta.dataset.hapusPeserta];
        if (!p || !confirm(`Hapus ${LABEL[mode].satu} "${p.nama}" beserta semua nilainya dari kelas ini?`)) return;
        try { await GURU_DATA.hapusPeserta(k.id, mode, hapusPeserta.dataset.hapusPeserta); } catch (err) { toast('Gagal menghapus.'); }
      } else if (hapusNilai) {
        const n = (k.nilai || {})[hapusNilai.dataset.hapusNilai];
        if (!n || !confirm(`Hapus nilai "${n.aktivitas}" (${n.nilai})?`)) return;
        try { await GURU_DATA.hapusNilai(k.id, hapusNilai.dataset.hapusNilai); } catch (err) { toast('Gagal menghapus nilai.'); }
      }
    });
    $('progres').addEventListener('change', async (e) => {
      const s = e.target.closest('[data-ubah-kelompok]');
      if (!s) return;
      try {
        await GURU_DATA.ubahKelompokSiswa(pilihan, s.dataset.ubahKelompok, s.value);
        toast('Kelompok siswa diperbarui.');
      } catch (err) { toast('Gagal mengubah kelompok.'); }
    });
    const grafik = $('grafik-garis');
    grafik.addEventListener('pointerover', (e) => { const g = e.target.closest('.gg-titik'); if (g) tampilTip(g); });
    grafik.addEventListener('pointerout', (e) => { if (e.target.closest('.gg-titik') && e.pointerType === 'mouse') sembunyiTip(e); });
    grafik.addEventListener('focusin', (e) => { const g = e.target.closest('.gg-titik'); if (g) tampilTip(g); });
    grafik.addEventListener('focusout', sembunyiTip);

    GURU_DATA.pantau(render);
  }

  return { mulai };
})();
