# ANALISIS DIAGRAM ACTIVITY - ADMIN DASHBOARD BUKU INDUK SISWA

## OVERVIEW
**Aplikasi:** Admin Dashboard - Buku Induk Siswa  
**Institusi:** SMP Negeri 03 Pekalongan  
**Total Use Cases:** 25 Use Cases  
**Modul:** 6 Modul Utama  

---

## A. MODUL AUTENTIKASI & SESSION

### UC-001: Login ke Sistem

```
[START] → [Admin mengakses aplikasi]
    ↓
[Sistem menampilkan halaman login]
    ↓
[Admin memasukkan username dan password]
    ↓
[Sistem validasi kredensial melalui USERS sheet]
    ↓
{Kredensial valid?}
    ├─ [NO] → [Tampilkan pesan error] → [Kembali ke form login]
    └─ [YES] → [Sistem membuat session (2 jam)]
        ↓
    [Sistem menyimpan session data]
        ↓
    [Redirect ke dashboard]
        ↓
    [END]
```

**Decision Points:**
- Validasi kredensial (valid/tidak valid)

**Parallel Activities:**
- Tidak ada

**Exception Handling:**
- Error koneksi database
- Kredensial tidak valid
- Session creation failure

---

### UC-002: Logout dari Sistem

```
[START] → [Admin klik tombol logout]
    ↓
[Sistem ambil session ID]
    ↓
[Sistem hapus session data]
    ↓
[Sistem clear browser session]
    ↓
[Redirect ke halaman login]
    ↓
[Tampilkan pesan logout berhasil]
    ↓
[END]
```

**Decision Points:**
- Tidak ada

**Parallel Activities:**
- Tidak ada

**Exception Handling:**
- Session tidak ditemukan
- Error saat menghapus session

---

### UC-003: Validasi Session

```
[START] → [Admin mengakses halaman protected]
    ↓
[Sistem ambil session ID dari request]
    ↓
{Session ID ada?}
    ├─ [NO] → [Redirect ke login]
    └─ [YES] → [Sistem cek validitas session]
        ↓
    {Session masih valid?}
        ├─ [NO] → [Hapus session] → [Redirect ke login]
        └─ [YES] → [Perpanjang session (extend 2 jam)]
            ↓
        [Lanjutkan ke halaman yang diminta]
            ↓
        [END]
```

**Decision Points:**
- Session ID tersedia
- Session masih valid (belum expired)

**Parallel Activities:**
- Tidak ada

**Exception Handling:**
- Session corrupted
- Database connection error

---

## B. MODUL DASHBOARD

### UC-004: Melihat Dashboard Utama

```
[START] → [Admin mengakses dashboard]
    ↓
[Sistem validasi session] → {Valid?} ─[NO]→ [Redirect login]
    ↓ [YES]
[Parallel: Ambil data statistik]
    ├─ [Hitung total siswa aktif]
    ├─ [Hitung total siswa lulus]
    ├─ [Ambil 5 siswa terbaru]
    └─ [Hitung statistik per kelas]
    ↓
[Sistem compile semua data]
    ↓
[Render dashboard dengan data]
    ↓
[Tampilkan ke admin]
    ↓
[END]
```

**Decision Points:**
- Session valid

**Parallel Activities:**
- Pengambilan berbagai statistik secara bersamaan

**Exception Handling:**
- Data tidak tersedia
- Error akses spreadsheet
- Timeout saat loading data

---

### UC-005: Melihat Statistik Siswa

```
[START] → [Admin klik menu statistik]
    ↓
[Sistem validasi session] → {Valid?} ─[NO]→ [Redirect login]
    ↓ [YES]
[Sistem ambil semua data siswa]
    ↓
[Parallel: Hitung statistik]
    ├─ [Kelompokkan berdasarkan kelas]
    ├─ [Kelompokkan berdasarkan status]
    ├─ [Kelompokkan berdasarkan gender]
    └─ [Hitung persentase masing-masing]
    ↓
[Sistem generate chart/grafik]
    ↓
[Render halaman statistik]
    ↓
[Tampilkan ke admin]
    ↓
[END]
```

