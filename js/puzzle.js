// Papan Puzzle: cocokkan jenis majas, penjelasan, kutipan lirik, dan makna lirik.

cekTim(document.getElementById('banner-tim'));

const KOLOM = [
  { tipe: 'jenis', label: 'Jenis Majas' },
  { tipe: 'penjelasan', label: 'Penjelasan Majas' },
  { tipe: 'kutipan', label: 'Kutipan Lirik' },
  { tipe: 'makna', label: 'Makna Lirik' },
];
const POIN_BENAR = 10;
const PENALTI_SALAH = 2;

const TAB = [{ id: 'semua', label: 'Semua' }, ...KOLOM.map((k) => ({ id: k.tipe, label: k.label.split(' ')[0] }))];

const papan = document.getElementById('papan');
const baki = document.getElementById('baki');
const bakiWrap = document.getElementById('baki-wrap');
const bakiTab = document.getElementById('baki-tab');
const tombolKembali = document.getElementById('baki-kembali');
const arena = document.getElementById('arena');
const waktuEl = document.getElementById('waktu');
const modal = document.getElementById('modal');
const layarHP = matchMedia('(max-width: 760px)');

let sisa = 0;
let timer = null;
let berjalan = false;
let totalKeping = 0;
let salahTotal = 0;
let dipilih = null;
let seret = null;

function formatWaktu(detik) {
  const m = Math.floor(detik / 60);
  const s = detik % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function renderIntro() {
  const state = loadState();
  document.getElementById('info-waktu').textContent =
    `⏱️ Waktu bermain: ${Math.round(PENGATURAN.waktuPuzzleDetik / 60)} menit · ${jumlahBarisTersedia()} baris majas.`;
  document.getElementById('hasil-lalu').textContent = state.puzzle
    ? `🏆 Hasil terakhir: ${state.puzzle.skor} poin (${state.puzzle.benar}/${state.puzzle.total} kepingan benar).`
    : '';
}

function jumlahBarisTersedia() {
  const jenis = new Set(daftarLaguSiap().map((l) => l.majasId));
  return Math.min(PENGATURAN.jumlahBarisPuzzle, jenis.size);
}

function labelTipe(tipe) {
  return KOLOM.find((k) => k.tipe === tipe).label;
}

// ---------- Mulai permainan ----------
function mulai() {
  // Hanya lagu yang kutipan & majasnya sudah diisi; satu baris = satu jenis majas.
  const laguSiapList = daftarLaguSiap();
  const tersedia = MAJAS.filter((m) => laguSiapList.some((l) => l.majasId === m.id));
  if (!tersedia.length) {
    toast('Belum ada lagu dengan kutipan lirik. Guru perlu mengisinya di js/data.js.');
    return;
  }
  const jumlahBaris = Math.min(PENGATURAN.jumlahBarisPuzzle, tersedia.length);
  const terpilih = acak(tersedia).slice(0, jumlahBaris);

  const kepingan = [];
  terpilih.forEach((m) => {
    const l = acak(laguSiapList.filter((x) => x.majasId === m.id))[0];
    kepingan.push(
      { tipe: 'jenis', majas: m.id, teks: m.jenis },
      { tipe: 'penjelasan', majas: m.id, teks: m.penjelasan },
      { tipe: 'kutipan', majas: m.id, teks: `“${l.kutipan}”` },
      { tipe: 'makna', majas: m.id, teks: l.makna },
    );
  });

  papan.innerHTML = terpilih.map((_, i) => `<div class="papan-baris" data-baris="Baris ${i + 1}">${KOLOM.map((k) =>
    `<div class="slot" data-tipe="${k.tipe}" data-label="${k.label}"></div>`).join('')}</div>`).join('');
  baki.innerHTML = acak(kepingan).map((k) =>
    `<div class="keping-puzzle" data-tipe="${k.tipe}" data-majas="${k.majas}">${esc(k.teks)}</div>`).join('');

  totalKeping = kepingan.length;
  salahTotal = 0;
  sisa = PENGATURAN.waktuPuzzleDetik;
  dipilih = null;
  berjalan = true;

  const peran = loadState().peran || {};
  document.getElementById('info-peran').textContent = peran.puzzle ? `🧩 Penyusun puzzle: ${peran.puzzle}` : '';
  document.getElementById('hitung-total').textContent = totalKeping;
  updateHitung();
  renderWaktu();

  document.getElementById('intro').hidden = true;
  document.getElementById('periksa').disabled = false;
  document.getElementById('selesai').disabled = false;
  document.body.classList.add('bermain');
  setTab(layarHP.matches ? 'jenis' : 'semua');
  arena.hidden = false;
  modal.classList.remove('buka');
  clearInterval(timer);
  timer = setInterval(tik, 1000);
  arena.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function tik() {
  sisa = Math.max(0, sisa - 1);
  renderWaktu();
  if (sisa === 0) {
    toast('⏰ Waktu habis!');
    periksa(true);
    selesai();
  }
}

function renderWaktu() {
  waktuEl.textContent = formatWaktu(sisa);
  waktuEl.classList.toggle('kritis', sisa <= 30);
}

function updateHitung() {
  document.getElementById('hitung-benar').textContent = papan.querySelectorAll('.terkunci').length;
}

// ---------- Tab baki (saring kepingan per jenis) ----------
function hitungBaki(tab) {
  return baki.querySelectorAll(tab === 'semua' ? '.keping-puzzle' : `.keping-puzzle[data-tipe=${tab}]`).length;
}

function setTab(tab) {
  baki.dataset.tabAktif = tab;
  baki.scrollLeft = 0;
  renderTabBaki();
}

function renderTabBaki() {
  let aktif = baki.dataset.tabAktif;
  // Tab aktif sudah kosong → pindah ke tab yang masih punya kepingan.
  if (aktif !== 'semua' && !hitungBaki(aktif)) {
    const lain = KOLOM.find((k) => hitungBaki(k.tipe));
    if (lain) {
      aktif = lain.tipe;
      baki.dataset.tabAktif = aktif;
      baki.scrollLeft = 0;
    }
  }
  bakiTab.innerHTML = TAB.map((t) => {
    const n = hitungBaki(t.id);
    return `<button type="button" role="tab" class="tab ${t.id === aktif ? 'aktif' : ''} ${n ? '' : 'kosong'}"
      data-tab="${t.id}" aria-selected="${t.id === aktif}">${t.label} <b>${n}</b></button>`;
  }).join('');
}

new MutationObserver(renderTabBaki).observe(baki, { childList: true });
new ResizeObserver(() => document.body.style.setProperty('--tinggi-baki', `${bakiWrap.offsetHeight}px`)).observe(bakiWrap);

bakiTab.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab');
  if (btn) setTab(btn.dataset.tab);
});

