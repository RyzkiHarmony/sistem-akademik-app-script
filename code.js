// ID Spreadsheet Acc (dibaca dari PropertiesService bila tersedia)
const SPREADSHEET_ACCOUNT_ID = "1XghbW1Ltp8DuqIBxlLEZQWtefwZSjX1Dn34nvpuo_vY";
const USERS_SHEET_NAME = "Users";
const SESSION_SHEET_NAME = "Sessions";

// Konstanta untuk Buku induk spreadsheet (dibaca dari PropertiesService bila tersedia)
const BUKU_INDUK_SPREADSHEET_ID =
  "1Xv8VGni724ljfMe1RW_0Io5bivzCOxgsZF-khqtoABc";
const STUDENTS_SHEET_NAME = "DATA SISWA";
const STUDENTS_GRADE_NAME = "DATA NILAI";

// Konstanta untuk folder Drive tempat menyimpan PDF siswa (dibaca dari PropertiesService bila tersedia)
const STUDENT_PDF_FOLDER_ID = "1wUht7lREV6ycI2WNP2FtJahvcFDUdZH1";

// Helper konfigurasi: baca Script Properties, fallback ke default di atas
function getConfigValue(key, fallback) {
  try {
    const sp = PropertiesService.getScriptProperties();
    const v = sp.getProperty(key);
    return v && v.trim() !== "" ? v : fallback;
  } catch (e) {
    return fallback;
  }
}

function getSpreadsheetAccountId() {
  return getConfigValue("SPREADSHEET_ACCOUNT_ID", SPREADSHEET_ACCOUNT_ID);
}

function getBukuIndukSpreadsheetId() {
  return getConfigValue("BUKU_INDUK_SPREADSHEET_ID", BUKU_INDUK_SPREADSHEET_ID);
}

function getStudentPdfFolderId() {
  return getConfigValue("STUDENT_PDF_FOLDER_ID", STUDENT_PDF_FOLDER_ID);
}

// Update the doGet function to check for session on protected pages






// Session Management Constants
const SESSION_EXPIRY_HOURS = 2; // Sessions expire after 2 hours

// Create a new session for a user


// Validate a session and return the username if valid


// Extend a session's expiry time


// Destroy a session


// Function to set a session and return dashboard URL








// Update logout function to destroy session


// Function to actually destroy the session from client-side


// Update getCurrentUserUsername to use sessions


// Fungsi untuk memverifikasi Login (hash + salt + pepper)


// Util: pastikan kolom keamanan Users tersedia
function ensureUserColumns(sheet, headerRow) {
  const required = [
    "username",
    "password",
    "password_hash",
    "salt",
    "iterations",
    "role",
  ];
  const headers = headerRow.slice();
  let changed = false;
  required.forEach(function (h) {
    if (headers.indexOf(h) === -1) {
      headers.push(h);
      changed = true;
    }
  });
  if (changed) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

// Util: konversi bytes ke hex string
function bytesToHex(bytes) {
  return bytes
    .map(function (b) {
      const v = b < 0 ? b + 256 : b;
      const s = v.toString(16);
      return s.length === 1 ? "0" + s : s;
    })
    .join("");
}

// Util: constant-time compare
function safeCompare(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) {
    r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return r === 0;
}

// Ambil pepper dari Script Properties (generate jika belum ada)


// Hash HMAC-SHA256 berulang dengan pepper + salt


// Mendapatkan URL halaman utama


//-----------------------------------------------------------------------------------------------------------------------

// Fungsi untuk mendapatkan data dashboard (statistik)
function getDashboardData() {
  try {
    // Buka spreadsheet buku induk (terpisah dari spreadsheet Login)
    const bukuIndukSS = SpreadsheetApp.openById(getBukuIndukSpreadsheetId());

    // Data yang akan dikembalikan
    const dashboardData = {
      totalSiswaAktif: 0,
      totalSiswaLulus: 0,
      rataRataNilai: 0,
      analisisKIP: 0,
      adminName: getCurrentUserUsername(),
    };

    // Hitung jumlah siswa berdasarkan status
    let studentsSheet = bukuIndukSS.getSheetByName(STUDENTS_SHEET_NAME);
    if (studentsSheet) {
      // Dapatkan semua data dari sheet
      const dataRange = studentsSheet.getDataRange();
      const values = dataRange.getValues();

      if (values.length > 1) {
        // Dapatkan header (baris pertama)
        const headers = values[0];

        // Cari indeks kolom status
        const statusIndex = findColumnIndex(headers, [
          "Status Akademik",
          "Status",
          "status",
        ]);

        Logger.log("Headers: " + JSON.stringify(headers));
        Logger.log("Status Index: " + statusIndex);

        if (statusIndex !== -1) {
          // Hitung siswa berdasarkan status
          for (let i = 1; i < values.length; i++) {
            const status = values[i][statusIndex];
            Logger.log("Row " + i + " status: " + status);
            if (status && status.toString().toLowerCase() === "aktif") {
              dashboardData.totalSiswaAktif++;
            } else if (status && status.toString().toLowerCase() === "lulus") {
              dashboardData.totalSiswaLulus++;
            }
          }
        } else {
          Logger.log("Status column not found in headers");
        }

        Logger.log(
          "Final counts - Aktif: " +
            dashboardData.totalSiswaAktif +
            ", Lulus: " +
            dashboardData.totalSiswaLulus
        );
      }
    } else {
      // Jika sheet belum ada, buat sheet baru
      createStudentsSheet(bukuIndukSS);
    }

    // Hitung rata-rata nilai siswa
    try {
      dashboardData.rataRataNilai = calculateOverallAverageGrade();
    } catch (error) {
      Logger.log("Error calculating average grade: " + error.message);
      dashboardData.rataRataNilai = 0;
    }

    // Hitung jumlah siswa layak KIP
    try {
      const kipStats = getKIPDashboardStats();
      dashboardData.analisisKIP = kipStats.layak + kipStats.sangatLayak;
    } catch (error) {
      Logger.log("Error getting KIP stats: " + error.message);
      dashboardData.analisisKIP = 0;
    }

    // Hitung data ringkasan
    try {
      const summaryStats = calculateSummaryStats();
      dashboardData.summaryStats = summaryStats;
    } catch (error) {
      Logger.log("Error calculating summary stats: " + error.message);
      dashboardData.summaryStats = {
        siswaAktif: 0,
        dataLengkap: 0,
        nilaiTerinput: 0,
      };
    }

    return dashboardData;
  } catch (error) {
    Logger.log("Error getting dashboard data: " + error.message);
    throw new Error("Gagal mendapatkan data dashboard: " + error.message);
  }
}

// Fungsi untuk menghitung statistik ringkasan dashboard
function calculateSummaryStats() {
  try {
    Logger.log("Calculating summary statistics...");

    const ss = SpreadsheetApp.openById(getBukuIndukSpreadsheetId());
    const studentsSheet = ss.getSheetByName(STUDENTS_SHEET_NAME);
    const gradesSheet = ss.getSheetByName(STUDENTS_GRADE_NAME);

    const summaryStats = {
      siswaAktif: 0,
      dataLengkap: 0,
      nilaiTerinput: 0,
    };

    if (!studentsSheet) {
      Logger.log("Students sheet not found");
      return summaryStats;
    }

    const studentData = studentsSheet.getDataRange().getValues();
    if (studentData.length <= 1) {
      Logger.log("No student data found");
      return summaryStats;
    }

    const headers = studentData[0];
    const statusIndex = findColumnIndex(headers, [
      "Status Akademik",
      "Status",
      "status",
    ]);

    let totalStudents = studentData.length - 1; // Exclude header
    let activeStudents = 0;
    let completeDataStudents = 0;

    // Hitung siswa aktif dan data lengkap
    for (let i = 1; i < studentData.length; i++) {
      const row = studentData[i];

      // Hitung siswa aktif
      if (statusIndex !== -1) {
        const status = row[statusIndex];
        if (status && status.toString().toLowerCase() === "aktif") {
          activeStudents++;
        }
      }

      // Hitung data lengkap (minimal 80% kolom terisi)
      let filledColumns = 0;
      for (let j = 0; j < row.length; j++) {
        if (row[j] && row[j].toString().trim() !== "") {
          filledColumns++;
        }
      }

      const completenessPercentage = (filledColumns / headers.length) * 100;
      if (completenessPercentage >= 80) {
        completeDataStudents++;
      }
    }

    // Hitung persentase siswa aktif
    summaryStats.siswaAktif =
      totalStudents > 0
        ? Math.round((activeStudents / totalStudents) * 100)
        : 0;

    // Hitung persentase data lengkap
    summaryStats.dataLengkap =
      totalStudents > 0
        ? Math.round((completeDataStudents / totalStudents) * 100)
        : 0;

    // Hitung persentase nilai terinput
    if (gradesSheet) {
      const gradeData = gradesSheet.getDataRange().getValues();
      if (gradeData.length > 1) {
        const gradeHeaders = gradeData[0];
        let studentsWithGrades = 0;

        for (let i = 1; i < gradeData.length; i++) {
          const row = gradeData[i];
          let hasGrades = false;

          // Cek apakah siswa memiliki nilai (minimal satu mata pelajaran)
          for (let j = 0; j < row.length; j++) {
            const value = row[j];
            if (value && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
              hasGrades = true;
              break;
            }
          }

          if (hasGrades) {
            studentsWithGrades++;
          }
        }

        const totalGradeStudents = gradeData.length - 1;
        summaryStats.nilaiTerinput =
          totalGradeStudents > 0
            ? Math.round((studentsWithGrades / totalGradeStudents) * 100)
            : 0;
      }
    }

    Logger.log(`Summary stats calculated: ${JSON.stringify(summaryStats)}`);
    return summaryStats;
  } catch (error) {
    Logger.log("Error in calculateSummaryStats: " + error.message);
    return {
      siswaAktif: 0,
      dataLengkap: 0,
      nilaiTerinput: 0,
    };
  }
}

// Fungsi untuk menghitung rata-rata nilai keseluruhan siswa
function calculateOverallAverageGrade() {
  try {
    Logger.log("Calculating overall average grade...");

    const ss = SpreadsheetApp.openById(getBukuIndukSpreadsheetId());
    const gradesSheet = ss.getSheetByName(STUDENTS_GRADE_NAME);

    if (!gradesSheet) {
      Logger.log("Grades sheet not found");
      return 0;
    }

    const dataRange = gradesSheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length <= 1) {
      Logger.log("No grade data found");
      return 0;
    }

    const headers = values[0];
    const gradeColumnMap = initializeGradeColumnMap(headers);

    // Daftar mata pelajaran yang akan dihitung
    const subjectFields = [
      "pendidikanAgamaIslam",
      "pendidikanPancasila",
      "bahasaIndonesia",
      "matematika",
      "ilmuPengetahuanAlam",
      "ilmuPengetahuanSosial",
      "bahasaInggris",
      "pendidikanJasmani",
      "informatika",
      "seniBudaya",
      "bimbinganKonseling",
      "bahasaJawa",
    ];

    let totalGrades = 0;
    let validGradeCount = 0;

    // Iterasi melalui semua baris data nilai
    for (let i = 1; i < values.length; i++) {
      const row = values[i];

      // Hitung nilai dari setiap mata pelajaran untuk siswa ini
      subjectFields.forEach((subject) => {
        const columnIndex = gradeColumnMap[subject];
        if (columnIndex !== -1) {
          const nilai = parseFloat(row[columnIndex]);
          if (!isNaN(nilai) && nilai > 0) {
            totalGrades += nilai;
            validGradeCount++;
          }
        }
      });
    }

    const averageGrade =
      validGradeCount > 0 ? totalGrades / validGradeCount : 0;
    const roundedAverage = Math.round(averageGrade * 10) / 10; // Round to 1 decimal place

    Logger.log(
      `Calculated overall average: ${roundedAverage} from ${validGradeCount} valid grades`
    );
    return roundedAverage;
  } catch (error) {
    Logger.log("Error in calculateOverallAverageGrade: " + error.message);
    return 0;
  }
}

// Fungsi untuk mendapatkan username pengguna yang sedang Login
// (Duplikasi dihapus - menggunakan fungsi yang sudah ada di atas)

// Fungsi untuk mendapatkan data siswa terbaru
function getRecentStudents() {
  try {
    // Buka spreadsheet
    const ss = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);

    // Dapatkan sheet siswa
    let studentsSheet = ss.getSheetByName(STUDENTS_SHEET_NAME);

    // Jika sheet belum ada, buat sheet baru
    if (!studentsSheet) {
      studentsSheet = createStudentsSheet(ss);
      // Return array kosong jika tidak ada data
      return [];
    }

    // Dapatkan semua data dari sheet
    const dataRange = studentsSheet.getDataRange();
    const values = dataRange.getValues();

    // Jika hanya ada baris header atau kosong, kembalikan array kosong
    if (values.length <= 1) {
      return [];
    }

    // Dapatkan header (baris pertama)
    const headers = values[0];

    // Indexing untuk kolom-kolom
    const nisIndex = headers.indexOf("NIS");
    const namaIndex = headers.indexOf("Nama Siswa");
    const jenisKelaminIndex = headers.indexOf("Jenis Kelamin");
    const tanggalDaftarIndex = headers.indexOf(
      "Hari, Tanggal, dan Tahun Diterima di SMPN 03 Pekalongan"
    );
    const statusIndex = headers.indexOf("Status Akademik");

    // Jika kolom-kolom wajib tidak ditemukan, tampilkan error
    if (nisIndex === -1 || namaIndex === -1) {
      throw new Error(
        "Format sheet siswa tidak valid. Kolom wajib tidak ditemukan."
      );
    }

    // Buat array untuk menampung data siswa
    const students = [];

    // Ambil semua data siswa terlebih dahulu
    // Mulai dari baris kedua (indeks 1) karena baris pertama adalah header
    for (let i = 1; i < values.length; i++) {
      const row = values[i];

      // Format tanggal untuk tampilan
      let tanggalDaftar = row[tanggalDaftarIndex];
      if (tanggalDaftar instanceof Date) {
        const options = { year: "numeric", month: "long", day: "numeric" };
        tanggalDaftar = tanggalDaftar.toLocaleDateString("id-ID", options);
      }

      // Buat objek siswa
      const student = {
        nis: row[nisIndex],
        nama: row[namaIndex],
        jenisKelamin: jenisKelaminIndex !== -1 ? row[jenisKelaminIndex] : "-",
        tanggalDaftar: tanggalDaftarIndex !== -1 ? tanggalDaftar : "-",
        status: statusIndex !== -1 ? row[statusIndex] : "Aktif",
      };

      students.push(student);
    }

    // Urutkan siswa berdasarkan NIS terbesar terlebih dahulu
    students.sort(function (a, b) {
      const nisA = parseInt(a.nis) || 0;
      const nisB = parseInt(b.nis) || 0;
      return nisB - nisA; // Descending order (NIS terbesar dulu)
    });

    // Ambil 5 siswa dengan NIS terbesar
    const recentStudents = students.slice(0, 5);

    return recentStudents;
  } catch (error) {
    Logger.log("Error getting recent students: " + error.message);
    throw new Error("Gagal mendapatkan data siswa terbaru: " + error.message);
  }
}

// Fungsi-fungsi untuk manajemen data siswa
// Map of column names to indices
let studentColumnMap = null;

