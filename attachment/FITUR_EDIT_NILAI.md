# FITUR EDIT NILAI SISWA

## Deskripsi

Fitur edit nilai siswa memungkinkan admin untuk mengubah nilai akademik siswa langsung dari halaman detail nilai siswa. Fitur ini menggunakan mekanisme yang sama dengan edit data siswa untuk konsistensi pengalaman pengguna.

## Komponen yang Ditambahkan

### 1. Backend (Code.js)

- **Fungsi `updateStudentGrades(updateData, sessionId)`**
  - Menangani update nilai siswa ke Google Sheets
  - Validasi sesi pengguna
  - Validasi nilai (0-100)
  - Pencarian record berdasarkan NIS, kelas, dan semester
  - Logging aktivitas update

### 2. Frontend HTML (Student_grades_detail.html)

- **Tombol Edit Nilai**
  - Ditambahkan di header kartu nilai akademik
  - Menggunakan ikon Font Awesome
  - Tooltip untuk panduan pengguna

### 3. CSS Styling (CSS_Student_grades_detail.html)

- **Styling tombol edit**
  - Konsisten dengan desain aplikasi
  - State hover dan disabled
  - Mode save dan cancel
- **Styling input nilai**
  - Input number dengan validasi visual
  - Responsive design untuk mobile
- **Alert notifications**
  - Success, error, dan info alerts
  - Animasi slide-in dari kanan

### 4. JavaScript Logic (JavaScript_Student_grades_detail.html)

- **Mode edit nilai**
  - Toggle antara view dan edit mode
  - Konversi display nilai ke input fields
  - Validasi real-time input
- **Manajemen state**
  - Tracking perubahan nilai
  - Restore nilai original saat cancel
  - Caching data untuk performa
- **Integrasi server**
  - Pemanggilan fungsi backend
  - Error handling
  - Success feedback

## Cara Penggunaan

1. **Akses halaman detail nilai siswa**

   - Navigasi dari halaman kelola nilai siswa
   - Klik tombol "Detail" pada siswa yang diinginkan

2. **Aktifkan mode edit**

   - Klik tombol "Edit Nilai" di kartu nilai akademik
   - Nilai akan berubah menjadi input fields

3. **Edit nilai**

   - Masukkan nilai baru (0-100)
   - Validasi otomatis akan berjalan
   - Input invalid akan ditandai dengan border merah

4. **Simpan atau batalkan**

   - Klik "Simpan" untuk menyimpan perubahan
   - Klik "Batal" untuk membatalkan dan kembali ke nilai original

5. **Konfirmasi**
   - Alert akan muncul untuk konfirmasi sukses/error
   - Data akan di-refresh otomatis setelah save berhasil

## Validasi

- **Nilai harus berupa angka** antara 0-100
- **Sesi pengguna** harus valid
- **Data siswa** (NIS, kelas, semester) harus lengkap
- **Perubahan** akan dideteksi otomatis

## Keamanan

- Validasi sesi di backend
- Sanitasi input nilai
- Logging aktivitas update
- Error handling yang komprehensif

## Konsistensi dengan Edit Data Siswa

- **Pola UI/UX yang sama**

  - Tombol edit dengan ikon yang konsisten
  - Mode toggle (view/edit)
  - Tombol save dan cancel

- **Struktur kode yang serupa**

  - Fungsi backend dengan parameter dan validasi serupa
  - JavaScript dengan state management yang sama
  - CSS styling yang konsisten

- **Error handling yang seragam**
  - Alert notifications dengan styling sama
  - Pesan error yang informatif
  - Loading states yang konsisten

## Mata Pelajaran yang Didukung

1. Pendidikan Agama Islam
2. Pendidikan Pancasila
3. Bahasa Indonesia
4. Matematika
5. Ilmu Pengetahuan Alam
6. Ilmu Pengetahuan Sosial
7. Bahasa Inggris
8. Pendidikan Jasmani, Olahraga, dan Kesehatan
9. Informatika
10. Seni Budaya
11. Bimbingan dan Konseling
12. Bahasa Jawa

## Teknologi yang Digunakan

- **Backend**: Google Apps Script
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Database**: Google Sheets
- **Icons**: Font Awesome 6
- **Styling**: Custom CSS dengan responsive design

## Troubleshooting dan Perbaikan

### Masalah: Edit Nilai Gagal Disimpan

**Penyebab**:
Terdapat ketidaksesuaian antara nama field yang digunakan dalam mapping JavaScript dengan nama kolom sebenarnya di Google Sheet "DATA NILAI".

**Detail Masalah**:

- Fungsi `getGradeFieldName()` mengembalikan nama field dalam format camelCase (contoh: `pendidikanAgamaIslam`)
- Nama kolom di sheet DATA NILAI menggunakan format nama lengkap (contoh: `Pendidikan Agama Islam`)
- Akibatnya, fungsi `updateStudentGrades()` tidak dapat menemukan kolom yang tepat untuk diupdate