**Decision Points:**
- Session valid

**Parallel Activities:**
- Pengelompokan data berdasarkan berbagai kriteria

**Exception Handling:**
- Data siswa kosong
- Error saat generate chart
- Memory limit exceeded

---

## C. MODUL MANAJEMEN DATA SISWA

### UC-006: Melihat Daftar Siswa

```
[START] → [Admin mengakses halaman siswa]
    ↓
[Sistem validasi session] → {Valid?} ─[NO]→ [Redirect login]
    ↓ [YES]
[Admin set filter/pagination (optional)]
    ↓
[Sistem ambil data dari DATA SISWA sheet]
    ↓
{Ada filter?}
    ├─ [YES] → [Terapkan filter]
    └─ [NO] → [Ambil semua data]
    ↓
{Ada pagination?}
    ├─ [YES] → [Terapkan pagination]
    └─ [NO] → [Tampilkan semua]
    ↓
[Sistem format data untuk tampilan]
    ↓
[Render tabel siswa]
    ↓
[Tampilkan ke admin]
    ↓
[END]
```

**Decision Points:**
- Session valid
- Filter diterapkan
- Pagination diterapkan

**Parallel Activities:**
- Tidak ada

**Exception Handling:**
- Sheet tidak ditemukan
- Data terlalu besar
- Filter invalid

---

### UC-007: Mencari Siswa Berdasarkan NIS

```
[START] → [Admin masukkan NIS di search box]
    ↓
[Sistem validasi format NIS]
    ↓
{Format NIS valid?}
    ├─ [NO] → [Tampilkan pesan error] → [Kembali ke form]
    └─ [YES] → [Sistem cari di DATA SISWA sheet]
        ↓
    [Loop: Scan setiap baris]
        ↓
    {NIS ditemukan?}
        ├─ [NO] → [Tampilkan "Siswa tidak ditemukan"]
        └─ [YES] → [Ambil semua data siswa]
            ↓
        [Format data untuk tampilan]
            ↓
        [Tampilkan detail siswa]
            ↓
        [END]
```

**Decision Points:**
- Format NIS valid
- NIS ditemukan di database

**Parallel Activities:**
- Tidak ada

**Exception Handling:**
- NIS format invalid
- Siswa tidak ditemukan
- Multiple NIS found (duplikasi)

---

### UC-008: Menambah Data Siswa Baru

```
[START] → [Admin klik "Tambah Siswa"]
    ↓
[Sistem validasi session] → {Valid?} ─[NO]→ [Redirect login]
    ↓ [YES]
[Sistem tampilkan form kosong (131 fields)]
    ↓
[Admin isi data siswa]
    ↓
[Admin submit form]
    ↓
[Sistem validasi semua field]
    ↓
{Data valid?}
    ├─ [NO] → [Tampilkan error] → [Kembali ke form]
    └─ [YES] → [Cek duplikasi NIS]
        ↓
    {NIS sudah ada?}
        ├─ [YES] → [Tampilkan error duplikasi] → [Kembali ke form]
        └─ [NO] → [Simpan ke DATA SISWA sheet]
            ↓
        [Tampilkan pesan sukses]
            ↓
        [Redirect ke daftar siswa]
            ↓
        [END]
```

**Decision Points:**
- Session valid
- Data form valid
- NIS tidak duplikasi

**Parallel Activities:**
- Tidak ada

**Exception Handling:**
- Validasi field gagal
- NIS duplikasi
- Error saat menyimpan
- Sheet penuh/limit exceeded

---

### UC-009: Mengubah Data Siswa