// Function to get all students with optional filtering, sorting, and pagination
function getAllStudents(options = {}) {
  try {
    Logger.log(
      "getAllStudents called with options: " + JSON.stringify(options)
    );

    // Default options
    const defaultOptions = {
      searchQuery: "",
      statusFilter: "",
      sortField: "NIS",
      sortDirection: "asc",
      forceRefresh: false,
      page: 1, // Halaman yang diminta (default: 1)
      limit: 0, // Jumlah item per halaman (0 = semua data)
      fieldsToReturn: [], // Kolom yang ingin dikembalikan (kosong = semua kolom)
    };

    Logger.log("Default options: " + JSON.stringify(defaultOptions));

    // Merge default options with provided options
    options = { ...defaultOptions, ...options };
    Logger.log("Final merged options: " + JSON.stringify(options));

    // Access the spreadsheet
    Logger.log(
      "Attempting to open spreadsheet with ID: " + BUKU_INDUK_SPREADSHEET_ID
    );
    const ss = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    Logger.log("Spreadsheet opened successfully");

    let studentsSheet = ss.getSheetByName(STUDENTS_SHEET_NAME);
    Logger.log("Students sheet accessed: " + STUDENTS_SHEET_NAME);

    // Get all data from the sheet
    const dataRange = studentsSheet.getDataRange();
    Logger.log("Data range obtained: " + dataRange.getA1Notation());

    const values = dataRange.getValues();
    Logger.log("Total rows read from sheet: " + values.length);

    if (values.length > 0) {
      Logger.log("First row (headers): " + JSON.stringify(values[0]));
    }

    // Return empty array if only header or no data
    if (values.length <= 1) {
      Logger.log("No student data found (only headers or empty sheet)");
      return {
        students: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: options.page,
      };
    }

    // Extract the header row and initialize column map
    const headers = values[0];
    Logger.log("Headers extracted: " + JSON.stringify(headers));

    initializeColumnMap(headers);
    Logger.log("Column map initialized successfully");

    // Process data rows into student objects
    let students = [];
    Logger.log("Starting to process " + (values.length - 1) + " student rows");
    for (let i = 1; i < values.length; i++) {
      const row = values[i];

      // Skip rows that don't have essential data
      if (!row[studentColumnMap.nis] && !row[studentColumnMap.nama]) {
        continue;
      }

      // Create student object with basic fields for table display
      let student = {
        rowIndex: i + 1, // Store the actual sheet row index for later use in updates
      };

      if (options.fieldsToReturn && options.fieldsToReturn.length > 0) {
        // Hanya ambil kolom yang diminta
        options.fieldsToReturn.forEach((field) => {
          if (field === "nis") {
            student.nis = row[studentColumnMap.nis] || "";
          } else if (field === "nama") {
            student.nama = row[studentColumnMap.nama] || "";
          } else if (field === "nisn") {
            student.nisn = row[studentColumnMap.nisn] || "";
          } else if (field === "gender") {
            student.gender = row[studentColumnMap.gender] || "";
          } else if (field === "tanggalDaftar") {
            student.tanggalDaftar = formatDate(
              row[studentColumnMap.tanggalDaftar]
            );
          } else if (field === "status") {
            student.status = row[studentColumnMap.status] || "Aktif";
          } else if (field === "kelas") {
            student.kelas = row[studentColumnMap.kelas] || "";
          }
          // Tambahkan kolom lain sesuai kebutuhan
        });
      } else {
        // Ambil semua kolom (seperti implementasi sebelumnya)
        // Data Identitas Siswa
        student.nis = row[studentColumnMap.nis] || "";
        student.nama = row[studentColumnMap.nama] || "";
        student.nisn = row[studentColumnMap.nisn] || "";
        student.gender = row[studentColumnMap.gender] || "";
        student.nik = row[studentColumnMap.nik] || "";
        student.birthplace = row[studentColumnMap.birthplace] || "";
        student.birthdate = formatDate(row[studentColumnMap.birthdate]);
        student.birthdateInput = formatDateForInput(
          row[studentColumnMap.birthdate]
        );
        student.agama = row[studentColumnMap.agama] || "";
        student.kewarganegaraan = row[studentColumnMap.kewarganegaraan] || "";
        student.anakKe = row[studentColumnMap.anakKe] || "";
        student.jumlahSaudaraKandung =
          row[studentColumnMap.jumlahSaudaraKandung] || "";
        student.jumlahSaudaraTiri =
          row[studentColumnMap.jumlahSaudaraTiri] || "";
        student.jumlahSaudaraAngkat =
          row[studentColumnMap.jumlahSaudaraAngkat] || "";
        student.statusOrangTua = row[studentColumnMap.statusOrangTua] || "";
        student.bahasaSehari = row[studentColumnMap.bahasaSehari] || "";
        student.tinggalBersama = row[studentColumnMap.tinggalBersama] || "";
        student.transportasi = row[studentColumnMap.transportasi] || "";
        student.jarakKeSekolah = row[studentColumnMap.jarakKeSekolah] || "";

        // Data Alamat
        student.alamat = row[studentColumnMap.alamat] || "";
        student.rt = row[studentColumnMap.rt] || "";
        student.dusun = row[studentColumnMap.dusun] || "";
        student.desa = row[studentColumnMap.desa] || "";
        student.kecamatan = row[studentColumnMap.kecamatan] || "";
        student.kodePos = row[studentColumnMap.kodePos] || "";
        student.teleponRumah = row[studentColumnMap.teleponRumah] || "";
        student.kabupaten = row[studentColumnMap.kabupaten] || "";
        student.provinsi = row[studentColumnMap.provinsi] || "";

        // Data Kesehatan
        student.golonganDarah = row[studentColumnMap.golonganDarah] || "";
        student.penyakitPernah = row[studentColumnMap.penyakitPernah] || "";
        student.penyakitLain = row[studentColumnMap.penyakitLain] || "";
        student.kelainanJasmani = row[studentColumnMap.kelainanJasmani] || "";
        student.tinggiBadan = row[studentColumnMap.tinggiBadan] || "";
        student.beratBadan = row[studentColumnMap.beratBadan] || "";

        // Data Pendidikan
        student.asalSekolah = row[studentColumnMap.asalSekolah] || "";
        student.tanggalLulusSD = row[studentColumnMap.tanggalLulusSD] || "";
        student.noIjazahSD = row[studentColumnMap.noIjazahSD] || "";
        student.lamaBelajarSD = row[studentColumnMap.lamaBelajarSD] || "";
        student.siswaPindahan = row[studentColumnMap.siswaPindahan] || "";
        student.kelasAwal = row[studentColumnMap.kelasAwal] || "";
        student.tanggalDaftar = formatDate(row[studentColumnMap.tanggalDaftar]);
        student.entryDate = formatDateForInput(
          row[studentColumnMap.tanggalDaftar]
        );
        student.asalSekolahSMP = row[studentColumnMap.asalSekolahSMP] || "";
        student.alasanPindah = row[studentColumnMap.alasanPindah] || "";

        // Data Orang Tua - Ayah
        student.ayah = row[studentColumnMap.ayah] || "";
        student.nikAyah = row[studentColumnMap.nikAyah] || "";
        student.ttlAyah = row[studentColumnMap.ttlAyah] || "";
        student.agamaAyah = row[studentColumnMap.agamaAyah] || "";
        student.kewarganegaraanAyah =
          row[studentColumnMap.kewarganegaraanAyah] || "";
        student.pendidikanAyah = row[studentColumnMap.pendidikanAyah] || "";
        student.pekerjaanAyah = row[studentColumnMap.pekerjaanAyah] || "";
        student.penghasilanAyah = row[studentColumnMap.penghasilanAyah] || "";
        student.alamatAyah = row[studentColumnMap.alamatAyah] || "";
        student.phoneAyah = row[studentColumnMap.phoneAyah] || "";
        student.statusAyah = row[studentColumnMap.statusAyah] || "";

        // Data Orang Tua - Ibu
        student.ibu = row[studentColumnMap.ibu] || "";
        student.nikIbu = row[studentColumnMap.nikIbu] || "";
        student.ttlIbu = row[studentColumnMap.ttlIbu] || "";
        student.agamaIbu = row[studentColumnMap.agamaIbu] || "";
        student.kewarganegaraanIbu =
          row[studentColumnMap.kewarganegaraanIbu] || "";
        student.pendidikanIbu = row[studentColumnMap.pendidikanIbu] || "";
        student.pekerjaanIbu = row[studentColumnMap.pekerjaanIbu] || "";
        student.penghasilanIbu = row[studentColumnMap.penghasilanIbu] || "";
        student.alamatIbu = row[studentColumnMap.alamatIbu] || "";
        student.phoneIbu = row[studentColumnMap.phoneIbu] || "";
        student.statusIbu = row[studentColumnMap.statusIbu] || "";

        // Data Wali
        student.wali = row[studentColumnMap.wali] || "";
        student.nikWali = row[studentColumnMap.nikWali] || "";
        student.ttlWali = row[studentColumnMap.ttlWali] || "";
        student.agamaWali = row[studentColumnMap.agamaWali] || "";
        student.kewarganegaraanWali =
          row[studentColumnMap.kewarganegaraanWali] || "";
        student.pendidikanWali = row[studentColumnMap.pendidikanWali] || "";
        student.pekerjaanWali = row[studentColumnMap.pekerjaanWali] || "";
        student.penghasilanWali = row[studentColumnMap.penghasilanWali] || "";
        student.alamatWali = row[studentColumnMap.alamatWali] || "";
        student.phoneWali = row[studentColumnMap.phoneWali] || "";
        student.statusWali = row[studentColumnMap.statusWali] || "";

        // Data Hobi
        student.bidangSeni = row[studentColumnMap.bidangSeni] || "";
        student.bidangOlahraga = row[studentColumnMap.bidangOlahraga] || "";
        student.bidangLain = row[studentColumnMap.bidangLain] || "";

        // Data Prestasi
        student.pernahPrestasi = row[studentColumnMap.pernahPrestasi] || "";
        student.jenisPrestasi1 = row[studentColumnMap.jenisPrestasi1] || "";
        student.tingkatPrestasi1 = row[studentColumnMap.tingkatPrestasi1] || "";
        student.namaPrestasi1 = row[studentColumnMap.namaPrestasi1] || "";
        student.tahunPrestasi1 = row[studentColumnMap.tahunPrestasi1] || "";
        student.penyelenggara1 = row[studentColumnMap.penyelenggara1] || "";
        student.peringkat1 = row[studentColumnMap.peringkat1] || "";

        // Data Beasiswa
        student.pernahBeasiswa = row[studentColumnMap.pernahBeasiswa] || "";
        student.jenisBeasiswa1 = row[studentColumnMap.jenisBeasiswa1] || "";
        student.keteranganBeasiswa1 =
          row[studentColumnMap.keteranganBeasiswa1] || "";
        student.tahunMulaiBeasiswa1 =
          row[studentColumnMap.tahunMulaiBeasiswa1] || "";
        student.tahunSelesaiBeasiswa1 =
          row[studentColumnMap.tahunSelesaiBeasiswa1] || "";

        // Data Beasiswa 2
        student.lanjutBeasiswa2 = row[studentColumnMap.lanjutBeasiswa2] || "";
        student.jenisBeasiswa2 = row[studentColumnMap.jenisBeasiswa2] || "";
        student.keteranganBeasiswa2 =
          row[studentColumnMap.keteranganBeasiswa2] || "";
        student.tahunMulaiBeasiswa2 =
          row[studentColumnMap.tahunMulaiBeasiswa2] || "";
        student.tahunSelesaiBeasiswa2 =
          row[studentColumnMap.tahunSelesaiBeasiswa2] || "";

        // Data Beasiswa 3
        student.lanjutBeasiswa3 = row[studentColumnMap.lanjutBeasiswa3] || "";
        student.jenisBeasiswa3 = row[studentColumnMap.jenisBeasiswa3] || "";
        student.keteranganBeasiswa3 =
          row[studentColumnMap.keteranganBeasiswa3] || "";
        student.tahunMulaiBeasiswa3 =
          row[studentColumnMap.tahunMulaiBeasiswa3] || "";
        student.tahunSelesaiBeasiswa3 =
          row[studentColumnMap.tahunSelesaiBeasiswa3] || "";

        // Status Akademik
        student.status = row[studentColumnMap.status] || "Aktif";
        student.notes = row[studentColumnMap.notes] || "";

        // Kelas
        student.kelas = row[studentColumnMap.kelas] || "";
      }

      students.push(student);
    }

    Logger.log("Total students processed: " + students.length);

    // Apply search filter if provided
    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase().trim();
      Logger.log("Applying search filter with query: '" + query + "'");
      Logger.log("Total students before filter: " + students.length);

      for (let i = 0; i < Math.min(5, students.length); i++) {
        Logger.log(
          "Student " +
            i +
            " - NIS: '" +
            students[i].nis +
            "', Nama: '" +
            students[i].nama +
            "'"
        );
      }

      students = students.filter((student) => {
        // Improved search logic - more flexible matching
        const isNumericQuery = /^\d+$/.test(query);

        // Helper function for fuzzy matching
        function fuzzyMatch(text, searchQuery) {
          if (!text) return false;
          const textLower = text.toString().toLowerCase();

          // Direct substring match
          if (textLower.includes(searchQuery)) {
            return true;
          }

          // For numeric queries, also try partial matching from start
          if (isNumericQuery && textLower.startsWith(searchQuery)) {
            return true;
          }

          // Split search query into words for multi-word search
          const queryWords = searchQuery
            .split(/\s+/)
            .filter((word) => word.length > 0);
          if (queryWords.length > 1) {
            return queryWords.every((word) => textLower.includes(word));
          }

          return false;
        }

        // Search in multiple fields with improved logic
        let nisMatch = false;
        if (student.nis) {
          const nisStr = student.nis.toString();
          if (isNumericQuery) {
            // For numeric queries, allow partial match from start or exact match
            nisMatch = nisStr.startsWith(query) || nisStr === query;
          } else {
            // For non-numeric, use fuzzy matching
            nisMatch = fuzzyMatch(nisStr, query);
          }
        }

        // Search in name with fuzzy matching
        const namaMatch = student.nama && fuzzyMatch(student.nama, query);

        // Search in NISN with improved matching
        const nisnMatch = student.nisn && fuzzyMatch(student.nisn, query);

        // Additional search fields for better results
        const nikMatch = student.nik && fuzzyMatch(student.nik, query);
        const tempatLahirMatch =
          student.birthplace && fuzzyMatch(student.birthplace, query);

        const isMatch =
          nisMatch || namaMatch || nisnMatch || nikMatch || tempatLahirMatch;

        if (isMatch) {
          Logger.log(
            "Match found - NIS: '" +
              student.nis +
              "', Nama: '" +
              student.nama +
              "' (Query: '" +
              query +
              "', Numeric: " +
              isNumericQuery +
              ")"
          );
        }

        return isMatch;
      });

      Logger.log("Total students after filter: " + students.length);
    }

    // Apply status filter if provided
    if (options.statusFilter) {
      students = students.filter(
        (student) => student.status === options.statusFilter
      );
    }

    // Sort the results
    students.sort((a, b) => {
      let valA = a[options.sortField] || "";
      let valB = b[options.sortField] || "";

      // Convert to strings if they are not already
      if (typeof valA !== "string") valA = valA.toString();
      if (typeof valB !== "string") valB = valB.toString();

      // Perform the comparison based on sort direction
      if (options.sortDirection === "asc") {
        return valA.localeCompare(valB, "id", { numeric: true });
      } else {
        return valB.localeCompare(valA, "id", { numeric: true });
      }
    });

    // Hitung total data dan total halaman
    const totalCount = students.length;
    const totalPages =
      options.limit > 0 ? Math.ceil(totalCount / options.limit) : 1;

    // Terapkan pagination jika limit > 0
    if (options.limit > 0) {
      const startIndex = (options.page - 1) * options.limit;
      const endIndex = startIndex + options.limit;
      students = students.slice(startIndex, endIndex);
    }

    // Return data dengan informasi pagination
    const result = {
      students: students,
      totalCount: totalCount,
      totalPages: totalPages,
      currentPage: options.page,
    };

    Logger.log(
      "Returning result: students=" +
        students.length +
        ", totalCount=" +
        totalCount +
        ", totalPages=" +
        totalPages +
        ", currentPage=" +
        options.page
    );

    return result;
  } catch (error) {
    Logger.log("Error in getAllStudents: " + error.message);
    throw new Error("Gagal mendapatkan data siswa: " + error.message);
  }
}

// Fungsi untuk mendapatkan detail lengkap siswa berdasarkan NIS
function getStudentDetail(nisId) {
  try {
    if (!nisId) {
      throw new Error("NIS tidak valid");
    }

    Logger.log("Getting student detail for NIS: " + nisId);
    Logger.log("NIS type: " + typeof nisId + ", value: '" + nisId + "'");

    // Gunakan getAllStudents dengan fieldsToReturn kosong untuk mendapatkan semua data
    const options = {
      searchQuery: String(nisId).trim(), // Search by NIS
      fieldsToReturn: [], // Empty = get ALL fields dengan mapping yang konsisten
      limit: 1, // Only get this specific student
    };

    Logger.log("Search options: " + JSON.stringify(options));
    const result = getAllStudents(options);
    Logger.log(
      "getAllStudents result: " +
        JSON.stringify({
          hasResult: !!result,
          hasStudents: !!(result && result.students),
          studentsLength:
            result && result.students ? result.students.length : 0,
          totalCount: result ? result.totalCount : "undefined",
        })
    );

    if (!result || !result.students || result.students.length === 0) {
      Logger.log("Student not found for NIS: " + nisId);

      const ss = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
      const studentsSheet = ss.getSheetByName(STUDENTS_SHEET_NAME);
      const dataRange = studentsSheet.getDataRange();
      const values = dataRange.getValues();
      const headers = values[0];
      const nisIndex = headers.indexOf("NIS");

      for (let i = 1; i < Math.min(6, values.length); i++) {
        const rowNis = values[i][nisIndex];
        Logger.log(
          "Row " + i + " NIS: '" + rowNis + "' (type: " + typeof rowNis + ")"
        );
      }

      throw new Error("Siswa dengan NIS " + nisId + " tidak ditemukan");
    }

    const student = result.students[0];
    Logger.log("Student data retrieved successfully for NIS: " + nisId);

    // Tambahkan juga raw header-based data untuk kompatibilitas dengan populateViewModal
    // Akses spreadsheet untuk mendapatkan raw data
    const ss = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const studentsSheet = ss.getSheetByName(STUDENTS_SHEET_NAME);
    const dataRange = studentsSheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];
    const nisIndex = headers.indexOf("NIS");

    // Cari baris yang sesuai dan tambahkan data dengan header asli
    for (let i = 1; i < values.length; i++) {
      const rowNis = String(values[i][nisIndex] || "").trim();
      const searchNis = String(nisId || "").trim();

      if (rowNis === searchNis) {
        // Tambahkan data dengan key header asli untuk kompatibilitas
        for (let j = 0; j < headers.length && j < values[i].length; j++) {
          let value = values[i][j];

          // Format tanggal jika kolom tanggalDaftar
          if (
            headers[j] ===
              "Hari, Tanggal, dan Tahun Diterima di SMPN 03 Pekalongan" &&
            value instanceof Date
          ) {
            const options = { year: "numeric", month: "long", day: "numeric" };
            value = value.toLocaleDateString("id-ID", options);
          }

          student[headers[j]] = value;
        }
        break;
      }
    }

    return student;
  } catch (error) {
    Logger.log("Error getting student detail: " + error.message);
    throw new Error("Gagal mendapatkan detail siswa: " + error.message);
  }
}

// Mendapatkan detail siswa berdasarkan NIS (alias untuk kompatibilitas)

function findStudentByNIS(nisId) {
  try {
    Logger.log("=== FINDING STUDENT BY NIS ===");
    Logger.log('Looking for NIS: "' + nisId + '"');

    const ss = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const studentsSheet = ss.getSheetByName(STUDENTS_SHEET_NAME);

    if (!studentsSheet) {
      throw new Error('Sheet "' + STUDENTS_SHEET_NAME + '" tidak ditemukan');
    }

    const dataRange = studentsSheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length === 0) {
      throw new Error("Sheet kosong");
    }

    const headers = values[0];
    const nisIndex = headers.indexOf("NIS");

    if (nisIndex === -1) {
      throw new Error("Kolom NIS tidak ditemukan");
    }

    Logger.log("Searching in " + (values.length - 1) + " student records...");

    // Cari siswa
    for (let i = 1; i < values.length; i++) {
      const rowNIS = String(values[i][nisIndex]).trim();
      const searchNIS = String(nisId).trim();

      Logger.log(
        "Row " + i + ': comparing "' + rowNIS + '" with "' + searchNIS + '"'
      );

      if (rowNIS === searchNIS) {
        Logger.log(
          "✓ Student found at row " +
            i +
            " (NIS: " +
            rowNIS +
            ", Kelas: " +
            rowKelas +
            ")"
        );

        // Buat object siswa dengan semua data
        const student = {};
        for (let j = 0; j < headers.length; j++) {
          let value = values[i][j];

          // Format tanggal jika diperlukan
          if (value instanceof Date) {
            const options = { year: "numeric", month: "long", day: "numeric" };
            value = value.toLocaleDateString("id-ID", options);
          }

          student[headers[j]] = value;
        }

        // Tambahkan mapping untuk kompatibilitas dengan frontend
        student.nis = student.NIS || student.nis;
        student.nama = student["Nama Siswa"] || student.nama;
        student.nisn = student.NISN || student.nisn;
        student.gender = student["Jenis Kelamin"] || student.gender;
        student.birthplace = student["Tempat Lahir"] || student.birthplace;
        student.birthdate = student["Tanggal Lahir"] || student.birthdate;
        student.agama = student.Agama || student.agama;
        student.kewarganegaraan =
          student.Kewarganegaraan || student.kewarganegaraan;
        student.anakKe = student["Anak Ke"] || student.anakKe;
        student.jumlahSaudaraKandung =
          student["Jumlah Saudara Kandung"] || student.jumlahSaudaraKandung;
        student.statusOrangTua =
          student["Status Orang Tua"] || student.statusOrangTua;
        student.bahasaSehari =
          student["Bahasa Sehari-hari"] || student.bahasaSehari;
        student.alamat = student.Alamat || student.alamat;
        student.rt = student.RT || student.rt;
        student.dusun = student.Dusun || student.dusun;
        student.desa = student["Desa/Kelurahan"] || student.desa;
        student.kecamatan = student.Kecamatan || student.kecamatan;
        student.kabupaten = student["Kabupaten/Kota"] || student.kabupaten;
        student.provinsi = student.Provinsi || student.provinsi;
        student.kodePos = student["Kode Pos"] || student.kodePos;
        student.teleponRumah =
          student["No. Telepon Rumah"] || student.teleponRumah;
        student.golonganDarah =
          student["Golongan Darah"] || student.golonganDarah;
        student.penyakitPernah =
          student["Penyakit Yang Pernah Diderita"] || student.penyakitPernah;
        student.kelainanJasmani =
          student["Kelainan Jasmani"] || student.kelainanJasmani;
        student.tinggiBadan = student["Tinggi Badan"] || student.tinggiBadan;
        student.beratBadan = student["Berat Badan"] || student.beratBadan;
        student.asalSekolah =
          student["Asal Sekolah (SD/MI)"] || student.asalSekolah;
        student.tanggalLulusSD =
          student["Tanggal Lulus SD/MI"] || student.tanggalLulusSD;
        student.noIjazahSD =
          student["Nomor Ijazah SD/MI"] || student.noIjazahSD;
        student.lamaBelajarSD =
          student["Lama Belajar di SD/MI"] || student.lamaBelajarSD;

        // Data orang tua
        student.namaAyah = student["Nama Ayah"] || student.namaAyah;
        student.nikAyah = student["NIK Ayah"] || student.nikAyah;
        student.pendidikanAyah =
          student["Pendidikan Ayah"] || student.pendidikanAyah;
        student.pekerjaanAyah =
          student["Pekerjaan Ayah"] || student.pekerjaanAyah;
        student.penghasilanAyah =
          student["Penghasilan Ayah"] || student.penghasilanAyah;

        student.namaIbu = student["Nama Ibu"] || student.namaIbu;
        student.nikIbu = student["NIK Ibu"] || student.nikIbu;
        student.pendidikanIbu =
          student["Pendidikan Ibu"] || student.pendidikanIbu;
        student.pekerjaanIbu = student["Pekerjaan Ibu"] || student.pekerjaanIbu;
        student.penghasilanIbu =
          student["Penghasilan Ibu"] || student.penghasilanIbu;

        student.namaWali = student["Nama Wali"] || student.namaWali;
        student.nikWali = student["NIK Wali"] || student.nikWali;
        student.pendidikanWali =
          student["Pendidikan Wali"] || student.pendidikanWali;
        student.pekerjaanWali =
          student["Pekerjaan Wali"] || student.pekerjaanWali;
        student.penghasilanWali =
          student["Penghasilan Wali"] || student.penghasilanWali;

        // Data tambahan
        student.hobi = student.Hobi || student.hobi;
        student.prestasi = student.Prestasi || student.prestasi;
        student.beasiswa = student.Beasiswa || student.beasiswa;

        return {
          success: true,
          student: student,
          foundAtRow: i,
        };
      }
    }

    Logger.log("✗ Student not found");
    return {
      success: false,
      error: 'Siswa dengan NIS "' + nisId + '" tidak ditemukan',
      searchedRows: values.length - 1,
    };
  } catch (error) {
    Logger.log("✗ Error in findStudentByNIS: " + error.toString());
    return {
      success: false,
      error: error.toString(),
    };
  }
}

