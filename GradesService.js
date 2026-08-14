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
