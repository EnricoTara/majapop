// Dashboard Guru: buat sesi, tampilkan kode + QR, peringkat kelompok secara live.

const KUNCI_GURU = 'majapop-guru';
const el = (id) => document.getElementById(id);
const papanEl = el('papan-peringkat');

let kodeAktif = null;
let daftarTerakhir = [];
let infoTerakhir = null;
let lepasPantau = [];
let podiumUntuk = null; // kode sesi yang podiumnya sudah ditampilkan
let daftarDimuat = false; // daftar peserta sesi aktif sudah terbaca dari Firebase
let jawabanTerakhir = {}; // jawaban rinci per peserta (jawaban/<kode>)
let jawabanDimuat = false;
let nilaiUntuk = null; // kode sesi yang nilainya sudah dikirim ke kelas

function simpanSesiGuru(kode) {
  try { kode ? localStorage.setItem(KUNCI_GURU, kode) : localStorage.removeItem(KUNCI_GURU); } catch (e) { /* abaikan */ }
}

function sesiGuruTersimpan() {
  try { return localStorage.getItem(KUNCI_GURU); } catch (e) { return null; }
}

function linkGabung(kode) {
  return new URL(`masuk.html?kode=${kode}`, location.href).href;
}

function waktuRelatif(ms) {
  if (!ms) return '';
  const detik = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (detik < 10) return 'baru saja';
  if (detik < 60) return `${detik} dtk lalu`;
  const menit = Math.round(detik / 60);
  return menit < 60 ? `${menit} mnt lalu` : `${Math.round(menit / 60)} jam lalu`;
}

function individu() {
  return SESI.modeSesi(infoTerakhir) === 'individu';
}

// Sesi Cipta Majas: tanpa peringkat, kalimat dinilai guru dengan rubrik.
function majasSesi() {
  return sesiMajas(infoTerakhir);
}

// Skor rubrik & nilai majas satu peserta sesi aktif (null = belum dinilai).
function skorPeserta(id) {
  return GURU_DATA.rubrik(kodeAktif, id);
}

function nilaiMajasPeserta(id) {
  return nilaiMajas(skorPeserta(id), (jawabanTerakhir[id] || {}).ciptaan || []);
}

// Kata untuk peserta sesi: "siswa" (individu) atau "kelompok".
function peserta() {
  return individu() ? 'siswa' : 'kelompok';
}

function labelLangkah(k) {
  const l = daftarLangkah(infoTerakhir).find((x) => x.id === k.langkah);
  return l ? `${l.ikon} ${l.label}` : '🏁 Selesai';
}

// ---------- Tampilan ----------
function tampilkan(layar) {
  ['belum-aktif', 'gagal-hubung', 'layar-mulai', 'layar-sesi'].forEach((id) => { el(id).hidden = id !== layar; });
}

function menunggu() {
  return SESI.sedangMenunggu(infoTerakhir);
}

// Ruang tunggu: kartu nama peserta sesuai urutan bergabung.
function renderLobi(daftar) {
  const ada = new Set([...papanEl.querySelectorAll('.lobi-nama')].map((c) => c.dataset.id));
  const urut = daftar.slice().sort((a, b) => (a.diperbarui || 0) - (b.diperbarui || 0));
  papanEl.innerHTML = `<div class="lobi-grid lobi-guru">${urut.map((k) => `
    <span class="lobi-nama ${ada.has(k.id) ? '' : 'baru'}" data-id="${esc(k.id)}">${k.absen ? `<span class="no-absen">No. ${esc(k.absen)}</span>` : ''}${esc(k.tim)}</span>`).join('')}</div>`;
}

// Sesi sudah diakhiri (status sudah terbaca, bukan sekadar belum dimuat).
function berakhir() {
  return Boolean(infoTerakhir) && !infoTerakhir.aktif;
}

