// KIP_Functions.js - Backend functions for KIP Analysis

// Constants for KIP Analysis
const KIP_ANALYSIS_SHEET_NAME = "KIP_Analisis";
const KIP_CONFIG_SHEET_NAME = "KIP_Config";

// Scoring weights
const KIP_WEIGHTS = {
  penghasilan: 0.4, // 40%
  statusKeluarga: 0.3, // 30%
  tanggungan: 0.2, // 20%
  beasiswa: 0.1, // 10%
};

// Scoring criteria
const KIP_SCORING = {
  penghasilan: {
    "< 1.000.000": 100,
    "1.000.000 - 2.000.000": 80,
    "2.000.000 - 3.000.000": 60,
    "3.000.000 - 4.000.000": 40,
    "> 4.000.000": 20,
  },
  statusKeluarga: {
    "Yatim Piatu": 100,
    "Yatim": 80,
    "Piatu": 80,
    "Lengkap": 40,
  },
  tanggungan: {
    "≥4": 100,
    "3": 80,
    "2": 60,
    "1": 40,
    "0": 20,
  },
  beasiswa: {
    "Belum Pernah": 100,
    "Sudah Pernah": 20,
  },
};

// Category thresholds
const KIP_CATEGORIES = {
  "Sangat Layak": 85,
  Layak: 70,
  "Kurang Layak": 0,
};

/**
 * Initialize KIP Analysis sheets if they don't exist
 */
function initializeKIPSheets() {
  try {
    const spreadsheet = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);

    // Create KIP_Analisis sheet if it doesn't exist
    let analysisSheet = spreadsheet.getSheetByName(KIP_ANALYSIS_SHEET_NAME);
    if (!analysisSheet) {
      analysisSheet = spreadsheet.insertSheet(KIP_ANALYSIS_SHEET_NAME);

      // Set headers for analysis sheet
      const headers = [
        "ID",
        "Tanggal Analisis",
        "NIS",
        "Nama Siswa",
        "Skor Penghasilan",
        "Skor Status Keluarga",
        "Skor Tanggungan",
        "Skor Beasiswa",
        "Skor Total",
        "Kategori",
        "Ranking",
        "Status Verifikasi",
        "Catatan Admin",
      ];

      analysisSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      analysisSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
      analysisSheet.setFrozenRows(1);
    }

    // Create KIP_Config sheet if it doesn't exist
    let configSheet = spreadsheet.getSheetByName(KIP_CONFIG_SHEET_NAME);
    if (!configSheet) {
      configSheet = spreadsheet.insertSheet(KIP_CONFIG_SHEET_NAME);

      // Set configuration data
      const configData = [
        ["Parameter", "Bobot", "Keterangan"],
        [
          "Penghasilan Keluarga",
          "40%",
          "Berdasarkan total penghasilan ayah, ibu, dan wali",
        ],
        [
          "Status Keluarga",
          "30%",
          "Status orang tua (lengkap/yatim/piatu/yatim piatu)",
        ],
        ["Jumlah Tanggungan", "20%", "Jumlah saudara kandung"],
        ["Status Beasiswa", "10%", "Apakah sudah pernah menerima beasiswa"],
      ];

      configSheet.getRange(1, 1, configData.length, 3).setValues(configData);
      configSheet.getRange(1, 1, 1, 3).setFontWeight("bold");
      configSheet.setFrozenRows(1);
    }

    return { success: true, message: "KIP sheets initialized successfully" };
  } catch (error) {
    Logger.log("Error initializing KIP sheets: " + error.message);
    return {
      success: false,
      message: "Error initializing KIP sheets: " + error.message,
    };
  }
}

/**
 * Parse income string and return numeric value
 */
function parseIncome(incomeStr) {
  if (!incomeStr || incomeStr === "") return 0;

  // Remove currency symbols and convert to number
  const cleanStr = incomeStr.toString().replace(/[^0-9]/g, "");
  return parseInt(cleanStr) || 0;
}

/**
 * Calculate income score based on total family income
 */
function calculateIncomeScore(ayahIncome, ibuIncome, waliIncome) {
  const totalIncome =
    parseIncome(ayahIncome) + parseIncome(ibuIncome) + parseIncome(waliIncome);

  if (totalIncome < 1000000) return 100;
  if (totalIncome <= 2000000) return 80;
  if (totalIncome <= 3000000) return 60;
  if (totalIncome <= 4000000) return 40;
  return 20;
}

/**
 * Calculate family status score
 */
