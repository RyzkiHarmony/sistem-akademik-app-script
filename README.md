# Admin Dashboard (Google Apps Script) – Hardening & Setup

## Ringkasan
- Web App berbasis Google Apps Script (GAS) untuk administrasi Buku Induk siswa (Sheets + Drive).
- Perubahan keamanan utama:
  - Menutup akses anonim (Web App: `executeAs: USER_ACCESSING`, `access: ANYONE_WITH_GOOGLE_ACCOUNT`).
  - Autentikasi aman: hashing HMAC‑SHA256 iteratif + salt + pepper.
  - RBAC: pembatasan akses halaman/aksi berdasarkan peran (`viewer`, `staff`, `admin`).
  - Secrets/ID dipindah ke `ScriptProperties`.
  - LockService untuk mencegah race condition saat tulis.

## Deploy Web App
1. Buka editor Apps Script, klik `Deploy` → `New deployment` → `Web app`.
2. Set `Execute as` ke `User accessing the web app` dan `Who has access` ke `Anyone with Google account`.
3. Simpan dan gunakan URL yang berakhiran `/exec` untuk akses publik.
- Referensi: Apps Script Web Apps (https://developers.google.com/apps-script/guides/web) dan contoh manifest (https://github.com/tanaikech/taking-advantage-of-Web-Apps-with-google-apps-script).

## Konfigurasi Secrets
Masukkan nilai berikut di `Project Settings` → `Script Properties`:
- `SPREADSHEET_ACCOUNT_ID`
- `BUKU_INDUK_SPREADSHEET_ID`
- `STUDENT_PDF_FOLDER_ID`
- `PASSWORD_PEPPER` (opsional; otomatis dibuat jika kosong)

Kode akan membaca nilai‑nilai ini terlebih dahulu; jika kosong, fallback ke konstanta lama.
- Referensi: Properties Service (https://developers.google.com/apps-script/guides/properties) dan praktik penyimpanan (https://dataful.tech/google-apps-script/security/how-to-store-secrets/).

## Autentikasi Aman
- `verifyLogin(username, password)` memverifikasi dengan skema hash: HMAC‑SHA256 iteratif + salt + pepper.
- Migrasi otomatis: jika user masih plaintext dan cocok, sistem menulis `password_hash`, `salt`, `iterations` dan mengosongkan `password`.
- Pepper disimpan di `ScriptProperties`.
- Catatan: OWASP menyarankan algoritma adaptif (Argon2/bcrypt/PBKDF2). Di GAS, HMAC‑SHA256 berulang adalah kompromi praktis (https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

## RBAC
- Peran di sheet `Users` kolom `role` (`viewer`, `staff`, `admin`).
- Halaman yang dilindungi memiliki `pageRequiredRole`. Gate dilakukan di `doGet` dan operasi tulis.
  - Edit siswa: `staff`+.
  - Hapus siswa: `admin`.

## Keandalan Tulis
- Operasi tulis kritis memakai `LockService.getScriptLock()` untuk mencegah collision saat akses paralel.
- Referensi: LockService (https://developers.google.com/apps-script/reference/lock).

## Linting Minimal
Konfigurasi berada di `.eslintrc.json`.
- Pasang dev dependencies: `npm i -D eslint eslint-plugin-googleappsscript eslint-plugin-html`.
- Jalankan: `npx eslint . --ext .js,.html`.

## Known Limitations
- Email pengguna (`Session.getActiveUser().getEmail()`) bisa kosong di beberapa konteks; sistem menggunakan session internal untuk RBAC (https://developers.google.com/apps-script/reference/base/session).
- Untuk kebutuhan secrets yang lebih kuat, pertimbangkan Google Secret Manager (https://pulse.appsscript.info/p/2024/04/how-to-access-secrets-from-google-secret-manager-using-google-apps-script/).

## Struktur Kode Terkait
- `Code.js`: routing `doGet`, autentikasi, RBAC, CRUD siswa, integrasi Drive.
- `appsscript.json`: manifest Web App (`webapp.executeAs`, `webapp.access`).
- `JavaScript_*.html`: logika frontend, termasuk pengiriman `sessionId` untuk operasi sensitif.

## Tips Operasional
- Setelah mengubah script, lakukan redeploy versi agar perubahan muncul di Web App.
- Saat mengubah izin akses, buat deployment baru bila diperlukan.