function getStudentById(nisId, sessionId) {
  try {
    Logger.log("=== getStudentById called ===");
    Logger.log('- nisId: "' + nisId + '" (type: ' + typeof nisId + ")");
    Logger.log('- sessionId: "' + sessionId + '"');

    // Validasi parameter
    if (!nisId) {
      Logger.log("ERROR: nisId is null or undefined");
      throw new Error("NIS siswa tidak boleh kosong");
    }

    // Konversi nisId ke string jika diperlukan
    const nisString = String(nisId).trim();
    if (nisString === "") {
      Logger.log("ERROR: nisId is empty string after trim");
      throw new Error("NIS siswa tidak valid");
    }

    Logger.log('Processed NIS: "' + nisString + '"');

    // Implementasi pencarian langsung dengan logika dari test_spreadsheet.js
    const ss = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const studentsSheet = ss.getSheetByName(STUDENTS_SHEET_NAME);

    if (!studentsSheet) {
      throw new Error('Sheet "' + STUDENTS_SHEET_NAME + '" tidak ditemukan');
    }

    const dataRange = studentsSheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length === 0) {
      throw new Error("Sheet kosong");
    }

    const headers = values[0];
    const nisIndex = headers.indexOf("NIS");

    if (nisIndex === -1) {
      throw new Error("Kolom NIS tidak ditemukan");
    }

    Logger.log("Searching in " + (values.length - 1) + " student records...");

    // Cari siswa
    for (let i = 1; i < values.length; i++) {
      const rowNIS = String(values[i][nisIndex]).trim();
      const searchNIS = String(nisString).trim();

      Logger.log(
        "Row " + i + ': comparing "' + rowNIS + '" with "' + searchNIS + '"'
      );

      if (rowNIS === searchNIS) {
        Logger.log("✓ Student found at row " + i);

        // Buat object siswa dengan semua data
        const student = {};
        for (let j = 0; j < headers.length; j++) {
          let value = values[i][j];

          // Format tanggal jika diperlukan
          if (value instanceof Date) {
            const options = { year: "numeric", month: "long", day: "numeric" };
            value = value.toLocaleDateString("id-ID", options);
          }

          student[headers[j]] = value;
        }

        // Tambahkan mapping untuk kompatibilitas dengan frontend
        student.nis = student.NIS || student.nis;
        student.nama = student["Nama Siswa"] || student.nama;
        student.nisn = student.NISN || student.nisn;
        student.gender = student["Jenis Kelamin"] || student.gender;
        student.birthplace = student["Tempat Lahir"] || student.birthplace;
        student.birthdate = student["Tanggal Lahir"] || student.birthdate;
        student.agama = student.Agama || student.agama;
        student.kewarganegaraan =
          student.Kewarganegaraan || student.kewarganegaraan;

        Logger.log("Successfully retrieved student data for NIS: " + nisString);
        Logger.log(
          "Student name: " +
            (student.nama || student["Nama Siswa"] || "Unknown")
        );

        return student;
      }
    }

    Logger.log("✗ Student not found");
    throw new Error('Siswa dengan NIS "' + nisString + '" tidak ditemukan');
  } catch (error) {
    Logger.log("ERROR in getStudentById: " + error.toString());
    Logger.log("Error stack: " + error.stack);
    throw error; // Re-throw untuk ditangani oleh client-side failure handler
  }
}

// Function to update student data
function updateStudentData(updateData, sessionId) {
  try {
    Logger.log("=== updateStudentData called ===");
    Logger.log("- updateData: " + JSON.stringify(updateData));
    Logger.log('- sessionId: "' + sessionId + '"');

    // Validate session & role
    const username = validateSession(sessionId);
    if (!username) {
      throw new Error("Session tidak valid. Silakan login kembali.");
    }
    const role = getUserRoleByUsername(username) || "viewer";
    if (!roleMeets(role, "staff")) {
      throw new Error("Akses ditolak: peran tidak memiliki izin mengedit.");
    }

    // Validate parameters
    if (!updateData || !updateData.studentId || !updateData.changes) {
      throw new Error("Data update tidak valid");
    }

    const studentId = String(updateData.studentId).trim();
    const changes = updateData.changes;

    if (Object.keys(changes).length === 0) {
      return { success: true, message: "Tidak ada perubahan untuk disimpan" };
    }

    Logger.log('Updating student with NIS: "' + studentId + '"');
    Logger.log("Changes: " + JSON.stringify(changes));

    // Open spreadsheet
    const ss = SpreadsheetApp.openById(getBukuIndukSpreadsheetId());
    const studentsSheet = ss.getSheetByName(STUDENTS_SHEET_NAME);

    if (!studentsSheet) {
      throw new Error('Sheet "' + STUDENTS_SHEET_NAME + '" tidak ditemukan');
    }

    const dataRange = studentsSheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length === 0) {
      throw new Error("Sheet kosong");
    }

    const headers = values[0];
    const nisIndex = headers.indexOf("NIS");

    if (nisIndex === -1) {
      throw new Error("Kolom NIS tidak ditemukan");
    }

    // Find student row
    let studentRowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      const rowNIS = String(values[i][nisIndex]).trim();
      if (rowNIS === studentId) {
        studentRowIndex = i;
        break;
      }
    }

    if (studentRowIndex === -1) {
      throw new Error('Siswa dengan NIS "' + studentId + '" tidak ditemukan');
    }

    Logger.log("Student found at row: " + (studentRowIndex + 1));

    // Update the data
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
    } catch (e) {}
    let updatedFields = [];
    for (const fieldName in changes) {
      const columnIndex = headers.indexOf(fieldName);
      if (columnIndex !== -1) {
        const oldValue = values[studentRowIndex][columnIndex];
        const newValue = changes[fieldName];

        // Update the cell
        studentsSheet
          .getRange(studentRowIndex + 1, columnIndex + 1)
          .setValue(newValue);

        updatedFields.push({
          field: fieldName,
          oldValue: oldValue,
          newValue: newValue,
        });

        Logger.log(
          'Updated field "' +
            fieldName +
            '": "' +
            oldValue +
            '" -> "' +
            newValue +
            '"'
        );
      } else {
        Logger.log('Warning: Field "' + fieldName + '" not found in headers');
      }
    }

    if (updatedFields.length === 0) {
      return {
        success: false,
        error: "Tidak ada field yang valid untuk diupdate",
      };
    }

    // Sinkronisasi data ke sheet DATA NILAI jika ada perubahan pada kolom yang sama
    let nilaiUpdatedCount = 0;
    const fieldsToSync = ["Nama Siswa", "NIS", "NISN"]; // Kolom yang perlu disinkronkan
    const syncableChanges = {};

    // Cek apakah ada perubahan pada kolom yang perlu disinkronkan
    for (const field of fieldsToSync) {
      if (changes[field] !== undefined) {
        // Field name sudah sesuai dengan nama kolom di sheet DATA NILAI
        syncableChanges[field] = changes[field];
      }
    }

    // Jika ada perubahan yang perlu disinkronkan, update sheet DATA NILAI
    if (Object.keys(syncableChanges).length > 0) {
      try {
        const nilaiSheet = ss.getSheetByName(STUDENTS_GRADE_NAME);

        if (nilaiSheet) {
          const nilaiDataRange = nilaiSheet.getDataRange();
          const nilaiValues = nilaiDataRange.getValues();

          if (nilaiValues.length > 0) {
            const nilaiHeaders = nilaiValues[0];
            const nilaiNisIndex = nilaiHeaders.indexOf("NIS");

            if (nilaiNisIndex !== -1) {
              // Cari semua baris dengan NIS yang sama di sheet DATA NILAI
              for (let i = 1; i < nilaiValues.length; i++) {
                const rowNIS = String(nilaiValues[i][nilaiNisIndex]).trim();

                if (rowNIS === studentId) {
                  // Update setiap kolom yang perlu disinkronkan
                  for (const [nilaiFieldName, newValue] of Object.entries(
                    syncableChanges
                  )) {
                    const nilaiColumnIndex =
                      nilaiHeaders.indexOf(nilaiFieldName);

                    if (nilaiColumnIndex !== -1) {
                      nilaiSheet
                        .getRange(i + 1, nilaiColumnIndex + 1)
                        .setValue(newValue);
                      nilaiUpdatedCount++;

                      Logger.log(
                        'Synced to DATA NILAI - Field "' +
                          nilaiFieldName +
                          '" updated to "' +
                          newValue +
                          '" at row ' +
                          (i + 1)
                      );
                    }
                  }
                }
              }
            }
          }
        }
      } catch (syncError) {
        Logger.log(
          "Warning: Failed to sync data to DATA NILAI: " + syncError.message
        );
        // Tidak menggagalkan update utama jika sinkronisasi gagal
      }
    }

    // Log the update activity
    Logger.log(
      "Successfully updated " +
        updatedFields.length +
        " fields for student NIS: " +
        studentId
    );

    if (nilaiUpdatedCount > 0) {
      Logger.log(
        "Successfully synced " +
          nilaiUpdatedCount +
          " field updates to DATA NILAI sheet"
      );
    }

    Logger.log("Updated by user: " + username);

    const responseMessage =
      nilaiUpdatedCount > 0
        ? "Data siswa berhasil diperbarui dan disinkronkan ke DATA NILAI (" +
          nilaiUpdatedCount +
          " field)"
        : "Data siswa berhasil diperbarui";

    return {
      success: true,
      message: responseMessage,
      updatedFields: updatedFields,
      syncedToNilai: nilaiUpdatedCount,
      updatedBy: username,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    Logger.log("ERROR in updateStudentData: " + error.toString());
    Logger.log("Error stack: " + error.stack);
    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat mengupdate data siswa",
    };
  } finally {
    try {
      LockService.getScriptLock().releaseLock();
    } catch (e) {}
  }
}

// Menghapus siswa dan data terkaitnya
function deleteStudent(nisId, sessionId) {
  try {
    // RBAC: hanya admin
    const username = validateSession(sessionId);
    if (!username) {
      throw new Error("Session tidak valid. Silakan login kembali.");
    }
    const role = getUserRoleByUsername(username) || "viewer";
    if (!roleMeets(role, "admin")) {
      throw new Error("Akses ditolak: peran tidak memiliki izin menghapus.");
    }
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
    } catch (e) {}
    // Validasi NIS
    if (!nisId) {
      throw new Error("NIS tidak valid");
    }

    // Buka spreadsheet
    const ss = SpreadsheetApp.openById(getBukuIndukSpreadsheetId());

    // Dapatkan sheet siswa
    const studentsSheet = ss.getSheetByName(STUDENTS_SHEET_NAME);

    if (!studentsSheet) {
      throw new Error("Sheet siswa tidak ditemukan");
    }

    // Dapatkan semua data dan header
    const dataRange = studentsSheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];
    const nisIndex = headers.indexOf("NIS");

    if (nisIndex === -1) {
      throw new Error("Kolom NIS tidak ditemukan");
    }

    // Cari siswa berdasarkan NIS
    let rowToDelete = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][nisIndex] == nisId) {
        rowToDelete = i + 1; // +1 karena indeks baris di Sheets dimulai dari 1
        break;
      }
    }

    if (rowToDelete === -1) {
      throw new Error("Siswa dengan NIS " + nisId + " tidak ditemukan");
    }

    // Hapus baris di sheet DATA SISWA
    studentsSheet.deleteRow(rowToDelete);

    // Inisialisasi variabel untuk menyimpan jumlah baris yang dihapus
    let nilaiDeletedCount = 0;
    let raportDeletedCount = 0;

    // Hapus data nilai siswa (di sheet DATA NILAI)
    const NILAI_SHEET_NAME = "DATA NILAI";
    const nilaiSheet = ss.getSheetByName(NILAI_SHEET_NAME);

    if (nilaiSheet) {
      // Dapatkan semua data nilai dan header
      const nilaiDataRange = nilaiSheet.getDataRange();
      const nilaiValues = nilaiDataRange.getValues();
      const nilaiHeaders = nilaiValues[0];
      const nilaiNisIndex = nilaiHeaders.indexOf("NIS");

      if (nilaiNisIndex === -1) {
        Logger.log("Kolom NIS tidak ditemukan di sheet DATA NILAI");
      } else {
        // Cari semua baris dengan NIS yang sama (dari bawah ke atas)
        const nilaiRowsToDelete = [];

        for (let i = nilaiValues.length - 1; i > 0; i--) {
          if (nilaiValues[i][nilaiNisIndex] == nisId) {
            nilaiRowsToDelete.push(i + 1); // +1 karena indeks baris di Sheets dimulai dari 1
          }
        }

        // Hapus baris-baris di sheet DATA NILAI (dari bawah ke atas)
        for (const row of nilaiRowsToDelete) {
          nilaiSheet.deleteRow(row);
          Utilities.sleep(100); // Beri jeda untuk menghindari rate limiting
        }

        nilaiDeletedCount = nilaiRowsToDelete.length;
        Logger.log(
          `Dihapus ${nilaiDeletedCount} baris data nilai untuk siswa dengan NIS ${nisId}`
        );
      }
    } else {
      Logger.log("Sheet DATA NILAI tidak ditemukan");
    }

    // Hapus data di sheet Rata-Rata Raport
    const RAPORT_SHEET_NAME = "Rata-Rata Raport";
    const raportSheet = ss.getSheetByName(RAPORT_SHEET_NAME);

    if (raportSheet) {
      // Dapatkan semua data raport dan header
      const raportDataRange = raportSheet.getDataRange();
      const raportValues = raportDataRange.getValues();
      const raportHeaders = raportValues[0];
      const raportNisIndex = raportHeaders.indexOf("NIS");

      if (raportNisIndex === -1) {
        Logger.log("Kolom NIS tidak ditemukan di sheet Rata-Rata Raport");
      } else {
        // Cari semua baris dengan NIS yang sama (dari bawah ke atas)
        const raportRowsToDelete = [];

        for (let i = raportValues.length - 1; i > 0; i--) {
          if (raportValues[i][raportNisIndex] == nisId) {
            raportRowsToDelete.push(i + 1); // +1 karena indeks baris di Sheets dimulai dari 1
          }
        }

        // Hapus baris-baris di sheet Rata-Rata Raport (dari bawah ke atas)
        for (const row of raportRowsToDelete) {
          raportSheet.deleteRow(row);
          Utilities.sleep(100); // Beri jeda untuk menghindari rate limiting
        }

        raportDeletedCount = raportRowsToDelete.length;
        Logger.log(
          `Dihapus ${raportDeletedCount} baris data raport untuk siswa dengan NIS ${nisId}`
        );
      }
    } else {
      Logger.log("Sheet Rata-Rata Raport tidak ditemukan");
    }

    return {
      success: true,
      message: "Siswa berhasil dihapus",
      detail: `Data siswa, ${nilaiDeletedCount} data nilai, dan ${raportDeletedCount} data raport berhasil dihapus.`,
    };
  } catch (error) {
    Logger.log("Error deleting student: " + error.message);
    return { success: false, message: error.message };
  } finally {
    try {
      LockService.getScriptLock().releaseLock();
    } catch (e) {}
  }
}

// Fungsi untuk mendapatkan URL file PDF siswa dari Google Drive
function getStudentPDFUrl(nisId) {
  try {
    if (!nisId) {
      return {
        success: false,
        message: "NIS tidak valid",
      };
    }

    // Dapatkan data siswa untuk mendapatkan nama
    const studentData = getStudentById(nisId);
    if (!studentData) {
      return {
        success: false,
        message: "Siswa dengan NIS " + nisId + " tidak ditemukan",
      };
    }

    // Konstruksi nama file sesuai format yang digunakan: "Buku Induk - {nis} - {nama}.pdf"
    const pdfFileName = `Buku Induk - ${nisId} - ${studentData.nama}.pdf`;

    // Cari file di folder Google Drive
    const folder = DriveApp.getFolderById(getStudentPdfFolderId());

    // Cari dengan nama Siswa terlebih dahulu
    let files = folder.getFilesByName(pdfFileName);

    if (files.hasNext()) {
      // File ditemukan, dapatkan URL
      const file = files.next();
      const url = file.getUrl();

      return {
        success: true,
        url: url,
        message: "File PDF berhasil ditemukan",
      };
    }

    // Jika tidak ditemukan, coba mencari file dengan pola yang mirip
    // Menggunakan DriveApp.searchFiles untuk pencarian yang lebih fleksibel
    const query = `title contains 'Buku Induk - ${nisId}' and mimeType='application/pdf' and '${getStudentPdfFolderId()}' in parents`;
    files = DriveApp.searchFiles(query);

    if (files.hasNext()) {
      const file = files.next();
      const url = file.getUrl();

      return {
        success: true,
        url: url,
        message: "File PDF berhasil ditemukan",
      };
    }

    // Jika masih tidak ditemukan, kembalikan pesan error
    return {
      success: false,
      message: "File PDF untuk siswa dengan NIS " + nisId + " tidak ditemukan",
    };
  } catch (error) {
    Logger.log("Error getting student PDF: " + error.message);
    return {
      success: false,
      message: "Gagal mengakses file PDF: " + error.message,
    };
  }
}

// --------------------------------------------------------------
// API FUNCTIONS FOR STUDENT MANAGEMENT
// --------------------------------------------------------------