function calculateFamilyStatusScore(statusOrangTua) {
  if (!statusOrangTua) return 40; // Default to "Lengkap"

  const status = statusOrangTua.toString().toLowerCase();

  if (status.includes("yatim") && status.includes("piatu")) return 100;
  if (status.includes("yatim") || status.includes("piatu")) return 80;
  return 40; // Lengkap
}

/**
 * Calculate dependents score based on number of siblings
 */
function calculateDependentsScore(jumlahSaudara) {
  const siblings = parseInt(jumlahSaudara) || 0;

  if (siblings >= 4) return 100;
  if (siblings === 3) return 80;
  if (siblings === 2) return 60;
  if (siblings === 1) return 40;
  return 20; // 0 siblings
}

/**
 * Calculate scholarship score
 */
function calculateScholarshipScore(memilikiBeasiswa) {
  if (!memilikiBeasiswa) return 100; // Belum pernah

  const beasiswa = memilikiBeasiswa.toString().toLowerCase();

  if (
    beasiswa.includes("tidak") ||
    beasiswa.includes("belum") ||
    beasiswa === "tidak"
  ) {
    return 100;
  }
  return 20; // Sudah pernah
}

/**
 * Calculate total KIP score for a student
 */
function calculateKIPScore(studentData) {
  try {
    // Get scores for each criteria
    const incomeScore = calculateIncomeScore(
      studentData.penghasilanAyah,
      studentData.penghasilanIbu,
      studentData.penghasilanWali
    );

    const familyStatusScore = calculateFamilyStatusScore(
      studentData.statusOrangTua
    );
    const dependentsScore = calculateDependentsScore(studentData.jumlahSaudara);
    const scholarshipScore = calculateScholarshipScore(
      studentData.memilikiBeasiswa
    );

    // Calculate weighted total score
    const totalScore =
      incomeScore * KIP_WEIGHTS.penghasilan +
      familyStatusScore * KIP_WEIGHTS.statusKeluarga +
      dependentsScore * KIP_WEIGHTS.tanggungan +
      scholarshipScore * KIP_WEIGHTS.beasiswa;

    // Determine category
    let category = "Kurang Layak";
    if (totalScore >= KIP_CATEGORIES["Sangat Layak"]) {
      category = "Sangat Layak";
    } else if (totalScore >= KIP_CATEGORIES["Layak"]) {
      category = "Layak";
    }

    return {
      incomeScore: Math.round(incomeScore),
      familyStatusScore: Math.round(familyStatusScore),
      dependentsScore: Math.round(dependentsScore),
      scholarshipScore: Math.round(scholarshipScore),
      totalScore: Math.round(totalScore * 100) / 100,
      category: category,
    };
  } catch (error) {
    Logger.log("Error calculating KIP score: " + error.message);
    return null;
  }
}

/**
 * Get all students data for KIP analysis
 */
function getStudentsForKIPAnalysis() {
  try {
    const spreadsheet = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(STUDENTS_SHEET_NAME);

    if (!sheet) {
      throw new Error("Students sheet not found");
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Find column indices
    const nisIndex = headers.findIndex((h) => h === "NIS");
    const namaIndex = headers.findIndex((h) => h === "Nama Siswa");
    const statusOrangTuaIndex = headers.findIndex(
      (h) => h === "Status Orang Tua"
    );
    const jumlahSaudaraIndex = headers.findIndex(
      (h) => h === "Jumlah Saudara Kandung"
    );
    const penghasilanAyahIndex = headers.findIndex(
      (h) => h === "Penghasilan Bulanan Ayah"
    );
    const penghasilanIbuIndex = headers.findIndex(
      (h) => h === "Penghasilan Bulanan Ibu"
    );
    const penghasilanWaliIndex = headers.findIndex(
      (h) => h === "Penghasilan Bulanan Wali"
    );
    const memilikiBeasiswaIndex = headers.findIndex(
      (h) => h === "Apakah Peserta Didik Memiliki Beasiswa"
    );

    const students = [];

    // Process each student (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      if (row[nisIndex] && row[namaIndex]) {
        // Only process if NIS and name exist
        students.push({
          nis: row[nisIndex],
          nama: row[namaIndex],
          statusOrangTua: row[statusOrangTuaIndex] || "",
          jumlahSaudara: row[jumlahSaudaraIndex] || 0,
          penghasilanAyah: row[penghasilanAyahIndex] || 0,
          penghasilanIbu: row[penghasilanIbuIndex] || 0,
          penghasilanWali: row[penghasilanWaliIndex] || 0,
          memilikiBeasiswa: row[memilikiBeasiswaIndex] || "",
        });
      }
    }

    return students;
  } catch (error) {
    Logger.log("Error getting students for KIP analysis: " + error.message);
    throw error;
  }
}