```
[START] → [Admin pilih siswa untuk edit]
    ↓
[Sistem validasi session] → {Valid?} ─[NO]→ [Redirect login]
    ↓ [YES]
[Sistem ambil data siswa berdasarkan NIS]
    ↓
{Siswa ditemukan?}
    ├─ [NO] → [Tampilkan error] → [Kembali ke daftar]
    └─ [YES] → [Tampilkan form dengan data existing]
        ↓
    [Admin ubah data yang diperlukan]
        ↓
    [Admin submit form]
        ↓
    [Sistem validasi perubahan]
        ↓
    {Data valid?}
        ├─ [NO] → [Tampilkan error] → [Kembali ke form]
        └─ [YES] → [Update data di DATA SISWA sheet]
            ↓
        [Tampilkan pesan sukses]
            ↓
        [Redirect ke detail siswa]
            ↓
        [END]
```

**Decision Points:**
- Session valid
- Siswa ditemukan
- Data perubahan valid

**Parallel Activities:**
- Tidak ada

**Exception Handling:**
- Siswa tidak ditemukan
- Validasi gagal
- Error saat update
- Concurrent modification

---

### UC-010: Menghapus Data Siswa

```
[START] → [Admin pilih siswa untuk hapus]
    ↓
[Sistem validasi session] → {Valid?} ─[NO]→ [Redirect login]
    ↓ [YES]
[Sistem tampilkan konfirmasi hapus]
    ↓
[Admin konfirmasi penghapusan]
    ↓
{Admin yakin hapus?}
    ├─ [NO] → [Batal hapus] → [Kembali ke daftar]
    └─ [YES] → [Sistem cari siswa di DATA SISWA]
        ↓
    {Siswa ditemukan?}
        ├─ [NO] → [Tampilkan error] → [Kembali ke daftar]
        └─ [YES] → [Parallel: Hapus dari semua sheet]
            ├─ [Hapus dari DATA SISWA]
            ├─ [Hapus dari DATA NILAI]
            └─ [Hapus dari Rata-Rata Raport]
            ↓
        [Tampilkan pesan sukses dengan detail]
            ↓
        [Redirect ke daftar siswa]
            ↓
        [END]
```

**Decision Points:**
- Session valid
- Admin konfirmasi hapus
- Siswa ditemukan

**Parallel Activities:**
- Penghapusan dari multiple sheets secara bersamaan

**Exception Handling:**
- Siswa tidak ditemukan
- Error saat hapus dari salah satu sheet
- Referential integrity issues

---

### UC-011: Melihat Detail Siswa

```
[START] → [Admin klik detail siswa]
    ↓
[Sistem validasi session] → {Valid?} ─[NO]→ [Redirect login]
    ↓ [YES]
[Sistem ambil NIS siswa]
    ↓
[Sistem cari data lengkap siswa]
    ↓
{Siswa ditemukan?}
    ├─ [NO] → [Tampilkan error 404] → [Kembali ke daftar]
    └─ [YES] → [Parallel: Ambil data terkait]
        ├─ [Ambil data siswa (131 fields)]
        ├─ [Ambil data nilai siswa]
        └─ [Cek ketersediaan file PDF]
        ↓
    [Sistem format data untuk tampilan]
        ↓
    [Render halaman detail]
        ↓
    [Tampilkan ke admin]
        ↓
    [END]
```

**Decision Points:**
- Session valid
- Siswa ditemukan

**Parallel Activities:**
- Pengambilan data dari multiple sources

**Exception Handling:**
- Siswa tidak ditemukan
- Data incomplete
- File PDF tidak tersedia

---

### UC-012: Mengakses File PDF Siswa

