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
