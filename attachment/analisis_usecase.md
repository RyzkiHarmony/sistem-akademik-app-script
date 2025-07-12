# ANALISIS USE CASE - ADMIN DASHBOARD BUKU INDUK SISWA

## OVERVIEW APLIKASI
**Nama Aplikasi:** Admin Dashboard - Buku Induk Siswa  
**Institusi:** SMP Negeri 03 Pekalongan  
**Platform:** Google Apps Script Web Application  
**Database:** Google Sheets  
**Total Kode:** 4,607 baris  

---

## IDENTIFIKASI AKTOR

### 1. AKTOR UTAMA
| No | Aktor | Deskripsi | Hak Akses |
|----|-------|-----------|----------|
| 1 | **Admin/Pengguna Sistem** | Staff administrasi sekolah yang mengelola data siswa | Akses penuh ke semua fitur |
| 2 | **Sistem Google Apps Script** | Sistem backend yang memproses data | Otomatis menjalankan fungsi |
| 3 | **Google Sheets Database** | Penyimpanan data siswa dan nilai | Menyimpan dan menyediakan data |
| 4 | **Google Drive Storage** | Penyimpanan file PDF buku induk | Menyimpan file dokumen |

---

## ANALISIS USE CASE BERDASARKAN MODUL

### A. MODUL AUTENTIKASI & SESSION

#### UC-001: Login ke Sistem
- **Aktor Utama:** Admin/Pengguna Sistem
- **Fungsi Terkait:** `verifyLogin()`, `createSession()`, `setSessionAndGetDashboardUrl()`
- **Deskripsi:** Admin melakukan login dengan username dan password
- **Precondition:** Admin memiliki akses ke aplikasi
- **Flow:**
  1. Admin mengakses halaman login
  2. Sistem menampilkan form login
  3. Admin memasukkan username dan password
  4. Sistem memverifikasi kredensial melalui sheet USERS
  5. Sistem membuat session dengan durasi 2 jam
  6. Sistem mengarahkan ke dashboard
- **Postcondition:** Admin berhasil login dan session aktif

#### UC-002: Logout dari Sistem
- **Aktor Utama:** Admin/Pengguna Sistem
- **Fungsi Terkait:** `logout()`, `logoutAndDestroySession()`, `destroySession()`
- **Deskripsi:** Admin keluar dari sistem
- **Flow:**
  1. Admin klik tombol logout
  2. Sistem menghapus session
  3. Sistem mengarahkan ke halaman login
- **Postcondition:** Session dihapus, admin keluar dari sistem

#### UC-003: Validasi Session
- **Aktor Utama:** Sistem Google Apps Script
- **Fungsi Terkait:** `validateSession()`, `extendSession()`
- **Deskripsi:** Sistem otomatis memvalidasi session setiap request
- **Flow:**
  1. Sistem menerima request dari admin
  2. Sistem cek validitas session
  3. Jika valid, perpanjang session
  4. Jika tidak valid, redirect ke login
- **Postcondition:** Session tervalidasi atau admin diarahkan login

---

### B. MODUL DASHBOARD

#### UC-004: Melihat Dashboard Utama
- **Aktor Utama:** Admin/Pengguna Sistem
- **Fungsi Terkait:** `getDashboardData()`, `getRecentStudents()`
- **Deskripsi:** Admin melihat ringkasan data siswa
- **Flow:**
  1. Admin mengakses dashboard
  2. Sistem menghitung total siswa aktif dan lulus
  3. Sistem menampilkan 5 siswa terbaru
  4. Sistem menampilkan statistik umum
- **Postcondition:** Dashboard ditampilkan dengan data terkini

#### UC-005: Melihat Statistik Siswa
- **Aktor Utama:** Admin/Pengguna Sistem
- **Fungsi Terkait:** `getStudentStatistics()`
- **Deskripsi:** Admin melihat statistik detail siswa
- **Flow:**
  1. Admin mengakses menu statistik
  2. Sistem menghitung data berdasarkan kelas, status, gender
  3. Sistem menampilkan grafik dan tabel statistik
- **Postcondition:** Statistik siswa ditampilkan

---

### C. MODUL MANAJEMEN DATA SISWA

#### UC-006: Melihat Daftar Siswa
- **Aktor Utama:** Admin/Pengguna Sistem
- **Fungsi Terkait:** `getAllStudents()`
- **Deskripsi:** Admin melihat daftar semua siswa dengan fitur filter dan pagination
- **Flow:**
  1. Admin mengakses halaman daftar siswa
  2. Sistem mengambil data dari sheet DATA SISWA
  3. Sistem menerapkan filter dan pagination
  4. Sistem menampilkan daftar siswa
