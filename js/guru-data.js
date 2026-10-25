// ============================================================
// Data portal guru di Firebase (guru/<uid>): profil, materi tambahan,
// kelas beserta siswa, kelompok, dan catatan nilainya.
// Hanya akun guru yang bisa membaca/menulis (lihat database.rules.json).
// ============================================================

const GURU_DATA = (() => {
  let janjiAkar = null;
  let akar = null;
  let data = {};
  let dimuat = false;
  const pendengar = [];

  // Referensi guru/<uid>; dipanggil setelah guru dipastikan login.
  function siapAkar() {
    if (!janjiAkar) {
      janjiAkar = SESI.siap().then((db) => {
        akar = db.ref(`guru/${firebase.auth().currentUser.uid}`);
        return akar;
      }).catch((e) => { janjiAkar = null; throw e; });
    }
    return janjiAkar;
  }

  // Satu listener untuk semua data guru (ukurannya kecil); setiap perubahan memanggil semua cb.
  function pantau(cb) {
    pendengar.push(cb);
    if (dimuat) cb(data);
    if (pendengar.length > 1) return;
    siapAkar().then((r) => r.on('value', (snap) => {
      data = snap.val() || {};
      dimuat = true;
      pendengar.forEach((f) => f(data));
    }));
  }

  // ---------- Bantuan ----------
  const WAKTU = () => firebase.database.ServerValue.TIMESTAMP;

  function idBaru() {
    return akar.push().key;
  }

  function samakan(teks) {
    return String(teks || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  // Tanggal lokal "YYYY-MM-DD" (bukan UTC, agar tidak mundur sehari di pagi hari).
  function tanggal(ms = Date.now()) {
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function daftar(obj) {
    return Object.entries(obj || {}).map(([id, v]) => ({ id, ...v }));
  }

  function kelasList() {
    return daftar(data.kelas).sort((a, b) => (a.dibuat || 0) - (b.dibuat || 0));
  }

  function kelas(id) {
    return data.kelas && data.kelas[id] ? { id, ...data.kelas[id] } : null;
  }

  // ---------- Profil & materi ----------
  async function simpanProfil(profil) {
    await (await siapAkar()).child('profil').set(profil);
  }

  async function tambahMateri(judul, isi) {
    await siapAkar();
    await akar.child(`materi/${idBaru()}`).set({ judul, isi, dibuat: WAKTU() });
  }

  async function hapusMateri(id) {
    await (await siapAkar()).child(`materi/${id}`).remove();
  }

  // ---------- Kelas ----------
  async function tambahKelas({ nama, jenis, catatan }) {
    await siapAkar();
    const id = idBaru();
    await akar.child(`kelas/${id}`).set({ nama, jenis, catatan, dibuat: WAKTU() });
    return id;
  }

  async function hapusKelas(id) {
    await (await siapAkar()).child(`kelas/${id}`).remove();
  }

  // Banyak siswa sekaligus (satu nama per baris), opsional langsung masuk ke satu kelompok.
  async function tambahSiswa(kelasId, namaList, kelompokId) {
    await siapAkar();
    const u = {};
    namaList.forEach((nama) => {
      u[`kelas/${kelasId}/siswa/${idBaru()}`] = { nama, ...(kelompokId ? { kelompokId } : {}) };
    });
    await akar.update(u);
  }

  async function ubahKelompokSiswa(kelasId, siswaId, kelompokId) {
    await (await siapAkar()).child(`kelas/${kelasId}/siswa/${siswaId}/kelompokId`).set(kelompokId || null);
  }

  async function tambahKelompok(kelasId, nama) {
    await (await siapAkar()).child(`kelas/${kelasId}/kelompok/${idBaru()}`).set({ nama });
  }

  // jenis: 'siswa' atau 'kelompok'. Nilainya ikut terhapus; anggota kelompok yang dihapus jadi tanpa kelompok.
  async function hapusPeserta(kelasId, jenis, id) {
    await siapAkar();
    const k = kelas(kelasId) || {};
    const u = { [`kelas/${kelasId}/${jenis}/${id}`]: null };
    daftar(k.nilai).forEach((n) => {
      if (n.peserta === jenis && n.pesertaId === id) u[`kelas/${kelasId}/nilai/${n.id}`] = null;
    });
    if (jenis === 'kelompok') {
      daftar(k.siswa).forEach((s) => {
        if (s.kelompokId === id) u[`kelas/${kelasId}/siswa/${s.id}/kelompokId`] = null;
      });
    }
    await akar.update(u);
  }

  // n: { peserta, pesertaId, tanggal, aktivitas, nilai }
  async function catatNilai(kelasId, n) {
    await siapAkar();
    await akar.child(`kelas/${kelasId}/nilai/${idBaru()}`).set({ ...n, sumber: 'manual', dibuat: WAKTU() });
  }

  async function hapusNilai(kelasId, id) {
    await (await siapAkar()).child(`kelas/${kelasId}/nilai/${id}`).remove();
  }

  // ---------- Nilai otomatis dari sesi ----------
  // Nilai 0–100 = jawaban benar ÷ jumlah soal × 100.
  // Soal = tebakan majas (satu per lagu) + kepingan puzzle (4 per baris); yang tidak dikerjakan dihitung 0.
  function nilaiSesi(k) {
    const keping = k.puzzleTotal > 0 ? k.puzzleTotal : jumlahBarisTersedia() * 4;
    const soal = (k.totalLagu || daftarLaguSiap().length) + keping;
    const benar = (k.benar || 0) + Math.max(0, k.puzzleBenar || 0);
    return soal ? Math.min(100, Math.round((benar / soal) * 100)) : 0;
  }

  // Simpan nilai setiap peserta sesi ke kelas asalnya (sekali per sesi).
  // Peserta dicocokkan dengan daftar kelas (no. absen / nama); yang belum ada otomatis ditambahkan.
  // Mengembalikan { kelas, jumlah }, atau null jika sesi tidak terhubung ke kelas / sudah tersimpan.
  async function simpanHasilSesi(kode, info, peserta) {
    if (!info || !info.kelasId) return null;
    await siapAkar();
    const dasar = `kelas/${info.kelasId}`;
    const snap = await akar.child(dasar).get();
    const k = snap.val();
    if (!k || (k.sesiTersimpan && k.sesiTersimpan[kode])) return null;

    const indiv = SESI.modeSesi(info) === 'individu';
    const siswa = daftar(k.siswa);
    const kelompok = daftar(k.kelompok);
    const tgl = tanggal(info.mulai || info.dibuat || Date.now());
    const u = {};

    const cariSiswa = (nama, absen) =>
      (absen && siswa.find((s) => s.absen === absen)) || siswa.find((s) => samakan(s.nama) === samakan(nama));
    const siswaBaru = (isi) => {
      const s = { id: idBaru(), ...isi };
      siswa.push(s);
      u[`${dasar}/siswa/${s.id}`] = isi;
      return s;
    };

    peserta.forEach((p) => {
      const nama = String(p.tim || 'Tanpa nama').slice(0, 60);
      let pesertaId;
      if (indiv) {
        const absen = Number(p.absen) >= 1 && Number(p.absen) <= 99 ? Number(p.absen) : 0;
        let s = cariSiswa(nama, absen);
        if (!s) s = siswaBaru({ nama, ...(absen ? { absen } : {}) });
        else if (absen && !s.absen) u[`${dasar}/siswa/${s.id}/absen`] = absen;
        pesertaId = s.id;
      } else {
        let g = kelompok.find((x) => samakan(x.nama) === samakan(nama));
        if (!g) {
          g = { id: idBaru(), nama };
          kelompok.push(g);
          u[`${dasar}/kelompok/${g.id}`] = { nama };
        }
        (p.anggota || []).forEach((a) => {
          const s = cariSiswa(a);
          if (!s) siswaBaru({ nama: String(a).slice(0, 60), kelompokId: g.id });
          else if (!s.kelompokId) {
            s.kelompokId = g.id;
            u[`${dasar}/siswa/${s.id}/kelompokId`] = g.id;
          }
        });
        pesertaId = g.id;
      }
      u[`${dasar}/nilai/sesi-${kode}-${pesertaId}`] = {
        peserta: indiv ? 'siswa' : 'kelompok', pesertaId, tanggal: tgl,
        aktivitas: `Sesi ${kode}`, nilai: nilaiSesi(p), sumber: 'sesi', sesi: kode, dibuat: WAKTU(),
      };
    });
    u[`${dasar}/sesiTersimpan/${kode}`] = true;
    await akar.update(u);
    return { kelas: k.nama, jumlah: peserta.length };
  }

  return {
    pantau, daftar, kelasList, kelas, tanggal, samakan,
    simpanProfil, tambahMateri, hapusMateri,
    tambahKelas, hapusKelas, tambahSiswa, ubahKelompokSiswa, tambahKelompok, hapusPeserta, catatNilai, hapusNilai,
    nilaiSesi, simpanHasilSesi,
  };
})();