// Initialize the column map for student data
function initializeColumnMap(headers) {
  // If already initialized, return
  if (studentColumnMap) return;

  // Create a new column map
  studentColumnMap = {
    // Data Identitas Siswa
    nis: headers.indexOf("NIS"),
    nisn: headers.indexOf("NISN"),
    nama: headers.indexOf("Nama Siswa"),
    gender: headers.indexOf("Jenis Kelamin"),
    nik: headers.indexOf("NIK"),
    birthplace: headers.indexOf("Tempat Lahir"),
    birthdate: headers.indexOf("Tanggal Lahir"),
    agama: headers.indexOf("Agama"),
    kewarganegaraan: headers.indexOf("Kewarganegaraan"),
    anakKe: headers.indexOf("Anak Ke-Berapa"),
    jumlahSaudaraKandung: headers.indexOf("Jumlah Saudara Kandung"),
    jumlahSaudaraTiri: headers.indexOf("Jumlah Saudara Tiri"),
    jumlahSaudaraAngkat: headers.indexOf("Jumlah Saudara Angkat"),
    statusOrangTua: headers.indexOf("Status Orang Tua"),
    bahasaSehari: headers.indexOf("Bahasa Sehari-hari Dirumah"),
    tinggalBersama: headers.indexOf("Tempat Tinggal Bersama"),
    transportasi: headers.indexOf("Modal Transportasi ke Sekolah"),
    jarakKeSekolah: headers.indexOf("Jarak ke Sekolah"),

    // Data Alamat
    alamat: headers.indexOf("Alamat Lengkap"),
    rt: headers.indexOf("RT/RW"),
    dusun: headers.indexOf("Nama Dusun"),
    desa: headers.indexOf("Nama Desa/Kelurahan"),
    kecamatan: headers.indexOf("Kecamatan"),
    kodePos: headers.indexOf("Kode Pos"),
    teleponRumah: headers.indexOf("No. Telp Rumah"),
    kabupaten: headers.indexOf("Kabupaten/Kota"),
    provinsi: headers.indexOf("Provinsi"),

    // Data Kesehatan
    golonganDarah: headers.indexOf("Golongan Darah"),
    penyakitPernah: headers.indexOf("Penyakit Yang Pernah dI Derita"),
    penyakitLain: headers.indexOf("Penyakit Yang Lain"),
    kelainanJasmani: headers.indexOf("Kelainan Jasmani"),
    tinggiBadan: headers.indexOf("Tinggi Badan"),
    beratBadan: headers.indexOf("Berat Badan"),

    // Data Pendidikan
    asalSekolah: headers.indexOf("Asal Sekolah (SD/MI)"),
    tanggalLulusSD: headers.indexOf("Tanggal Lulus SD/MI"),
    noIjazahSD: headers.indexOf("Nomor Ijazah SD/MI"),
    lamaBelajarSD: headers.indexOf("Lama Belajar di SD/MI"),
    siswaPindahan: headers.indexOf("Apakah Kamu Siswa Pindahan?"),
    kelasAwal: headers.indexOf(
      "Mulai Kelas Berapa Diterima di SMPN 03 Pekalongan"
    ),
    tanggalDaftar: headers.indexOf(
      "Hari, Tanggal, dan Tahun Diterima di SMPN 03 Pekalongan"
    ),
    asalSekolahSMP: headers.indexOf("Asal Sekolah (SMP/MTS/Sederajat)"),
    alasanPindah: headers.indexOf("Alasan Pindah Sekolah"),

    // Data Orang Tua - Ayah
    ayah: headers.indexOf("Nama Ayah  Kandung"),
    nikAyah: headers.indexOf("NIK Ayah"),
    ttlAyah: headers.indexOf("Tempat dan Tanggal Lahir Ayah"),
    agamaAyah: headers.indexOf("Agama Ayah"),
    kewarganegaraanAyah: headers.indexOf("Kewarganegaraan Ayah"),
    pendidikanAyah: headers.indexOf("Pendidikan Terakhir Ayah"),
    pekerjaanAyah: headers.indexOf("Pekerjaan Ayah"),
    penghasilanAyah: headers.indexOf("Penghasilan Bulanan Ayah"),
    alamatAyah: headers.indexOf("Alamat Lengkap Ayah"),
    phoneAyah: headers.indexOf("Nomor Telepon Ayah"),
    statusAyah: headers.indexOf("Status Ayah"),

    // Data Orang Tua - Ibu
    ibu: headers.indexOf("Nama Ibu Kandung"),
    nikIbu: headers.indexOf("NIK Ibu"),
    ttlIbu: headers.indexOf("Tempat dan Tanggal Lahir Ibu"),
    agamaIbu: headers.indexOf("Agama Ibu"),
    kewarganegaraanIbu: headers.indexOf("Kewarganegaraan Ibu"),
    pendidikanIbu: headers.indexOf("Pendidikan Terakhir Ibu"),
    pekerjaanIbu: headers.indexOf("Pekerjaan Ibu"),
    penghasilanIbu: headers.indexOf("Penghasilan Bulanan Ibu"),
    alamatIbu: headers.indexOf("Alamat Lengkap Ibu"),
    phoneIbu: headers.indexOf("Nomor Telepon Ibu"),
    statusIbu: headers.indexOf("Status Ibu"),

    // Data Wali
    wali: headers.indexOf("Nama Wali"),
    nikWali: headers.indexOf("NIK Wali"),
    ttlWali: headers.indexOf("Tempat dan Tanggal Lahir Wali"),
    agamaWali: headers.indexOf("Agama Wali Murid"),
    kewarganegaraanWali: headers.indexOf("Kewarganegaraan Wali"),
    pendidikanWali: headers.indexOf("Pendidikan Terakhir Wali"),
    pekerjaanWali: headers.indexOf("Pekerjaan Wali"),
    penghasilanWali: headers.indexOf("Penghasilan Bulanan Wali"),
    alamatWali: headers.indexOf("Alamat Lengkap Wali"),
    phoneWali: headers.indexOf("Nomor Telepon Wali"),
    statusWali: headers.indexOf("Status Wali"),

    // Data Hobi
    bidangSeni: headers.indexOf("Bidang Seni"),
    bidangOlahraga: headers.indexOf("Bidang Olahraga"),
    bidangLain: headers.indexOf("Bidang Lain-Lain"),

    // Data Prestasi
    pernahPrestasi: headers.indexOf(
      "Apakah Peserta Didik Pernah Meraih Prestasi?"
    ),
    jenisPrestasi1: headers.indexOf("Jenis Prestasi"),
    tingkatPrestasi1: headers.indexOf("Tingkat Prestasi"),
    namaPrestasi1: headers.indexOf("Nama Prestasi"),
    tahunPrestasi1: headers.indexOf("Tahun Prestasi"),
    penyelenggara1: headers.indexOf("Penyelenggara"),
    peringkat1: headers.indexOf("Peringkat"),

    // Data Prestasi 2
    lanjutPrestasi2: headers.indexOf("Lanjut Ke-Prestasi 2"),
    jenisPrestasi2: headers.indexOf("Jenis Prestasi (2)"),
    tingkatPrestasi2: headers.indexOf("Tingkat Prestasi (2)"),
    namaPrestasi2: headers.indexOf("Nama Prestasi (2)"),
    tahunPrestasi2: headers.indexOf("Tahun Prestasi (2)"),
    penyelenggara2: headers.indexOf("Penyelenggara (2)"),
    peringkat2: headers.indexOf("Peringkat (2)"),

    // Data Prestasi 3
    lanjutPrestasi3: headers.indexOf("Lanjut Ke-Prestasi 3"),
    jenisPrestasi3: headers.indexOf("Jenis Prestasi (3)"),
    tingkatPrestasi3: headers.indexOf("Tingkat Prestasi (3)"),
    namaPrestasi3: headers.indexOf("Nama Prestasi (3)"),
    tahunPrestasi3: headers.indexOf("Tahun Prestasi (3)"),
    penyelenggara3: headers.indexOf("Penyelenggara (3)"),
    peringkat3: headers.indexOf("Peringkat (3)"),

    // Data Prestasi 4
    lanjutPrestasi4: headers.indexOf("Lanjut Ke-Prestasi 4"),
    jenisPrestasi4: headers.indexOf("Jenis Prestasi (4)"),
    tingkatPrestasi4: headers.indexOf("Tingkat Prestasi (4)"),
    namaPrestasi4: headers.indexOf("Nama Prestasi (4)"),
    tahunPrestasi4: headers.indexOf("Tahun Prestasi (4)"),
    penyelenggara4: headers.indexOf("Penyelenggara (4)"),
    peringkat4: headers.indexOf("Peringkat (4)"),

    // Data Prestasi 5
    lanjutPrestasi5: headers.indexOf("Lanjut Ke-Prestasi 5"),
    jenisPrestasi5: headers.indexOf("Jenis Prestasi (5)"),
    tingkatPrestasi5: headers.indexOf("Tingkat Prestasi (5)"),
    namaPrestasi5: headers.indexOf("Nama Prestasi (5)"),
    tahunPrestasi5: headers.indexOf("Tahun Prestasi (5)"),
    penyelenggara5: headers.indexOf("Penyelenggara (5)"),
    peringkat5: headers.indexOf("Peringkat (5)"),

    // Data Beasiswa
    pernahBeasiswa: headers.indexOf("Apakah Peserta Didik Memiliki Beasiswa"),
    jenisBeasiswa1: headers.indexOf("Jenis Beasiswa"),
    keteranganBeasiswa1: headers.indexOf("Keterangan"),
    tahunMulaiBeasiswa1: headers.indexOf("Tahun Mulai"),
    tahunSelesaiBeasiswa1: headers.indexOf("Tahun Selesai"),

    // Data Beasiswa 2
    lanjutBeasiswa2: headers.indexOf("Lanjut Ke-Beasiswa 2"),
    jenisBeasiswa2: headers.indexOf("Jenis Beasiswa (2)"),
    keteranganBeasiswa2: headers.indexOf("Keterangan (2)"),
    tahunMulaiBeasiswa2: headers.indexOf("Tahun Mulai (2)"),
    tahunSelesaiBeasiswa2: headers.indexOf("Tahun Selesai (2)"),

    // Data Beasiswa 3
    lanjutBeasiswa3: headers.indexOf("Lanjut Ke-Beasiswa 3"),
    jenisBeasiswa3: headers.indexOf("Jenis Beasiswa (3)"),
    keteranganBeasiswa3: headers.indexOf("Keterangan (3)"),
    tahunMulaiBeasiswa3: headers.indexOf("Tahun Mulai (3)"),
    tahunSelesaiBeasiswa3: headers.indexOf("Tahun Selesai (3)"),

    // Status Akademik
    status: headers.indexOf("Status Akademik"),

    // Kelas
    kelas:
      headers.indexOf("Kelas") !== -1
        ? headers.indexOf("Kelas")
        : headers.indexOf("Kelas Sekarang") !== -1
        ? headers.indexOf("Kelas Sekarang")
        : headers.indexOf("Kelas Saat Ini") !== -1
        ? headers.indexOf("Kelas Saat Ini")
        : -1,
  };

  Logger.log("Column map initialized: " + JSON.stringify(studentColumnMap));
}

// Update existing student
function updateStudent(studentData) {
  try {
    // Validate required fields
    if (!studentData.nis) {
      return { success: false, message: "NIS wajib diisi" };
    }

    // Access the spreadsheet
    const ss = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const studentsSheet = ss.getSheetByName(STUDENTS_SHEET_NAME);

    if (!studentsSheet) {
      return { success: false, message: "Sheet data siswa tidak ditemukan" };
    }

    // Get all students to find the one to update
    const allStudents = getAllStudents();
    const studentToUpdate = allStudents.find((s) => s.nis == studentData.nis);

    if (!studentToUpdate) {
      return {
        success: false,
        message: "Siswa dengan NIS " + studentData.nis + " tidak ditemukan",
      };
    }

    // Get row index from data
    const rowIndex = studentToUpdate.rowIndex;

    // Get headers to ensure we update the right columns
    const headerRange = studentsSheet.getRange(
      1,
      1,
      1,
      studentsSheet.getLastColumn()
    );
    const headers = headerRange.getValues()[0];

    // Initialize column map if needed
    initializeColumnMap(headers);

    // Fungsi helper untuk memperbarui nilai sel jika kolom ada
    function updateCell(columnKey, value) {
      if (
        studentColumnMap[columnKey] !== -1 &&
        studentColumnMap[columnKey] !== undefined
      ) {
        studentsSheet
          .getRange(rowIndex, studentColumnMap[columnKey] + 1)
          .setValue(value || "");
      }
    }

    // Fungsi helper untuk memperbarui nilai tanggal
    function updateDateCell(columnKey, dateValue) {
      if (
        studentColumnMap[columnKey] !== -1 &&
        studentColumnMap[columnKey] !== undefined &&
        dateValue
      ) {
        const parsedDate = parseDate(dateValue);
        studentsSheet
          .getRange(rowIndex, studentColumnMap[columnKey] + 1)
          .setValue(parsedDate || "");
      }
    }

    // Data Identitas Siswa
    updateCell("nama", studentData.nama);
    updateCell("nisn", studentData.nisn);
    updateCell("gender", studentData.gender);
    updateCell("nik", studentData.nik);
    updateCell("birthplace", studentData.birthplace);
    updateDateCell("birthdate", studentData.birthdate);
    updateCell("agama", studentData.agama);
    updateCell("kewarganegaraan", studentData.kewarganegaraan);
    updateCell("anakKe", studentData.anakKe);
    updateCell("jumlahSaudaraKandung", studentData.jumlahSaudaraKandung);
    updateCell("jumlahSaudaraTiri", studentData.jumlahSaudaraTiri);
    updateCell("jumlahSaudaraAngkat", studentData.jumlahSaudaraAngkat);
    updateCell("statusOrangTua", studentData.statusOrangTua);
    updateCell("bahasaSehari", studentData.bahasaSehari);
    updateCell("tinggalBersama", studentData.tinggalBersama);
    updateCell("transportasi", studentData.transportasi);
    updateCell("jarakKeSekolah", studentData.jarakKeSekolah);

    // Data Alamat
    updateCell("alamat", studentData.alamat);
    updateCell("rt", studentData.rt);
    updateCell("dusun", studentData.dusun);
    updateCell("desa", studentData.desa);
    updateCell("kecamatan", studentData.kecamatan);
    updateCell("kodePos", studentData.kodePos);
    updateCell("teleponRumah", studentData.teleponRumah);
    updateCell("kabupaten", studentData.kabupaten);
    updateCell("provinsi", studentData.provinsi);

    // Data Kesehatan
    updateCell("golonganDarah", studentData.golonganDarah);
    updateCell("penyakitPernah", studentData.penyakitPernah);
    updateCell("penyakitLain", studentData.penyakitLain);
    updateCell("kelainanJasmani", studentData.kelainanJasmani);
    updateCell("tinggiBadan", studentData.tinggiBadan);
    updateCell("beratBadan", studentData.beratBadan);

    // Data Pendidikan
    updateCell("asalSekolah", studentData.asalSekolah);
    updateCell("tanggalLulusSD", studentData.tanggalLulusSD);
    updateCell("noIjazahSD", studentData.noIjazahSD);
    updateCell("lamaBelajarSD", studentData.lamaBelajarSD);
    updateCell("siswaPindahan", studentData.siswaPindahan);
    updateCell("kelasAwal", studentData.kelasAwal);
    updateDateCell("tanggalDaftar", studentData.entryDate);
    updateCell("asalSekolahSMP", studentData.asalSekolahSMP);
    updateCell("alasanPindah", studentData.alasanPindah);

    // Data Orang Tua - Ayah
    updateCell("ayah", studentData.ayah);
    updateCell("nikAyah", studentData.nikAyah);
    updateCell("ttlAyah", studentData.ttlAyah);
    updateCell("agamaAyah", studentData.agamaAyah);
    updateCell("kewarganegaraanAyah", studentData.kewarganegaraanAyah);
    updateCell("pendidikanAyah", studentData.pendidikanAyah);
    updateCell("pekerjaanAyah", studentData.pekerjaanAyah);
    updateCell("penghasilanAyah", studentData.penghasilanAyah);
    updateCell("alamatAyah", studentData.alamatAyah);
    updateCell("phoneAyah", studentData.phoneAyah);
    updateCell("statusAyah", studentData.statusAyah);

    // Data Orang Tua - Ibu
    updateCell("ibu", studentData.ibu);
    updateCell("nikIbu", studentData.nikIbu);
    updateCell("ttlIbu", studentData.ttlIbu);
    updateCell("agamaIbu", studentData.agamaIbu);
    updateCell("kewarganegaraanIbu", studentData.kewarganegaraanIbu);
    updateCell("pendidikanIbu", studentData.pendidikanIbu);
    updateCell("pekerjaanIbu", studentData.pekerjaanIbu);
    updateCell("penghasilanIbu", studentData.penghasilanIbu);
    updateCell("alamatIbu", studentData.alamatIbu);
    updateCell("phoneIbu", studentData.phoneIbu);
    updateCell("statusIbu", studentData.statusIbu);

    // Data Wali
    updateCell("wali", studentData.wali);
    updateCell("nikWali", studentData.nikWali);
    updateCell("ttlWali", studentData.ttlWali);
    updateCell("agamaWali", studentData.agamaWali);
    updateCell("kewarganegaraanWali", studentData.kewarganegaraanWali);
    updateCell("pendidikanWali", studentData.pendidikanWali);
    updateCell("pekerjaanWali", studentData.pekerjaanWali);
    updateCell("penghasilanWali", studentData.penghasilanWali);
    updateCell("alamatWali", studentData.alamatWali);
    updateCell("phoneWali", studentData.phoneWali);
    updateCell("statusWali", studentData.statusWali);

    // Data Hobi
    updateCell("bidangSeni", studentData.bidangSeni);
    updateCell("bidangOlahraga", studentData.bidangOlahraga);
    updateCell("bidangLain", studentData.bidangLain);

    // Data Prestasi
    updateCell("pernahPrestasi", studentData.pernahPrestasi);
    updateCell("jenisPrestasi1", studentData.jenisPrestasi1);
    updateCell("tingkatPrestasi1", studentData.tingkatPrestasi1);
    updateCell("namaPrestasi1", studentData.namaPrestasi1);
    updateCell("tahunPrestasi1", studentData.tahunPrestasi1);
    updateCell("penyelenggara1", studentData.penyelenggara1);
    updateCell("peringkat1", studentData.peringkat1);

    // Data Beasiswa
    updateCell("pernahBeasiswa", studentData.pernahBeasiswa);
    updateCell("jenisBeasiswa1", studentData.jenisBeasiswa1);
    updateCell("keteranganBeasiswa1", studentData.keteranganBeasiswa1);
    updateCell("tahunMulaiBeasiswa1", studentData.tahunMulaiBeasiswa1);
    updateCell("tahunSelesaiBeasiswa1", studentData.tahunSelesaiBeasiswa1);

    // Status Akademik
    updateCell("status", studentData.status || "Aktif");
    updateCell("notes", studentData.notes);

    return { success: true, message: "Data siswa berhasil diperbarui" };
  } catch (error) {
    Logger.log("Error in updateStudent: " + error.message);
    return {
      success: false,
      message: "Gagal memperbarui data siswa: " + error.message,
    };
  }
}

// Helper function to format date for display
function formatDate(date) {
  if (!date) return "";

  // If it's already a string, return as is
  if (typeof date === "string") return date;

  // If it's a Date object, format it
  if (date instanceof Date) {
    try {
      const options = { day: "numeric", month: "long", year: "numeric" };
      return date.toLocaleDateString("id-ID", options);
    } catch (error) {
      // Fallback if toLocaleDateString fails
      return date.toISOString().split("T")[0];
    }
  }

  return "";
}