```
[START] → [Admin klik link PDF siswa]
    ↓
[Sistem validasi session] → {Valid?} ─[NO]→ [Redirect login]
    ↓ [YES]
[Sistem ambil NIS dan nama siswa]
    ↓
[Sistem konstruksi nama file PDF]
    ↓
[Sistem cari file di Google Drive folder]
    ↓
{File ditemukan dengan nama exact?}
    ├─ [YES] → [Generate URL akses]
    └─ [NO] → [Cari dengan pattern matching]
        ↓
    {File ditemukan dengan pattern?}
        ├─ [YES] → [Generate URL akses]
        └─ [NO] → [Tampilkan error "File tidak ditemukan"]
            ↓
[Redirect admin ke URL file]
    ↓
[END]
```

**Decision Points:**
- Session valid
- File ditemukan (exact match)
- File ditemukan (pattern match)

**Parallel Activities:**
- Tidak ada

**Exception Handling:**
- File tidak ditemukan
- Access denied ke Google Drive
- File corrupted

---

## D. MODUL MANAJEMEN NILAI SISWA

### UC-013: Melihat Daftar Nilai Siswa

```
[START] → [Admin mengakses halaman nilai]
    ↓
[Sistem validasi session] → {Valid?} ─[NO]→ [Redirect login]
    ↓ [YES]
[Admin set filter (kelas/semester) - optional]
    ↓
[Sistem ambil data dari DATA NILAI sheet]
    ↓
{Ada filter?}
    ├─ [YES] → [Terapkan filter kelas/semester]
    └─ [NO] → [Ambil semua data]
    ↓
[Sistem optimasi data (remove empty fields)]
    ↓
{Data terlalu besar?}
    ├─ [YES] → [Terapkan pagination]
    └─ [NO] → [Tampilkan semua]
    ↓
[Render tabel nilai dengan 12 mata pelajaran]
    ↓
[Tampilkan ke admin]
    ↓
[END]
```

**Decision Points:**
- Session valid
- Filter diterapkan
- Data perlu pagination

**Parallel Activities:**
- Tidak ada

**Exception Handling:**
- Sheet DATA NILAI tidak ditemukan
- Data terlalu besar
- Memory limit exceeded

---

### UC-014: Melihat Nilai Siswa Berdasarkan NIS

```
[START] → [Admin masukkan NIS untuk cari nilai]
    ↓
[Sistem validasi format NIS]
    ↓
{Format valid?}
    ├─ [NO] → [Tampilkan error] → [Kembali ke form]
    └─ [YES] → [Sistem filter DATA NILAI berdasarkan NIS]
        ↓
    {Data nilai ditemukan?}
        ├─ [NO] → [Tampilkan "Tidak ada data nilai"]
        └─ [YES] → [Parallel: Process nilai]
            ├─ [Ambil semua record nilai siswa]
            ├─ [Generate summary statistik]
            └─ [Kelompokkan per semester]
            ↓
        [Render halaman nilai siswa]
            ↓
        [Tampilkan ke admin]
            ↓
        [END]
```

**Decision Points:**
- Format NIS valid
- Data nilai ditemukan

**Parallel Activities:**
- Processing nilai dan generate summary

**Exception Handling:**
- NIS format invalid
- Tidak ada data nilai
- Error saat calculate summary

---

### UC-015: Melihat Detail Nilai Siswa

```
[START] → [Admin klik detail nilai siswa]
    ↓
[Sistem validasi session] → {Valid?} ─[NO]→ [Redirect login]
    ↓ [YES]
[Sistem ambil parameter (NIS, semester, tahun)]
    ↓
[Sistem cari data nilai spesifik]
    ↓
{Data ditemukan?}
    ├─ [NO] → [Tampilkan error] → [Kembali ke daftar]
    └─ [YES] → [Parallel: Process detail]
        ├─ [Breakdown nilai per mata pelajaran]
        ├─ [Hitung rata-rata]
        ├─ [Identifikasi mata pelajaran lulus/tidak lulus]
        └─ [Generate chart nilai]
        ↓
    [Render halaman detail nilai]
        ↓
    [Tampilkan ke admin]
        ↓
    [END]
```