/**
 * Perform KIP analysis for all students
 */
function performKIPAnalysis() {
  try {
    // Initialize sheets if needed
    initializeKIPSheets();

    // Get students data
    const students = getStudentsForKIPAnalysis();

    if (students.length === 0) {
      return { success: false, message: "No students found for analysis" };
    }

    // Calculate scores for all students
    const analysisResults = [];

    students.forEach((student, index) => {
      const scores = calculateKIPScore(student);

      if (scores) {
        analysisResults.push({
          id: index + 1,
          tanggalAnalisis: new Date(),
          nis: student.nis,
          nama: student.nama,
          skorPenghasilan: scores.incomeScore,
          skorStatusKeluarga: scores.familyStatusScore,
          skorTanggungan: scores.dependentsScore,
          skorBeasiswa: scores.scholarshipScore,
          skorTotal: scores.totalScore,
          kategori: scores.category,
          ranking: 0, // Will be calculated after sorting
          statusVerifikasi: "Belum Diverifikasi",
          catatanAdmin: "",
        });
      }
    });

    // Sort by total score (descending) and assign rankings
    analysisResults.sort((a, b) => b.skorTotal - a.skorTotal);
    analysisResults.forEach((result, index) => {
      result.ranking = index + 1;
    });

    // Save results to sheet
    const spreadsheet = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const analysisSheet = spreadsheet.getSheetByName(KIP_ANALYSIS_SHEET_NAME);

    // Clear existing data (except headers)
    if (analysisSheet.getLastRow() > 1) {
      analysisSheet
        .getRange(
          2,
          1,
          analysisSheet.getLastRow() - 1,
          analysisSheet.getLastColumn()
        )
        .clearContent();
    }

    // Write new data
    if (analysisResults.length > 0) {
      const dataToWrite = analysisResults.map((result) => [
        result.id,
        result.tanggalAnalisis,
        result.nis,
        result.nama,
        result.skorPenghasilan,
        result.skorStatusKeluarga,
        result.skorTanggungan,
        result.skorBeasiswa,
        result.skorTotal,
        result.kategori,
        result.ranking,
        result.statusVerifikasi,
        result.catatanAdmin,
      ]);

      analysisSheet
        .getRange(2, 1, dataToWrite.length, dataToWrite[0].length)
        .setValues(dataToWrite);
    }

    return {
      success: true,
      message: `Analysis completed for ${analysisResults.length} students`,
      totalStudents: analysisResults.length,
      categories: {
        "Sangat Layak": analysisResults.filter(
          (r) => r.kategori === "Sangat Layak"
        ).length,
        Layak: analysisResults.filter((r) => r.kategori === "Layak").length,
        "Kurang Layak": analysisResults.filter(
          (r) => r.kategori === "Kurang Layak"
        ).length,
      },
    };
  } catch (error) {
    Logger.log("Error performing KIP analysis: " + error.message);
    return {
      success: false,
      message: "Error performing analysis: " + error.message,
    };
  }
}

/**
 * Get KIP analysis results with filtering and pagination
 */
function getKIPAnalysisResults(options = {}) {
  try {
    const {
      page = 1,
      limit = 50,
      category = "",
      status = "",
      search = "",
    } = options;

    const spreadsheet = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const analysisSheet = spreadsheet.getSheetByName(KIP_ANALYSIS_SHEET_NAME);

    if (!analysisSheet || analysisSheet.getLastRow() <= 1) {
      return {
        success: true,
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalRecords: 0,
          limit: limit,
        },
      };
    }

    const data = analysisSheet.getDataRange().getValues();
    const headers = data[0];

    // Convert data to objects
    let results = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      results.push({
        id: row[0],
        tanggalAnalisis: row[1],
        nis: row[2],
        nama: row[3],
        skorPenghasilan: row[4],
        skorStatusKeluarga: row[5],
        skorTanggungan: row[6],
        skorBeasiswa: row[7],
        skorTotal: row[8],
        kategori: row[9],
        ranking: row[10],
        statusVerifikasi: row[11],
        catatanAdmin: row[12],
      });
    }

    // Apply filters
    if (category) {
      results = results.filter((r) => r.kategori === category);
    }

    if (status) {
      results = results.filter((r) => r.statusVerifikasi === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(
        (r) =>
          r.nama.toLowerCase().includes(searchLower) ||
          r.nis.toString().includes(searchLower)
      );
    }

    // Calculate pagination
    const totalRecords = results.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Get page data
    const pageData = results.slice(startIndex, endIndex);

    return {
      success: true,
      data: pageData,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalRecords: totalRecords,
        limit: limit,
      },
    };
  } catch (error) {
    Logger.log("Error getting KIP analysis results: " + error.message);
    return {
      success: false,
      message: "Error getting analysis results: " + error.message,
    };
  }
}

