// Cipta Majas: pilih kepingan jenis majas lalu isi dengan kalimat majas buatan sendiri.

cekTim(document.getElementById('banner-tim'));

const pilihEl = document.getElementById('pilih-keping');
const form = document.getElementById('form-cipta');
const listEl = document.getElementById('ciptaan-list');
let majasDipilih = null;

pilihEl.innerHTML = MAJAS.map((m) =>
  `<button type="button" class="keping-puzzle" data-tipe="jenis" data-majas="${m.id}">${esc(m.jenis)}</button>`).join('');

pilihEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.keping-puzzle');
  if (!btn) return;
  majasDipilih = btn.dataset.majas;
  pilihEl.querySelectorAll('.keping-puzzle').forEach((b) => b.classList.toggle('dipilih', b === btn));
  const m = majasById(majasDipilih);
  document.getElementById('petunjuk-majas').innerHTML =
    `<strong>Majas ${esc(m.jenis)}:</strong> ${esc(m.penjelasan)}<br><span class="kecil">Contoh: <em>“${esc(m.contoh)}”</em></span>`;
  form.hidden = false;
  document.getElementById('kalimat').focus();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const kalimat = document.getElementById('kalimat').value.trim();
  if (!majasDipilih) { toast('Pilih kepingan jenis majas dulu.'); return; }
  if (kalimat.length < 5) { toast('Kalimat majasnya masih kosong atau terlalu pendek.'); return; }
  updateState((s) => {
    s.ciptaan.push({ id: Date.now(), majasId: majasDipilih, tema: document.getElementById('tema').value, kalimat });
  });
  tandaiSelesai('cipta');
  document.getElementById('kalimat').value = '';
  toast('🧩 Kepingan majas berhasil dipasang!');
  renderList();
});

listEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-hapus]');
  if (!btn) return;
  const id = Number(btn.dataset.hapus);
  updateState((s) => { s.ciptaan = s.ciptaan.filter((c) => c.id !== id); });
  renderList();
});

function renderList() {
  const { ciptaan } = loadState();
  listEl.innerHTML = ciptaan.length
    ? ciptaan.map((c) => `
      <div class="ciptaan">
        <div class="keping-puzzle" data-tipe="jenis">${esc(majasById(c.majasId)?.jenis || c.majasId)}</div>
        <div class="keping-puzzle kalimat" data-tipe="kalimat">
          <div>“${esc(c.kalimat)}”<br><span style="opacity:.8;font-size:.78rem">Tema: ${esc(c.tema)}</span></div>
        </div>
        <button type="button" class="btn-hapus" data-hapus="${c.id}" aria-label="Hapus">✕</button>
      </div>`).join('')
    : '<p class="kecil">Belum ada kepingan. Pilih jenis majas di atas, lalu tulis kalimatmu.</p>';
}

renderList();