- **Postcondition:** Daftar siswa ditampilkan sesuai filter

#### UC-007: Mencari Siswa Berdasarkan NIS
- **Aktor Utama:** Admin/Pengguna Sistem
- **Fungsi Terkait:** `findStudentByNIS()`, `getStudentById()`
- **Deskripsi:** Admin mencari data siswa spesifik
- **Flow:**
  1. Admin memasukkan NIS siswa
  2. Sistem mencari di sheet DATA SISWA
  3. Sistem menampilkan detail siswa jika ditemukan
- **Postcondition:** Data siswa ditampilkan atau pesan tidak ditemukan

#### UC-008: Menambah Data Siswa Baru
- **Aktor Utama:** Admin/Pengguna Sistem
- **Fungsi Terkait:** `addStudent()`
- **Deskripsi:** Admin menambahkan siswa baru ke sistem
- **Flow:**
  1. Admin mengakses form tambah siswa
  2. Admin mengisi 131 field data siswa
  3. Sistem validasi data
  4. Sistem menyimpan ke sheet DATA SISWA
- **Postcondition:** Data siswa baru tersimpan

#### UC-009: Mengubah Data Siswa
- **Aktor Utama:** Admin/Pengguna Sistem
- **Fungsi Terkait:** `updateStudent()`
- **Deskripsi:** Admin mengubah data siswa yang sudah ada
- **Flow:**
  1. Admin pilih siswa yang akan diubah
  2. Sistem tampilkan form edit dengan data existing
  3. Admin ubah data yang diperlukan
  4. Sistem update data di sheet DATA SISWA
- **Postcondition:** Data siswa berhasil diperbarui

#### UC-010: Menghapus Data Siswa
- **Aktor Utama:** Admin/Pengguna Sistem
- **Fungsi Terkait:** `deleteStudent()`
- **Deskripsi:** Admin menghapus data siswa dari sistem
- **Flow:**
  1. Admin pilih siswa yang akan dihapus
  2. Sistem tampilkan konfirmasi
  3. Admin konfirmasi penghapusan
  4. Sistem hapus data dari sheet DATA SISWA, DATA NILAI, dan Rata-Rata Raport
- **Postcondition:** Semua data siswa terhapus dari sistem

#### UC-011: Melihat Detail Siswa
- **Aktor Utama:** Admin/Pengguna Sistem
- **Fungsi Terkait:** `getStudentDetail()`
- **Deskripsi:** Admin melihat detail lengkap data siswa
- **Flow:**
  1. Admin klik detail siswa
  2. Sistem ambil semua data siswa
  3. Sistem tampilkan dalam format yang mudah dibaca
- **Postcondition:** Detail siswa ditampilkan lengkap

#### UC-012: Mengakses File PDF Siswa
- **Aktor Utama:** Admin/Pengguna Sistem
- **Fungsi Terkait:** `getStudentPDFUrl()`
- **Deskripsi:** Admin mengakses file PDF buku induk siswa
- **Flow:**
  1. Admin klik link PDF siswa
  2. Sistem cari file di Google Drive
  3. Sistem berikan URL akses file
- **Postcondition:** File PDF dapat diakses

---

### D. MODUL MANAJEMEN NILAI SISWA

#### UC-013: Melihat Daftar Nilai Siswa
- **Aktor Utama:** Admin/Pengguna Sistem
- **Fungsi Terkait:** `getAllStudentGrades()`, `getAllStudentGradesForFrontend()`
- **Deskripsi:** Admin melihat daftar nilai semua siswa
- **Flow:**
  1. Admin akses halaman nilai siswa
  2. Sistem ambil data dari sheet DATA NILAI
  3. Sistem tampilkan dengan pagination dan filter
- **Postcondition:** Daftar nilai siswa ditampilkan

#### UC-014: Melihat Nilai Siswa Berdasarkan NIS
- **Aktor Utama:** Admin/Pengguna Sistem
- **Fungsi Terkait:** `getStudentGradesByNIS()`
- **Deskripsi:** Admin melihat nilai spesifik satu siswa
- **Flow:**
  1. Admin masukkan NIS siswa
  2. Sistem filter data nilai berdasarkan NIS
  3. Sistem tampilkan semua nilai siswa tersebut
- **Postcondition:** Nilai siswa spesifik ditampilkan