tombolKembali.addEventListener('click', () => {
  if (!dipilih) return;
  const tipe = dipilih.dataset.tipe;
  taruh(dipilih, baki);
  if (baki.dataset.tabAktif !== 'semua') setTab(tipe);
});

// ---------- Memindahkan kepingan ----------
function tandaiCocok(kp) {
  papan.querySelectorAll(`.slot[data-tipe=${kp.dataset.tipe}]`).forEach((s) => {
    if (!s.firstElementChild) s.classList.add('cocok');
  });
}

function pilih(kp) {
  if (dipilih === kp) { batalPilih(); return; }
  batalPilih();
  dipilih = kp;
  kp.classList.add('dipilih');
  tandaiCocok(kp);
  tombolKembali.hidden = !kp.parentElement.classList.contains('slot');
}

function batalPilih() {
  if (dipilih) dipilih.classList.remove('dipilih');
  dipilih = null;
  papan.querySelectorAll('.slot.cocok').forEach((s) => s.classList.remove('cocok'));
  tombolKembali.hidden = true;
}

function tolak(slot, pesan) {
  slot.classList.remove('tolak');
  void slot.offsetWidth; // ulang animasi
  slot.classList.add('tolak');
  toast(pesan);
}

function taruh(kp, target) {
  if (target === baki) {
    baki.appendChild(kp);
    batalPilih();
    return;
  }
  if (target.dataset.tipe !== kp.dataset.tipe) {
    tolak(target, `Kotak ini untuk kepingan "${labelTipe(target.dataset.tipe)}".`);
    return;
  }
  const ada = target.querySelector('.keping-puzzle');
  if (ada === kp) { batalPilih(); return; }
  if (ada) {
    if (ada.classList.contains('terkunci')) { tolak(target, 'Kotak ini sudah terisi kepingan yang benar.'); return; }
    // Tukar posisi: kepingan lama pindah ke tempat asal kepingan baru.
    const asal = kp.parentElement;
    (asal.classList.contains('slot') ? asal : baki).appendChild(ada);
  }
  target.appendChild(kp);
  batalPilih();
}

