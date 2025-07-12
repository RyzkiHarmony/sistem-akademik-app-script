# Tabel Pengujian Web Google Apps Script - Buku Induk Siswa

## Informasi Umum
- **Aplikasi**: Sistem Buku Induk Siswa
- **Platform**: Google Apps Script
- **Tanggal Pengujian**: [Tanggal]
- **Versi**: 1.0
- **Tester**: [Nama Tester]

## 1. Pengujian Halaman Login

| No | Test Case | Langkah Pengujian | Expected Result | Actual Result | Status | Catatan |
|----|-----------|-------------------|-----------------|---------------|--------|---------|
| 1.1 | Login dengan kredensial valid | 1. Buka halaman login<br>2. Masukkan username/password yang benar<br>3. Klik tombol login | Berhasil masuk ke dashboard | | ⏳ | |
| 1.2 | Login dengan kredensial invalid | 1. Masukkan username/password salah<br>2. Klik tombol login | Muncul pesan error | | ⏳ | |
| 1.3 | Validasi field kosong | 1. Biarkan field kosong<br>2. Klik tombol login | Muncul validasi field required | | ⏳ | |
| 1.4 | Responsivitas mobile | 1. Buka di perangkat mobile<br>2. Test semua fungsi login | Layout responsive dan fungsional | | ⏳ | |

## 2. Pengujian Dashboard

| No | Test Case | Langkah Pengujian | Expected Result | Actual Result | Status | Catatan |
|----|-----------|-------------------|-----------------|---------------|--------|---------|
| 2.1 | Tampilan statistik | 1. Login ke dashboard<br>2. Periksa card statistik | Menampilkan jumlah siswa, nilai, dll | | ⏳ | |
| 2.2 | Navigasi sidebar | 1. Klik menu sidebar<br>2. Test semua link menu | Navigasi berfungsi dengan benar | | ⏳ | |
| 2.3 | Mobile toggle | 1. Buka di mobile<br>2. Klik hamburger menu | Sidebar dapat dibuka/tutup | | ⏳ | |
| 2.4 | Ikon Font Awesome | 1. Periksa semua ikon<br>2. Pastikan tidak ada kotak rusak | Semua ikon tampil dengan benar | | ⏳ | |

## 3. Pengujian Manajemen Siswa

| No | Test Case | Langkah Pengujian | Expected Result | Actual Result | Status | Catatan |
|----|-----------|-------------------|-----------------|---------------|--------|---------|
| 3.1 | Tampil daftar siswa | 1. Buka halaman Students_manage<br>2. Periksa tabel siswa | Data siswa tampil dalam tabel | | ⏳ | |
| 3.2 | Pencarian siswa | 1. Masukkan nama di search box<br>2. Klik tombol cari | Hasil pencarian sesuai keyword | | ⏳ | |
| 3.3 | Filter siswa | 1. Pilih filter (kelas, status, dll)<br>2. Apply filter | Data terfilter sesuai kriteria | | ⏳ | |
| 3.4 | Refresh data | 1. Klik tombol refresh<br>2. Tunggu loading | Data ter-refresh dari spreadsheet | | ⏳ | |
| 3.5 | Batch update status | 1. Pilih multiple siswa<br>2. Update status batch | Status berubah untuk siswa terpilih | | ⏳ | |
| 3.6 | Export data | 1. Klik tombol export<br>2. Pilih format export | File berhasil di-download | | ⏳ | |

## 4. Pengujian Detail Siswa

| No | Test Case | Langkah Pengujian | Expected Result | Actual Result | Status | Catatan |
|----|-----------|-------------------|-----------------|---------------|--------|---------|
| 4.1 | Tampil detail siswa | 1. Klik tombol "Lihat" pada siswa<br>2. Periksa data detail | Semua data siswa tampil lengkap | | ⏳ | |
| 4.2 | Edit data siswa | 1. Klik tombol "Edit"<br>2. Ubah beberapa field<br>3. Simpan perubahan | Data berhasil diupdate | | ⏳ | |
| 4.3 | Validasi form edit | 1. Kosongkan field required<br>2. Coba simpan | Muncul validasi error | | ⏳ | |
| 4.4 | Generate PDF | 1. Klik tombol "Generate PDF"<br>2. Tunggu proses | PDF berhasil dibuat dan didownload | | ⏳ | |
| 4.5 | Navigasi kembali | 1. Klik tombol "Kembali"<br>2. Periksa navigasi | Kembali ke halaman sebelumnya | | ⏳ | |

## 5. Pengujian Nilai Siswa

| No | Test Case | Langkah Pengujian | Expected Result | Actual Result | Status | Catatan |
|----|-----------|-------------------|-----------------|---------------|--------|---------|
| 5.1 | Tampil daftar nilai | 1. Buka halaman Students_grades<br>2. Periksa tabel nilai | Data nilai siswa tampil | | ⏳ | |
| 5.2 | Detail nilai siswa | 1. Klik "Detail Nilai" pada siswa<br>2. Periksa breakdown nilai | Nilai akademik dan ujian tampil | | ⏳ | |
| 5.3 | Pencarian nilai | 1. Cari siswa berdasarkan nama<br>2. Filter berdasarkan kelas | Hasil pencarian akurat | | ⏳ | |
| 5.4 | Refresh data nilai | 1. Klik refresh<br>2. Tunggu loading | Data nilai ter-update | | ⏳ | |
| 5.5 | Statistik nilai | 1. Periksa summary card<br>2. Validasi perhitungan | Statistik nilai benar | | ⏳ | |

## 6. Pengujian Analisis KIP