// Helper function to format date for input fields (YYYY-MM-DD)
function formatDateForInput(date) {
  if (!date) return "";

  // If it's already a string in YYYY-MM-DD format, return as is
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;

  // If it's a Date object, format it
  if (date instanceof Date) {
    try {
      // Format as YYYY-MM-DD for HTML date input
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (error) {
      return "";
    }
  }

  return "";
}

// Helper function to parse date string in various formats
function parseDate(dateString) {
  if (!dateString) return null;

  // If it's already a Date object, return as is
  if (dateString instanceof Date) return dateString;

  try {
    // Try to parse the date string
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  } catch (error) {
    Logger.log("Error parsing date: " + error.message);
    return null;
  }
}

// Function to get statistics for students data
function getStudentStatistics() {
  try {
    // Get all students
    const students = getAllStudents();

    // Initialize statistics object
    const stats = {
      totalStudents: students.length,
      byClass: {},
      byStatus: {},
      byGender: {
        "Laki-laki": 0,
        Perempuan: 0,
        Lainnya: 0,
      },
    };

    // Calculate statistics
    students.forEach((student) => {
      // Count by status
      const status = student.status || "Aktif";
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // Count by gender
      const gender = student.gender || "Lainnya";
      if (gender.toLowerCase().includes("laki")) {
        stats.byGender["Laki-laki"]++;
      } else if (gender.toLowerCase().includes("perempuan")) {
        stats.byGender["Perempuan"]++;
      } else {
        stats.byGender["Lainnya"]++;
      }
    });

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    Logger.log("Error in getStudentStatistics: " + error.message);
    return {
      success: false,
      message: "Gagal mendapatkan statistik: " + error.message,
    };
  }
}

// Fungsi untuk menemukan indeks kolom berdasarkan berbagai kemungkinan nama
function findColumnIndex(headers, possibleNames) {
  for (const name of possibleNames) {
    const index = headers.indexOf(name);
    if (index !== -1) {
      return index;
    }
  }
  return -1;
}

// Tambahkan fungsi ini untuk mendapatkan username pengguna saat ini dari client-side


// Fungsi untuk membersihkan cache
function clearCache() {
  studentColumnMap = null;
  return "Cache dibersihkan";
}
// Duplikasi fungsi getCurrentUserUsername dihapus - menggunakan implementasi yang sudah ada di atas

function getStudentColumnMap() {
  if (studentColumnMap) return studentColumnMap;

  const spreadsheet = SpreadsheetApp.openById(getBukuIndukSpreadsheetId());
  const sheet = spreadsheet.getSheetByName(STUDENTS_SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const columnMap = {};

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (header.startsWith("NIM:")) {
      columnMap[header] = i;
    }
  }

  // Update global variable
  studentColumnMap = columnMap;
  return studentColumnMap;
}

function getStudentData() {
  const spreadsheet = SpreadsheetApp.openById(getBukuIndukSpreadsheetId());
  const sheet = spreadsheet.getSheetByName(STUDENTS_SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  const studentData = {};
  const studentColumnMap = getStudentColumnMap();

  for (let i = 1; i < data.length; i++) {
    const student = data[i];
    const nim = student[studentColumnMap["NIM:"]];
    studentData[nim] = student;
  }

  return studentData;
}

function getStudentDataByNim(nim) {
  const studentData = getStudentData();
  return studentData[nim];
}

// Function to add a new student
function addStudent(studentData) {
  try {
    // Validate required fields
    if (!studentData.nis || !studentData.nama) {
      return { success: false, message: "NIS dan Nama Siswa wajib diisi" };
    }

    // Access the spreadsheet
    const ss = SpreadsheetApp.openById(getBukuIndukSpreadsheetId());
    const studentsSheet = ss.getSheetByName(STUDENTS_SHEET_NAME);

    if (!studentsSheet) {
      return { success: false, message: "Sheet data siswa tidak ditemukan" };
    }

    // Check if NIS already exists
    const allStudents = getAllStudents();
    const existingStudent = allStudents.find(
      (student) => student.nis === studentData.nis
    );
    if (existingStudent) {
      return {
        success: false,
        message: "NIS sudah terdaftar. Gunakan NIS yang berbeda.",
      };
    }

    // Get headers and initialize column map
    const headers = studentsSheet
      .getRange(1, 1, 1, studentsSheet.getLastColumn())
      .getValues()[0];
    const studentColumnMap = {};
    headers.forEach((header, index) => {
      studentColumnMap[header] = index;
    });

    // Prepare new row data
    const newRow = new Array(headers.length).fill("");

    // Helper function to set cell value
    function setCellValue(columnKey, value) {
      if (studentColumnMap[columnKey] !== undefined) {
        newRow[studentColumnMap[columnKey]] = value || "";
      }
    }

    // Helper function to set date value
    function setDateValue(columnKey, dateValue) {
      if (studentColumnMap[columnKey] !== undefined && dateValue) {
        const parsedDate = parseDate(dateValue);
        newRow[studentColumnMap[columnKey]] = parsedDate || "";
      }
    }

    // Data Identitas Siswa
    setCellValue("NIS", studentData.nis);
    setCellValue("Nama Siswa", studentData.nama);
    setCellValue("NISN", studentData.nisn);
    setCellValue("Jenis Kelamin", studentData.gender);
    setCellValue("Tempat Lahir", studentData.tempatLahir);
    setDateValue("Tanggal Lahir", studentData.tanggalLahir);
    setCellValue("Agama", studentData.agama);
    setCellValue("Kewarganegaraan", studentData.kewarganegaraan);
    setCellValue("Anak Ke", studentData.anakKe);
    setCellValue("Jumlah Saudara", studentData.jumlahSaudara);
    setCellValue("Status Dalam Keluarga", studentData.statusDalamKeluarga);
    setCellValue("Bahasa Sehari-hari", studentData.bahasaSehariHari);
    setCellValue("No. Telepon", studentData.phone);
    setCellValue("Email", studentData.email);
    setCellValue("Jarak ke Sekolah", studentData.jarakKeSekolah);

    // Data Alamat
    setCellValue("Alamat", studentData.alamat);
    setCellValue("RT", studentData.rt);
    setCellValue("RW", studentData.rw);
    setCellValue("Dusun", studentData.dusun);
    setCellValue("Desa/Kelurahan", studentData.desa);
    setCellValue("Kecamatan", studentData.kecamatan);
    setCellValue("Kabupaten/Kota", studentData.kabupaten);
    setCellValue("Provinsi", studentData.provinsi);
    setCellValue("Kode Pos", studentData.kodePos);

    // Data Kesehatan
    setCellValue("Golongan Darah", studentData.golonganDarah);
    setCellValue("Tinggi Badan", studentData.tinggiBadan);
    setCellValue("Berat Badan", studentData.beratBadan);
    setCellValue("Riwayat Penyakit", studentData.riwayatPenyakit);
    setCellValue("Kebutuhan Khusus", studentData.kebutuhanKhusus);

    // Data Pendidikan
    setCellValue("Asal Sekolah", studentData.asalSekolah);
    setCellValue("Nomor Ijazah", studentData.nomorIjazah);
    setDateValue("Tanggal Ijazah", studentData.tanggalIjazah);
    setCellValue("Lama Belajar", studentData.lamaBelajar);
    setDateValue("Tanggal Diterima", studentData.tanggalDiterima);
    setCellValue("Kelas Diterima", studentData.kelasDiterima);

    // Data Orang Tua - Ayah
    setCellValue("Nama Ayah", studentData.ayah);
    setCellValue("NIK Ayah", studentData.nikAyah);
    setCellValue("Tempat, Tanggal Lahir Ayah", studentData.ttlAyah);
    setCellValue("Agama Ayah", studentData.agamaAyah);
    setCellValue("Kewarganegaraan Ayah", studentData.kewarganegaraanAyah);
    setCellValue("Pendidikan Ayah", studentData.pendidikanAyah);
    setCellValue("Pekerjaan Ayah", studentData.pekerjaanAyah);
    setCellValue("Penghasilan Ayah", studentData.penghasilanAyah);
    setCellValue("Alamat Ayah", studentData.alamatAyah);
    setCellValue("No. Telepon Ayah", studentData.phoneAyah);
    setCellValue("Status Ayah", studentData.statusAyah);

    // Data Orang Tua - Ibu
    setCellValue("Nama Ibu", studentData.ibu);
    setCellValue("NIK Ibu", studentData.nikIbu);
    setCellValue("Tempat, Tanggal Lahir Ibu", studentData.ttlIbu);
    setCellValue("Agama Ibu", studentData.agamaIbu);
    setCellValue("Kewarganegaraan Ibu", studentData.kewarganegaraanIbu);
    setCellValue("Pendidikan Ibu", studentData.pendidikanIbu);
    setCellValue("Pekerjaan Ibu", studentData.pekerjaanIbu);
    setCellValue("Penghasilan Ibu", studentData.penghasilanIbu);
    setCellValue("Alamat Ibu", studentData.alamatIbu);
    setCellValue("No. Telepon Ibu", studentData.phoneIbu);
    setCellValue("Status Ibu", studentData.statusIbu);

    // Data Wali
    setCellValue("Nama Wali", studentData.wali);
    setCellValue("NIK Wali", studentData.nikWali);
    setCellValue("Tempat, Tanggal Lahir Wali", studentData.ttlWali);
    setCellValue("Agama Wali", studentData.agamaWali);
    setCellValue("Kewarganegaraan Wali", studentData.kewarganegaraanWali);
    setCellValue("Pendidikan Wali", studentData.pendidikanWali);
    setCellValue("Pekerjaan Wali", studentData.pekerjaanWali);
    setCellValue("Penghasilan Wali", studentData.penghasilanWali);
    setCellValue("Alamat Wali", studentData.alamatWali);
    setCellValue("No. Telepon Wali", studentData.phoneWali);
    setCellValue("Status Wali", studentData.statusWali);

    // Data Hobi
    setCellValue("Bidang Seni", studentData.bidangSeni);
    setCellValue("Bidang Olahraga", studentData.bidangOlahraga);
    setCellValue("Bidang Lain", studentData.bidangLain);

    // Data Prestasi
    setCellValue("Prestasi 1", studentData.prestasi1);
    setCellValue("Tingkat Prestasi 1", studentData.tingkatPrestasi1);
    setCellValue("Tahun Prestasi 1", studentData.tahunPrestasi1);
    setCellValue("Prestasi 2", studentData.prestasi2);
    setCellValue("Tingkat Prestasi 2", studentData.tingkatPrestasi2);
    setCellValue("Tahun Prestasi 2", studentData.tahunPrestasi2);
    setCellValue("Prestasi 3", studentData.prestasi3);
    setCellValue("Tingkat Prestasi 3", studentData.tingkatPrestasi3);
    setCellValue("Tahun Prestasi 3", studentData.tahunPrestasi3);

    // Data Beasiswa
    setCellValue("Beasiswa 1", studentData.beasiswa1);
    setCellValue("Keterangan Beasiswa 1", studentData.keteranganBeasiswa1);
    setCellValue("Tahun Mulai Beasiswa 1", studentData.tahunMulaiBeasiswa1);
    setCellValue("Tahun Selesai Beasiswa 1", studentData.tahunSelesaiBeasiswa1);

    // Status Akademik
    setCellValue("Status", studentData.status || "Aktif");
    setCellValue("Keterangan", studentData.notes);

    // Add current date as registration date if not provided
    if (!studentData.tanggalDiterima) {
      const today = new Date();
      setDateValue("Tanggal Diterima", today);
    }

    // Append the new row to the sheet (gunakan LockService)
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
    } catch (e) {}
    studentsSheet.appendRow(newRow);

    return { success: true, message: "Data siswa berhasil ditambahkan" };
  } catch (error) {
    return {
      success: false,
      message: "Terjadi kesalahan: " + error.toString(),
    };
  }
}

// Function to create students sheet if it doesn't exist
function createStudentsSheet(spreadsheet) {
  try {
    // Create new sheet with students data structure
    const studentsSheet = spreadsheet.insertSheet(STUDENTS_SHEET_NAME);

    // Define headers for the students sheet
    const headers = [
      "NIS",
      "Nama Siswa",
      "NISN",
      "Jenis Kelamin",
      "Tempat Lahir",
      "Tanggal Lahir",
      "Agama",
      "Kewarganegaraan",
      "Anak Ke",
      "Jumlah Saudara",
      "Status Dalam Keluarga",
      "Bahasa Sehari-hari",
      "No. Telepon",
      "Email",
      "Jarak ke Sekolah",
      "Alamat",
      "RT",
      "RW",
      "Dusun",
      "Desa/Kelurahan",
      "Kecamatan",
      "Kabupaten/Kota",
      "Provinsi",
      "Kode Pos",
      "Golongan Darah",
      "Tinggi Badan",
      "Berat Badan",
      "Riwayat Penyakit",
      "Kebutuhan Khusus",
      "Asal Sekolah",
      "Nomor Ijazah",
      "Tanggal Ijazah",
      "Lama Belajar",
      "Tanggal Diterima",
      "Kelas Diterima",
      "Nama Ayah",
      "NIK Ayah",
      "Tempat, Tanggal Lahir Ayah",
      "Agama Ayah",
      "Kewarganegaraan Ayah",
      "Pendidikan Ayah",
      "Pekerjaan Ayah",
      "Penghasilan Ayah",
      "Alamat Ayah",
      "No. Telepon Ayah",
      "Status Ayah",
      "Nama Ibu",
      "NIK Ibu",
      "Tempat, Tanggal Lahir Ibu",
      "Agama Ibu",
      "Kewarganegaraan Ibu",
      "Pendidikan Ibu",
      "Pekerjaan Ibu",
      "Penghasilan Ibu",
      "Alamat Ibu",
      "No. Telepon Ibu",
      "Status Ibu",
      "Nama Wali",
      "NIK Wali",
      "Tempat, Tanggal Lahir Wali",
      "Agama Wali",
      "Kewarganegaraan Wali",
      "Pendidikan Wali",
      "Pekerjaan Wali",
      "Penghasilan Wali",
      "Alamat Wali",
      "No. Telepon Wali",
      "Status Wali",
      "Bidang Seni",
      "Bidang Olahraga",
      "Bidang Lain",
      "Prestasi 1",
      "Tingkat Prestasi 1",
      "Tahun Prestasi 1",
      "Prestasi 2",
      "Tingkat Prestasi 2",
      "Tahun Prestasi 2",
      "Prestasi 3",
      "Tingkat Prestasi 3",
      "Tahun Prestasi 3",
      "Beasiswa 1",
      "Keterangan Beasiswa 1",
      "Tahun Mulai Beasiswa 1",
      "Tahun Selesai Beasiswa 1",
      "Status",
      "Keterangan",
    ];

    // Set headers in the first row
    studentsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format header row
    const headerRange = studentsSheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4285f4");
    headerRange.setFontColor("white");

    // Auto-resize columns
    studentsSheet.autoResizeColumns(1, headers.length);

    Logger.log("Students sheet created successfully");
    return studentsSheet;
  } catch (error) {
    Logger.log("Error creating students sheet: " + error.message);
    throw new Error("Gagal membuat sheet siswa: " + error.message);
  }
}

// Fungsi untuk preview siswa berdasarkan tanggal masuk
function previewStudentsByEntryDate(filterParams) {
  try {
    Logger.log(
      "previewStudentsByEntryDate called with params: " +
        JSON.stringify(filterParams)
    );

    // Akses spreadsheet
    const ss = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const studentsSheet = ss.getSheetByName(STUDENTS_SHEET_NAME);

    // Ambil semua data
    const dataRange = studentsSheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length <= 1) {
      return [];
    }

    // Inisialisasi column map
    const headers = values[0];
    initializeColumnMap(headers);

    let filteredStudents = [];

    // Filter berdasarkan tanggal masuk
    for (let i = 1; i < values.length; i++) {
      const row = values[i];

      // Skip rows yang tidak memiliki data penting
      if (!row[studentColumnMap.nis] && !row[studentColumnMap.nama]) {
        continue;
      }

      const tanggalDaftar = row[studentColumnMap.tanggalDaftar];
      if (!tanggalDaftar) {
        continue;
      }

      let tanggalDaftarDate;
      if (tanggalDaftar instanceof Date) {
        tanggalDaftarDate = tanggalDaftar;
      } else {
        tanggalDaftarDate = new Date(tanggalDaftar);
      }

      // Skip jika tanggal tidak valid
      if (isNaN(tanggalDaftarDate.getTime())) {
        continue;
      }

      let isMatch = false;

      if (filterParams.date) {
        // Filter tanggal tertentu
        const targetDate = new Date(filterParams.date);
        isMatch =
          tanggalDaftarDate.toDateString() === targetDate.toDateString();
      } else if (filterParams.startDate && filterParams.endDate) {
        // Filter rentang tanggal
        const startDate = new Date(filterParams.startDate);
        const endDate = new Date(filterParams.endDate);
        isMatch =
          tanggalDaftarDate >= startDate && tanggalDaftarDate <= endDate;
      } else if (filterParams.year) {
        // Filter berdasarkan tahun
        const targetYear = parseInt(filterParams.year);
        isMatch = tanggalDaftarDate.getFullYear() === targetYear;
      }

      if (isMatch) {
        // Buat objek siswa untuk preview
        const student = {
          nis: row[studentColumnMap.nis] || "",
          nama: row[studentColumnMap.nama] || "",
          gender: row[studentColumnMap.gender] || "",
          tanggalDaftar: formatDate(tanggalDaftarDate),
          status: row[studentColumnMap.status] || "Aktif",
        };

        filteredStudents.push(student);
      }
    }

    Logger.log(
      "Found " + filteredStudents.length + " students matching criteria"
    );
    return filteredStudents;
  } catch (error) {
    Logger.log("Error in previewStudentsByEntryDate: " + error.message);
    throw new Error("Gagal mendapatkan preview siswa: " + error.message);
  }
}

// Fungsi untuk batch update status siswa
function batchUpdateStudentStatus(batchUpdateParams) {
  try {
    Logger.log(
      "batchUpdateStudentStatus called with params: " +
        JSON.stringify(batchUpdateParams)
    );

    const filterParams = batchUpdateParams.filter;
    const updateData = batchUpdateParams.update;

    // Validasi parameter update
    if (!updateData.newStatus) {
      throw new Error("Status baru harus diisi");
    }

    // Akses spreadsheet
    const ss = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const studentsSheet = ss.getSheetByName(STUDENTS_SHEET_NAME);

    // Ambil semua data
    const dataRange = studentsSheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length <= 1) {
      return { success: false, message: "Tidak ada data siswa", count: 0 };
    }

    // Inisialisasi column map
    const headers = values[0];
    initializeColumnMap(headers);

    let updatedCount = 0;
    const rowsToUpdate = [];

    // Cari siswa yang sesuai kriteria
    for (let i = 1; i < values.length; i++) {
      const row = values[i];

      // Skip rows yang tidak memiliki data penting
      if (!row[studentColumnMap.nis] && !row[studentColumnMap.nama]) {
        continue;
      }

      const tanggalDaftar = row[studentColumnMap.tanggalDaftar];
      if (!tanggalDaftar) {
        continue;
      }

      let tanggalDaftarDate;
      if (tanggalDaftar instanceof Date) {
        tanggalDaftarDate = tanggalDaftar;
      } else {
        tanggalDaftarDate = new Date(tanggalDaftar);
      }

      // Skip jika tanggal tidak valid
      if (isNaN(tanggalDaftarDate.getTime())) {
        continue;
      }

      let isMatch = false;

      if (filterParams.date) {
        // Filter tanggal tertentu
        const targetDate = new Date(filterParams.date);
        isMatch =
          tanggalDaftarDate.toDateString() === targetDate.toDateString();
      } else if (filterParams.startDate && filterParams.endDate) {
        // Filter rentang tanggal
        const startDate = new Date(filterParams.startDate);
        const endDate = new Date(filterParams.endDate);
        isMatch =
          tanggalDaftarDate >= startDate && tanggalDaftarDate <= endDate;
      } else if (filterParams.year) {
        // Filter berdasarkan tahun
        const targetYear = parseInt(filterParams.year);
        isMatch = tanggalDaftarDate.getFullYear() === targetYear;
      }

      if (isMatch) {
        // Siapkan data untuk update
        const rowIndex = i + 1; // Sheet row index (1-based)
        rowsToUpdate.push({
          rowIndex: rowIndex,
          nis: row[studentColumnMap.nis],
          nama: row[studentColumnMap.nama],
        });
      }
    }

    if (rowsToUpdate.length === 0) {
      return {
        success: false,
        message: "Tidak ada siswa yang sesuai kriteria",
        count: 0,
      };
    }

    // Update status siswa
    for (const studentRow of rowsToUpdate) {
      try {
        // Update status
        studentsSheet
          .getRange(studentRow.rowIndex, studentColumnMap.status + 1)
          .setValue(updateData.newStatus);

        // Note: Tanggal lulus dan notes tidak tersedia dalam struktur kolom saat ini
        // Jika diperlukan, kolom tersebut perlu ditambahkan ke spreadsheet terlebih dahulu

        updatedCount++;
        Logger.log(
          "Updated student: " + studentRow.nis + " - " + studentRow.nama
        );
      } catch (updateError) {
        Logger.log(
          "Error updating student " +
            studentRow.nis +
            ": " +
            updateError.message
        );
      }
    }

    Logger.log(
      "Batch update completed. Updated " + updatedCount + " students."
    );

    return {
      success: true,
      message: "Batch update berhasil",
      count: updatedCount,
    };
  } catch (error) {
    Logger.log("Error in batchUpdateStudentStatus: " + error.message);
    return {
      success: false,
      message: "Gagal melakukan batch update: " + error.message,
      count: 0,
    };
  }
}

// ===== FUNGSI UNTUK MENGELOLA DATA NILAI SISWA =====

// Fungsi untuk mendapatkan semua data nilai siswa
function getAllStudentGrades(options = {}) {
  try {
    Logger.log(
      "getAllStudentGrades called with options: " + JSON.stringify(options)
    );

    // Set default options with smaller default limit to prevent size issues
    const defaultOptions = {
      page: 1,
      limit: 50, // Default limit to prevent large responses
      sortField: "nis",
      sortDirection: "asc",
      searchQuery: "",
      nisFilter: "",
      classFilter: "",
      subjectFilter: "",
    };

    // Merge options dengan default
    options = Object.assign(defaultOptions, options);

    // Override limit if explicitly set to 0 (for frontend compatibility)
    if (options.limit === 0) {
      options.limit = 100; // Maximum safe limit for Google Apps Script
      Logger.log("Limit override applied: changed from 0 to 100 for safety");
    }

    Logger.log("Final options: " + JSON.stringify(options));

    // Akses spreadsheet DATA NILAI
    Logger.log("Accessing spreadsheet with ID: " + getBukuIndukSpreadsheetId());
    const ss = SpreadsheetApp.openById(getBukuIndukSpreadsheetId());
    Logger.log("Spreadsheet accessed successfully");

    Logger.log("Looking for sheet: " + STUDENTS_GRADE_NAME);
    const gradesSheet = ss.getSheetByName(STUDENTS_GRADE_NAME);

    if (!gradesSheet) {
      Logger.log("ERROR: Sheet DATA NILAI tidak ditemukan");
      throw new Error("Sheet DATA NILAI tidak ditemukan");
    }
    Logger.log("Grades sheet found successfully");

    // Ambil semua data
    Logger.log("Getting data range from grades sheet");
    const dataRange = gradesSheet.getDataRange();
    Logger.log("Data range: " + dataRange.getA1Notation());

    const values = dataRange.getValues();
    Logger.log("Total rows retrieved: " + values.length);

    if (values.length <= 1) {
      Logger.log("No data found, returning empty result");
      return {
        grades: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: options.page,
      };
    }

    // Header row
    const headers = values[0];
    Logger.log("Headers found: " + headers.join(", "));

    // Inisialisasi column map untuk grades
    Logger.log("Initializing grade column map");
    const gradeColumnMap = initializeGradeColumnMap(headers);
    Logger.log("Grade column map initialized successfully");

    // Log header information for debugging
    Logger.log("Available headers: " + headers.join(", "));

    let grades = [];
    Logger.log("Starting to process " + (values.length - 1) + " data rows");

    // Proses setiap baris data
    for (let i = 1; i < values.length; i++) {
      const row = values[i];

      // Skip rows yang tidak memiliki data penting
      if (!row[gradeColumnMap.nis]) {
        Logger.log("Skipping row " + i + " - no NIS found");
        continue;
      }

      // Data dasar siswa
      const studentData = {
        timestamp: row[gradeColumnMap.timestamp] || "",
        nis: row[gradeColumnMap.nis] || "",
        nama: row[gradeColumnMap.nama] || "",
        nisn: row[gradeColumnMap.nisn] || "",
        kelas: row[gradeColumnMap.kelas] || "",
        jenisKelas: row[gradeColumnMap.jenisKelas] || "",
        jenisKelas_: row[gradeColumnMap.jenisKelas_] || "",
        semester: row[gradeColumnMap.semester] || "",
        tahunAjaran: row[gradeColumnMap.tahunAjaran] || "",
        rataRataNilaiPerSMT: row[gradeColumnMap.rataRataNilaiPerSMT] || "",
      };

      // Tambahkan nilai mata pelajaran
      const subjects = {
        pendidikanAgamaIslam: row[gradeColumnMap.pendidikanAgamaIslam] || "",
        pendidikanPancasila: row[gradeColumnMap.pendidikanPancasila] || "",
        bahasaIndonesia: row[gradeColumnMap.bahasaIndonesia] || "",
        matematika: row[gradeColumnMap.matematika] || "",
        ilmuPengetahuanAlam: row[gradeColumnMap.ilmuPengetahuanAlam] || "",
        ilmuPengetahuanSosial: row[gradeColumnMap.ilmuPengetahuanSosial] || "",
        bahasaInggris: row[gradeColumnMap.bahasaInggris] || "",
        pendidikanJasmani: row[gradeColumnMap.pendidikanJasmani] || "",
        informatika: row[gradeColumnMap.informatika] || "",
        seniBudaya: row[gradeColumnMap.seniBudaya] || "",
        bimbinganKonseling: row[gradeColumnMap.bimbinganKonseling] || "",
        bahasaJawa: row[gradeColumnMap.bahasaJawa] || "",
      };

      // Gabungkan semua data
      const grade = Object.assign({}, studentData, subjects);

      grades.push(grade);
    }

    Logger.log("Total grades processed: " + grades.length);

    // Apply search filter if provided
    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase().trim();
      Logger.log("Applying search filter with query: '" + query + "'");

      grades = grades.filter((grade) => {
        const nisMatch =
          grade.nis && grade.nis.toString().toLowerCase().includes(query);
        const namaMatch =
          grade.nama && grade.nama.toLowerCase().includes(query);
        const kelasMatch =
          grade.kelas && grade.kelas.toLowerCase().includes(query);
        const nisnMatch =
          grade.nisn && grade.nisn.toString().toLowerCase().includes(query);

        return nisMatch || namaMatch || kelasMatch || nisnMatch;
      });
      Logger.log("After search filter: " + grades.length + " grades remaining");
    }

    // Apply specific filters
    if (options.nisFilter) {
      grades = grades.filter((grade) => grade.nis === options.nisFilter);
      Logger.log("After NIS filter: " + grades.length + " grades remaining");
    }

    if (options.classFilter) {
      grades = grades.filter((grade) => grade.kelas === options.classFilter);
      Logger.log("After class filter: " + grades.length + " grades remaining");
    }

    // Sort the results
    Logger.log(
      "Sorting grades by " +
        options.sortField +
        " (" +
        options.sortDirection +
        ")"
    );
    grades.sort((a, b) => {
      let valA = a[options.sortField] || "";
      let valB = b[options.sortField] || "";

      // Convert to strings if they are not already
      if (typeof valA !== "string") valA = valA.toString();
      if (typeof valB !== "string") valB = valB.toString();

      // Perform the comparison based on sort direction
      if (options.sortDirection === "asc") {
        return valA.localeCompare(valB, "id", { numeric: true });
      } else {
        return valB.localeCompare(valA, "id", { numeric: true });
      }
    });
    Logger.log("Sorting completed");

    // Hitung total data dan total halaman
    const totalCount = grades.length;
    const totalPages =
      options.limit > 0 ? Math.ceil(totalCount / options.limit) : 1;
    Logger.log("Total count: " + totalCount + ", Total pages: " + totalPages);

    // Terapkan pagination jika limit > 0
    if (options.limit > 0) {
      const startIndex = (options.page - 1) * options.limit;
      const endIndex = startIndex + options.limit;
      grades = grades.slice(startIndex, endIndex);
      Logger.log(
        "Applied pagination: showing " +
          grades.length +
          " grades (" +
          startIndex +
          " to " +
          endIndex +
          ")"
      );
    }

    // Return data dengan informasi pagination
    // Reduce data size by removing empty fields and optimizing structure
    const optimizedGrades = grades.map((grade) => {
      const optimized = {};

      // Only include non-empty essential fields
      const essentialFields = [
        "nis",
        "nama",
        "kelas",
        "jenisKelas",
        "jenisKelas_",
        "nisn",
        "semester",
        "tahunAjaran",
      ];
      essentialFields.forEach((field) => {
        if (grade[field] && grade[field].toString().trim() !== "") {
          optimized[field] = grade[field];
        }
      });

      // Only include non-empty subject grades
      const subjectFields = [
        "pendidikanAgamaIslam",
        "pendidikanPancasila",
        "bahasaIndonesia",
        "matematika",
        "ilmuPengetahuanAlam",
        "ilmuPengetahuanSosial",
        "bahasaInggris",
        "pendidikanJasmani",
        "informatika",
        "seniBudaya",
        "bimbinganKonseling",
        "bahasaJawa",
      ];

      subjectFields.forEach((field) => {
        if (grade[field] && grade[field].toString().trim() !== "") {
          optimized[field] = grade[field];
        }
      });

      return optimized;
    });

    const result = {
      grades: optimizedGrades,
      totalCount: totalCount,
      totalPages: totalPages,
      currentPage: options.page,
    };

    Logger.log(
      "Preparing to return optimized result: grades=" +
        optimizedGrades.length +
        ", totalCount=" +
        totalCount +
        ", totalPages=" +
        totalPages +
        ", currentPage=" +
        options.page
    );

    // Log the size of the result to check if it's too large
    const resultString = JSON.stringify(result);
    Logger.log("Result JSON size: " + resultString.length + " characters");

    Logger.log("getAllStudentGrades function completed successfully");
    return result;
  } catch (error) {
    Logger.log("ERROR in getAllStudentGrades: " + error.message);
    Logger.log("Error stack: " + error.stack);

    // Return null explicitly to match what frontend is receiving
    Logger.log("Returning null due to error");
    return null;
  }
}

