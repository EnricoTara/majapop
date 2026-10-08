// ============================================================
// Sesi Kelas: progress live setiap kelompok ke dashboard guru (Firebase).
// Semua fungsi aman dipanggil walau Firebase belum diatur / sedang offline:
// permainan tetap berjalan secara lokal.
// ============================================================

const SESI = (() => {
  const VERSI_SDK = '12.19.0';
  const MAKS_CIPTA_DINILAI = 3;
  let janjiSiap = null;
  let db = null;
  let uid = null;
  let timerKirim = null;

  function konfigurasi() {
    // FIREBASE_CONFIG_UJI hanya dipakai saat pengujian otomatis.
    if (window.FIREBASE_CONFIG_UJI) return window.FIREBASE_CONFIG_UJI;
    return typeof FIREBASE_CONFIG !== 'undefined' ? FIREBASE_CONFIG : {};
  }

  function aktif() {
    const c = konfigurasi();
    return Boolean(c && c.databaseURL);
  }

  function muatSkrip(src) {
    return new Promise((ok, gagal) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = ok;
      s.onerror = () => gagal(new Error('Tidak bisa memuat Firebase. Periksa koneksi internet.'));
      document.head.appendChild(s);
    });
  }

  // Muat SDK (sekali), inisialisasi, lalu login anonim agar rules bisa mengenali perangkat.
  function siap() {
    if (!aktif()) return Promise.reject(new Error('Fitur sesi kelas belum diaktifkan.'));
    if (!janjiSiap) {
      janjiSiap = (async () => {
        if (!window.firebase || !firebase.database) {
          for (const modul of ['app', 'auth', 'database']) {
            await muatSkrip(`https://www.gstatic.com/firebasejs/${VERSI_SDK}/firebase-${modul}-compat.js`);
          }
        }
        if (!firebase.apps.length) firebase.initializeApp(konfigurasi());
        const auth = firebase.auth();
        db = firebase.database();
        const emu = window.FIREBASE_EMULATOR_UJI; // hanya untuk pengujian otomatis
        if (emu) {
          auth.useEmulator(`http://${emu.auth}`);
          const [host, port] = emu.db.split(':');
          db.useEmulator(host, Number(port));
        }
        const pengguna = await new Promise((ok) => {
          const lepas = auth.onAuthStateChanged((u) => { lepas(); ok(u); });
        });
        uid = (pengguna || (await auth.signInAnonymously()).user).uid;
        return db;
      })().catch((e) => { janjiSiap = null; throw e; });
    }
    return janjiSiap;
  }

  // ---------- Poin & langkah ----------
  function rincian(state) {
    const siapList = daftarLaguSiap();
    const d = (id) => state.lagu[id] || {};
    const benar = siapList.filter((l) => d(l.id).benar).length;
    const pertama = siapList.filter((l) => d(l.id).benar && d(l.id).percobaan === 1).length;
    const cipta = (state.ciptaan || []).length;
    const puzzle = state.puzzle ? state.puzzle.skor : null;
    const poin = benar * 10 + pertama * 5 + (puzzle || 0) + Math.min(cipta, MAKS_CIPTA_DINILAI) * 20;
    return { poin, benar, pertama, totalLagu: siapList.length, puzzle, puzzleBenar: state.puzzle ? state.puzzle.benar : null, cipta };
  }

  function hitungPoin(state) {
    return rincian(state).poin;
  }

  // ke = jumlah langkah yang sudah selesai (0–6); id = langkah pertama yang belum selesai.
  // Siswa bisa melompat lewat Menu, jadi setiap langkah dihitung sendiri-sendiri.
  function langkahSaatIni(state) {
    const selesai = LANGKAH.filter((l) => (state.selesai || []).includes(l.id)).map((l) => l.id);
    const berikut = LANGKAH.find((l) => !selesai.includes(l.id));
    return { ke: selesai.length, id: berikut ? berikut.id : 'selesai', selesai };
  }

  // Jenis sesi: 'kelompok' atau 'individu'. Sesi lama (tanpa mode) dianggap kelompok.
  function modeSesi(info) {
    return info && info.mode === 'individu' ? 'individu' : 'kelompok';
  }

  // Sesi baru menunggu di ruang tunggu sampai guru menekan Mulai.
  // Sesi lama (tanpa field menunggu) dianggap sudah berjalan.
  function sedangMenunggu(info) {
    return Boolean(info && info.aktif && info.menunggu === true);
  }

  // ---------- Guru ----------
  // Mengembalikan { kode, ruangTunggu }. ruangTunggu false jika rules di Firebase
  // belum mengenal field "menunggu": sesi tetap dibuat, tetapi langsung berjalan.
  async function buatSesi(namaKelas, mode) {
    await siap();
    let ruangTunggu = true;
    for (let i = 0; i < 15; i++) {
      const kode = String(1000 + Math.floor(Math.random() * 9000));
      const ref = db.ref(`sesi/${kode}`);
      const data = { guru: uid, aktif: true, kelas: String(namaKelas || '').slice(0, 40), dibuat: firebase.database.ServerValue.TIMESTAMP };
      // Sesi kelompok tidak perlu menyimpan mode (bawaannya kelompok), jadi tetap jalan dengan rules lama.
      if (modeSesi({ mode }) === 'individu') data.mode = 'individu';
      if (ruangTunggu) data.menunggu = true;
      try {
        // Rules menolak menimpa sesi yang sudah ada, jadi kode bentrok otomatis gagal.
        await ref.set(data);
        return { kode, ruangTunggu };
      } catch (e) {
        // Kode belum dipakai tetapi tetap ditolak: rules di Firebase belum diperbarui.
        if (!(await ref.get()).exists()) {
          if (!ruangTunggu) {
            throw new Error('Firebase menolak sesi ini. Publish ulang isi database.rules.json di Firebase Console → Realtime Database → Rules.');
          }
          ruangTunggu = false; // coba lagi tanpa ruang tunggu
        }
        // Kode sudah dipakai, coba kode lain.
      }
    }
    throw new Error('Gagal membuat sesi. Coba lagi.');
  }

  async function mulaiSesi(kode) {
    await siap();
    await db.ref(`sesi/${kode}`).update({ menunggu: false, mulai: firebase.database.ServerValue.TIMESTAMP });
  }

  async function akhiriSesi(kode) {
    await siap();
    await db.ref(`sesi/${kode}/aktif`).set(false);
  }

  // Apakah sesi ini dibuat dari perangkat (akun anonim) yang sedang dipakai?
  async function sesiMilikSaya(kode) {
    const info = await infoSesi(kode);
    return Boolean(info && info.guru === uid);
  }

  async function infoSesi(kode) {
    await siap();
    const snap = await db.ref(`sesi/${kode}`).get();
    return snap.exists() ? snap.val() : null;
  }

  function pantauSesi(kode, cb) {
    siap().then(() => db.ref(`sesi/${kode}`).on('value', (snap) => cb(snap.val())));
    return () => { if (db) db.ref(`sesi/${kode}`).off(); };
  }

  // ---------- Kelompok ----------
  async function gabung(kode) {
    if (!/^\d{4}$/.test(kode)) throw new Error('Kode sesi harus 4 angka.');
    await siap();
    const info = await infoSesi(kode);
    if (!info) throw new Error(`Sesi ${kode} tidak ditemukan. Periksa lagi kodenya.`);
    if (!info.aktif) throw new Error(`Sesi ${kode} sudah diakhiri guru.`);
    const lama = loadState().sesi;
    const kelompokId = lama && lama.kode === kode && lama.kelompokId ? lama.kelompokId : db.ref().push().key;
    return { kode, kelompokId, mode: modeSesi(info) };
  }

  function ringkasan(state) {
    const r = rincian(state);
    const l = langkahSaatIni(state);
    const absen = Number(state.absen);
    return {
      uid,
      mode: modeSesi(state.sesi),
      ...(absen >= 1 && absen <= 99 ? { absen } : {}),
      tim: String(state.tim || 'Tanpa nama').slice(0, 40),
      kelas: String(state.kelas || '').slice(0, 20),
      anggota: (state.anggota || []).slice(0, 10).map((a) => String(a).slice(0, 40)),
      langkah: l.id,
      langkahKe: l.ke,
      selesai: l.selesai,
      poin: r.poin,
      benar: r.benar,
      pertama: r.pertama,
      totalLagu: r.totalLagu,
      puzzle: r.puzzle === null ? -1 : r.puzzle,
      puzzleBenar: r.puzzleBenar === null ? -1 : r.puzzleBenar,
      cipta: r.cipta,
      kalimat: (state.ciptaan || []).slice(0, 5).map((c) => `[${(majasById(c.majasId) || {}).jenis || c.majasId}] ${String(c.kalimat).slice(0, 300)}`),
      diperbarui: firebase.database.ServerValue.TIMESTAMP,
    };
  }

  async function kirim() {
    try {
      await siap();
      const s = loadState();
      if (!s.sesi || !s.sesi.kode) return;
      await db.ref(`sesi/${s.sesi.kode}/kelompok/${s.sesi.kelompokId}`).set(ringkasan(s));
    } catch (e) {
      // Sesi sudah diakhiri / offline: permainan tetap lanjut secara lokal.
    }
  }

  // Dipanggil setiap state disimpan; dikirim dengan jeda agar tidak terlalu sering.
  function kirimProgress(state) {
    if (!state.sesi || !state.sesi.kode || !aktif()) return;
    clearTimeout(timerKirim);
    timerKirim = setTimeout(kirim, 600);
  }

  // Kirim sekarang juga (maks. 4 detik menunggu), misalnya sebelum pindah halaman.
  function kirimSegera() {
    clearTimeout(timerKirim);
    return Promise.race([kirim(), new Promise((ok) => setTimeout(ok, 4000))]);
  }

  function urutkan(kelompok) {
    return Object.entries(kelompok || {})
      .map(([id, k]) => ({ id, ...k }))
      .sort((a, b) => (b.poin - a.poin) || (b.langkahKe - a.langkahKe) || ((a.diperbarui || 0) - (b.diperbarui || 0)));
  }

  function pantauKelompok(kode, cb) {
    siap().then(() => db.ref(`sesi/${kode}/kelompok`).on('value', (snap) => cb(urutkan(snap.val()))));
    return () => { if (db) db.ref(`sesi/${kode}/kelompok`).off(); };
  }

  // ---------- Ruang tunggu di HP siswa ----------
  // Overlay yang menutupi halaman permainan sampai guru menekan Mulai.
  let ruangEl = null;

  function bukaRuangTunggu(state) {
    if (ruangEl) return;
    const indiv = modeSesi(state.sesi) === 'individu';
    ruangEl = document.createElement('div');
    ruangEl.className = 'modal buka ruang-tunggu';
    ruangEl.setAttribute('role', 'dialog');
    ruangEl.setAttribute('aria-modal', 'true');
    ruangEl.setAttribute('aria-labelledby', 'rt-judul');
    ruangEl.innerHTML = `
      <div class="modal-isi">
        <div class="besar denyut" aria-hidden="true">⏳</div>
        <h2 id="rt-judul">Ruang Tunggu</h2>
        <p class="rt-sesi">📡 Sesi ${esc(state.sesi.kode)} · ${indiv ? '👤 Individu' : '👥 Kelompok'}</p>
        <p>Halo, <b>${esc(state.tim)}</b>! Tunggu guru memulai sesi ya…</p>
        <p class="kecil rt-jumlah" id="rt-jumlah" aria-live="polite"></p>
        <div class="lobi-grid" id="rt-daftar"></div>
        <div class="aksi"><a class="btn btn-kecil btn-garis" href="masuk.html">✏️ Ubah data</a></div>
      </div>`;
    document.body.appendChild(ruangEl);
    document.body.classList.add('menunggu-sesi');
    const main = document.querySelector('main');
    if (main) main.inert = true;
  }

  function isiRuangTunggu(daftar, kelompokId, indiv) {
    if (!ruangEl) return;
    const jumlah = ruangEl.querySelector('#rt-jumlah');
    const wadah = ruangEl.querySelector('#rt-daftar');
    if (!jumlah || !wadah) return;
    jumlah.textContent = `${daftar.length} ${indiv ? 'siswa' : 'kelompok'} sudah bergabung`;
    const ada = new Set([...wadah.children].map((c) => c.dataset.id));
    // Urutan bergabung (paling awal di depan); nama baru muncul dengan animasi.
    wadah.innerHTML = daftar.slice().sort((a, b) => (a.diperbarui || 0) - (b.diperbarui || 0)).map((k) => `
      <span class="lobi-nama ${k.id === kelompokId ? 'saya' : ''} ${ada.has(k.id) ? '' : 'baru'}" data-id="${esc(k.id)}">${k.absen ? `<span class="no-absen">No. ${esc(k.absen)}</span>` : ''}${esc(k.tim)}${k.id === kelompokId ? ' (kamu)' : ''}</span>`).join('');
  }

  function tutupRuangTunggu(isi, otomatis) {
    if (!ruangEl) return;
    const el = ruangEl;
    el.querySelector('.modal-isi').innerHTML = isi;
    if (!otomatis) return;
    ruangEl = null;
    setTimeout(() => {
      el.classList.add('hilang');
      setTimeout(() => {
        el.remove();
        document.body.classList.remove('menunggu-sesi');
        const main = document.querySelector('main');
        if (main) main.inert = false;
      }, 350);
    }, 1200);
  }

  // ---------- Badge peringkat di HP siswa ----------
  function pasangBadge() {
    const state = loadState();
    if (!state.sesi || !state.sesi.kode || !aktif()) return;
    const stepper = document.getElementById('stepper');
    if (!stepper) return;
    let badge = document.getElementById('badge-sesi');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'badge-sesi';
      badge.className = 'badge-sesi';
      stepper.insertAdjacentElement('afterend', badge);
    }
    const kode = state.sesi.kode;
    badge.innerHTML = `<span>📡 Sesi ${esc(kode)}</span><span class="kecil">Menghubungkan…</span>`;
    let aktifSesi = true;
    let menunggu = false;
    let daftarTerakhir = [];
    const indiv = modeSesi(state.sesi) === 'individu';
    // Ruang tunggu hanya menutupi halaman permainan, bukan halaman Bagi Tim.
    const kunci = (location.pathname.split('/').pop() || '') !== 'masuk.html';
    function badgePeringkat() {
      if (!aktifSesi || menunggu) return;
      const s = loadState();
      const daftar = daftarTerakhir;
      const i = daftar.findIndex((k) => k.id === (s.sesi && s.sesi.kelompokId));
      badge.innerHTML = i === -1
        ? `<span>📡 Sesi ${esc(kode)}</span><span class="kecil">${daftar.length} ${indiv ? 'siswa' : 'kelompok'} bergabung</span>`
        : `<span>🏆 Peringkat <b>${i + 1}</b> dari ${daftar.length}</span><span class="poin-badge">${daftar[i].poin} poin</span>`;
    }
    pantauSesi(kode, (info) => {
      aktifSesi = Boolean(info && info.aktif);
      menunggu = sedangMenunggu(info);
      if (!aktifSesi) badge.innerHTML = `<span>⏹ Sesi ${esc(kode)} sudah diakhiri guru.</span>`;
      else if (menunggu) badge.innerHTML = `<span>⏳ Ruang tunggu · Sesi ${esc(kode)}</span><span class="kecil">Menunggu guru memulai…</span>`;
      else badgePeringkat();
      if (!kunci) return;
      if (menunggu) {
        bukaRuangTunggu(loadState());
        isiRuangTunggu(daftarTerakhir, state.sesi.kelompokId, indiv);
      } else if (!aktifSesi) {
        tutupRuangTunggu(`<div class="besar" aria-hidden="true">⏹</div><h2>Sesi sudah diakhiri</h2>
          <p>Guru sudah mengakhiri sesi ${esc(kode)}. Minta kode sesi baru ke guru, ya.</p>
          <div class="aksi"><a class="btn" href="masuk.html">Masukkan kode baru</a></div>`, false);
      } else {
        tutupRuangTunggu('<div class="besar" aria-hidden="true">🚀</div><h2>Sesi dimulai!</h2><p>Selamat bermain, semangat!</p>', true);
      }
    });
    pantauKelompok(kode, (daftar) => {
      daftarTerakhir = daftar;
      isiRuangTunggu(daftar, state.sesi.kelompokId, indiv);
      badgePeringkat();
    });
    // Kirim progress terbaru saat halaman dibuka (misalnya setelah sempat offline).
    kirimProgress(state);
  }

  return { aktif, siap, modeSesi, sedangMenunggu, buatSesi, mulaiSesi, akhiriSesi, infoSesi, sesiMilikSaya, pantauSesi, gabung, kirimProgress, kirimSegera, pantauKelompok, hitungPoin, rincian, langkahSaatIni, pasangBadge };
})();

document.addEventListener('DOMContentLoaded', () => SESI.pasangBadge());