| No | Test Case | Langkah Pengujian | Expected Result | Actual Result | Status | Catatan |
|----|-----------|-------------------|-----------------|---------------|--------|---------|
| 6.1 | Tampil halaman KIP | 1. Buka halaman KIP_Analysis<br>2. Periksa layout | Halaman tampil dengan benar | | ⏳ | |
| 6.2 | Statistik KIP | 1. Periksa card statistik<br>2. Validasi angka | Statistik KIP akurat | | ⏳ | |
| 6.3 | Analisis otomatis | 1. Klik "Mulai Analisis"<br>2. Tunggu proses selesai | Analisis berhasil dan hasil tampil | | ⏳ | |
| 6.4 | Tabel hasil analisis | 1. Periksa tabel ranking<br>2. Test sorting kolom | Tabel berfungsi dengan baik | | ⏳ | |
| 6.5 | Filter hasil | 1. Filter berdasarkan kategori<br>2. Cari siswa tertentu | Filter berfungsi dengan benar | | ⏳ | |
| 6.6 | Export hasil KIP | 1. Klik tombol export<br>2. Download file | File hasil analisis berhasil didownload | | ⏳ | |
| 6.7 | Detail siswa KIP | 1. Klik "Detail" pada siswa<br>2. Periksa breakdown skor | Modal detail tampil dengan lengkap | | ⏳ | |

## 7. Pengujian Responsivitas

| No | Test Case | Langkah Pengujian | Expected Result | Actual Result | Status | Catatan |
|----|-----------|-------------------|-----------------|---------------|--------|---------|
| 7.1 | Desktop (1920x1080) | 1. Buka di resolusi desktop<br>2. Test semua halaman | Layout optimal untuk desktop | | ⏳ | |
| 7.2 | Tablet (768x1024) | 1. Buka di resolusi tablet<br>2. Test navigasi dan fungsi | Layout responsive untuk tablet | | ⏳ | |
| 7.3 | Mobile (375x667) | 1. Buka di resolusi mobile<br>2. Test semua fungsi | Layout mobile-friendly | | ⏳ | |
| 7.4 | Orientasi landscape | 1. Rotate ke landscape<br>2. Test fungsi utama | Tetap berfungsi di landscape | | ⏳ | |

## 8. Pengujian Performance

| No | Test Case | Langkah Pengujian | Expected Result | Actual Result | Status | Catatan |
|----|-----------|-------------------|-----------------|---------------|--------|---------|
| 8.1 | Loading time halaman | 1. Measure loading time<br>2. Test di berbagai halaman | Loading < 5 detik | | ⏳ | |
| 8.2 | Loading data besar | 1. Test dengan 1000+ siswa<br>2. Measure response time | Tetap responsive | | ⏳ | |
| 8.3 | Concurrent users | 1. Test dengan multiple users<br>2. Monitor performance | Tidak ada degradasi signifikan | | ⏳ | |
| 8.4 | Memory usage | 1. Monitor penggunaan memory<br>2. Test long session | Tidak ada memory leak | | ⏳ | |

## 9. Pengujian Keamanan

| No | Test Case | Langkah Pengujian | Expected Result | Actual Result | Status | Catatan |
|----|-----------|-------------------|-----------------|---------------|--------|---------|
| 9.1 | Session management | 1. Test timeout session<br>2. Test invalid session | Redirect ke login jika invalid | | ⏳ | |
| 9.2 | Input validation | 1. Input karakter khusus<br>2. Test SQL injection | Input ter-sanitasi dengan benar | | ⏳ | |
| 9.3 | Authorization | 1. Test akses tanpa login<br>2. Test direct URL access | Akses ditolak jika tidak authorized | | ⏳ | |
| 9.4 | Data privacy | 1. Periksa data exposure<br>2. Test data leakage | Data sensitif terlindungi | | ⏳ | |

## 10. Pengujian Integrasi

| No | Test Case | Langkah Pengujian | Expected Result | Actual Result | Status | Catatan |
|----|-----------|-------------------|-----------------|---------------|--------|---------|
| 10.1 | Google Sheets sync | 1. Update data di sheets<br>2. Refresh aplikasi | Data tersinkronisasi | | ⏳ | |
| 10.2 | PDF generation | 1. Generate berbagai PDF<br>2. Test dengan data lengkap | PDF terbuat dengan format benar | | ⏳ | |
| 10.3 | Export functionality | 1. Export ke berbagai format<br>2. Validasi data export | Data export akurat dan lengkap | | ⏳ | |
| 10.4 | Email notifications | 1. Test notifikasi email<br>2. Periksa delivery | Email terkirim dengan benar | | ⏳ | |

## Legend Status:
- ✅ **PASS**: Test berhasil sesuai expected result
- ❌ **FAIL**: Test gagal, tidak sesuai expected result
- ⚠️ **PARTIAL**: Test sebagian berhasil dengan catatan
- ⏳ **PENDING**: Belum ditest
- 🚫 **BLOCKED**: Test terblokir karena dependency

## Summary Hasil Pengujian

### Statistik Pengujian
- **Total Test Cases**: 40
- **Passed**: 0
- **Failed**: 0
- **Pending**: 40
- **Pass Rate**: 0%

### Critical Issues Found
[Daftar issue kritis yang ditemukan]

### Recommendations
[Rekomendasi perbaikan berdasarkan hasil pengujian]

### Test Environment
- **Browser**: Chrome, Firefox, Safari, Edge
- **OS**: Windows, macOS, Android, iOS
- **Network**: WiFi, 4G, 3G
- **Device**: Desktop, Tablet, Mobile

---
**Catatan**: Tabel ini harus diupdate secara berkala seiring dengan pengembangan fitur baru atau perbaikan bug.