// Podium juara 1-2-3 saat sesi diakhiri, disusun 2 – 1 – 3 seperti podium sungguhan.
function renderPodium() {
  const podium = el('podium');
  const juara = daftarTerakhir.slice(0, 3);
  if (!berakhir() || !juara.length || majasSesi()) { podium.hidden = true; return; }
  if (podiumUntuk === kodeAktif && !podium.hidden) return; // animasi cukup sekali
  podiumUntuk = kodeAktif;
  const medali = ['🥇', '🥈', '🥉'];
  const kolom = [1, 0, 2].filter((i) => juara[i]).map((i) => {
    const k = juara[i];
    return `<div class="podium-kolom juara-${i + 1}">
      <div class="podium-info">
        <span class="podium-medali" aria-hidden="true">${medali[i]}</span>
        <span class="podium-nama">${k.absen ? `<span class="no-absen">No. ${esc(k.absen)}</span>` : ''}${esc(k.tim)}</span>
        <span class="podium-poin"><b>✔ ${k.totalBenar}</b> benar</span>
        <span class="podium-sub">✖ ${k.totalSalah} salah · ⏱ ${SESI.formatDurasi(k.durasi)}</span>
      </div>
      <div class="podium-balok"><span>${i + 1}</span></div>
    </div>`;
  }).join('');
  const reduksi = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const warna = ['#FFC93C', '#DB2777', '#5B21B6', '#0F766E', '#C2410C', '#ffffff'];
  const konfeti = reduksi ? '' : Array.from({ length: 30 }, () =>
    `<i style="left:${Math.random() * 100}%;background:${warna[Math.floor(Math.random() * warna.length)]};animation-delay:${(1.4 + Math.random() * 1.2).toFixed(2)}s;animation-duration:${(2.2 + Math.random() * 1.6).toFixed(2)}s;rotate:${Math.floor(Math.random() * 360)}deg"></i>`).join('');
  podium.innerHTML = `<div class="konfeti" aria-hidden="true">${konfeti}</div>
    <h2>🏆 Juara Sesi ${esc(kodeAktif)}</h2>
    <div class="podium-panggung">${kolom}</div>`;
  podium.hidden = false;
  podium.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

function renderPapan() {
  const daftar = daftarTerakhir;
  const tunggu = menunggu();
  renderPodium();
  const majas = majasSesi();
  el('judul-papan').textContent = tunggu ? 'Ruang tunggu' : majas ? 'Kalimat majas peserta' : berakhir() ? 'Peringkat akhir' : 'Peringkat';
  el('aturan-peringkat').hidden = tunggu || !daftar.length || majas;
  el('jumlah-kelompok').textContent = daftar.length ? `· ${daftar.length} ${peserta()}` : '';

  if (!daftar.length) {
    papanEl.innerHTML = `<div class="papan-kosong kartu"><span class="denyut">📡</span> Menunggu ${peserta()} bergabung dengan kode <b>${esc(kodeAktif)}</b>…</div>`;
    return;
  }
  if (tunggu) { renderLobi(daftar); return; }
  if (majas) { renderPapanMajas(daftar); return; }

  // FLIP: catat posisi lama agar perpindahan peringkat terlihat beranimasi.
  const posLama = {};
  papanEl.querySelectorAll('.peringkat-baris').forEach((b) => { posLama[b.dataset.id] = { top: b.getBoundingClientRect().top, benar: Number(b.dataset.benar) }; });

  const medali = ['🥇', '🥈', '🥉'];
  papanEl.innerHTML = daftar.map((k, i) => {
    const selesai = k.selesai || [];
    const segmen = LANGKAH_SOAL.map((l) => `<span class="seg ${selesai.includes(l.id) ? 'selesai' : l.id === k.langkah ? 'aktif' : ''}" title="${esc(l.label)}"></span>`).join('');
    const n = nilaiRinci(k);
    const detail = [
      `🎵 Lagu <b>${n.lagu}</b> (${k.benar || 0}/${k.totalLagu || daftarLaguSiap().length} · ✖${k.salahLagu || 0})`,
      k.puzzleBenar >= 0 ? `🧩 Puzzle <b>${n.puzzle}</b> (${k.puzzleBenar}/${k.puzzleTotal > 0 ? k.puzzleTotal : jumlahBarisTersedia() * 4} · ✖${k.puzzleSalah || 0})` : '🧩 Puzzle <b>0</b> (belum)',
      `⭐ Nilai pokok <b>${n.pokok}</b>`,
      `<span class="waktu-update" data-ms="${k.diperbarui || 0}">${waktuRelatif(k.diperbarui)}</span>`,
    ].join(' · ');
    return `<div class="peringkat-baris ${i < 3 ? 'top' + (i + 1) : ''}" data-id="${esc(k.id)}" data-benar="${k.totalBenar}">
      <div class="rank">${medali[i] || i + 1}</div>
      <div class="info">
        <div class="nama">${k.absen ? `<span class="no-absen">No. ${esc(k.absen)}</span>` : ''}${esc(k.tim)}${k.dikirim ? ' <span class="tanda-kirim">✅ Terkirim</span>' : ''}</div>
        <div class="langkah-bar" aria-label="${k.langkahKe} dari ${LANGKAH_SOAL.length} langkah">${segmen}</div>
        <div class="detail">${detail}</div>
        <button type="button" class="btn-jawaban" data-jawaban="${esc(k.id)}">📝 Lihat jawaban</button>
      </div>
      <div class="langkah-label">${labelLangkah(k)}</div>
      <div class="nilai"><b>✔ ${k.totalBenar}</b><span>benar</span><small>✖ ${k.totalSalah} · ⏱ ${SESI.formatDurasi(k.durasi)}</small></div>
    </div>`;
  }).join('');

  papanEl.querySelectorAll('.peringkat-baris').forEach((b) => {
    const lama = posLama[b.dataset.id];
    if (!lama) { b.classList.add('baru'); return; }
    const geser = lama.top - b.getBoundingClientRect().top;
    if (geser) {
      b.animate([{ transform: `translateY(${geser}px)` }, { transform: 'translateY(0)' }], { duration: 500, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    if (Number(b.dataset.benar) > lama.benar) b.classList.add('naik');
  });
}

// Sesi Cipta Majas: urutan bergabung, kalimat setiap peserta, nilai rubrik, dan tombol menilai.
function renderPapanMajas(daftar) {
  const urut = daftar.slice().sort((a, b) => (a.diperbarui || 0) - (b.diperbarui || 0));
  papanEl.innerHTML = urut.map((k, i) => {
    const ciptaan = (jawabanTerakhir[k.id] || {}).ciptaan || [];
    const skor = skorPeserta(k.id);
    const dinilai = ciptaan.filter((c, j) => skor && nilaiKalimat(skor[kunciKalimat(c, j)]) !== null).length;
    const nilai = nilaiMajasPeserta(k.id);
    const kalimat = ciptaan.length
      ? `<ol class="majas-kalimat">${ciptaan.map((c, j) => {
        const n = skor ? nilaiKalimat(skor[kunciKalimat(c, j)]) : null;
        return `<li><span class="jw-label">${esc((majasById(c.majasId) || {}).jenis || c.majasId)}</span> ${esc(c.kalimat)} <span class="jw-skor ${n === null ? 'belum' : ''}">${n === null ? 'belum dinilai' : Math.round(n)}</span></li>`;
      }).join('')}</ol>`
      : '<p class="kecil">Belum menulis kalimat majas.</p>';
    return `<div class="peringkat-baris baris-majas" data-id="${esc(k.id)}">
      <div class="rank">${i + 1}</div>
      <div class="info">
        <div class="nama">${k.absen ? `<span class="no-absen">No. ${esc(k.absen)}</span>` : ''}${esc(k.tim)}${k.dikirim ? ' <span class="tanda-kirim">✅ Terkirim</span>' : ''}</div>
        ${kalimat}
        <div class="detail">✍️ ${ciptaan.length} kalimat · ${dinilai}/${ciptaan.length} dinilai · <span class="waktu-update" data-ms="${k.diperbarui || 0}">${waktuRelatif(k.diperbarui)}</span></div>
        <button type="button" class="btn-jawaban" data-rubrik="${esc(k.id)}" ${ciptaan.length ? '' : 'disabled'}>✍️ Nilai kalimat</button>
      </div>
      <div class="nilai"><b>${nilai === null ? '–' : nilai}</b><span>nilai majas</span></div>
    </div>`;
  }).join('');
}

function renderStatus() {
  const aktif = Boolean(infoTerakhir && infoTerakhir.aktif);
  const tunggu = menunggu();
  el('status-sesi').textContent = !aktif ? '⏹ Sudah diakhiri' : tunggu ? '⏳ Ruang tunggu' : '● Berjalan';
  el('status-sesi').classList.toggle('berakhir', !aktif);
  el('status-sesi').classList.toggle('tunggu', tunggu);
  el('mulai-permainan').hidden = !tunggu;
  el('langkah-tunggu').hidden = !tunggu;
  el('akhiri-sesi').hidden = !aktif;
  el('sesi-baru').hidden = aktif;
  el('info-kelas').textContent = infoTerakhir && infoTerakhir.kelas ? `Kelas: ${infoTerakhir.kelas}` : '';
  el('mode-sesi').textContent = `${majasSesi() ? '✍️ Cipta Majas' : '🎵 Lagu & Puzzle'} · ${individu() ? '👤 Individu' : '👥 Kelompok'}`;
  el('isian-gabung').textContent = individu() ? 'nama dan no. absen (opsional)' : 'nama kelompok dan anggota';
  renderPapan();
}

function bukaSesi(kode) {
  lepasPantau.forEach((f) => f());
  kodeAktif = kode;
  simpanSesiGuru(kode);
  el('kode-besar').textContent = kode;
  el('kode-kecil').textContent = kode;
  const alamat = new URL('./', location.href);
  el('alamat-web').textContent = (alamat.host + alamat.pathname).replace(/\/$/, '');
  el('qr').innerHTML = '';
  if (window.QRCode) {
    new QRCode(el('qr'), { text: linkGabung(kode), width: 168, height: 168, colorDark: '#3B0F7A', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
  }
  el('qr').title = linkGabung(kode);
  tampilkan('layar-sesi');
  daftarTerakhir = [];
  infoTerakhir = null;
  podiumUntuk = null;
  daftarDimuat = false;
  jawabanTerakhir = {};
  jawabanDimuat = false;
  el('podium').hidden = true;
  renderPapan();
  lepasPantau = [
    SESI.pantauSesi(kode, (info) => { infoTerakhir = info; renderStatus(); simpanNilaiKeKelas(); }),
    SESI.pantauKelompok(kode, (daftar) => { daftarTerakhir = daftar; daftarDimuat = true; renderPapan(); simpanNilaiKeKelas(); }),
    SESI.pantauJawaban(kode, (jawaban) => {
      jawabanTerakhir = jawaban;
      jawabanDimuat = true;
      if (majasSesi()) renderPapan(); // kalimat majas tampil dari jawaban rinci
      simpanNilaiKeKelas();
    }),
  ];
}

// Sesi yang dibuat dari sebuah kelas: setelah diakhiri, nilai setiap peserta disimpan ke kelas itu
// (menu Kelas). Sekali per sesi; GURU_DATA juga menolak menyimpan dua kali.
async function simpanNilaiKeKelas() {
  if (!berakhir() || !infoTerakhir.kelasId || !daftarDimuat || !jawabanDimuat || nilaiUntuk === kodeAktif) return;
  nilaiUntuk = kodeAktif;
  try {
    const hasil = await GURU_DATA.simpanHasilSesi(kodeAktif, infoTerakhir, daftarTerakhir, jawabanTerakhir);
    if (hasil && hasil.jumlah) toast(`📊 Nilai ${hasil.jumlah} ${peserta()} tersimpan ke kelas ${hasil.kelas}.`);
  } catch (e) {
    nilaiUntuk = null;
    toast('Nilai belum tersimpan ke kelas. Buka lagi sesi ini saat koneksi lancar.');
  }
}

// ---------- Rekap CSV (dibuka di Excel) ----------
function unduhRekapMajas() {
  const indiv = individu();
  const identitas = indiv ? ['Nama siswa', 'No. absen', 'Kelas'] : ['Kelompok', 'Kelas', 'Anggota'];
  const baris = [['No.', ...identitas, 'Jumlah kalimat', 'Nilai majas', 'Jenis majas', 'Tema', 'Kalimat', 'Nilai kalimat', ...RUBRIK_MAJAS.map((r) => `${r.label} (${r.bobot}%)`), 'Status kirim']];
  const urut = daftarTerakhir.slice().sort((a, b) => (a.diperbarui || 0) - (b.diperbarui || 0));
  urut.forEach((k, i) => {
    const ciptaan = (jawabanTerakhir[k.id] || {}).ciptaan || [];
    const skor = skorPeserta(k.id) || {};
    const nilai = nilaiMajasPeserta(k.id);
    const kepala = [i + 1, ...(indiv ? [k.tim, k.absen || '', k.kelas] : [k.tim, k.kelas, (k.anggota || []).join(', ')]), ciptaan.length, nilai === null ? '' : nilai];
    const status = k.dikirim ? `Terkirim ${new Date(k.dikirim).toLocaleString('id-ID')}` : 'Belum menekan Kirim';
    if (!ciptaan.length) { baris.push([...kepala, '', '', '', '', ...RUBRIK_MAJAS.map(() => ''), status]); return; }
    // Satu baris per kalimat; identitas diulang agar mudah difilter di Excel.
    ciptaan.forEach((c, j) => {
      const s = skor[kunciKalimat(c, j)] || {};
      const n = nilaiKalimat(s);
      baris.push([...kepala, (majasById(c.majasId) || {}).jenis || c.majasId, c.tema || '', c.kalimat, n === null ? '' : Math.round(n), ...RUBRIK_MAJAS.map((r) => s[r.id] || ''), status]);
    });
  });
  unduhCsv(`majapop-cipta-majas-${kodeAktif}.csv`, baris);
}

function unduhRekap() {
  if (majasSesi()) { unduhRekapMajas(); return; }
  const indiv = individu();
  const identitas = indiv ? ['Nama siswa', 'No. absen', 'Kelas'] : ['Kelompok', 'Kelas', 'Anggota'];
  const baris = [['Peringkat', ...identitas, 'Langkah terakhir', 'Jumlah benar', 'Jumlah salah', 'Durasi mengerjakan', 'Poin', 'Majas benar', 'Tepat tebakan pertama', 'Skor puzzle', 'Kepingan puzzle benar', ...(indiv ? [] : ['Peran']), 'Tebakan majas', 'Makna lirik', 'Status kirim', 'Terakhir diperbarui']];
  daftarTerakhir.forEach((k, i) => {
    baris.push([
      i + 1, ...(indiv ? [k.tim, k.absen || '', k.kelas] : [k.tim, k.kelas, (k.anggota || []).join(', ')]), labelLangkah(k).replace(/^\S+\s/, ''),
      k.totalBenar, k.totalSalah, k.durasi ? SESI.formatDurasi(k.durasi) : '', k.poin,
      `${k.benar || 0}/${k.totalLagu || 0}`, k.pertama || 0, k.puzzle >= 0 ? k.puzzle : '', k.puzzleBenar >= 0 ? k.puzzleBenar : '',
      ...(indiv ? [] : [JAWABAN.teksPeran(jawabanTerakhir[k.id])]), JAWABAN.teksLagu(jawabanTerakhir[k.id]), JAWABAN.teksMakna(jawabanTerakhir[k.id]),
      k.dikirim ? `Terkirim ${new Date(k.dikirim).toLocaleString('id-ID')}` : 'Belum menekan Kirim',
      k.diperbarui ? new Date(k.diperbarui).toLocaleString('id-ID') : '',
    ]);
  });
  unduhCsv(`majapop-sesi-${indiv ? 'individu-' : ''}${kodeAktif}.csv`, baris);
}

// ---------- Tombol ----------
el('mulai-sesi').addEventListener('click', async () => {
  const namaKelas = el('nama-kelas').value.trim();
  // Kelas dari guru otomatis tercatat untuk semua siswa yang masuk dengan kode ini.
  if (!namaKelas) { toast('Isi kelas dulu sebelum membuat kode sesi.'); el('nama-kelas').focus(); return; }
  const tombol = el('mulai-sesi');
  tombol.disabled = true;
  tombol.textContent = 'Membuat sesi…';
  try {
    // Satu guru hanya boleh punya satu sesi aktif: buka lagi sesi yang masih berjalan.
    const lama = sesiGuruTersimpan();
    if (lama && await SESI.sesiMilikSaya(lama)) {
      const info = await SESI.infoSesi(lama);
      if (info && info.aktif) {
        toast(`Sesi ${lama} masih berjalan. Akhiri dulu sebelum membuat sesi baru.`);
        bukaSesi(lama);
        return;
      }
    }
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const aktivitas = document.querySelector('input[name="aktivitas"]:checked').value;
    const { kode, ruangTunggu } = await SESI.buatSesi(namaKelas, mode, el('pilih-kelas').value, aktivitas);
    bukaSesi(kode);
    if (!ruangTunggu) alert('Sesi dibuat tanpa ruang tunggu (siswa langsung mulai), karena aturan Firebase belum diperbarui. Publish ulang isi database.rules.json di Firebase Console → Realtime Database → Rules agar ruang tunggu aktif.');
  } catch (e) {
    alert(e.message || 'Gagal membuat sesi.');
  } finally {
    tombol.disabled = false;
    tombol.textContent = '▶ Buat Kode Sesi';
  }
});

el('mulai-permainan').addEventListener('click', async () => {
  if (!daftarTerakhir.length && !confirm(`Belum ada ${peserta()} yang bergabung. Tetap mulai sesi sekarang?`)) return;
  const tombol = el('mulai-permainan');
  tombol.disabled = true;
  try { await SESI.mulaiSesi(kodeAktif); toast('🚀 Sesi dimulai!'); } catch (e) { toast('Gagal memulai sesi.'); }
  tombol.disabled = false;
});

el('akhiri-sesi').addEventListener('click', async () => {
  if (!confirm(`Akhiri sesi ${kodeAktif}? ${individu() ? 'Siswa' : 'Kelompok'} tidak bisa mengirim progress lagi, tetapi peringkat tetap bisa dilihat dan diunduh.`)) return;
  try { await SESI.akhiriSesi(kodeAktif); toast('Sesi diakhiri.'); } catch (e) { toast('Gagal mengakhiri sesi.'); }
});

el('sesi-baru').addEventListener('click', () => {
  lepasPantau.forEach((f) => f());
  lepasPantau = [];
  simpanSesiGuru(null);
  kodeAktif = null;
  el('buka-lagi').hidden = true;
  tampilkan('layar-mulai');
});

el('unduh-csv').addEventListener('click', () => {
  if (!daftarTerakhir.length) { toast(`Belum ada ${peserta()} untuk direkap.`); return; }
  unduhRekap();
});

el('layar-penuh').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => {});
});
document.addEventListener('fullscreenchange', () => {
  document.body.classList.toggle('proyektor', Boolean(document.fullscreenElement));
  el('layar-penuh').textContent = document.fullscreenElement ? '✕ Keluar layar penuh' : '⛶ Layar penuh';
});

// Jawaban rinci peserta (tombol di setiap baris peringkat).
papanEl.addEventListener('click', (e) => {
  const r = e.target.closest('[data-rubrik]');
  if (r) {
    const k = daftarTerakhir.find((x) => x.id === r.dataset.rubrik);
    if (!k) return;
    const kode = kodeAktif;
    RUBRIK.buka({
      judul: `${k.absen ? `No. ${k.absen} · ` : ''}${k.tim}`,
      ciptaan: (jawabanTerakhir[k.id] || {}).ciptaan || [],
      skorAwal: skorPeserta(k.id) || {},
      onSimpan: (skor) => GURU_DATA.simpanRubrik(kode, k.id, skor),
    });
    return;
  }
  const b = e.target.closest('[data-jawaban]');
  if (!b) return;
  const k = daftarTerakhir.find((x) => x.id === b.dataset.jawaban);
  if (!k) return;
  JAWABAN.buka(`${k.absen ? `No. ${k.absen} · ` : ''}${k.tim}`, jawabanTerakhir[k.id], skorPeserta(k.id));
});

el('buka-lagi').addEventListener('click', () => bukaSesi(el('buka-lagi').dataset.kode));

el('coba-lagi').addEventListener('click', () => location.reload());

el('keluar-guru').addEventListener('click', PORTAL.keluar);

// Perbarui tulisan "x dtk lalu" tanpa menunggu data baru.
setInterval(() => {
  document.querySelectorAll('.waktu-update').forEach((s) => { s.textContent = waktuRelatif(Number(s.dataset.ms)); });
}, 5000);

// ---------- Mulai ----------
// Dashboard hanya untuk akun guru: yang belum login diarahkan ke halaman masuk.
// Isi halaman disembunyikan (body.cek-login) sampai status login terbaca.
(async () => {
  if (!SESI.aktif()) { tampilkan('belum-aktif'); document.body.classList.remove('cek-login'); return; }
  try {
    if (!(await SESI.guruMasuk())) { location.replace('masuk.html?peran=guru'); return; }
  } catch (e) {
    tampilkan('gagal-hubung');
    document.body.classList.remove('cek-login');
    return;
  }
  el('nama-guru').textContent = SESI.namaGuru();
  el('akun-guru').hidden = false;
  PORTAL.mulai();
  // Skor rubrik tersimpan di data guru: tampilkan nilai majas terbaru setelah guru menyimpan.
  GURU_DATA.pantau(() => { if (kodeAktif && majasSesi()) renderPapan(); });
  document.body.classList.remove('cek-login');
  tampilkan('layar-mulai');
  const tersimpan = sesiGuruTersimpan();
  if (!tersimpan) return;
  try {
    if (await SESI.sesiMilikSaya(tersimpan)) {
      const info = await SESI.infoSesi(tersimpan);
      if (info && info.aktif) { bukaSesi(tersimpan); return; }
      el('buka-lagi').textContent = `Lihat hasil sesi terakhir (${tersimpan})`;
      el('buka-lagi').dataset.kode = tersimpan;
      el('buka-lagi').hidden = false;
    }
  } catch (e) {
    toast('Tidak bisa terhubung ke Firebase. Periksa koneksi internet.');
  }
})();
