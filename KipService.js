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
