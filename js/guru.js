// Dashboard Guru: buat sesi, tampilkan kode + QR, peringkat kelompok secara live.

const KUNCI_GURU = 'majapop-guru';
const el = (id) => document.getElementById(id);
const papanEl = el('papan-peringkat');

let kodeAktif = null;
let daftarTerakhir = [];
let infoTerakhir = null;
let lepasPantau = [];
let podiumUntuk = null; // kode sesi yang podiumnya sudah ditampilkan

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

// Kata untuk peserta sesi: "siswa" (individu) atau "kelompok".
function peserta() {
  return individu() ? 'siswa' : 'kelompok';
}

function labelLangkah(k) {
  const l = LANGKAH.find((x) => x.id === k.langkah);
  return l ? `${l.ikon} ${l.label}` : '🏁 Selesai';
}

// ---------- Tampilan ----------
function tampilkan(layar) {
  ['belum-aktif', 'layar-mulai', 'layar-sesi'].forEach((id) => { el(id).hidden = id !== layar; });
}

function menunggu() {
  return SESI.sedangMenunggu(infoTerakhir);
}

// Ruang tunggu: kartu nama peserta sesuai urutan bergabung.
function renderLobi(daftar) {
  const ada = new Set([...papanEl.querySelectorAll('.lobi-nama')].map((c) => c.dataset.id));
  const urut = daftar.slice().sort((a, b) => (a.diperbarui || 0) - (b.diperbarui || 0));
  papanEl.innerHTML = `<div class="lobi-grid lobi-guru">${urut.map((k) => `
    <span class="lobi-nama ${ada.has(k.id) ? '' : 'baru'}" data-id="${esc(k.id)}">${k.absen ? `<span class="no-absen">No. ${esc(k.absen)}</span>` : ''}${esc(k.tim)}${k.kelas ? ` <span class="kecil">${esc(k.kelas)}</span>` : ''}</span>`).join('')}</div>`;
}

// Sesi sudah diakhiri (status sudah terbaca, bukan sekadar belum dimuat).
function berakhir() {
  return Boolean(infoTerakhir) && !infoTerakhir.aktif;
}