// Fungsi khusus untuk frontend yang membutuhkan semua data dengan optimasi
function getAllStudentGradesForFrontend() {
  try {
    Logger.log("getAllStudentGradesForFrontend called");

    // Get data with a reasonable limit for frontend
    const allData = getAllStudentGrades({ limit: 100, page: 1 });

    if (!allData || !allData.grades) {
      Logger.log("No data returned from getAllStudentGrades");
      return {
        grades: [],
        totalCount: 0,
        success: false,
        message: "No data available",
      };
    }

    // Return optimized data structure for frontend
    const result = {
      grades: allData.grades,
      totalCount: allData.totalCount,
      totalPages: allData.totalPages,
      currentPage: allData.currentPage,
      success: true,
      message: "Data loaded successfully",
    };

    Logger.log(
      "getAllStudentGradesForFrontend completed: " +
        result.grades.length +
        " records"
    );
    return result;
  } catch (error) {
    Logger.log("ERROR in getAllStudentGradesForFrontend: " + error.message);
    return {
      grades: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      success: false,
      message: "Error loading data: " + error.message,
    };
  }
}

// Fungsi untuk mendapatkan nilai siswa berdasarkan NIS
function getStudentGradesByNIS(nisId, options = {}) {
  try {
    Logger.log("getStudentGradesByNIS called with NIS: " + nisId);

    if (!nisId) {
      throw new Error("NIS tidak valid");
    }

    // Set filter NIS
    options.nisFilter = nisId;

    // Panggil fungsi getAllStudentGrades dengan filter NIS
    const result = getAllStudentGrades(options);

    return {
      nis: nisId,
      grades: result.grades,
      totalCount: result.totalCount,
      summary: generateGradeSummary(result.grades),
    };
  } catch (error) {
    Logger.log("Error in getStudentGradesByNIS: " + error.message);
    throw new Error("Gagal mendapatkan nilai siswa: " + error.message);
  }
}

// Fungsi untuk mendapatkan ringkasan nilai siswa
function generateGradeSummary(grades) {
  if (!grades || grades.length === 0) {
    return {
      totalSubjects: 0,
      averageGrade: 0,
      highestGrade: 0,
      lowestGrade: 0,
      passedSubjects: 0,
      failedSubjects: 0,
    };
  }

  // Daftar mata pelajaran yang akan dihitung
  const subjectFields = [
    "pendidikanAgamaIslam",
    "pendidikanPancasila",
    "bahasaIndonesia",
    "matematika",
    "ilmuPengetahuanAlam",
    "ilmuPengetahuanSosial",
    "bahasaInggris",
    "pendidikanJasmani",
    "informatika",
    "seniBudaya",
    "bimbinganKonseling",
    "bahasaJawa",
  ];

  let totalGrade = 0;
  let validGrades = [];
  let passedCount = 0;
  let failedCount = 0;

  // Ambil data siswa pertama (karena semua baris adalah siswa yang sama)
  const studentGrade = grades[0];

  // Hitung nilai dari setiap mata pelajaran
  subjectFields.forEach((subject) => {
    const nilai = parseFloat(studentGrade[subject]);
    if (!isNaN(nilai) && nilai > 0) {
      validGrades.push(nilai);
      totalGrade += nilai;

      // Asumsi nilai lulus >= 75
      if (nilai >= 75) {
        passedCount++;
      } else {
        failedCount++;
      }
    }
  });

  const averageGrade =
    validGrades.length > 0 ? totalGrade / validGrades.length : 0;
  const highestGrade = validGrades.length > 0 ? Math.max(...validGrades) : 0;
  const lowestGrade = validGrades.length > 0 ? Math.min(...validGrades) : 0;

  return {
    totalSubjects: validGrades.length,
    averageGrade: Math.round(averageGrade * 100) / 100,
    highestGrade: highestGrade,
    lowestGrade: lowestGrade,
    passedSubjects: passedCount,
    failedSubjects: failedCount,
  };
}

// Fungsi untuk inisialisasi column map untuk sheet DATA NILAI
function initializeGradeColumnMap(headers) {
  try {
    Logger.log(
      "initializeGradeColumnMap called with " + headers.length + " headers"
    );
    const gradeColumnMap = {};

    // Mapping kolom berdasarkan analisis struktur sheet DATA NILAI
    const columnMappings = {
      timestamp: ["Timestamp"],
      nama: ["Nama Siswa"],
      nis: ["NIS"],
      nisn: ["NISN"],
      kelas: ["Kelas"],
      jenisKelas: ["Jenis Kelas"],
      jenisKelas_: ["Jenis Kelas_"],
      semester: ["Semester"],
      tahunAjaran: ["Tahun Ajaran"],
      // Mata pelajaran dengan nilai
      pendidikanAgamaIslam: ["Pendidikan Agama Islam"],
      pendidikanPancasila: ["Pendidikan Pancasila"],
      bahasaIndonesia: ["Bahasa Indonesia"],
      matematika: ["Matematika"],
      ilmuPengetahuanAlam: ["Ilmu Pengetahuan Alam"],
      ilmuPengetahuanSosial: ["Ilmu Pengetahuan Sosial"],
      bahasaInggris: ["Bahasa Inggris"],
      pendidikanJasmani: ["Pendidikan Jasmani, Olahraga, dan Kesehatan"],
      informatika: ["Informatika"],
      seniBudaya: ["Seni Budaya"],
      bimbinganKonseling: ["Bimbingan dan Konseling"],
      bahasaJawa: ["Bahasa Jawa"],
      // Capaian Pembelajaran
      capaianPendidikanAgamaIslam: [
        "Capaian Pembelajaran (Pendidikan Agama Islam)",
      ],
      capaianPendidikanPancasila: [
        "Capaian Pembelajaran (Pendidikan Pancasila)",
      ],
      capaianBahasaIndonesia: ["Capaian Pembelajaran (Bahasa Indonesia)"],
      capaianMatematika: ["Capaian Pembelajaran (Matematika)"],
      capaianIlmuPengetahuanAlam: [
        "Capaian Pembelajaran (Ilmu Pengetahuan Alam)",
      ],
      capaianIlmuPengetahuanSosial: [
        "Capaian Pembelajaran (Ilmu Pengetahuan Sosial)",
      ],
      capaianBahasaInggris: ["Capaian Pembelajaran (Bahasa Inggris)"],
      capaianPendidikanJasmani: ["Capaian Pembelajaran (PJOK)"],
      capaianInformatika: ["Capaian Pembelajaran (Informatika)"],
      capaianSeniBudaya: ["Capaian Pembelajaran (Seni Budaya)"],
      capaianBimbinganKonseling: ["Capaian Pembelajaran (BK)"],
      capaianBahasaJawa: ["Capaian Pembelajaran (Bahasa Jawa)"],
      // Field tambahan
      rataRataNilaiPerSMT: ["Rata-Rata Nilai per SMT"],
    };

    Logger.log("Starting column mapping process");
    // Cari index kolom untuk setiap field
    for (const [field, possibleNames] of Object.entries(columnMappings)) {
      gradeColumnMap[field] = findColumnIndex(headers, possibleNames);
      if (gradeColumnMap[field] === -1) {
        Logger.log(
          "WARNING: Column not found for field '" +
            field +
            "' with names: " +
            possibleNames.join(", ")
        );
      }
    }

    Logger.log("Grade column map initialized successfully");
    Logger.log("Grade column map: " + JSON.stringify(gradeColumnMap));
    return gradeColumnMap;
  } catch (error) {
    Logger.log("ERROR in initializeGradeColumnMap: " + error.message);
    Logger.log("Error stack: " + error.stack);
    throw error;
  }
}

// Fungsi untuk mendapatkan daftar mata pelajaran yang tersedia
function getAvailableSubjects() {
  try {
    // Daftar mata pelajaran berdasarkan struktur sheet DATA NILAI
    const subjects = [
      "Pendidikan Agama Islam",
      "Pendidikan Pancasila",
      "Bahasa Indonesia",
      "Matematika",
      "Ilmu Pengetahuan Alam",
      "Ilmu Pengetahuan Sosial",
      "Bahasa Inggris",
      "Pendidikan Jasmani, Olahraga, dan Kesehatan",
      "Informatika",
      "Seni Budaya",
      "Bimbingan dan Konseling",
      "Bahasa Jawa",
    ];

    return subjects.sort();
  } catch (error) {
    Logger.log("Error in getAvailableSubjects: " + error.message);
    return [];
  }
}

// Fungsi untuk mendapatkan daftar kelas yang tersedia
function getAvailableClasses() {
  try {
    const ss = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const gradesSheet = ss.getSheetByName(STUDENTS_GRADE_NAME);

    if (!gradesSheet) {
      return [];
    }

    const dataRange = gradesSheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length <= 1) {
      return [];
    }

    const headers = values[0];
    const gradeColumnMap = initializeGradeColumnMap(headers);

    const classes = new Set();

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const kelas = row[gradeColumnMap.kelas];
      if (kelas) {
        classes.add(kelas);
      }
    }

    return Array.from(classes).sort();
  } catch (error) {
    Logger.log("Error in getAvailableClasses: " + error.message);
    return [];
  }
}