function targetDi(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  return el.closest('#papan .slot') || el.closest('#baki');
}

function sorot(target) {
  document.querySelectorAll('.slot.sorot, .baki.sorot').forEach((el) => { if (el !== target) el.classList.remove('sorot'); });
  if (target) target.classList.add('sorot');
}

arena.addEventListener('pointerdown', (e) => {
  const kp = e.target.closest('.keping-puzzle');
  if (!kp || !berjalan || kp.classList.contains('terkunci') || e.button > 0) return;
  seret = { kp, x: e.clientX, y: e.clientY, gerak: false, hantu: null, dx: 0, dy: 0 };
});

document.addEventListener('pointermove', (e) => {
  if (!seret) return;
  if (!seret.gerak) {
    const gx = e.clientX - seret.x;
    const gy = e.clientY - seret.y;
    if (Math.hypot(gx, gy) < 6) return;
    // Di baki HP, geser ke samping = menggulir baki, bukan menyeret kepingan.
    if (e.pointerType === 'touch' && seret.kp.parentElement === baki && Math.abs(gx) > Math.abs(gy)) {
      seret = null;
      return;
    }
    const r = seret.kp.getBoundingClientRect();
    seret.gerak = true;
    seret.dx = seret.x - r.left;
    seret.dy = seret.y - r.top;
    seret.hantu = seret.kp.cloneNode(true);
    seret.hantu.classList.remove('dipilih');
    seret.hantu.classList.add('hantu');
    seret.hantu.style.width = `${r.width}px`;
    document.body.appendChild(seret.hantu);
    seret.kp.classList.add('diseret');
    batalPilih();
    tandaiCocok(seret.kp);
  }
  e.preventDefault();
  seret.px = e.clientX;
  seret.py = e.clientY;
  gerakHantu();
  if (!seret.gulir) seret.gulir = requestAnimationFrame(gulirOtomatis);
}, { passive: false });

function gerakHantu() {
  seret.hantu.style.left = `${seret.px - seret.dx}px`;
  seret.hantu.style.top = `${seret.py - seret.dy}px`;
  sorot(targetDi(seret.px, seret.py));
}

// Gulir halaman otomatis saat kepingan diseret ke tepi atas/bawah area papan.
// Di HP, area papan dibatasi bilah waktu (atas) dan baki yang menempel (bawah).
function gulirOtomatis() {
  if (!seret || !seret.gerak) return;
  const modeHP = layarHP.matches && document.body.classList.contains('bermain');
  const atas = modeHP ? document.querySelector('.puzzle-info').getBoundingClientRect().bottom : 0;
  const bawah = modeHP ? bakiWrap.getBoundingClientRect().top : innerHeight;
  const tepi = modeHP ? 60 : 90;
  let dy = 0;
  if (seret.py < atas + tepi) dy = -Math.ceil((atas + tepi - seret.py) / 6);
  else if (seret.py > bawah - tepi && seret.py < bawah) dy = Math.ceil((seret.py - (bawah - tepi)) / 6);
  if (dy) {
    scrollBy({ top: dy, behavior: 'instant' });
    gerakHantu();
  }
  seret.gulir = requestAnimationFrame(gulirOtomatis);
}

function akhiriSeret(e, batal) {
  if (!seret) return;
  const s = seret;
  seret = null;
  cancelAnimationFrame(s.gulir);
  if (s.gerak) {
    s.hantu.remove();
    s.kp.classList.remove('diseret');
    sorot(null);
    batalPilih();
    const t = !batal && targetDi(e.clientX, e.clientY);
    if (t) taruh(s.kp, t);
  } else if (!batal) {
    // Ketuk: jika sudah ada kepingan terpilih dan yang diketuk berada di kotak, tukar.
    if (dipilih && dipilih !== s.kp && s.kp.parentElement.classList.contains('slot')) taruh(dipilih, s.kp.parentElement);
    else pilih(s.kp);
  }
}
document.addEventListener('pointerup', (e) => akhiriSeret(e, false));
document.addEventListener('pointercancel', (e) => akhiriSeret(e, true));

