// Halaman Refleksi: roda putar berisi pertanyaan REFLEKSI (js/data.js).
// Jawaban disimpan di localStorage perangkat ini dan bisa diunduh sebagai .txt.

const KUNCI_REFLEKSI = 'majapop-refleksi';
const WARNA_RODA = ['#FFD3E6', '#E3D6FF', '#FFE9A8', '#C7EEE9', '#FFD6C2', '#D2DCFA', '#F1D0EE', '#E4ECB8'];
const $ = (id) => document.getElementById(id);
const kanvas = $('roda');
const ctx = kanvas.getContext('2d');
const jumlahSoal = REFLEKSI.length;
const besarIris = 360 / jumlahSoal;

let sudut = 0;
let terpakai = [];
let dipilih = null;
let berputar = false;
let catatan = muatCatatan();

function muatCatatan() {
  try {
    const data = JSON.parse(localStorage.getItem(KUNCI_REFLEKSI) || '[]');
    return Array.isArray(data) ? data.filter((r) => r && typeof r.tanya === 'string' && typeof r.jawab === 'string') : [];
  } catch (e) { return []; }
}

function simpanCatatan() {
  try { localStorage.setItem(KUNCI_REFLEKSI, JSON.stringify(catatan)); return true; } catch (e) { return false; }
}