**Solusi yang Diterapkan**:

1. **Perbaikan Mapping Field**: Mengubah mapping dalam fungsi `getGradeFieldName()` agar menggunakan nama kolom yang sebenarnya:

   ```javascript
   // SEBELUM (SALAH)
   'Pendidikan Agama Islam': 'pendidikanAgamaIslam'

   // SESUDAH (BENAR)
   'Pendidikan Agama Islam': 'Pendidikan Agama Islam'
   ```

2. **Validasi Kolom**: Backend function `updateStudentGrades()` sudah memiliki validasi untuk memastikan kolom ditemukan sebelum melakukan update

3. **Error Handling**: Sistem memberikan pesan error yang jelas jika kolom tidak ditemukan

**Status**: ✅ **DIPERBAIKI** - Fitur edit nilai sekarang dapat menyimpan perubahan dengan benar ke Google Sheet.

### Masalah Kedua: Kolom Kelas dan Semester Tidak Ditemukan

**Penyebab**:
Fungsi `updateStudentGrades()` mencari kolom dengan nama "kelas" dan "semester" (huruf kecil), tetapi nama kolom sebenarnya di sheet DATA NILAI adalah "Kelas" dan "Semester" (huruf kapital).

**Detail Masalah**:

```javascript
// SEBELUM (SALAH)
const kelasIndex = headers.indexOf("kelas");
const semesterIndex = headers.indexOf("semester");

// SESUDAH (BENAR)
const kelasIndex = headers.indexOf("Kelas");
const semesterIndex = headers.indexOf("Semester");
```

**Solusi yang Diterapkan**:

1. **Perbaikan Case Sensitivity**: Mengubah pencarian kolom agar sesuai dengan nama kolom yang sebenarnya
2. **Konsistensi dengan Header Sheet**: Menggunakan nama kolom persis seperti di sheet DATA NILAI
3. **Validasi Error**: Sistem akan memberikan error "Kolom kelas/semester tidak ditemukan" jika masih salah

**Status**: ✅ **DIPERBAIKI** - Pencarian kolom kelas dan semester sekarang menggunakan case yang benar.

### Masalah Ketiga: Edit Mode Tidak Berfungsi Setelah Cancel

**Penyebab**:
Fungsi `cancelGradeEditMode()` menggunakan `innerHTML` untuk mengembalikan input menjadi span, yang dapat merusak struktur DOM dan menyebabkan hanya sebagian field yang dapat diedit saat mode edit diaktifkan kembali.

**Detail Masalah**:

- Setelah klik Edit → Cancel → Edit lagi, hanya field PAI yang bisa diedit
- Fungsi `cancelGradeEditMode()` menggunakan `parentElement.innerHTML = ...` yang mengganti seluruh konten parent
- Ini menyebabkan elemen `.grade-value` tidak dikembalikan dengan struktur yang benar

**Solusi yang Diterapkan**:

```javascript
// SEBELUM (BERMASALAH)
parentElement.innerHTML = `<span class="grade-value ${gradeClass}">${displayValue}</span>`;

// SESUDAH (DIPERBAIKI)
input.remove();
const gradeSpan = document.createElement("span");
gradeSpan.className = `grade-value ${gradeClass}`;
gradeSpan.textContent = displayValue;
parentElement.appendChild(gradeSpan);
```

**Manfaat Perbaikan**:

1. **DOM Manipulation yang Aman**: Menggunakan `createElement()` dan `appendChild()` alih-alih `innerHTML`
2. **Struktur Konsisten**: Memastikan elemen `.grade-value` dikembalikan dengan struktur yang sama
3. **State Management**: Mode edit dapat diaktifkan berulang kali tanpa masalah

**Perbaikan Tambahan**:
Untuk memastikan DOM dikembalikan dengan sempurna, ditambahkan `parentElement.innerHTML = '';` sebelum `appendChild()` dalam fungsi `cancelGradeEditMode()` untuk membersihkan elemen parent sepenuhnya.

```javascript
// Perbaikan final untuk memastikan DOM bersih
parentElement.innerHTML = "";
parentElement.appendChild(gradeSpan);
```

**Status**: ✅ **DIPERBAIKI** - Mode edit sekarang dapat digunakan berulang kali tanpa masalah.

### Cara Verifikasi Perbaikan

1. Akses halaman detail nilai siswa
2. Klik tombol "Edit Nilai"
3. Ubah beberapa nilai mata pelajaran
4. Klik "Simpan"
5. Sistem harus menampilkan pesan "Nilai berhasil disimpan!"
6. Data akan ter-refresh otomatis menampilkan nilai yang telah diubah

## Catatan Pengembangan

- Fitur ini mengikuti pola yang sama dengan edit data siswa untuk konsistensi
- Validasi nilai dilakukan di frontend dan backend
- Data di-cache untuk performa yang lebih baik
- Responsive design untuk akses mobile
- Error handling yang robust untuk pengalaman pengguna yang baik