// Ketuk kotak / baki setelah memilih kepingan.
arena.addEventListener('click', (e) => {
  if (!berjalan || e.target.closest('.keping-puzzle')) return;
  const t = e.target.closest('#papan .slot') || e.target.closest('#baki');
  if (!t) return;
  if (dipilih) { taruh(dipilih, t); return; }
  // Belum memilih kepingan: ketuk kotak kosong → baki menampilkan kepingan untuk kotak itu.
  if (t !== baki && !t.firstElementChild) {
    setTab(t.dataset.tipe);
    if (layarHP.matches) toast(`Pilih kepingan "${labelTipe(t.dataset.tipe)}" di baki bawah 👇`);
  }
});

// ---------- Periksa & selesai ----------
function periksa(diam) {
  if (!berjalan) return;
  batalPilih();
  let benarBaru = 0;
  let salah = 0;
  let tanpaKunci = false;
  papan.querySelectorAll('.papan-baris').forEach((baris) => {
    const kunci = baris.querySelector('.slot[data-tipe=jenis] .keping-puzzle');
    const majas = kunci && kunci.dataset.majas;
    baris.querySelectorAll('.slot .keping-puzzle:not(.terkunci)').forEach((kp) => {
      if (majas && kp.dataset.majas === majas) {
        kp.classList.add('terkunci');
        benarBaru++;
      } else {
        if (!majas) tanpaKunci = true;
        baki.appendChild(kp);
        salah++;
      }
    });
  });
  salahTotal += salah;
  updateHitung();

  if (papan.querySelectorAll('.terkunci').length === totalKeping) {
    selesai();
    return;
  }
  if (diam) return;
  if (!benarBaru && !salah) toast('Belum ada kepingan baru di papan.');
  else if (tanpaKunci) toast(`${benarBaru} benar, ${salah} kembali ke baki. Isi dulu kolom "Jenis Majas" sebagai kunci baris!`);
  else toast(`✔ ${benarBaru} kepingan benar, ✖ ${salah} kembali ke baki.`);
}

function selesai() {
  if (!berjalan) return;
  berjalan = false;
  clearInterval(timer);
  batalPilih();
  document.body.classList.remove('bermain');
  setTab('semua');
  document.querySelector('.toast')?.classList.remove('show');

  const benar = papan.querySelectorAll('.terkunci').length;
  const semua = benar === totalKeping;
  const bonus = semua ? Math.floor(sisa / 5) : 0;
  const skor = Math.max(0, benar * POIN_BENAR - salahTotal * PENALTI_SALAH) + bonus;

  updateState((s) => {
    s.puzzle = { skor, benar, total: totalKeping, sisaWaktu: sisa, salah: salahTotal, bonus };
  });
  tandaiSelesai('puzzle');

  document.getElementById('modal-ikon').textContent = semua ? '🏆' : '⏰';
  document.getElementById('modal-judul').textContent = semua ? 'Puzzle Selesai!' : 'Permainan Berakhir';
  document.getElementById('modal-skor').textContent = skor;
  document.getElementById('modal-benar').textContent = `${benar}/${totalKeping}`;
  document.getElementById('modal-waktu').textContent = formatWaktu(sisa);
  document.getElementById('modal-salah').textContent = salahTotal;
  modal.classList.add('buka');
  renderIntro();
  document.getElementById('periksa').disabled = true;
  document.getElementById('selesai').disabled = true;
  document.getElementById('mulai').textContent = '↻ Main lagi';
  document.getElementById('intro').hidden = false;
}

document.getElementById('mulai').addEventListener('click', mulai);
document.getElementById('main-lagi').addEventListener('click', mulai);
document.getElementById('periksa').addEventListener('click', () => periksa(false));
document.getElementById('selesai').addEventListener('click', () => {
  if (confirm('Akhiri permainan sekarang? Kepingan di papan akan diperiksa terlebih dahulu.')) {
    periksa(true);
    selesai();
  }
});
modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('buka'); });

renderIntro();