function gambarRoda() {
  const iris = (2 * Math.PI) / jumlahSoal;
  ctx.clearRect(0, 0, 700, 700);
  REFLEKSI.forEach((r, i) => {
    const awal = -Math.PI / 2 + i * iris;
    const tengah = awal + iris / 2;
    ctx.beginPath();
    ctx.moveTo(350, 350);
    ctx.arc(350, 350, 340, awal, awal + iris);
    ctx.closePath();
    ctx.fillStyle = WARNA_RODA[i % WARNA_RODA.length];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Tulisan menghadap keluar; di separuh bawah dibalik agar tidak terbaca terbalik.
    ctx.save();
    ctx.translate(350 + 218 * Math.cos(tengah), 350 + 218 * Math.sin(tengah));
    ctx.rotate(tengah + Math.PI / 2);
    if (Math.cos(tengah + Math.PI / 2) < 0) ctx.rotate(Math.PI);
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.beginPath();
    ctx.arc(0, -43, 18, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#3B0F7A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 21px Poppins, system-ui, sans-serif';
    ctx.fillText(String(i + 1), 0, -43);
    ctx.font = '700 25px Poppins, system-ui, sans-serif';
    r.label.forEach((baris, j) => ctx.fillText(baris, 0, 2 + j * 30));
    ctx.restore();
  });
}

function renderRiwayat() {
  $('riwayat-refleksi').innerHTML = catatan.map((r) => `
    <li><strong>${esc(r.nama ? `${r.nama} · ` : '')}${esc(r.tanya)}</strong><p>${esc(r.jawab)}</p></li>`).join('');
  $('jumlah-refleksi').textContent = `(${catatan.length})`;
  $('kosong-refleksi').hidden = catatan.length > 0;
  $('btn-unduh').disabled = !catatan.length;
}

function renderProgres() {
  $('progres-refleksi').textContent = `${terpakai.length} dari ${jumlahSoal} pertanyaan sudah dibuka`;
}

// Kembali ke keadaan siap putar setelah jawaban disimpan atau dilewati.
function lepasPertanyaan() {
  const habis = terpakai.length === jumlahSoal;
  dipilih = null;
  $('jawab-refleksi').value = '';
  $('jawab-refleksi').disabled = true;
  $('btn-simpan').disabled = true;
  $('btn-lewati').disabled = true;
  $('btn-putar').disabled = habis;
  $('tanya-refleksi').textContent = habis ? 'Semua pertanyaan telah kamu jelajahi! 🎉' : 'Siap untuk pertanyaan berikutnya?';
  $('petunjuk-refleksi').textContent = habis
    ? 'Unduh jawabanmu atau mulai sesi baru untuk berefleksi lagi.'
    : 'Putar roda kembali untuk melanjutkan perjalananmu.';
}

$('btn-putar').addEventListener('click', () => {
  if (berputar || dipilih !== null) return;
  const tersedia = REFLEKSI.map((_, i) => i).filter((i) => !terpakai.includes(i));
  if (!tersedia.length) return;
  const acakAngka = new Uint32Array(1);
  crypto.getRandomValues(acakAngka);
  const i = tersedia[Math.floor((acakAngka[0] / 4294967296) * tersedia.length)];

  // Tengah irisan i berhenti tepat di bawah penunjuk (atas), setelah 5 putaran penuh.
  const target = (360 - (i + 0.5) * besarIris) % 360;
  sudut += 1800 + ((target - (sudut % 360) + 360) % 360);
  const kurangiGerak = matchMedia('(prefers-reduced-motion: reduce)').matches;
  berputar = true;
  $('btn-putar').disabled = true;
  $('status-refleksi').textContent = 'Roda sedang berputar…';
  kanvas.style.transition = kurangiGerak ? 'none' : 'transform 4s cubic-bezier(.12,.7,.12,1)';
  kanvas.style.transform = `rotate(${sudut}deg)`;

  setTimeout(() => {
    berputar = false;
    dipilih = i;
    terpakai.push(i);
    $('kategori-refleksi').textContent = REFLEKSI[i].kategori;
    $('tanya-refleksi').textContent = REFLEKSI[i].tanya;
    $('petunjuk-refleksi').textContent = 'Luangkan waktu untuk mengingat pengalamanmu. Tidak ada jawaban benar atau salah.';
    $('jawab-refleksi').disabled = false;
    $('btn-simpan').disabled = false;
    $('btn-lewati').disabled = false;
    $('status-refleksi').textContent = 'Pertanyaanmu siap dijawab.';
    renderProgres();
    $('jawab-refleksi').focus();
  }, kurangiGerak ? 50 : 4050);
});

$('btn-simpan').addEventListener('click', () => {
  const jawab = $('jawab-refleksi').value.trim();
  if (!jawab) {
    $('status-refleksi').textContent = 'Tulis jawabanmu terlebih dahulu.';
    $('jawab-refleksi').focus();
    return;
  }
  if (dipilih === null) return;
  catatan.push({ nama: $('nama-refleksi').value.trim(), tanya: REFLEKSI[dipilih].tanya, jawab });
  const tersimpan = simpanCatatan();
  renderRiwayat();
  lepasPertanyaan();
  $('status-refleksi').textContent = tersimpan
    ? 'Jawaban tersimpan. Terima kasih sudah berefleksi!'
    : 'Jawaban ada dalam sesi ini. Unduh sebelum menutup halaman.';
});

$('btn-lewati').addEventListener('click', () => {
  if ($('jawab-refleksi').value.trim() && !confirm('Lewati pertanyaan dan hapus jawaban yang belum disimpan?')) return;
  lepasPertanyaan();
  $('status-refleksi').textContent = 'Pertanyaan dilewati. Kamu bisa melanjutkan putaran.';
});

$('btn-unduh').addEventListener('click', () => {
  const isi = 'REFLEKSI MAJAPOP\n\n' + catatan.map((r, i) =>
    `${i + 1}. ${r.nama ? `Nama: ${r.nama}\n` : ''}${r.tanya}\nJawaban: ${r.jawab}`).join('\n\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([isi], { type: 'text/plain;charset=utf-8' }));
  a.download = 'Refleksi-MajaPOP.txt';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
});

$('btn-ulang').addEventListener('click', () => {
  if (berputar) return;
  if (!confirm('Mulai sesi baru? Jawaban tersimpan akan dihapus dari browser ini. Unduh terlebih dahulu jika diperlukan.')) return;
  catatan = [];
  try { localStorage.removeItem(KUNCI_REFLEKSI); } catch (e) { /* abaikan */ }
  terpakai = [];
  lepasPertanyaan();
  $('kategori-refleksi').textContent = 'Perjalanan Belajarku';
  $('status-refleksi').textContent = 'Sesi baru siap dimainkan.';
  renderProgres();
  renderRiwayat();
});

// Nama terisi otomatis dari data Masukkan Kode, tetap bisa diubah.
$('nama-refleksi').value = loadState().tim || '';
gambarRoda();
// Gambar ulang setelah Poppins selesai dimuat agar tulisan di roda memakai font yang sama.
if (document.fonts) document.fonts.ready.then(gambarRoda);
renderProgres();
renderRiwayat();
