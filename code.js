// ID Spreadsheet Acc
const SPREADSHEET_ACCOUNT_ID = "1XghbW1Ltp8DuqIBxlLEZQWtefwZSjX1Dn34nvpuo_vY";
const USERS_SHEET_NAME = "Users";
const SESSION_SHEET_NAME = "Sessions";

// Konstanta untuk Buku induk spreadsheet
const BUKU_INDUK_SPREADSHEET_ID =
  "1Xv8VGni724ljfMe1RW_0Io5bivzCOxgsZF-khqtoABc";
const STUDENTS_SHEET_NAME = "DATA SISWA";
const STUDENTS_GRADE_NAME = "DATA NILAI";

// Konstanta untuk folder Drive tempat menyimpan PDF siswa
const STUDENT_PDF_FOLDER_ID = "1wUht7lREV6ycI2WNP2FtJahvcFDUdZH1";

// Update the doGet function to check for session on protected pages
function doGet(e) {
  let page = e.parameter.page;
  let sessionId = e.parameter.sessionId;
  let studentId = e.parameter.id; // Add student ID parameter
  let editId = e.parameter.edit; // Add edit ID parameter

  if (page == null) page = "Login"; //Default page

  // List of pages that require authentication
  const protectedPages = [
    "Dashboard",
    "Students_manage",
    "Student_detail",
    "Student_form",
  ];

  // Check if the requested page requires authentication
  if (protectedPages.includes(page)) {
    // Validate session
    const username = validateSession(sessionId);

    if (!username) {
      // Redirect to login page if session is invalid
      return HtmlService.createTemplateFromFile("Login")
        .evaluate()
        .setTitle("Buku Induk Siswa - Login")
        .addMetaTag("viewport", "width=device-width, initial-scale=1")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
  }

  // If not protected or session is valid, proceed to the requested page
  var output = HtmlService.createTemplateFromFile(page);

  // Add session ID to the template if available
  if (sessionId) {
    output.sessionId = sessionId;
  }

  // Add student ID to the template if available
  if (studentId) {
    output.studentId = studentId;
  }

  // Add edit ID to the template if available
  if (editId) {
    output.editId = editId;
  }

  return output
    .evaluate()
    .setTitle("Buku Induk Siswa")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Session Management Constants
const SESSION_EXPIRY_HOURS = 2; // Sessions expire after 2 hours

// Create a new session for a user
function createSession(username) {
  try {
    // Generate random session ID
    const sessionId = Utilities.getUuid();

    // Get the current time
    const now = new Date();

    // Calculate expiry time (current time + SESSION_EXPIRY_HOURS)
    const expiryTime = new Date(
      now.getTime() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000
    );

    // Create session data
    const sessionData = {
      username: username,
      created: now.toString(),
      expires: expiryTime.toString(),
    };

    // Store session in Script Properties
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty(sessionId, JSON.stringify(sessionData));

    Logger.log(
      "Session created for user: " + username + " with ID: " + sessionId
    );

    return sessionId;
  } catch (error) {
    Logger.log("Error creating session: " + error.message);
    throw new Error("Failed to create session: " + error.message);
  }
}

// Validate a session and return the username if valid
function validateSession(sessionId) {
  try {
    if (!sessionId) {
      return null;
    }

    // Get session data from Script Properties
    const scriptProperties = PropertiesService.getScriptProperties();
    const sessionDataJson = scriptProperties.getProperty(sessionId);

    if (!sessionDataJson) {
      Logger.log("Session not found: " + sessionId);
      return null;
    }

    // Parse session data
    const sessionData = JSON.parse(sessionDataJson);

    // Check if session is expired
    const expiryTime = new Date(sessionData.expires);
    const now = new Date();

    if (now > expiryTime) {
      Logger.log("Session expired for user: " + sessionData.username);
      // Delete expired session
      scriptProperties.deleteProperty(sessionId);
      return null;
    }

    // Extend session if needed (optional)
    extendSession(sessionId, sessionData);

    return sessionData.username;
  } catch (error) {
    Logger.log("Error validating session: " + error.message);
    return null;
  }
}

// Extend a session's expiry time
function extendSession(sessionId, sessionData) {
  try {
    // Update expiry time
    const now = new Date();
    const newExpiryTime = new Date(
      now.getTime() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000
    );

    sessionData.expires = newExpiryTime.toString();

    // Update session in Script Properties
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty(sessionId, JSON.stringify(sessionData));
  } catch (error) {
    Logger.log("Error extending session: " + error.message);
  }
}

// Destroy a session
function destroySession(sessionId) {
  try {
    if (!sessionId) {
      return;
    }

    // Delete session from Script Properties
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.deleteProperty(sessionId);

    Logger.log("Session destroyed: " + sessionId);
  } catch (error) {
    Logger.log("Error destroying session: " + error.message);
  }
}

// Function to set a session and return dashboard URL
function setSessionAndGetDashboardUrl(username) {
  try {
    // Create session
    const sessionId = createSession(username);

    // Return dashboard URL with session ID
    const dashboardUrl =
      myURL() + "?page=Dashboard&sessionId=" + encodeURIComponent(sessionId);

    return dashboardUrl;
  } catch (error) {
    Logger.log("Error in setSessionAndGetDashboardUrl: " + error.message);
    throw new Error("Failed to set session: " + error.message);
  }
}

function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}

function includeNavbar() {
  return HtmlService.createTemplateFromFile("Sidebar.html")
    .evaluate()
    .getContent();
}

function myURL() {
  return ScriptApp.getService().getUrl();
}

// Update logout function to destroy session
function logout() {
  try {
    // Get the current session ID from the client
    // This will be handled by the client-side script
    return myURL() + "?page=Login";
  } catch (error) {
    Logger.log("Error in logout: " + error.message);
    return myURL() + "?page=Login";
  }
}

// Function to actually destroy the session from client-side
function logoutAndDestroySession(sessionId) {
  try {
    if (sessionId) {
      destroySession(sessionId);
    }
    return myURL() + "?page=Login";
  } catch (error) {
    Logger.log("Error in logoutAndDestroySession: " + error.message);
    return myURL() + "?page=Login";
  }
}

// Update getCurrentUserUsername to use sessions
function getCurrentUserUsername(sessionId) {
  try {
    // If sessionId is provided, get username from session
    if (sessionId) {
      const username = validateSession(sessionId);
      return username || "Admin";
    }

    // If no sessionId, return default
    return "Admin";
  } catch (error) {
    Logger.log("Error getting current user: " + error.message);
    return "Admin";
  }
}

// Fungsi untuk memverifikasi Login
function verifyLogin(username, password) {
  try {
    // Buka spreadsheet dan dapatkan sheet Users
    const ss = SpreadsheetApp.openById(SPREADSHEET_ACCOUNT_ID);
    const sheet = ss.getSheetByName(USERS_SHEET_NAME);

    // Dapatkan semua data pengguna
    const data = sheet.getDataRange().getValues();

    // Periksa baris header
    const headerRow = data[0];
    const usernameCol = headerRow.indexOf("username");
    const passwordCol = headerRow.indexOf("password");

    // Cari username dan verifikasi password
    for (let i = 1; i < data.length; i++) {
      if (data[i][usernameCol] === username) {
        // Username ditemukan, verifikasi password
        if (data[i][passwordCol] === password) {
          // Login berhasil, buat URL Dashboard
          const dashboardUrl =
            myURL() + "?page=Dashboard&user=" + encodeURIComponent(username);
          return {
            success: true,
            message: "Login berhasil",
            dashboardUrl: dashboardUrl,
            username: username,
          };
        } else {
          return { success: false, message: "Password salah" };
        }
      }
    }

    // Username tidak ditemukan
    return { success: false, message: "Username tidak ditemukan" };
  } catch (error) {
    return { success: false, message: "Error: " + error.message };
  }
}

// Mendapatkan URL halaman utama
function getHomeUrl() {
  return myURL() + "?page=Login";
}

//-----------------------------------------------------------------------------------------------------------------------

// Fungsi untuk mendapatkan data dashboard (statistik)
function getDashboardData() {
  try {
    // Buka spreadsheet buku induk (terpisah dari spreadsheet Login)
    const bukuIndukSS = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);

    // Data yang akan dikembalikan
    const dashboardData = {
      totalSiswaAktif: 0,
      totalSiswaLulus: 0,
      totalGuru: 0,
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

    // Kode lainnya untuk guru dan kelas...

    return dashboardData;
  } catch (error) {
    Logger.log("Error getting dashboard data: " + error.message);
    throw new Error("Gagal mendapatkan data dashboard: " + error.message);
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

    // Merge default options with provided options
    options = { ...defaultOptions, ...options };

    // Access the spreadsheet
    const ss = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    let studentsSheet = ss.getSheetByName(STUDENTS_SHEET_NAME);

    // Get all data from the sheet
    const dataRange = studentsSheet.getDataRange();
    const values = dataRange.getValues();

    // Return empty array if only header or no data
    if (values.length <= 1) {
      return {
        students: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: options.page,
      };
    }

    // Extract the header row and initialize column map
    const headers = values[0];
    initializeColumnMap(headers);

    // Process data rows into student objects
    let students = [];
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

      // Jika fieldsToReturn kosong, ambil semua kolom
      // Jika tidak, hanya ambil kolom yang diminta
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

        // Status Akademik
        student.status = row[studentColumnMap.status] || "Aktif";
        student.notes = row[studentColumnMap.notes] || "";
      }

      students.push(student);
    }

    // Apply search filter if provided
    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
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
        // For NIS search, use exact match when query is numeric
        const isNumericQuery = /^\d+$/.test(query);

        let nisMatch = false;
        if (student.nis) {
          if (isNumericQuery) {
            // Exact match for numeric NIS
            nisMatch = student.nis.toString() === query;
          } else {
            // Partial match for non-numeric search
            nisMatch = student.nis.toString().toLowerCase().includes(query);
          }
        }

        const namaMatch =
          student.nama && student.nama.toLowerCase().includes(query);
        const nisnMatch =
          student.nisn && student.nisn.toString().toLowerCase().includes(query);

        const isMatch = nisMatch || namaMatch || nisnMatch;

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
    return {
      students: students,
      totalCount: totalCount,
      totalPages: totalPages,
      currentPage: options.page,
    };
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

// Function untuk testing dari client-side
function testSpreadsheetFromClient() {
  try {
    Logger.log("=== CLIENT-SIDE SPREADSHEET TEST ===");

    const ss = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const studentsSheet = ss.getSheetByName(STUDENTS_SHEET_NAME);

    if (!studentsSheet) {
      return {
        success: false,
        error: 'Sheet "' + STUDENTS_SHEET_NAME + '" tidak ditemukan',
        availableSheets: ss.getSheets().map((s) => s.getName()),
      };
    }

    const dataRange = studentsSheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length === 0) {
      return {
        success: false,
        error: "Sheet kosong, tidak ada data siswa",
      };
    }

    const headers = values[0];
    const nisIndex = headers.indexOf("NIS");

    if (nisIndex === -1) {
      return {
        success: false,
        error: "Kolom NIS tidak ditemukan",
        headers: headers,
      };
    }

    // Ambil sample NIS
    const sampleNIS = [];
    for (let i = 1; i < Math.min(6, values.length); i++) {
      const nis = values[i][nisIndex];
      if (nis) {
        sampleNIS.push(String(nis).trim());
      }
    }

    return {
      success: true,
      spreadsheetName: ss.getName(),
      sheetName: studentsSheet.getName(),
      totalRows: values.length,
      dataRows: values.length - 1,
      headers: headers,
      nisColumnIndex: nisIndex,
      sampleNIS: sampleNIS,
    };
  } catch (error) {
    Logger.log("Error in testSpreadsheetFromClient: " + error.toString());
    return {
      success: false,
      error: error.toString(),
      stack: error.stack,
    };
  }
}