**Decision Points:**
- Session valid
- Data nilai detail ditemukan

**Parallel Activities:**
- Processing berbagai aspek detail nilai

**Exception Handling:**
- Data tidak ditemukan
- Error saat calculate
- Chart generation failed

---

### UC-016: Menambah/Edit Nilai Siswa

```
[START] → [Admin pilih tambah/edit nilai]
    ↓
[Sistem validasi session] → {Valid?} ─[NO]→ [Redirect login]
    ↓ [YES]
{Mode edit?}
    ├─ [YES] → [Ambil data nilai existing]
    └─ [NO] → [Buat form kosong]
    ↓
[Tampilkan form 12 mata pelajaran]
    ↓
[Admin input/ubah nilai (0-100)]
    ↓
[Admin submit form]
    ↓
[Parallel: Validasi semua nilai]
    ├─ [Cek range 0-100]
    ├─ [Cek format numerik]
    └─ [Cek mandatory fields]
    ↓
{Semua nilai valid?}
    ├─ [NO] → [Tampilkan error spesifik] → [Kembali ke form]
    └─ [YES] → [Simpan ke DATA NILAI sheet]
        ↓
    [Update/Insert record]
        ↓
    [Tampilkan pesan sukses]
        ↓
    [Redirect ke daftar nilai]
        ↓
    [END]
```

**Decision Points:**
- Session valid
- Mode edit atau tambah
- Semua nilai valid

**Parallel Activities:**
- Validasi multiple fields secara bersamaan

**Exception Handling:**
- Nilai di luar range
- Format tidak valid
- Error saat simpan
- Duplikasi record

---

### UC-017: Menghitung Ringkasan Nilai

```
[START] → [Sistem trigger calculate summary]
    ↓
[Sistem ambil semua nilai siswa]
    ↓
{Data nilai ada?}
    ├─ [NO] → [Return summary kosong]
    └─ [YES] → [Parallel: Hitung statistik]
        ├─ [Hitung total mata pelajaran]
        ├─ [Hitung rata-rata keseluruhan]
        ├─ [Identifikasi nilai tertinggi]
        ├─ [Identifikasi nilai terendah]
        ├─ [Hitung jumlah mata pelajaran lulus]
        └─ [Hitung jumlah mata pelajaran tidak lulus]
        ↓
    [Compile hasil perhitungan]
        ↓
    [Return summary object]
        ↓
    [END]
```

**Decision Points:**
- Data nilai tersedia

**Parallel Activities:**
- Perhitungan berbagai statistik secara bersamaan

**Exception Handling:**
- Data nilai kosong
- Error saat calculate
- Division by zero

---

## E. MODUL ANALISIS KIP

### UC-018: Memulai Analisis KIP

```
[START] → [Admin klik "Mulai Analisis KIP"]
    ↓
[Sistem validasi session] → {Valid?} ─[NO]→ [Redirect login]
    ↓ [YES]
[Sistem tampilkan konfirmasi]
    ↓
{Admin konfirmasi?}
    ├─ [NO] → [Batal analisis] → [Kembali ke dashboard]
    └─ [YES] → [Sistem buat/bersihkan sheet KIP_Analisis]
        ↓
    [Sistem setup header sheet]
        ↓
    [Sistem ambil semua data siswa aktif]
        ↓
    {Ada siswa aktif?}
        ├─ [NO] → [Tampilkan error "Tidak ada siswa aktif"]
        └─ [YES] → [Loop: Proses setiap siswa]
            ├─ [Analisis siswa individual]
            ├─ [Hitung skor total]
            └─ [Tentukan kategori]
            ↓
        [Sort berdasarkan skor total (descending)]
            ↓
        [Assign ranking]
            ↓
        [Simpan hasil ke sheet KIP_Analisis]
            ↓
        [Tampilkan pesan sukses dengan statistik]
            ↓
        [Redirect ke hasil analisis]
            ↓
        [END]
```