/**
 * Get KIP analysis statistics
 */
function getKIPAnalysisStatistics() {
  try {
    const spreadsheet = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const analysisSheet = spreadsheet.getSheetByName(KIP_ANALYSIS_SHEET_NAME);

    if (!analysisSheet || analysisSheet.getLastRow() <= 1) {
      return {
        success: true,
        statistics: {
          totalStudents: 0,
          categories: {
            "Sangat Layak": 0,
            Layak: 0,
            "Kurang Layak": 0,
          },
          verificationStatus: {
            "Belum Diverifikasi": 0,
            "Sudah Diverifikasi": 0,
          },
          lastAnalysis: null,
        },
      };
    }

    const data = analysisSheet.getDataRange().getValues();
    const results = [];

    // Convert data to objects (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      results.push({
        kategori: row[9],
        statusVerifikasi: row[11],
        tanggalAnalisis: row[1],
      });
    }

    // Calculate statistics
    const categories = {
      "Sangat Layak": results.filter((r) => r.kategori === "Sangat Layak")
        .length,
      Layak: results.filter((r) => r.kategori === "Layak").length,
      "Kurang Layak": results.filter((r) => r.kategori === "Kurang Layak")
        .length,
    };

    const verificationStatus = {
      "Belum Diverifikasi": results.filter(
        (r) => r.statusVerifikasi === "Belum Diverifikasi"
      ).length,
      "Sudah Diverifikasi": results.filter(
        (r) => r.statusVerifikasi === "Sudah Diverifikasi"
      ).length,
    };

    // Get last analysis date
    let lastAnalysis = null;
    if (results.length > 0) {
      const dates = results
        .map((r) => new Date(r.tanggalAnalisis))
        .sort((a, b) => b - a);
      lastAnalysis = dates[0];
    }

    return {
      success: true,
      statistics: {
        totalStudents: results.length,
        categories: categories,
        verificationStatus: verificationStatus,
        lastAnalysis: lastAnalysis,
      },
    };
  } catch (error) {
    Logger.log("Error getting KIP analysis statistics: " + error.message);
    return {
      success: false,
      message: "Error getting statistics: " + error.message,
    };
  }
}

/**
 * Get detailed breakdown for a specific student
 */
function getStudentKIPDetail(nis) {
  try {
    const spreadsheet = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const analysisSheet = spreadsheet.getSheetByName(KIP_ANALYSIS_SHEET_NAME);

    if (!analysisSheet) {
      return { success: false, message: "Analysis sheet not found" };
    }

    const data = analysisSheet.getDataRange().getValues();

    // Find student data
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[2] === nis) {
        // NIS column
        // Get original student data for detailed breakdown
        const studentsSheet = spreadsheet.getSheetByName(STUDENTS_SHEET_NAME);
        const studentsData = studentsSheet.getDataRange().getValues();
        const studentsHeaders = studentsData[0];

        // Find student in original data
        let studentOriginalData = null;
        for (let j = 1; j < studentsData.length; j++) {
          const studentRow = studentsData[j];
          const nisIndex = studentsHeaders.findIndex((h) => h === "NIS");
          if (studentRow[nisIndex] === nis) {
            studentOriginalData = studentRow;
            break;
          }
        }

        if (!studentOriginalData) {
          return { success: false, message: "Student original data not found" };
        }

        // Get indices for detailed breakdown
        const penghasilanAyahIndex = studentsHeaders.findIndex(
          (h) => h === "Penghasilan Bulanan Ayah"
        );
        const penghasilanIbuIndex = studentsHeaders.findIndex(
          (h) => h === "Penghasilan Bulanan Ibu"
        );
        const penghasilanWaliIndex = studentsHeaders.findIndex(
          (h) => h === "Penghasilan Bulanan Wali"
        );
        const statusOrangTuaIndex = studentsHeaders.findIndex(
          (h) => h === "Status Orang Tua"
        );
        const jumlahSaudaraIndex = studentsHeaders.findIndex(
          (h) => h === "Jumlah Saudara Kandung"
        );
        const memilikiBeasiswaIndex = studentsHeaders.findIndex(
          (h) => h === "Apakah Peserta Didik Memiliki Beasiswa"
        );

        return {
          success: true,
          data: {
            nis: row[2],
            nama: row[3],
            skorPenghasilan: row[4],
            skorStatusKeluarga: row[5],
            skorTanggungan: row[6],
            skorBeasiswa: row[7],
            skorTotal: row[8],
            kategori: row[9],
            ranking: row[10],
            statusVerifikasi: row[11],
            catatanAdmin: row[12],
            breakdown: {
              penghasilan: {
                ayah: studentOriginalData[penghasilanAyahIndex] || 0,
                ibu: studentOriginalData[penghasilanIbuIndex] || 0,
                wali: studentOriginalData[penghasilanWaliIndex] || 0,
                total:
                  parseIncome(studentOriginalData[penghasilanAyahIndex]) +
                  parseIncome(studentOriginalData[penghasilanIbuIndex]) +
                  parseIncome(studentOriginalData[penghasilanWaliIndex]),
                skor: row[4],
              },
              statusKeluarga: {
                status: studentOriginalData[statusOrangTuaIndex] || "Lengkap",
                skor: row[5],
              },
              tanggungan: {
                jumlahSaudara: studentOriginalData[jumlahSaudaraIndex] || 0,
                skor: row[6],
              },
              beasiswa: {
                status:
                  studentOriginalData[memilikiBeasiswaIndex] || "Belum Pernah",
                skor: row[7],
              },
            },
          },
        };
      }
    }

    return { success: false, message: "Student not found in analysis results" };
  } catch (error) {
    Logger.log("Error getting student KIP detail: " + error.message);
    return {
      success: false,
      message: "Error getting student detail: " + error.message,
    };
  }
}

