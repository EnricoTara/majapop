// ============================================================
// Konfigurasi Firebase untuk fitur "Sesi Kelas" (progress live per kelompok).
//
// Cara mengisi: Firebase Console → Project settings → Your apps → Web (</>)
// → salin isi objek firebaseConfig ke bawah ini.
// Nilai-nilai ini memang aman untuk publik; keamanan data diatur oleh
// "Rules" di Realtime Database (lihat file database.rules.json).
//
// Biarkan kosong ({}) jika fitur sesi kelas tidak dipakai —
// MajaPOP tetap bisa dimainkan seperti biasa.
// ============================================================
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAslSxIDpMK_TrI6a3iSMhrt755rFyhrnQ',
  authDomain: 'webrediva.firebaseapp.com',
  databaseURL: 'https://webrediva-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'webrediva',
  storageBucket: 'webrediva.firebasestorage.app',
  messagingSenderId: '713176907935',
  appId: '1:713176907935:web:ea275cf3f2c5ef176722aa',
};