**Decision Points:**
- Session valid
- Admin konfirmasi analisis
- Ada siswa aktif

**Parallel Activities:**
- Tidak ada (sequential processing untuk akurasi)

**Exception Handling:**
- Tidak ada siswa aktif
- Error saat create sheet
- Memory limit saat processing
- Error saat simpan hasil

---

### UC-019: Melihat Hasil Analisis KIP

```
[START] → [Admin mengakses halaman hasil KIP]
    ↓
[Sistem validasi session] → {Valid?} ─[NO]→ [Redirect login]
    ↓ [YES]
[Sistem cek ketersediaan data analisis]
    ↓
{Data analisis ada?}
    ├─ [NO] → [Tampilkan "Belum ada analisis"] → [Redirect ke dashboard KIP]
    └─ [YES] → [Sistem ambil data dari sheet KIP_Analisis]
        ↓
    [Admin set filter (optional)]
        ↓
    {Ada filter?}
        ├─ [YES] → [Terapkan filter kategori/kelas]
        └─ [NO] → [Tampilkan semua data]
        ↓
    [Parallel: Generate tampilan]
        ├─ [Format tabel hasil]
        ├─ [Generate chart distribusi kategori]
        └─ [Hitung statistik summary]
        ↓
    [Render halaman hasil]
        ↓
    [Tampilkan ke admin]
        ↓
    [END]
```

**Decision Points:**
- Session valid
- Data analisis tersedia
- Filter diterapkan

**Parallel Activities:**
- Generate berbagai komponen tampilan

**Exception Handling:**
- Data analisis tidak ada
- Error saat load data
- Chart generation failed

---

### UC-020: Menganalisis Siswa Individual

```
[START] → [Sistem terima data siswa]
    ↓
[Parallel: Ambil data ekonomi keluarga]
    ├─ [Ambil penghasilan ayah]
    ├─ [Ambil penghasilan ibu]
    ├─ [Ambil penghasilan wali]
    ├─ [Ambil status orang tua]
    ├─ [Ambil jumlah saudara]
    └─ [Ambil riwayat beasiswa]
    ↓
[Parallel: Hitung skor komponen]
    ├─ [Hitung skor penghasilan (0-100)]
    ├─ [Hitung skor status keluarga (0-100)]
    ├─ [Hitung skor tanggungan (0-100)]
    └─ [Hitung skor beasiswa (0-100)]
    ↓
[Jumlahkan semua skor]
    ↓
[Tentukan kategori berdasarkan total skor]
    ├─ [Sangat Layak: 300-400]
    ├─ [Layak: 200-299]
    ├─ [Cukup Layak: 100-199]
    └─ [Kurang Layak: 0-99]
    ↓
[Return hasil analisis]
    ↓
[END]
```

**Decision Points:**
- Tidak ada (pure calculation)

**Parallel Activities:**
- Pengambilan data ekonomi keluarga
- Perhitungan skor komponen

**Exception Handling:**
- Data ekonomi tidak lengkap
- Error saat calculate skor
- Invalid data format

---

### UC-021: Menghitung Skor Komponen KIP