// Podium juara 1-2-3 saat sesi diakhiri, disusun 2 – 1 – 3 seperti podium sungguhan.
function renderPodium() {
  const podium = el('podium');
  const juara = daftarTerakhir.slice(0, 3);
  if (!berakhir() || !juara.length) { podium.hidden = true; return; }
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
  el('judul-papan').textContent = tunggu ? 'Ruang tunggu' : berakhir() ? 'Peringkat akhir' : 'Peringkat';
  el('aturan-peringkat').hidden = tunggu || !daftar.length;
  el('jumlah-kelompok').textContent = daftar.length ? `· ${daftar.length} ${peserta()}` : '';

  if (!daftar.length) {
    papanEl.innerHTML = `<div class="papan-kosong kartu"><span class="denyut">📡</span> Menunggu ${peserta()} bergabung dengan kode <b>${esc(kodeAktif)}</b>…</div>`;
    return;
  }
  if (tunggu) { renderLobi(daftar); return; }

  // FLIP: catat posisi lama agar perpindahan peringkat terlihat beranimasi.
  const posLama = {};
  papanEl.querySelectorAll('.peringkat-baris').forEach((b) => { posLama[b.dataset.id] = { top: b.getBoundingClientRect().top, benar: Number(b.dataset.benar) }; });

  const medali = ['🥇', '🥈', '🥉'];
  papanEl.innerHTML = daftar.map((k, i) => {
    const selesai = k.selesai || [];
    const segmen = LANGKAH.map((l) => `<span class="seg ${selesai.includes(l.id) ? 'selesai' : l.id === k.langkah ? 'aktif' : ''}" title="${esc(l.label)}"></span>`).join('');
    const detail = [
      `🔍 ${k.benar || 0}/${k.totalLagu || 0} majas`,
      k.puzzle >= 0 ? `🧩 ${k.puzzle} poin puzzle` : '🧩 belum',
      `✍️ ${k.cipta || 0} kalimat`,
      `⭐ ${k.poin} poin`,
      `<span class="waktu-update" data-ms="${k.diperbarui || 0}">${waktuRelatif(k.diperbarui)}</span>`,
    ].join(' · ');
    return `<div class="peringkat-baris ${i < 3 ? 'top' + (i + 1) : ''}" data-id="${esc(k.id)}" data-benar="${k.totalBenar}">
      <div class="rank">${medali[i] || i + 1}</div>
      <div class="info">
        <div class="nama">${k.absen ? `<span class="no-absen">No. ${esc(k.absen)}</span>` : ''}${esc(k.tim)}${k.kelas ? ` <span class="kecil">${esc(k.kelas)}</span>` : ''}</div>
        <div class="langkah-bar" aria-label="${k.langkahKe} dari ${LANGKAH.length} langkah">${segmen}</div>
        <div class="detail">${detail}</div>
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
  el('mode-sesi').textContent = individu() ? '👤 Sesi Individu' : '👥 Sesi Kelompok';
  el('isian-gabung').textContent = individu() ? 'nama, kelas, dan no. absen' : 'nama kelompok dan anggota';
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
  el('podium').hidden = true;
  renderPapan();
  lepasPantau = [
    SESI.pantauSesi(kode, (info) => { infoTerakhir = info; renderStatus(); }),
    SESI.pantauKelompok(kode, (daftar) => { daftarTerakhir = daftar; renderPapan(); }),
  ];
}

// ---------- Rekap CSV (dibuka di Excel) ----------
function unduhCsv() {
  const sel = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const indiv = individu();
  const identitas = indiv ? ['Nama siswa', 'No. absen', 'Kelas'] : ['Kelompok', 'Kelas', 'Anggota'];
  const baris = [['Peringkat', ...identitas, 'Langkah terakhir', 'Jumlah benar', 'Jumlah salah', 'Durasi mengerjakan', 'Poin', 'Majas benar', 'Tepat tebakan pertama', 'Skor puzzle', 'Kepingan puzzle benar', 'Jumlah majas buatan', 'Kalimat majas buatan', 'Terakhir diperbarui']];
  daftarTerakhir.forEach((k, i) => {
    baris.push([
      i + 1, ...(indiv ? [k.tim, k.absen || '', k.kelas] : [k.tim, k.kelas, (k.anggota || []).join(', ')]), labelLangkah(k).replace(/^\S+\s/, ''),
      k.totalBenar, k.totalSalah, k.durasi ? SESI.formatDurasi(k.durasi) : '', k.poin,
      `${k.benar || 0}/${k.totalLagu || 0}`, k.pertama || 0, k.puzzle >= 0 ? k.puzzle : '', k.puzzleBenar >= 0 ? k.puzzleBenar : '',
      k.cipta || 0, (k.kalimat || []).join(' | '), k.diperbarui ? new Date(k.diperbarui).toLocaleString('id-ID') : '',
    ]);
  });
  // BOM + titik koma agar langsung rapi di Excel berbahasa Indonesia.
  const csv = '﻿' + baris.map((r) => r.map(sel).join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `majapop-sesi-${indiv ? 'individu-' : ''}${kodeAktif}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

// ---------- Tombol ----------
el('mulai-sesi').addEventListener('click', async () => {
  const tombol = el('mulai-sesi');
  tombol.disabled = true;
  tombol.textContent = 'Membuat sesi…';
  try {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const { kode, ruangTunggu } = await SESI.buatSesi(el('nama-kelas').value.trim(), mode);
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
  unduhCsv();
});

el('layar-penuh').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => {});
});
document.addEventListener('fullscreenchange', () => {
  document.body.classList.toggle('proyektor', Boolean(document.fullscreenElement));
  el('layar-penuh').textContent = document.fullscreenElement ? '✕ Keluar layar penuh' : '⛶ Layar penuh';
});

el('buka-lagi').addEventListener('click', () => bukaSesi(el('buka-lagi').dataset.kode));

// Perbarui tulisan "x dtk lalu" tanpa menunggu data baru.
setInterval(() => {
  document.querySelectorAll('.waktu-update').forEach((s) => { s.textContent = waktuRelatif(Number(s.dataset.ms)); });
}, 5000);

// ---------- Mulai ----------
(async () => {
  if (!SESI.aktif()) { tampilkan('belum-aktif'); return; }
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
