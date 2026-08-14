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