```
[START] → [Sistem terima data komponen]
    ↓
[Parallel: Hitung setiap komponen]
    ├─ [SKOR PENGHASILAN]
    │   ├─ {Tidak berpenghasilan?} → [Skor: 100]
    │   ├─ {< Rp1.000.000?} → [Skor: 100]
    │   ├─ {Rp1.000.000-1.999.999?} → [Skor: 80]
    │   ├─ {Rp2.000.000-2.999.999?} → [Skor: 60]
    │   ├─ {Rp3.000.000-4.999.999?} → [Skor: 40]
    │   ├─ {Rp5.000.000-9.999.999?} → [Skor: 20]
    │   └─ {≥ Rp10.000.000?} → [Skor: 10]
    │
    ├─ [SKOR STATUS KELUARGA]
    │   ├─ {Yatim Piatu?} → [Skor: 100]
    │   ├─ {Yatim atau Piatu?} → [Skor: 80]
    │   └─ {Lengkap?} → [Skor: 40]
    │
    ├─ [SKOR TANGGUNGAN]
    │   ├─ {≥ 4 saudara?} → [Skor: 100]
    │   ├─ {3 saudara?} → [Skor: 80]
    │   ├─ {2 saudara?} → [Skor: 60]
    │   ├─ {1 saudara?} → [Skor: 40]
    │   └─ {Anak tunggal?} → [Skor: 20]
    │
    └─ [SKOR BEASISWA]
        ├─ {Pernah beasiswa?} → [Skor: 20]
        └─ {Belum pernah?} → [Skor: 100]
    ↓
[Return semua skor komponen]
    ↓
[END]
```

**Decision Points:**
- Multiple decision points untuk setiap komponen

**Parallel Activities:**
- Perhitungan skor komponen secara bersamaan

**Exception Handling:**
- Data komponen tidak valid
- Range penghasilan tidak dikenali
- Status keluarga tidak standar

---

### UC-022: Export Data Analisis KIP

```
[START] → [Admin klik "Export Excel"]
    ↓
[Sistem validasi session] → {Valid?} ─[NO]→ [Redirect login]
    ↓ [YES]
[Sistem cek data analisis]
    ↓
{Data analisis ada?}
    ├─ [NO] → [Tampilkan error "Tidak ada data untuk export"]
    └─ [YES] → [Sistem buat spreadsheet baru]
        ↓
    [Sistem setup header Excel]
        ↓
    [Sistem copy data hasil analisis]
        ↓
    [Parallel: Format spreadsheet]
        ├─ [Format header (background, font)]
        ├─ [Auto resize columns]
        └─ [Set sharing permission]
        ↓
    [Generate URL download Excel]
        ↓
    [Return URL dan filename ke admin]
        ↓
    [Admin download file]
        ↓
    [END]
```

**Decision Points:**
- Session valid
- Data analisis tersedia

**Parallel Activities:**
- Formatting spreadsheet

**Exception Handling:**
- Tidak ada data untuk export
- Error saat create spreadsheet
- Permission setting failed
- File generation timeout

---

### UC-023: Melihat Statistik Dashboard KIP

```
[START] → [Admin mengakses dashboard KIP]
    ↓
[Sistem validasi session] → {Valid?} ─[NO]→ [Redirect login]
    ↓ [YES]
[Sistem cek data analisis]
    ↓
{Data analisis ada?}
    ├─ [NO] → [Tampilkan dashboard kosong dengan tombol "Mulai Analisis"]
    └─ [YES] → [Parallel: Hitung statistik]
        ├─ [Hitung jumlah per kategori]
        │   ├─ [Sangat Layak]
        │   ├─ [Layak]
        │   ├─ [Cukup Layak]
        │   └─ [Kurang Layak]
        ├─ [Hitung persentase distribusi]
        ├─ [Hitung rata-rata skor]
        └─ [Identifikasi top 10 siswa]
        ↓
    [Parallel: Generate visualisasi]
        ├─ [Pie chart distribusi kategori]
        ├─ [Bar chart per kelas]
        └─ [Tabel ranking teratas]
        ↓
    [Render dashboard KIP]
        ↓
    [Tampilkan ke admin]
        ↓
    [END]
```

**Decision Points:**
- Session valid
- Data analisis tersedia

**Parallel Activities:**
- Perhitungan statistik
- Generate visualisasi

**Exception Handling:**
- Data analisis tidak ada
- Error saat calculate statistik
- Chart generation failed

---

## F. MODUL SISTEM & UTILITAS

### UC-024: Mengelola Session Otomatis

