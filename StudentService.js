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