#### UC-015: Melihat Detail Nilai Siswa
- **Aktor Utama:** Admin/Pengguna Sistem
- **Fungsi Terkait:** `getStudentGradeDetail()`
- **Deskripsi:** Admin melihat detail nilai siswa per semester
- **Flow:**
  1. Admin pilih detail nilai siswa
  2. Sistem ambil data nilai lengkap
  3. Sistem tampilkan breakdown per mata pelajaran
- **Postcondition:** Detail nilai per mata pelajaran ditampilkan

#### UC-016: Menambah/Edit Nilai Siswa
- **Aktor Utama:** Admin/Pengguna Sistem
- **Fungsi Terkait:** `addStudentGrade()`, `updateStudentGrade()`
- **Deskripsi:** Admin mengelola nilai siswa untuk 12 mata pelajaran
- **Flow:**
  1. Admin akses form nilai siswa
  2. Admin input nilai untuk setiap mata pelajaran
  3. Sistem validasi nilai (0-100)
  4. Sistem simpan ke sheet DATA NILAI
- **Postcondition:** Nilai siswa tersimpan/diperbarui

#### UC-017: Menghitung Ringkasan Nilai
- **Aktor Utama:** Sistem Google Apps Script
- **Fungsi Terkait:** `generateGradeSummary()`
- **Deskripsi:** Sistem otomatis menghitung statistik nilai siswa
- **Flow:**
  1. Sistem ambil semua nilai siswa
  2. Sistem hitung rata-rata, nilai tertinggi, terendah
  3. Sistem hitung jumlah mata pelajaran lulus/tidak lulus
- **Postcondition:** Ringkasan nilai tersedia

---

### E. MODUL ANALISIS KIP (KARTU INDONESIA PINTAR)

#### UC-018: Memulai Analisis KIP
- **Aktor Utama:** Admin/Pengguna Sistem
- **Fungsi Terkait:** `startKIPAnalysis()`
- **Deskripsi:** Admin memulai proses analisis kelayakan KIP
- **Flow:**
  1. Admin klik tombol mulai analisis KIP
  2. Sistem buat/bersihkan sheet KIP_Analisis
  3. Sistem ambil data semua siswa aktif
  4. Sistem proses setiap siswa dengan algoritma scoring
  5. Sistem urutkan berdasarkan skor total
  6. Sistem assign ranking
- **Postcondition:** Analisis KIP selesai dengan ranking siswa

#### UC-019: Melihat Hasil Analisis KIP
- **Aktor Utama:** Admin/Pengguna Sistem
- **Fungsi Terkait:** `getKIPAnalysisResults()`, `getKIPDashboardStats()`
- **Deskripsi:** Admin melihat hasil analisis kelayakan KIP
- **Flow:**
  1. Admin akses halaman hasil KIP
  2. Sistem tampilkan daftar siswa dengan skor
  3. Sistem tampilkan kategori (Sangat Layak, Layak, Cukup Layak, Kurang Layak)
  4. Sistem tampilkan statistik dashboard
- **Postcondition:** Hasil analisis KIP ditampilkan

#### UC-020: Menganalisis Siswa Individual
- **Aktor Utama:** Sistem Google Apps Script
- **Fungsi Terkait:** `analyzeStudentKIP()`
- **Deskripsi:** Sistem menganalisis kelayakan KIP per siswa
- **Flow:**
  1. Sistem ambil data ekonomi keluarga siswa
  2. Sistem hitung skor penghasilan (ayah, ibu, wali)
  3. Sistem hitung skor status keluarga
  4. Sistem hitung skor tanggungan (jumlah saudara)
  5. Sistem hitung skor beasiswa
  6. Sistem jumlahkan total skor
  7. Sistem tentukan kategori kelayakan
- **Postcondition:** Skor dan kategori siswa ditentukan

#### UC-021: Menghitung Skor Komponen KIP
- **Aktor Utama:** Sistem Google Apps Script
- **Fungsi Terkait:** `calculateIncomeScore()`, `calculateFamilyStatusScore()`, `calculateDependentsScore()`, `calculateScholarshipScore()`
- **Deskripsi:** Sistem menghitung skor setiap komponen analisis
- **Flow:**
  1. **Skor Penghasilan:** Sistem evaluasi penghasilan orang tua (0-100)
  2. **Skor Status Keluarga:** Sistem evaluasi status orang tua (yatim/piatu/lengkap)
  3. **Skor Tanggungan:** Sistem evaluasi jumlah saudara kandung
  4. **Skor Beasiswa:** Sistem evaluasi riwayat beasiswa