```
[START] → [Sistem menerima request]
    ↓
[Sistem extract session ID dari request]
    ↓
{Session ID ada?}
    ├─ [NO] → [Set status: not authenticated]
    └─ [YES] → [Sistem ambil session data]
        ↓
    {Session data valid?}
        ├─ [NO] → [Hapus session] → [Set status: not authenticated]
        └─ [YES] → [Cek expiry time]
            ↓
        {Session expired?}
            ├─ [YES] → [Hapus session] → [Set status: not authenticated]
            └─ [NO] → [Perpanjang session (extend 2 jam)]
                ↓
            [Update last activity]
                ↓
            [Set status: authenticated]
                ↓
            [Lanjutkan request]
                ↓
            [END]
```

**Decision Points:**
- Session ID tersedia
- Session data valid
- Session belum expired

**Parallel Activities:**
- Tidak ada

**Exception Handling:**
- Session corrupted
- Database connection error
- Session storage full

---

### UC-025: Mengelola File dan Folder

```
[START] → [Sistem terima request akses file]
    ↓
[Sistem ambil parameter (NIS, nama siswa)]
    ↓
[Sistem konstruksi nama file pattern]
    ↓
[Sistem akses Google Drive folder]
    ↓
{Folder accessible?}
    ├─ [NO] → [Return error "Folder tidak dapat diakses"]
    └─ [YES] → [Cari file dengan nama exact]
        ↓
    {File ditemukan (exact)?}
        ├─ [YES] → [Generate URL akses]
        └─ [NO] → [Cari dengan pattern matching]
            ↓
        {File ditemukan (pattern)?}
            ├─ [YES] → [Generate URL akses]
            └─ [NO] → [Return error "File tidak ditemukan"]
                ↓
        [Cek permission file]
            ↓
        {File accessible?}
            ├─ [NO] → [Return error "Access denied"]
            └─ [YES] → [Return URL sukses]
                ↓
            [END]
```

**Decision Points:**
- Folder dapat diakses
- File ditemukan (exact match)
- File ditemukan (pattern match)
- File dapat diakses

**Parallel Activities:**
- Tidak ada

**Exception Handling:**
- Folder tidak dapat diakses
- File tidak ditemukan
- Permission denied
- Google Drive API error

---

## RINGKASAN ANALISIS ACTIVITY DIAGRAM

### KOMPLEKSITAS FLOW:
- **Simple Flow (Linear):** 8 use cases
- **Medium Flow (dengan decision points):** 12 use cases
- **Complex Flow (dengan parallel activities):** 5 use cases

### DECISION POINTS TERBANYAK:
1. **UC-021 (Menghitung Skor Komponen KIP):** 15+ decision points
2. **UC-018 (Memulai Analisis KIP):** 6 decision points
3. **UC-008 (Menambah Data Siswa Baru):** 5 decision points

### PARALLEL ACTIVITIES TERBANYAK:
1. **UC-020 (Menganalisis Siswa Individual):** 6 parallel activities
2. **UC-004 (Melihat Dashboard Utama):** 4 parallel activities
3. **UC-010 (Menghapus Data Siswa):** 3 parallel activities

### EXCEPTION HANDLING:
- **Setiap use case memiliki 2-5 exception scenarios**
- **Total 75+ exception scenarios** yang perlu ditangani
- **Kategori utama:** Authentication, Data validation, System errors, Permission issues

### REKOMENDASI OPTIMASI:
1. **Implementasi caching** untuk use cases dengan data loading berat
2. **Asynchronous processing** untuk analisis KIP
3. **Better error handling** dengan user-friendly messages
4. **Progress indicators** untuk long-running operations
5. **Rollback mechanisms** untuk operations yang mengubah multiple sheets

---

**Dokumen ini menggambarkan flow detail dari 25 use cases dalam aplikasi Admin Dashboard Buku Induk Siswa, termasuk decision points, parallel activities, dan exception handling untuk setiap scenario.**