// Fungsi khusus untuk halaman Student_grades_detail - pencarian data siswa yang lebih robust
function getStudentDetailForGrades(nisId, kelas, semester) {
  try {
    Logger.log("=== getStudentDetailForGrades START ===");
    Logger.log(
      'Searching for NIS: "' +
        nisId +
        '" (type: ' +
        typeof nisId +
        "), Kelas: " +
        kelas +
        ", Semester: " +
        semester
    );

    if (!nisId) {
      throw new Error("NIS tidak boleh kosong");
    }

    const ss = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const studentsSheet = ss.getSheetByName(STUDENTS_GRADE_NAME);

    if (!studentsSheet) {
      throw new Error('Sheet "' + STUDENTS_GRADE_NAME + '" tidak ditemukan');
    }

    const dataRange = studentsSheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length === 0) {
      throw new Error("Sheet kosong");
    }

    const headers = values[0];
    const nisIndex = headers.indexOf("NIS");
    const kelasIndex = headers.indexOf("Kelas");
    const semesterIndex = headers.indexOf("Semester");

    if (nisIndex === -1) {
      throw new Error("Kolom NIS tidak ditemukan");
    }

    Logger.log("Searching in " + (values.length - 1) + " student records...");
    Logger.log("NIS column index: " + nisIndex);
    Logger.log("Kelas column index: " + kelasIndex);
    Logger.log("Semester column index: " + semesterIndex);

    // Normalisasi NIS yang dicari
    const searchNIS = String(nisId).trim();
    Logger.log('Normalized search NIS: "' + searchNIS + '"');

    // Cari siswa dengan berbagai format NIS dan pertimbangkan kelas dan semester
    for (let i = 1; i < values.length; i++) {
      const rowNIS = String(values[i][nisIndex] || "").trim();
      const rowKelas =
        kelasIndex !== -1 ? String(values[i][kelasIndex] || "").trim() : "";
      const rowSemester =
        semesterIndex !== -1
          ? String(values[i][semesterIndex] || "").trim()
          : "";

      Logger.log(
        "Row " +
          i +
          ': comparing NIS "' +
          rowNIS +
          '" with "' +
          searchNIS +
          '", Kelas "' +
          rowKelas +
          '" with "' +
          (kelas || "any") +
          '", Semester "' +
          rowSemester +
          '" with "' +
          (semester || "any") +
          '"'
      );

      // Coba berbagai format perbandingan untuk NIS
      const nisMatches = [
        rowNIS === searchNIS, // Exact match
        rowNIS === searchNIS.padStart(4, "0"), // Add leading zeros
        rowNIS.padStart(4, "0") === searchNIS, // Add leading zeros to row
        parseInt(rowNIS) === parseInt(searchNIS), // Numeric comparison
      ];

      // Cek apakah NIS cocok
      const nisMatch = nisMatches.some((match) => match);

      // Cek apakah kelas cocok (jika parameter kelas diberikan)
      let kelasMatch = true; // Default true jika tidak ada filter kelas
      if (kelas && kelasIndex !== -1) {
        kelasMatch =
          rowKelas === kelas ||
          rowKelas.includes(kelas) ||
          kelas.includes(rowKelas);
      }

      // Cek apakah semester cocok (jika parameter semester diberikan)
      let semesterMatch = true; // Default true jika tidak ada filter semester
      if (semester && semesterIndex !== -1) {
        // Normalisasi semester untuk perbandingan yang lebih fleksibel
        const normalizedRowSemester = rowSemester
          .toLowerCase()
          .replace(/\s+/g, "");
        const normalizedSearchSemester = String(semester)
          .toLowerCase()
          .replace(/\s+/g, "");

        semesterMatch =
          normalizedRowSemester === normalizedSearchSemester ||
          normalizedRowSemester.includes(normalizedSearchSemester) ||
          normalizedSearchSemester.includes(normalizedRowSemester) ||
          // Cek juga format angka semester (1 vs I, 2 vs II)
          (semester === "1" &&
            (rowSemester.includes("I") || rowSemester.includes("Ganjil"))) ||
          (semester === "2" &&
            (rowSemester.includes("II") || rowSemester.includes("Genap"))) ||
          (semester === "I" &&
            (rowSemester.includes("1") || rowSemester.includes("Ganjil"))) ||
          (semester === "II" &&
            (rowSemester.includes("2") || rowSemester.includes("Genap")));
      }

      if (nisMatch && kelasMatch && semesterMatch) {
        Logger.log("✓ Student found at row " + i);

        // Buat object siswa dengan semua data
        const student = {};
        for (let j = 0; j < headers.length; j++) {
          let value = values[i][j];

          // Format tanggal jika diperlukan
          if (value instanceof Date) {
            const options = { year: "numeric", month: "long", day: "numeric" };
            value = value.toLocaleDateString("id-ID", options);
          }

          student[headers[j]] = value;
        }

        // Tambahkan mapping untuk kompatibilitas dengan frontend
        student.nis = student.NIS || student.nis;
        student.nama = student["Nama Siswa"] || student.nama;
        student.nisn = student.NISN || student.nisn;
        student.gender = student["Jenis Kelamin"] || student.gender;
        student.birthplace = student["Tempat Lahir"] || student.birthplace;
        student.birthdate = student["Tanggal Lahir"] || student.birthdate;
        student.agama = student.Agama || student.agama;
        student.kewarganegaraan =
          student.Kewarganegaraan || student.kewarganegaraan;
        student.alamat = student.Alamat || student.alamat;
        student.kelas = student.Kelas || student.kelas;

        Logger.log(
          "Student data found: " +
            JSON.stringify({
              nis: student.nis,
              nama: student.nama,
              kelas: student.kelas,
              semester: student.Semester,
              searchedKelas: kelas,
              searchedSemester: semester,
            })
        );

        return {
          success: true,
          student: student,
        };
      }
    }

    // Jika tidak ditemukan, log beberapa contoh data untuk debugging
    Logger.log("Student not found. Sample data from sheet:");
    for (let i = 1; i < Math.min(6, values.length); i++) {
      const rowNis = values[i][nisIndex];
      const rowKelas = kelasIndex !== -1 ? values[i][kelasIndex] : "N/A";
      const rowSemester =
        semesterIndex !== -1 ? values[i][semesterIndex] : "N/A";
      Logger.log(
        "Row " +
          i +
          ' NIS: "' +
          rowNis +
          '" (type: ' +
          typeof rowNis +
          "), Kelas: " +
          rowKelas +
          ", Semester: " +
          rowSemester
      );
    }

    const errorMsg =
      "Siswa dengan NIS " +
      nisId +
      (kelas ? " di kelas " + kelas : "") +
      (semester ? " semester " + semester : "") +
      " tidak ditemukan";
    throw new Error(errorMsg);
  } catch (error) {
    Logger.log("Error in getStudentDetailForGrades: " + error.message);
    Logger.log("Error stack: " + error.stack);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Fungsi khusus untuk mendapatkan data nilai siswa untuk halaman Student_grades_detail
function getAllStudentGradesForDetail(nisId, kelas, semester) {
  try {
    Logger.log(
      "getAllStudentGradesForDetail called with NIS: " +
        nisId +
        ", Kelas: " +
        kelas +
        ", Semester: " +
        semester
    );

    // Akses spreadsheet DATA NILAI
    const ss = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const gradesSheet = ss.getSheetByName(STUDENTS_GRADE_NAME);

    if (!gradesSheet) {
      throw new Error("Sheet DATA NILAI tidak ditemukan");
    }

    // Ambil semua data
    const dataRange = gradesSheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length <= 1) {
      return { grades: [], totalCount: 0 };
    }

    // Header row
    const headers = values[0];
    Logger.log("Processing " + (values.length - 1) + " rows for grade detail");

    // Cari index kolom langsung dari header tanpa mapping
    const nisIndex = headers.findIndex((h) => h === "NIS");
    const namaIndex = headers.findIndex((h) => h === "Nama Siswa");
    const kelasIndex = headers.findIndex((h) => h === "Kelas");
    const semesterIndex = headers.findIndex((h) => h === "Semester");

    // Index untuk mata pelajaran
    const pendidikanAgamaIslamIndex = headers.findIndex(
      (h) => h === "Pendidikan Agama Islam"
    );
    const pendidikanPancasilaIndex = headers.findIndex(
      (h) => h === "Pendidikan Pancasila"
    );
    const bahasaIndonesiaIndex = headers.findIndex(
      (h) => h === "Bahasa Indonesia"
    );
    const matematikaIndex = headers.findIndex((h) => h === "Matematika");
    const ilmuPengetahuanAlamIndex = headers.findIndex(
      (h) => h === "Ilmu Pengetahuan Alam"
    );
    const ilmuPengetahuanSosialIndex = headers.findIndex(
      (h) => h === "Ilmu Pengetahuan Sosial"
    );
    const bahasaInggrisIndex = headers.findIndex((h) => h === "Bahasa Inggris");
    const pendidikanJasmaniIndex = headers.findIndex(
      (h) => h === "Pendidikan Jasmani, Olahraga, dan Kesehatan"
    );
    const informatikaIndex = headers.findIndex((h) => h === "Informatika");
    const seniBudayaIndex = headers.findIndex((h) => h === "Seni Budaya");
    const bimbinganKonselingIndex = headers.findIndex(
      (h) => h === "Bimbingan dan Konseling"
    );
    const bahasaJawaIndex = headers.findIndex((h) => h === "Bahasa Jawa");

    // Index untuk capaian pembelajaran
    const capaianPendidikanAgamaIslamIndex = headers.findIndex(
      (h) => h === "Capaian Pembelajaran (Pendidikan Agama Islam)"
    );
    const capaianPendidikanPancasilaIndex = headers.findIndex(
      (h) => h === "Capaian Pembelajaran (Pendidikan Pancasila)"
    );
    const capaianBahasaIndonesiaIndex = headers.findIndex(
      (h) => h === "Capaian Pembelajaran (Bahasa Indonesia)"
    );
    const capaianMatematikaIndex = headers.findIndex(
      (h) => h === "Capaian Pembelajaran (Matematika)"
    );
    const capaianIlmuPengetahuanAlamIndex = headers.findIndex(
      (h) => h === "Capaian Pembelajaran (Ilmu Pengetahuan Alam)"
    );
    const capaianIlmuPengetahuanSosialIndex = headers.findIndex(
      (h) => h === "Capaian Pembelajaran (Ilmu Pengetahuan Sosial)"
    );
    const capaianBahasaInggrisIndex = headers.findIndex(
      (h) => h === "Capaian Pembelajaran (Bahasa Inggris)"
    );
    const capaianPendidikanJasmaniIndex = headers.findIndex(
      (h) => h === "Capaian Pembelajaran (PJOK)"
    );
    const capaianInformatikaIndex = headers.findIndex(
      (h) => h === "Capaian Pembelajaran (Informatika)"
    );
    const capaianSeniBudayaIndex = headers.findIndex(
      (h) => h === "Capaian Pembelajaran (Seni Budaya)"
    );
    const capaianBimbinganKonselingIndex = headers.findIndex(
      (h) => h === "Capaian Pembelajaran (BK)"
    );
    const capaianBahasaJawaIndex = headers.findIndex(
      (h) => h === "Capaian Pembelajaran (Bahasa Jawa)"
    );

    Logger.log("Kelas column index: " + kelasIndex);
    Logger.log("Semester column index: " + semesterIndex);

    let matchingGrades = [];

    // Proses setiap baris data
    for (let i = 1; i < values.length; i++) {
      const row = values[i];

      // Skip rows yang tidak memiliki NIS
      if (!row[nisIndex]) {
        continue;
      }

      // Cek apakah NIS cocok
      const rowNIS = String(row[nisIndex] || "").trim();
      const searchNIS = String(nisId).trim();

      const nisMatches = [
        rowNIS === searchNIS,
        rowNIS === searchNIS.padStart(4, "0"),
        rowNIS.padStart(4, "0") === searchNIS,
        parseInt(rowNIS) === parseInt(searchNIS),
      ];

      if (!nisMatches.some((match) => match)) {
        continue;
      }

      // Ambil kelas dan semester dari kolom yang benar (nilai akademik biasa)
      const rowKelas =
        kelasIndex !== -1 ? String(row[kelasIndex] || "").trim() : "";
      const rowSemester =
        semesterIndex !== -1 ? String(row[semesterIndex] || "").trim() : "";

      Logger.log(
        "Row " +
          i +
          ": NIS=" +
          rowNIS +
          ", Kelas=" +
          rowKelas +
          ", Semester=" +
          rowSemester
      );

      // Cek apakah kelas dan semester cocok dengan mekanisme sederhana
      let kelasMatch = false;
      let semesterMatch = false;

      // Kelas harus cocok dan tidak boleh kosong
      if (kelas && rowKelas) {
        kelasMatch = rowKelas.trim() === kelas.trim();
      } else if (!kelas) {
        // Jika tidak ada filter kelas, anggap cocok
        kelasMatch = true;
      }

      // Semester harus cocok dan tidak boleh kosong
      if (semester && rowSemester) {
        semesterMatch = rowSemester.trim() === semester.trim();
      } else if (!semester) {
        // Jika tidak ada filter semester, anggap cocok
        semesterMatch = true;
      }

      if (kelasMatch && semesterMatch) {
        Logger.log("✓ Matching grade record found at row " + i);

        // Buat object grade dengan data langsung dari spreadsheet
        const gradeData = {
          nis: row[nisIndex] || "",
          nama: row[namaIndex] || "",
          kelas: rowKelas,
          semester: rowSemester,

          // Nilai mata pelajaran reguler
          pendidikanAgamaIslam: row[pendidikanAgamaIslamIndex] || "",
          pendidikanPancasila: row[pendidikanPancasilaIndex] || "",
          bahasaIndonesia: row[bahasaIndonesiaIndex] || "",
          matematika: row[matematikaIndex] || "",
          ilmuPengetahuanAlam: row[ilmuPengetahuanAlamIndex] || "",
          ilmuPengetahuanSosial: row[ilmuPengetahuanSosialIndex] || "",
          bahasaInggris: row[bahasaInggrisIndex] || "",
          pendidikanJasmani: row[pendidikanJasmaniIndex] || "",
          informatika: row[informatikaIndex] || "",
          seniBudaya: row[seniBudayaIndex] || "",
          bimbinganKonseling: row[bimbinganKonselingIndex] || "",
          bahasaJawa: row[bahasaJawaIndex] || "",

          // Capaian pembelajaran
          "Capaian Pembelajaran (Pendidikan Agama Islam)":
            row[capaianPendidikanAgamaIslamIndex] || "",
          "Capaian Pembelajaran (Pendidikan Pancasila)":
            row[capaianPendidikanPancasilaIndex] || "",
          "Capaian Pembelajaran (Bahasa Indonesia)":
            row[capaianBahasaIndonesiaIndex] || "",
          "Capaian Pembelajaran (Matematika)":
            row[capaianMatematikaIndex] || "",
          "Capaian Pembelajaran (Ilmu Pengetahuan Alam)":
            row[capaianIlmuPengetahuanAlamIndex] || "",
          "Capaian Pembelajaran (Ilmu Pengetahuan Sosial)":
            row[capaianIlmuPengetahuanSosialIndex] || "",
          "Capaian Pembelajaran (Bahasa Inggris)":
            row[capaianBahasaInggrisIndex] || "",
          "Capaian Pembelajaran (PJOK)":
            row[capaianPendidikanJasmaniIndex] || "",
          "Capaian Pembelajaran (Informatika)":
            row[capaianInformatikaIndex] || "",
          "Capaian Pembelajaran (Seni Budaya)":
            row[capaianSeniBudayaIndex] || "",
          "Capaian Pembelajaran (BK)":
            row[capaianBimbinganKonselingIndex] || "",
          "Capaian Pembelajaran (Bahasa Jawa)":
            row[capaianBahasaJawaIndex] || "",
        };

        matchingGrades.push(gradeData);
      }
    }

    Logger.log("Total matching grades found: " + matchingGrades.length);

    return {
      grades: matchingGrades,
      totalCount: matchingGrades.length,
    };
  } catch (error) {
    Logger.log("Error in getAllStudentGradesForDetail: " + error.message);
    throw error;
  }
}