- **Postcondition:** Skor komponen dihitung sesuai algoritma

#### UC-022: Export Data Analisis KIP
- **Aktor Utama:** Admin/Pengguna Sistem
- **Fungsi Terkait:** `exportKIPAnalysis()`
- **Deskripsi:** Admin mengexport hasil analisis ke file Excel
- **Flow:**
  1. Admin klik tombol export
  2. Sistem buat spreadsheet baru
  3. Sistem copy data hasil analisis
  4. Sistem format dan berikan akses public
  5. Sistem berikan URL download Excel
- **Postcondition:** File Excel hasil analisis tersedia untuk download

#### UC-023: Melihat Statistik Dashboard KIP
- **Aktor Utama:** Admin/Pengguna Sistem
- **Fungsi Terkait:** `getKIPDashboardStats()`
- **Deskripsi:** Admin melihat ringkasan statistik analisis KIP
- **Flow:**
  1. Admin akses dashboard KIP
  2. Sistem hitung jumlah siswa per kategori
  3. Sistem hitung persentase distribusi
  4. Sistem tampilkan dalam bentuk chart/grafik
- **Postcondition:** Statistik KIP ditampilkan

---

### F. MODUL SISTEM & UTILITAS

#### UC-024: Mengelola Session Otomatis
- **Aktor Utama:** Sistem Google Apps Script
- **Fungsi Terkait:** `validateSession()`, `extendSession()`, `getCurrentUserFromSession()`
- **Deskripsi:** Sistem otomatis mengelola session pengguna
- **Flow:**
  1. Sistem cek session setiap request
  2. Jika session valid, perpanjang otomatis
  3. Jika session expired, redirect ke login
  4. Sistem track user yang sedang login
- **Postcondition:** Session terkelola otomatis

#### UC-025: Mengelola File dan Folder
- **Aktor Utama:** Sistem Google Apps Script
- **Fungsi Terkait:** `getStudentPDFUrl()`, integrasi Google Drive
- **Deskripsi:** Sistem mengelola file PDF di Google Drive
- **Flow:**
  1. Sistem akses folder Google Drive
  2. Sistem cari file berdasarkan nama pattern
  3. Sistem berikan URL akses file
- **Postcondition:** File dapat diakses melalui URL

---

## RINGKASAN ANALISIS

### TOTAL USE CASE: 25 Use Cases

### DISTRIBUSI PER MODUL:
- **Autentikasi & Session:** 3 use cases
- **Dashboard:** 2 use cases  
- **Manajemen Data Siswa:** 7 use cases
- **Manajemen Nilai Siswa:** 5 use cases
- **Analisis KIP:** 6 use cases
- **Sistem & Utilitas:** 2 use cases

### KOMPLEKSITAS INTERAKSI:
- **Interaksi Sederhana:** 8 use cases (view, display)
- **Interaksi Menengah:** 12 use cases (CRUD operations)
- **Interaksi Kompleks:** 5 use cases (analisis, kalkulasi, export)

### DATA YANG DIKELOLA:
- **Data Siswa:** 131 field per siswa
- **Data Nilai:** 146 field per record nilai
- **Data Analisis KIP:** 20 field per analisis
- **Mata Pelajaran:** 12 mata pelajaran
- **Kelas:** 12 jenis kelas (VII A-D, VIII A-D, IX A-D)

### TEKNOLOGI YANG DIGUNAKAN:
- **Backend:** Google Apps Script (JavaScript)
- **Frontend:** HTML5, CSS3, JavaScript
- **Database:** Google Sheets
- **Storage:** Google Drive
- **Authentication:** Session-based dengan Google OAuth 2.0

---

## REKOMENDASI PENGEMBANGAN

### 1. PENINGKATAN KEAMANAN
- Implementasi role-based access control
- Enkripsi data sensitif
- Audit trail untuk semua operasi

### 2. OPTIMASI PERFORMA
- Implementasi caching untuk data yang sering diakses
- Pagination yang lebih efisien
- Lazy loading untuk data besar

### 3. PENINGKATAN UX/UI
- Interface yang lebih responsif
- Validasi real-time
- Progress indicator untuk operasi panjang

### 4. FITUR TAMBAHAN
- Backup otomatis
- Notifikasi sistem
- Reporting yang lebih advanced
- Integration dengan sistem sekolah lain

---

**Dokumen ini dibuat berdasarkan analisis kode sumber aplikasi Admin Dashboard Buku Induk Siswa SMP Negeri 03 Pekalongan.**