// Menghapus siswa dan data terkaitnya
function deleteStudent(nisId) {
  try {
    // Validasi NIS
    if (!nisId) {
      throw new Error("NIS tidak valid");
    }

    // Buka spreadsheet
    const ss = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);

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
    const folder = DriveApp.getFolderById(STUDENT_PDF_FOLDER_ID);

    // Cari dengan nama lengkap terlebih dahulu
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
    const query = `title contains 'Buku Induk - ${nisId}' and mimeType='application/pdf' and '${STUDENT_PDF_FOLDER_ID}' in parents`;
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

// Fungsi untuk preview siswa berdasarkan tanggal diterima
function previewStudentsByEntryDate(params) {
  try {
    // Buka spreadsheet dan dapatkan sheet siswa
    const ss = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const studentsSheet = ss.getSheetByName(STUDENTS_SHEET_NAME);

    if (!studentsSheet) {
      throw new Error("Sheet siswa tidak ditemukan");
    }

    // Dapatkan semua data siswa
    const dataRange = studentsSheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];

    // Temukan indeks kolom yang dibutuhkan dengan berbagai kemungkinan nama kolom
    const nisIndex = findColumnIndex(headers, ["nis", "NIS"]);
    const nameIndex = findColumnIndex(headers, [
      "nama",
      "Nama Lengkap",
      "nama_lengkap",
      "Nama Siswa",
    ]);
    const genderIndex = findColumnIndex(headers, [
      "gender",
      "Jenis Kelamin",
      "jenis_kelamin",
    ]);
    const statusIndex = findColumnIndex(headers, [
      "status",
      "Status Akademik",
      "Status",
    ]);
    const entryDateIndex = findColumnIndex(headers, [
      "tanggalDaftar",
      "Tanggal Diterima",
      "Hari, Tanggal, dan Tahun Diterima di SMPN 03 Pekalongan",
      "Tanggal Diterima di SMPN 03 Pekalongan",
    ]);

    if (nisIndex === -1 || entryDateIndex === -1) {
      throw new Error("Kolom NIS atau tanggal diterima tidak ditemukan");
    }

    // Filter siswa berdasarkan parameter
    const filteredStudents = [];

    // Tanggal tertentu
    if (params.date) {
      const targetDate = new Date(params.date);

      for (let i = 1; i < values.length; i++) {
        const entryDate = new Date(values[i][entryDateIndex]);

        // Bandingkan tanggal (tanpa waktu)
        if (
          entryDate.toDateString() === targetDate.toDateString() &&
          (statusIndex === -1 || values[i][statusIndex] === "Aktif")
        ) {
          filteredStudents.push({
            nis: values[i][nisIndex],
            name: nameIndex !== -1 ? values[i][nameIndex] : "Tidak diketahui",
            gender: genderIndex !== -1 ? values[i][genderIndex] : "",
          });
        }
      }
    }
    // Rentang tanggal
    else if (params.startDate && params.endDate) {
      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);

      for (let i = 1; i < values.length; i++) {
        const entryDate = new Date(values[i][entryDateIndex]);

        if (
          entryDate >= startDate &&
          entryDate <= endDate &&
          (statusIndex === -1 || values[i][statusIndex] === "Aktif")
        ) {
          filteredStudents.push({
            nis: values[i][nisIndex],
            name: nameIndex !== -1 ? values[i][nameIndex] : "Tidak diketahui",
            gender: genderIndex !== -1 ? values[i][genderIndex] : "",
          });
        }
      }
    }
    // Tahun tertentu
    else if (params.year) {
      const year = parseInt(params.year);

      for (let i = 1; i < values.length; i++) {
        const entryDate = new Date(values[i][entryDateIndex]);

        if (
          entryDate.getFullYear() === year &&
          (statusIndex === -1 || values[i][statusIndex] === "Aktif")
        ) {
          filteredStudents.push({
            nis: values[i][nisIndex],
            name: nameIndex !== -1 ? values[i][nameIndex] : "Tidak diketahui",
            gender: genderIndex !== -1 ? values[i][genderIndex] : "",
          });
        }
      }
    }

    return filteredStudents;
  } catch (error) {
    Logger.log("Error in previewStudentsByEntryDate: " + error.message);
    throw error;
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

// Fungsi untuk update status siswa secara batch
function updateStudentsStatusBatch(params) {
  try {
    // Pertama preview siswa yang akan diupdate
    const studentsToUpdate = previewStudentsByEntryDate(params.filter);

    if (studentsToUpdate.length === 0) {
      return {
        success: false,
        message: "Tidak ada siswa yang sesuai dengan kriteria",
        count: 0,
      };
    }

    // Buka spreadsheet dan dapatkan sheet siswa
    const ss = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
    const studentsSheet = ss.getSheetByName(STUDENTS_SHEET_NAME);

    if (!studentsSheet) {
      throw new Error("Sheet siswa tidak ditemukan");
    }

    // Dapatkan semua data siswa
    const dataRange = studentsSheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];

    // Temukan indeks kolom yang dibutuhkan dengan berbagai kemungkinan nama kolom
    const nisIndex = findColumnIndex(headers, ["nis", "NIS"]);
    const statusIndex = findColumnIndex(headers, [
      "status",
      "Status Akademik",
      "Status",
    ]);
    const notesIndex = findColumnIndex(headers, [
      "notes",
      "Keterangan",
      "keterangan",
    ]);

    if (nisIndex === -1) {
      throw new Error("Kolom NIS tidak ditemukan");
    }

    if (statusIndex === -1) {
      throw new Error("Kolom Status tidak ditemukan");
    }

    // Kumpulkan NIS siswa yang akan diupdate
    const nisToUpdate = studentsToUpdate.map((student) => student.nis);

    // Update status siswa
    let updatedCount = 0;

    for (let i = 1; i < values.length; i++) {
      if (nisToUpdate.includes(values[i][nisIndex])) {
        // Update status
        studentsSheet
          .getRange(i + 1, statusIndex + 1)
          .setValue(params.update.newStatus);

        // Update notes jika ada
        if (notesIndex !== -1 && params.update.notes) {
          let currentNotes = values[i][notesIndex] || "";
          let newNotes = currentNotes;

          // Tambahkan tanggal kelulusan ke notes jika ada
          if (params.update.graduationDate) {
            const graduationDate = new Date(params.update.graduationDate);
            const dateString = Utilities.formatDate(
              graduationDate,
              Session.getScriptTimeZone(),
              "dd/MM/yyyy"
            );
            newNotes +=
              (currentNotes ? "\n" : "") +
              `${params.update.newStatus} pada tanggal ${dateString}. `;
          }

          // Tambahkan notes baru
          if (params.update.notes) {
            newNotes += params.update.notes;
          }

          studentsSheet.getRange(i + 1, notesIndex + 1).setValue(newNotes);
        }

        updatedCount++;
      }
    }

    return {
      success: true,
      message: "Berhasil mengupdate status siswa",
      count: updatedCount,
    };
  } catch (error) {
    Logger.log("Error in updateStudentsStatusBatch: " + error.message);
    return { success: false, message: error.message, count: 0 };
  }
}