/**
 * Update verification status for a student
 */
function updateKIPVerificationStatus(nis, status, catatan = "") {
  try {
    const spreadsheet = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const analysisSheet = spreadsheet.getSheetByName(KIP_ANALYSIS_SHEET_NAME);

    if (!analysisSheet) {
      return { success: false, message: "Analysis sheet not found" };
    }

    const data = analysisSheet.getDataRange().getValues();

    // Find and update student data
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[2] === nis) {
        // NIS column
        // Update status and notes
        analysisSheet.getRange(i + 1, 12).setValue(status); // Status Verifikasi column
        analysisSheet.getRange(i + 1, 13).setValue(catatan); // Catatan Admin column

        return {
          success: true,
          message: "Verification status updated successfully",
        };
      }
    }

    return { success: false, message: "Student not found" };
  } catch (error) {
    Logger.log("Error updating KIP verification status: " + error.message);
    return {
      success: false,
      message: "Error updating verification status: " + error.message,
    };
  }
}

/**
 * Export KIP analysis results to PDF/Excel format
 */
function exportKIPAnalysisResults(format = "excel") {
  try {
    const spreadsheet = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const analysisSheet = spreadsheet.getSheetByName(KIP_ANALYSIS_SHEET_NAME);

    if (!analysisSheet) {
      return { success: false, message: "Analysis sheet not found" };
    }

    // Create a temporary spreadsheet for export
    const tempSpreadsheet = SpreadsheetApp.create(
      "KIP Analysis Export - " + new Date().toISOString().split("T")[0]
    );
    const tempSheet = tempSpreadsheet.getActiveSheet();

    // Copy data to temp sheet
    const data = analysisSheet.getDataRange().getValues();
    tempSheet.getRange(1, 1, data.length, data[0].length).setValues(data);

    // Format the temp sheet
    tempSheet.getRange(1, 1, 1, data[0].length).setFontWeight("bold");
    tempSheet.setFrozenRows(1);

    // Auto-resize columns
    for (let i = 1; i <= data[0].length; i++) {
      tempSheet.autoResizeColumn(i);
    }

    const fileId = tempSpreadsheet.getId();
    const file = DriveApp.getFileById(fileId);

    if (format === "pdf") {
      // Convert to PDF
      const pdfBlob = file.getAs("application/pdf");
      const pdfFile = DriveApp.createFile(
        pdfBlob.setName(
          "KIP_Analysis_Report_" +
            new Date().toISOString().split("T")[0] +
            ".pdf"
        )
      );

      // Delete temp spreadsheet
      DriveApp.getFileById(fileId).setTrashed(true);

      return {
        success: true,
        message: "PDF export completed",
        fileId: pdfFile.getId(),
        fileName: pdfFile.getName(),
        downloadUrl:
          "https://drive.google.com/file/d/" + pdfFile.getId() + "/view",
      };
    } else {
      // Return Excel file
      return {
        success: true,
        message: "Excel export completed",
        fileId: fileId,
        fileName: file.getName(),
        downloadUrl:
          "https://docs.google.com/spreadsheets/d/" + fileId + "/edit",
      };
    }
  } catch (error) {
    Logger.log("Error exporting KIP analysis results: " + error.message);
    return {
      success: false,
      message: "Error exporting results: " + error.message,
    };
  }
}