// Fungsi untuk mendapatkan detail nilai siswa berdasarkan NIS, kelas, dan semester
function getStudentGradeDetail(nisId, kelas, semester) {
  try {
    Logger.log(
      "getStudentGradeDetail called with NIS: " +
        nisId +
        ", Kelas: " +
        kelas +
        ", Semester: " +
        semester
    );

    if (!nisId) {
      throw new Error("NIS tidak boleh kosong");
    }

    // Gunakan fungsi pencarian khusus untuk halaman grades detail dengan parameter kelas dan semester
    const studentData = getStudentDetailForGrades(nisId, kelas, semester);
    if (!studentData || !studentData.success) {
      throw new Error(studentData.error || "Data siswa tidak ditemukan");
    }

    // Gunakan fungsi khusus untuk mendapatkan data nilai yang menggunakan kolom yang benar
    const gradeData = getAllStudentGradesForDetail(nisId, kelas, semester);
    const filteredGrades = gradeData.grades || [];

    Logger.log("Filtered grades count: " + filteredGrades.length);

    // Generate summary untuk data yang sudah difilter
    const summary = generateGradeSummary(filteredGrades);

    // Gabungkan data capaian pembelajaran dari gradeData ke studentData
    let enhancedStudentData = studentData.student;
    if (filteredGrades.length > 0) {
      const gradeRecord = filteredGrades[0]; // Ambil record pertama yang cocok
      // Tambahkan data capaian pembelajaran ke student data
      enhancedStudentData = {
        ...studentData.student,
        "Capaian Pembelajaran (Pendidikan Agama Islam)":
          gradeRecord["Capaian Pembelajaran (Pendidikan Agama Islam)"] || "",
        "Capaian Pembelajaran (Pendidikan Pancasila)":
          gradeRecord["Capaian Pembelajaran (Pendidikan Pancasila)"] || "",
        "Capaian Pembelajaran (Bahasa Indonesia)":
          gradeRecord["Capaian Pembelajaran (Bahasa Indonesia)"] || "",
        "Capaian Pembelajaran (Matematika)":
          gradeRecord["Capaian Pembelajaran (Matematika)"] || "",
        "Capaian Pembelajaran (Ilmu Pengetahuan Alam)":
          gradeRecord["Capaian Pembelajaran (Ilmu Pengetahuan Alam)"] || "",
        "Capaian Pembelajaran (Ilmu Pengetahuan Sosial)":
          gradeRecord["Capaian Pembelajaran (Ilmu Pengetahuan Sosial)"] || "",
        "Capaian Pembelajaran (Bahasa Inggris)":
          gradeRecord["Capaian Pembelajaran (Bahasa Inggris)"] || "",
        "Capaian Pembelajaran (PJOK)":
          gradeRecord["Capaian Pembelajaran (PJOK)"] || "",
        "Capaian Pembelajaran (Informatika)":
          gradeRecord["Capaian Pembelajaran (Informatika)"] || "",
        "Capaian Pembelajaran (Seni Budaya)":
          gradeRecord["Capaian Pembelajaran (Seni Budaya)"] || "",
        "Capaian Pembelajaran (BK)":
          gradeRecord["Capaian Pembelajaran (BK)"] || "",
        "Capaian Pembelajaran (Bahasa Jawa)":
          gradeRecord["Capaian Pembelajaran (Bahasa Jawa)"] || "",
      };
      Logger.log(
        "Enhanced student data with capaian pembelajaran from grade record"
      );
    }

    // Gabungkan data siswa dan nilai
    const result = {
      success: true,
      student: enhancedStudentData,
      grades: filteredGrades,
      summary: summary,
    };

    Logger.log("getStudentGradeDetail result: " + JSON.stringify(result));
    return result;
  } catch (error) {
    Logger.log("Error in getStudentGradeDetail: " + error.message);
    Logger.log("Error stack: " + error.stack);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ===== KIP ANALYSIS FUNCTIONS =====

// Konstanta untuk sheet KIP Analysis
const KIP_ANALYSIS_SHEET_NAME = "KIP_Analisis";
const KIP_CONFIG_SHEET_NAME = "KIP_Config";

// Fungsi untuk mendapatkan statistik dashboard KIP
function getKIPDashboardStats() {
  try {
    const spreadsheet = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    let kipSheet = spreadsheet.getSheetByName(KIP_ANALYSIS_SHEET_NAME);

    if (!kipSheet) {
      return {
        total: 0,
        sangatLayak: 0,
        layak: 0,
        kurangLayak: 0,
      };
    }

    const values = kipSheet.getDataRange().getValues();
    if (values.length <= 1) {
      return {
        total: 0,
        sangatLayak: 0,
        layak: 0,
        kurangLayak: 0,
      };
    }

    const headers = values[0];
    const kategoriIndex = headers.indexOf("Kategori");

    if (kategoriIndex === -1) {
      return {
        total: 0,
        sangatLayak: 0,
        layak: 0,
        kurangLayak: 0,
      };
    }

    let stats = {
      total: values.length - 1,
      sangatLayak: 0,
      layak: 0,
      kurangLayak: 0,
    };

    for (let i = 1; i < values.length; i++) {
      const kategori = values[i][kategoriIndex];
      switch (kategori) {
        case "Sangat Layak":
          stats.sangatLayak++;
          break;
        case "Layak":
          stats.layak++;
          break;
        case "Kurang Layak":
          stats.kurangLayak++;
          break;
      }
    }

    return stats;
  } catch (error) {
    Logger.log("Error in getKIPDashboardStats: " + error.message);
    return {
      total: 0,
      sangatLayak: 0,
      layak: 0,
      kurangLayak: 0,
    };
  }
}

// Fungsi untuk mendapatkan hasil analisis KIP yang sudah ada
function getKIPAnalysisResults() {
  try {
    Logger.log("=== Starting getKIPAnalysisResults ===");
    Logger.log("BUKU_INDUK_SPREADSHEET_ID: " + BUKU_INDUK_SPREADSHEET_ID);
    Logger.log("KIP_ANALYSIS_SHEET_NAME: " + KIP_ANALYSIS_SHEET_NAME);

    // Ensure the sheet exists first
    const kipSheet = ensureKIPAnalysisSheet();
    Logger.log("KIP_Analisis sheet verified/created successfully");

    const dataRange = kipSheet.getDataRange();
    Logger.log("Data range: " + dataRange.getA1Notation());

    const values = dataRange.getValues();
    Logger.log("Found " + values.length + " rows in KIP_Analisis sheet");

    if (values.length <= 1) {
      Logger.log("No data rows found (only headers or empty)");
      return [];
    }

    const headers = values[0];
    Logger.log("Headers: " + JSON.stringify(headers));
    Logger.log("Number of columns: " + headers.length);

    const results = [];

    for (let i = 1; i < values.length; i++) {
      const row = values[i];

      // Ensure all values are properly serializable
      const result = {
        id: Number(row[headers.indexOf("ID")]) || i,
        tanggalAnalisis: formatDateForSerialization(
          row[headers.indexOf("Tanggal Analisis")] || new Date()
        ),
        nis: String(row[headers.indexOf("NIS")] || ""),
        namaSiswa: String(row[headers.indexOf("Nama Siswa")] || ""),
        kelas: String(row[headers.indexOf("Kelas")] || ""),
        skorPenghasilan: Number(
          parseFloat(row[headers.indexOf("Skor Penghasilan")] || 0)
        ),
        skorStatus: Number(
          parseFloat(row[headers.indexOf("Skor Status")] || 0)
        ),
        skorTanggungan: Number(
          parseFloat(row[headers.indexOf("Skor Tanggungan")] || 0)
        ),
        skorBeasiswa: Number(
          parseFloat(row[headers.indexOf("Skor Beasiswa")] || 0)
        ),
        skorTotal: Number(parseFloat(row[headers.indexOf("Skor Total")] || 0)),
        kategori: String(row[headers.indexOf("Kategori")] || ""),
        ranking: Number(parseInt(row[headers.indexOf("Ranking")] || 0)),
        status: String(row[headers.indexOf("Status Verifikasi")] || "Pending"),
        catatan: String(row[headers.indexOf("Catatan Admin")] || ""),
        penghasilanAyah: String(row[headers.indexOf("Penghasilan Ayah")] || ""),
        penghasilanIbu: String(row[headers.indexOf("Penghasilan Ibu")] || ""),
        penghasilanWali: String(row[headers.indexOf("Penghasilan Wali")] || ""),
        statusOrangTua: String(row[headers.indexOf("Status Orang Tua")] || ""),
        jumlahSaudara: String(row[headers.indexOf("Jumlah Saudara")] || ""),
        statusBeasiswa: String(row[headers.indexOf("Status Beasiswa")] || ""),
      };

      // Validate the result object
      if (result.nis && result.namaSiswa) {
        results.push(result);
      } else {
        Logger.log("Skipping invalid row " + i + ": missing NIS or name");
      }
    }

    // Sort by ranking
    results.sort((a, b) => a.ranking - b.ranking);
    Logger.log("Processed " + results.length + " valid data rows successfully");

    if (results.length > 0) {
      Logger.log("Sample result (first item): " + JSON.stringify(results[0]));
    }

    Logger.log("=== Returning " + results.length + " KIP analysis results ===");

    // Return a clean, serializable array
    return JSON.parse(JSON.stringify(results));
  } catch (error) {
    Logger.log("=== ERROR in getKIPAnalysisResults ===");
    Logger.log("Error message: " + error.message);
    Logger.log("Error stack: " + error.stack);
    Logger.log("Returning empty array due to error");
    return [];
  }
}

// Helper function to format dates for serialization
function formatDateForSerialization(date) {
  if (!date) return new Date().toISOString();

  try {
    if (date instanceof Date) {
      return date.toISOString();
    } else if (typeof date === "string") {
      return new Date(date).toISOString();
    } else {
      return new Date().toISOString();
    }
  } catch (error) {
    Logger.log("Error formatting date: " + error.message);
    return new Date().toISOString();
  }
}

// Fungsi untuk memverifikasi dan membuat sheet KIP_Analisis jika diperlukan
function ensureKIPAnalysisSheet() {
  try {
    Logger.log("Ensuring KIP_Analisis sheet exists...");
    const spreadsheet = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    let kipSheet = spreadsheet.getSheetByName(KIP_ANALYSIS_SHEET_NAME);

    if (!kipSheet) {
      Logger.log("Creating new KIP_Analisis sheet...");
      kipSheet = spreadsheet.insertSheet(KIP_ANALYSIS_SHEET_NAME);

      // Buat header untuk sheet KIP_Analisis
      const headers = [
        "ID",
        "Tanggal Analisis",
        "NIS",
        "Nama Siswa",
        "Kelas",
        "Penghasilan Ayah",
        "Penghasilan Ibu",
        "Penghasilan Wali",
        "Status Orang Tua",
        "Jumlah Saudara",
        "Status Beasiswa",
        "Skor Penghasilan",
        "Skor Status",
        "Skor Tanggungan",
        "Skor Beasiswa",
        "Skor Total",
        "Kategori",
        "Ranking",
        "Status Verifikasi",
        "Catatan Admin",
      ];

      kipSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

      // Format header
      const headerRange = kipSheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#f0f0f0");
      headerRange.setFontWeight("bold");

      Logger.log("KIP_Analisis sheet created successfully with headers");
    } else {
      Logger.log("KIP_Analisis sheet already exists");

      // Periksa apakah sheet memiliki header yang benar
      const dataRange = kipSheet.getDataRange();
      if (dataRange.getNumRows() === 0) {
        Logger.log("Sheet exists but is empty, adding headers...");
        const headers = [
          "ID",
          "Tanggal Analisis",
          "NIS",
          "Nama Siswa",
          "Kelas",
          "Penghasilan Ayah",
          "Penghasilan Ibu",
          "Penghasilan Wali",
          "Status Orang Tua",
          "Jumlah Saudara",
          "Status Beasiswa",
          "Skor Penghasilan",
          "Skor Status",
          "Skor Tanggungan",
          "Skor Beasiswa",
          "Skor Total",
          "Kategori",
          "Ranking",
          "Status Verifikasi",
          "Catatan Admin",
        ];

        kipSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

        // Format header
        const headerRange = kipSheet.getRange(1, 1, 1, headers.length);
        headerRange.setBackground("#f0f0f0");
        headerRange.setFontWeight("bold");

        Logger.log("Headers added to existing empty sheet");
      }
    }

    return kipSheet;
  } catch (error) {
    Logger.log("Error ensuring KIP_Analisis sheet: " + error.message);
    throw error;
  }
}

// Fungsi untuk memeriksa apakah ada data KIP yang valid
function hasKIPAnalysisData() {
  try {
    Logger.log("Checking if KIP analysis data exists...");
    const spreadsheet = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const kipSheet = spreadsheet.getSheetByName(KIP_ANALYSIS_SHEET_NAME);

    if (!kipSheet) {
      Logger.log("KIP_Analisis sheet does not exist");
      return false;
    }

    const dataRange = kipSheet.getDataRange();
    const hasData = dataRange.getNumRows() > 1; // More than just headers
    Logger.log(
      "KIP analysis data exists: " +
        hasData +
        " (rows: " +
        dataRange.getNumRows() +
        ")"
    );
    return hasData;
  } catch (error) {
    Logger.log("Error checking KIP analysis data: " + error.message);
    return false;
  }
}

// Fungsi untuk memulai analisis KIP
function startKIPAnalysis() {
  try {
    Logger.log("Starting KIP Analysis...");

    // Buat atau bersihkan sheet KIP_Analisis
    const spreadsheet = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    let kipSheet = spreadsheet.getSheetByName(KIP_ANALYSIS_SHEET_NAME);

    if (!kipSheet) {
      kipSheet = spreadsheet.insertSheet(KIP_ANALYSIS_SHEET_NAME);
    } else {
      kipSheet.clear();
    }

    // Buat header untuk sheet KIP_Analisis
    const headers = [
      "ID",
      "Tanggal Analisis",
      "NIS",
      "Nama Siswa",
      "Kelas",
      "Penghasilan Ayah",
      "Penghasilan Ibu",
      "Penghasilan Wali",
      "Status Orang Tua",
      "Jumlah Saudara",
      "Status Beasiswa",
      "Skor Penghasilan",
      "Skor Status",
      "Skor Tanggungan",
      "Skor Beasiswa",
      "Skor Total",
      "Kategori",
      "Ranking",
      "Status Verifikasi",
      "Catatan Admin",
    ];

    kipSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format header
    const headerRange = kipSheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#f0f0f0");
    headerRange.setFontWeight("bold");

    // Ambil data siswa dengan semua field
    const studentsResult = getAllStudents({ fieldsToReturn: [] }); // Empty array = get all fields
    if (
      !studentsResult ||
      !studentsResult.students ||
      studentsResult.students.length === 0
    ) {
      Logger.log("No student data found for KIP analysis");
      return {
        success: false,
        message:
          "Tidak ada data siswa yang ditemukan. Pastikan ada data siswa di sheet 'DATA SISWA'.",
        processedCount: 0,
        totalStudents: 0,
        activeStudents: 0,
      };
    }

    const studentsData = studentsResult.students;
    Logger.log(
      "Processing " + studentsData.length + " students for KIP analysis"
    );

    const analysisResults = [];
    const currentDate = new Date();

    // Filter siswa dengan status akademik aktif dan proses setiap siswa
    let processedCount = 0;
    for (let i = 0; i < studentsData.length; i++) {
      const student = studentsData[i];

      // Cek status akademik siswa dengan berbagai kemungkinan field name
      const statusAkademik =
        student.status ||
        student["Status Akademik"] ||
        student.statusAkademik ||
        "Aktif";
      Logger.log(
        "Student " + (student.nis || "unknown") + " status: " + statusAkademik
      );

      if (statusAkademik.toLowerCase() !== "aktif") {
        Logger.log(
          "Skipping student " +
            (student.nis || "unknown") +
            " - Status akademik: " +
            statusAkademik
        );
        continue;
      }

      try {
        const analysis = analyzeStudentKIP(student);
        processedCount++;
        analysis.id = processedCount;
        analysis.tanggalAnalisis = currentDate;
        analysis.nis = student.nis || "";
        analysis.namaSiswa = student.nama || "";
        analysis.kelas = student.kelas || "";

        analysisResults.push(analysis);
      } catch (error) {
        Logger.log(
          "Error analyzing student " +
            (student.nis || "unknown") +
            ": " +
            error.message
        );
      }
    }

    // Sort berdasarkan skor total (descending) untuk ranking
    analysisResults.sort((a, b) => b.skorTotal - a.skorTotal);

    // Assign ranking
    for (let i = 0; i < analysisResults.length; i++) {
      analysisResults[i].ranking = i + 1;
    }

    // Cek apakah ada siswa aktif yang berhasil diproses
    if (analysisResults.length === 0) {
      Logger.log("No active students found for KIP analysis after filtering");
      return {
        success: false,
        message:
          "Tidak ada siswa aktif yang ditemukan untuk dianalisis. Pastikan ada siswa dengan status 'Aktif' di sheet 'DATA SISWA'.",
        processedCount: 0,
        totalStudents: studentsData.length,
        activeStudents: 0,
      };
    }

    // Tulis hasil ke sheet
    const dataRows = analysisResults.map((result) => [
      result.id,
      result.tanggalAnalisis,
      result.nis,
      result.namaSiswa,
      result.kelas,
      result.penghasilanAyah,
      result.penghasilanIbu,
      result.penghasilanWali,
      result.statusOrangTua,
      result.jumlahSaudara,
      result.statusBeasiswa,
      result.skorPenghasilan,
      result.skorStatus,
      result.skorTanggungan,
      result.skorBeasiswa,
      result.skorTotal,
      result.kategori,
      result.ranking,
      "Pending",
      "",
    ]);

    kipSheet
      .getRange(2, 1, dataRows.length, headers.length)
      .setValues(dataRows);

    Logger.log(
      "KIP Analysis completed successfully. Processed " +
        analysisResults.length +
        " active students out of " +
        studentsData.length +
        " total students"
    );

    return {
      success: true,
      message:
        "Analisis KIP berhasil diselesaikan untuk " +
        analysisResults.length +
        " siswa aktif dari total " +
        studentsData.length +
        " siswa",
      processedCount: analysisResults.length,
      totalStudents: studentsData.length,
      activeStudents: analysisResults.length,
    };
  } catch (error) {
    Logger.log("Error in startKIPAnalysis: " + error.message);
    return {
      success: false,
      message: error.message,
    };
  }
}

// Fungsi untuk menganalisis satu siswa
function analyzeStudentKIP(student) {
  try {
    // Ambil data yang diperlukan sesuai dengan column map
    const penghasilanAyah = student.penghasilanAyah || "";
    const penghasilanIbu = student.penghasilanIbu || "";
    const penghasilanWali = student.penghasilanWali || "";
    const statusOrangTua = student.statusOrangTua || "";
    const jumlahSaudara = student.jumlahSaudaraKandung || "";
    const beasiswa1 = student.jenisBeasiswa1 || "";
    const beasiswa2 = student.jenisBeasiswa2 || "";
    const beasiswa3 = student.jenisBeasiswa3 || "";

    Logger.log(
      "Analyzing student: " + student.nama + " (NIS: " + student.nis + ")"
    );
    Logger.log(
      "Data: penghasilanAyah=" +
        penghasilanAyah +
        ", penghasilanIbu=" +
        penghasilanIbu +
        ", statusOrangTua=" +
        statusOrangTua +
        ", jumlahSaudara=" +
        jumlahSaudara
    );

    // Hitung skor penghasilan (40% bobot)
    const skorPenghasilan =
      calculateIncomeScore(penghasilanAyah, penghasilanIbu, penghasilanWali) *
      0.4;

    // Hitung skor status keluarga (30% bobot)
    const skorStatus = calculateFamilyStatusScore(statusOrangTua) * 0.3;

    // Hitung skor tanggungan (20% bobot)
    const skorTanggungan = calculateDependentsScore(jumlahSaudara) * 0.2;

    // Hitung skor beasiswa (10% bobot)
    const skorBeasiswa =
      calculateScholarshipScore(beasiswa1, beasiswa2, beasiswa3) * 0.1;

    // Total skor
    const skorTotal =
      skorPenghasilan + skorStatus + skorTanggungan + skorBeasiswa;

    // Tentukan kategori
    let kategori;
    if (skorTotal >= 85) {
      kategori = "Sangat Layak";
    } else if (skorTotal >= 70) {
      kategori = "Layak";
    } else {
      kategori = "Kurang Layak";
    }

    // Tentukan status beasiswa untuk display
    let statusBeasiswa = "Belum pernah";
    // Convert to string first to handle non-string inputs
    const beasiswa1Str = String(beasiswa1 || "");
    const beasiswa2Str = String(beasiswa2 || "");
    const beasiswa3Str = String(beasiswa3 || "");

    if (beasiswa1 && beasiswa1Str.trim() !== "" && beasiswa1Str !== "-") {
      statusBeasiswa = "Sudah pernah";
    } else if (
      beasiswa2 &&
      beasiswa2Str.trim() !== "" &&
      beasiswa2Str !== "-"
    ) {
      statusBeasiswa = "Sudah pernah";
    } else if (
      beasiswa3 &&
      beasiswa3Str.trim() !== "" &&
      beasiswa3Str !== "-"
    ) {
      statusBeasiswa = "Sudah pernah";
    }

    return {
      penghasilanAyah: penghasilanAyah,
      penghasilanIbu: penghasilanIbu,
      penghasilanWali: penghasilanWali,
      statusOrangTua: statusOrangTua,
      jumlahSaudara: jumlahSaudara,
      statusBeasiswa: statusBeasiswa,
      skorPenghasilan: skorPenghasilan,
      skorStatus: skorStatus,
      skorTanggungan: skorTanggungan,
      skorBeasiswa: skorBeasiswa,
      skorTotal: skorTotal,
      kategori: kategori,
    };
  } catch (error) {
    Logger.log("Error in analyzeStudentKIP: " + error.message);
    throw error;
  }
}

// Fungsi untuk menghitung skor penghasilan
function calculateIncomeScore(
  penghasilanAyah,
  penghasilanIbu,
  penghasilanWali
) {
  const incomes = [penghasilanAyah, penghasilanIbu, penghasilanWali];
  let totalScore = 0;
  let validIncomes = 0;

  incomes.forEach((income) => {
    // Convert to string first to handle non-string inputs
    const incomeStr = String(income || "");
    if (income && incomeStr.trim() !== "" && incomeStr !== "-") {
      validIncomes++;
      const score = getIncomeScore(income);
      totalScore += score;
    }
  });

  // Jika tidak ada data penghasilan, berikan skor maksimal (asumsi tidak berpenghasilan)
  if (validIncomes === 0) {
    return 100;
  }

  // Rata-rata skor penghasilan
  return totalScore / validIncomes;
}

// Fungsi untuk mendapatkan skor berdasarkan penghasilan individual
function getIncomeScore(income) {
  // Convert to string first to handle non-string inputs
  const incomeStr = String(income || "");

  if (!income || incomeStr.trim() === "" || incomeStr === "-") {
    return 100; // Tidak berpenghasilan
  }

  const incomeStrLower = incomeStr.toLowerCase();

  if (incomeStrLower.includes("tidak berpenghasilan")) {
    return 100;
  } else if (incomeStrLower.includes("kurang dari rp1.000.000")) {
    return 100;
  } else if (
    incomeStrLower.includes("rp1.000.000") &&
    incomeStrLower.includes("rp1.999.999")
  ) {
    return 80;
  } else if (
    incomeStrLower.includes("rp2.000.000") &&
    incomeStrLower.includes("rp2.999.999")
  ) {
    return 60;
  } else if (
    incomeStrLower.includes("rp3.000.000") &&
    incomeStrLower.includes("rp4.999.999")
  ) {
    return 40;
  } else if (
    incomeStrLower.includes("rp5.000.000") &&
    incomeStrLower.includes("rp9.999.999")
  ) {
    return 20;
  } else if (
    incomeStrLower.includes("rp10.000.000") ||
    incomeStrLower.includes("rp20.000.000") ||
    incomeStrLower.includes("rp50.000.000")
  ) {
    return 10;
  }

  // Default untuk penghasilan yang tidak dikenali
  return 50;
}

// Fungsi untuk menghitung skor status keluarga
function calculateFamilyStatusScore(statusOrangTua) {
  // Convert to string first to handle both string and non-string inputs
  const statusStr = String(statusOrangTua || "");

  if (!statusOrangTua || statusStr.trim() === "" || statusStr === "-") {
    return 40; // Default untuk status lengkap
  }

  const status = statusStr.toLowerCase();

  if (status.includes("yatim piatu")) {
    return 100;
  } else if (status.includes("yatim") || status.includes("piatu")) {
    return 80;
  } else if (status.includes("lengkap")) {
    return 40;
  }

  // Default
  return 40;
}

// Fungsi untuk menghitung skor tanggungan
function calculateDependentsScore(jumlahSaudara) {
  // Convert to string first to handle both string and number inputs
  const jumlahStr = String(jumlahSaudara || "");

  if (!jumlahSaudara || jumlahStr.trim() === "" || jumlahStr === "-") {
    return 20; // Default untuk anak tunggal
  }

  const jumlah = parseInt(jumlahStr);

  if (isNaN(jumlah)) {
    return 20;
  }

  if (jumlah >= 4) {
    return 100;
  } else if (jumlah === 3) {
    return 80;
  } else if (jumlah === 2) {
    return 60;
  } else if (jumlah === 1) {
    return 40;
  } else {
    return 20; // Anak tunggal
  }
}

// Fungsi untuk menghitung skor beasiswa
function calculateScholarshipScore(beasiswa1, beasiswa2, beasiswa3) {
  const beasiswas = [beasiswa1, beasiswa2, beasiswa3];

  // Cek apakah ada beasiswa
  const hasScholarship = beasiswas.some((beasiswa) => {
    // Convert to string first to handle non-string inputs
    const beasiswaStr = String(beasiswa || "");
    return beasiswa && beasiswaStr.trim() !== "" && beasiswaStr !== "-";
  });

  if (hasScholarship) {
    return 20; // Sudah pernah mendapat beasiswa
  } else {
    return 100; // Belum pernah mendapat beasiswa
  }
}

// Fungsi untuk export data KIP
function exportKIPAnalysis(filteredData) {
  try {
    // Buat spreadsheet baru untuk export
    const exportSpreadsheet = SpreadsheetApp.create(
      "KIP Analysis Export - " +
        Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd")
    );
    const sheet = exportSpreadsheet.getActiveSheet();

    // Header untuk export
    const headers = [
      "Ranking",
      "NIS",
      "Nama Siswa",
      "Kelas",
      "Penghasilan Ayah",
      "Penghasilan Ibu",
      "Penghasilan Wali",
      "Status Orang Tua",
      "Jumlah Saudara",
      "Status Beasiswa",
      "Skor Penghasilan",
      "Skor Status",
      "Skor Tanggungan",
      "Skor Beasiswa",
      "Skor Total",
      "Kategori",
      "Status Verifikasi",
      "Catatan",
    ];

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format header
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#4285f4");
    headerRange.setFontColor("white");
    headerRange.setFontWeight("bold");

    // Data rows
    if (filteredData && filteredData.length > 0) {
      const dataRows = filteredData.map((item) => [
        item.ranking,
        item.nis,
        item.namaSiswa,
        item.kelas,
        item.penghasilanAyah,
        item.penghasilanIbu,
        item.penghasilanWali,
        item.statusOrangTua,
        item.jumlahSaudara,
        item.statusBeasiswa,
        item.skorPenghasilan,
        item.skorStatus,
        item.skorTanggungan,
        item.skorBeasiswa,
        item.skorTotal,
        item.kategori,
        item.status,
        item.catatan,
      ]);

      sheet.getRange(2, 1, dataRows.length, headers.length).setValues(dataRows);

      // Auto resize columns
      sheet.autoResizeColumns(1, headers.length);
    }

    // Atur permission file agar dapat dibagikan ke semua orang
    const file = DriveApp.getFileById(exportSpreadsheet.getId());
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Buat URL untuk download Excel
    const url =
      "https://docs.google.com/spreadsheets/d/" +
      exportSpreadsheet.getId() +
      "/export?format=xlsx";

    const filename =
      "KIP Analysis Export - " +
      Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd") +
      ".xlsx";

    return {
      success: true,
      url: url,
      filename: filename,
      spreadsheetId: exportSpreadsheet.getId(),
    };
  } catch (error) {
    Logger.log("Error in exportKIPAnalysis: " + error.message);
    return {
      success: false,
      message: error.message,
    };
  }
}

// Function to update student grades
function updateStudentGrades(updateData, sessionId) {
  try {
    Logger.log("=== updateStudentGrades called ===");
    Logger.log("- updateData: " + JSON.stringify(updateData));
    Logger.log('- sessionId: "' + sessionId + '"');

    // Validate session
    const username = validateSession(sessionId);
    if (!username) {
      throw new Error("Session tidak valid. Silakan login kembali.");
    }

    // Validate parameters
    if (
      !updateData ||
      !updateData.studentId ||
      !updateData.kelas ||
      !updateData.semester ||
      !updateData.changes
    ) {
      throw new Error("Data update tidak valid");
    }

    const studentId = String(updateData.studentId).trim();
    const kelas = String(updateData.kelas).trim();
    const semester = String(updateData.semester).trim();
    const changes = updateData.changes;

    if (Object.keys(changes).length === 0) {
      return { success: true, message: "Tidak ada perubahan untuk disimpan" };
    }

    Logger.log(
      'Updating grades for student NIS: "' +
        studentId +
        '", Kelas: "' +
        kelas +
        '", Semester: "' +
        semester +
        '"'
    );
    Logger.log("Changes: " + JSON.stringify(changes));

    // Open spreadsheet
    const ss = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const gradesSheet = ss.getSheetByName(STUDENTS_GRADE_NAME);

    if (!gradesSheet) {
      throw new Error('Sheet "' + STUDENTS_GRADE_NAME + '" tidak ditemukan');
    }

    const dataRange = gradesSheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length === 0) {
      throw new Error("Sheet kosong");
    }

    const headers = values[0];
    const nisIndex = headers.indexOf("NIS");
    const kelasIndex = headers.indexOf("Kelas");
    const semesterIndex = headers.indexOf("Semester");

    if (nisIndex === -1) {
      throw new Error("Kolom NIS tidak ditemukan");
    }
    if (kelasIndex === -1) {
      throw new Error("Kolom kelas tidak ditemukan");
    }
    if (semesterIndex === -1) {
      throw new Error("Kolom semester tidak ditemukan");
    }

    // Find student grade row
    let gradeRowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      const rowNIS = String(values[i][nisIndex]).trim();
      const rowKelas = String(values[i][kelasIndex]).trim();
      const rowSemester = String(values[i][semesterIndex]).trim();

      if (
        rowNIS === studentId &&
        rowKelas === kelas &&
        rowSemester === semester
      ) {
        gradeRowIndex = i;
        break;
      }
    }

    if (gradeRowIndex === -1) {
      throw new Error(
        'Data nilai untuk siswa NIS "' +
          studentId +
          '", Kelas "' +
          kelas +
          '", Semester "' +
          semester +
          '" tidak ditemukan'
      );
    }

    Logger.log("Grade record found at row: " + (gradeRowIndex + 1));

    // Update the grades
    let updatedFields = [];
    for (const fieldName in changes) {
      const columnIndex = headers.indexOf(fieldName);
      if (columnIndex !== -1) {
        const oldValue = values[gradeRowIndex][columnIndex];
        const newValue = changes[fieldName];

        // Validate grade value (should be between 0-100) - only for numeric grade fields, not text fields
        const isTextualField =
          fieldName.includes("Capaian Pembelajaran") ||
          fieldName.includes("Ekstrakurikuler") ||
          fieldName.includes("Keterangan Ekstrakurikuler") ||
          fieldName.includes("Jenis Prestasi") ||
          fieldName.includes("Tingkat Prestasi") ||
          fieldName.includes("Nama Prestasi") ||
          fieldName.includes("Penyelenggara") ||
          fieldName.includes("Peringkat") ||
          fieldName.includes("Tahun Prestasi");

        if (newValue !== "" && newValue !== "-" && !isTextualField) {
          const numericValue = parseFloat(newValue);
          if (isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
            throw new Error(
              'Nilai "' + fieldName + '" harus berupa angka antara 0-100'
            );
          }
        }

        // Update the cell
        gradesSheet
          .getRange(gradeRowIndex + 1, columnIndex + 1)
          .setValue(newValue === "" || newValue === "-" ? "" : newValue);

        updatedFields.push({
          field: fieldName,
          oldValue: oldValue,
          newValue: newValue,
        });

        Logger.log(
          'Updated field "' +
            fieldName +
            '": "' +
            oldValue +
            '" -> "' +
            newValue +
            '"'
        );
      } else {
        Logger.log('Warning: Field "' + fieldName + '" not found in headers');
      }
    }

    if (updatedFields.length === 0) {
      return {
        success: false,
        error: "Tidak ada field yang valid untuk diupdate",
      };
    }

    // Log the update activity
    Logger.log(
      "Successfully updated " +
        updatedFields.length +
        " grade fields for student NIS: " +
        studentId +
        ", Kelas: " +
        kelas +
        ", Semester: " +
        semester
    );
    Logger.log("Updated by user: " + username);

    return {
      success: true,
      message: "Nilai siswa berhasil diperbarui",
      updatedFields: updatedFields,
      updatedBy: username,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    Logger.log("ERROR in updateStudentGrades: " + error.toString());
    Logger.log("Error stack: " + error.stack);
    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat mengupdate nilai siswa",
    };
  }
}