// Tambahkan fungsi ini untuk mendapatkan username pengguna saat ini dari client-side
function getCurrentUserFromSession() {
  try {
    // Dapatkan parameter dari URL sebagai konteks permintaan
    const url = HtmlService.createHtmlOutputFromFile("dummy").getContent();
    const urlParams = url.split("?")[1];
    if (!urlParams) return "Admin";

    const params = urlParams.split("&");
    let sessionId = "";

    for (let i = 0; i < params.length; i++) {
      const param = params[i].split("=");
      if (param[0] === "sessionId") {
        sessionId = param[1];
        break;
      }
    }

    return getCurrentUserUsername(sessionId);
  } catch (error) {
    Logger.log("Error in getCurrentUserFromSession: " + error.message);
    return "Admin";
  }
}

// Fungsi untuk membersihkan cache
function clearCache() {
  studentColumnMap = null;
  return "Cache dibersihkan";
}
// Duplikasi fungsi getCurrentUserUsername dihapus - menggunakan implementasi yang sudah ada di atas

function getStudentColumnMap() {
  if (studentColumnMap) return studentColumnMap;

  const spreadsheet = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
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
  const spreadsheet = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
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
      return { success: false, message: "NIS dan Nama Lengkap wajib diisi" };
    }

    // Access the spreadsheet
    const ss = SpreadsheetApp.openById(BUKU_INDUK_SPREADSHEET_ID);
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
    setCellValue("Nama Lengkap", studentData.nama);
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

    // Append the new row to the sheet
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
      "Nama Lengkap",
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
