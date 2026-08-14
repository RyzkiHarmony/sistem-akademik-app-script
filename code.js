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

// Update the doGet function to check for session on protected pages

// Session Management Constants
const SESSION_EXPIRY_HOURS = 2; 

// Fungsi-fungsi untuk manajemen data siswa
// Map of column names to indices
let studentColumnMap = null;

// Tambahkan fungsi ini untuk mendapatkan username pengguna saat ini dari client-side

// Fungsi untuk membersihkan cache
function clearCache() {
  studentColumnMap = null;
  return "Cache dibersihkan";
}

// ===== KIP ANALYSIS FUNCTIONS =====

// Konstanta untuk sheet KIP Analysis
const KIP_ANALYSIS_SHEET_NAME = "KIP_Analisis";
const KIP_CONFIG_SHEET_NAME = "KIP_Config";

