function verifyLogin(username, password) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetAccountId());
    const sheet = ss.getSheetByName(USERS_SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    // Pastikan kolom keamanan tersedia
    const headerRow = data[0];
    ensureUserColumns(sheet, headerRow);
    const headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    const usernameCol = headers.indexOf("username");
    const passwordCol = headers.indexOf("password");
    const hashCol = headers.indexOf("password_hash");
    const saltCol = headers.indexOf("salt");
    const iterCol = headers.indexOf("iterations");
    const roleCol = headers.indexOf("role");

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[usernameCol] === username) {
        const storedHash = hashCol !== -1 ? row[hashCol] : "";
        const storedSalt = saltCol !== -1 ? row[saltCol] : "";
        const storedIter = iterCol !== -1 ? parseInt(row[iterCol]) || 0 : 0;

        // Jika sudah hash
        if (storedHash && storedSalt && storedIter > 0) {
          const calc = hashPasswordWithPepper(password, storedSalt, storedIter);
          if (safeCompare(calc, storedHash)) {
            const dashboardUrl =
              myURL() + "?page=Dashboard&user=" + encodeURIComponent(username);
            return {
              success: true,
              message: "Login berhasil",
              dashboardUrl: dashboardUrl,
              username: username,
              role: roleCol !== -1 ? row[roleCol] : "",
            };
          }
          return { success: false, message: "Password salah" };
        }

        // Fallback plaintext: migrasi jika cocok
        if (passwordCol !== -1 && row[passwordCol] === password) {
          const lock = LockService.getScriptLock();
          try {
            lock.waitLock(30000);
            const salt = Utilities.getUuid();
            const iterations = 20000;
            const newHash = hashPasswordWithPepper(password, salt, iterations);
            const writeRange = sheet.getRange(
              i + 1,
              1,
              1,
              sheet.getLastColumn()
            );
            const current = writeRange.getValues()[0];
            if (hashCol !== -1) current[hashCol] = newHash;
            if (saltCol !== -1) current[saltCol] = salt;
            if (iterCol !== -1) current[iterCol] = iterations;
            if (passwordCol !== -1) current[passwordCol] = "";
            writeRange.setValues([current]);
          } finally {
            try {
              lock.releaseLock();
            } catch (e) {}
          }
          const dashboardUrl =
            myURL() + "?page=Dashboard&user=" + encodeURIComponent(username);
          return {
            success: true,
            message: "Login berhasil",
            dashboardUrl: dashboardUrl,
            username: username,
            role: roleCol !== -1 ? row[roleCol] : "",
          };
        }
        return { success: false, message: "Password salah" };
      }
    }
    return { success: false, message: "Username tidak ditemukan" };
  } catch (error) {
    return { success: false, message: "Error: " + error.message };
  }
}

function hashPasswordWithPepper(password, salt, iterations) {
  const pepper = getPasswordPepper();
  let res = Utilities.computeHmacSha256Signature(salt + password, pepper);
  for (let i = 1; i < iterations; i++) {
    res = Utilities.computeHmacSha256Signature(res, pepper);
  }
  return bytesToHex(res);
}

function getPasswordPepper() {
  const sp = PropertiesService.getScriptProperties();
  let p = sp.getProperty("PASSWORD_PEPPER");
  if (!p) {
    p = Utilities.getUuid() + Utilities.getUuid();
    sp.setProperty("PASSWORD_PEPPER", p);
  }
  return p;
}

function roleMeets(role, required) {
  const rank = { viewer: 1, staff: 2, admin: 3 };
  const rr = rank[required] || 1;
  const rl = rank[role] || 1;
  return rl >= rr;
}

function getUserRoleByUsername(username) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetAccountId());
    const sheet = ss.getSheetByName(USERS_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const usernameCol = headers.indexOf("username");
    const roleCol = headers.indexOf("role");
    if (usernameCol === -1 || roleCol === -1) return "viewer";
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[usernameCol] === username) {
        const r = row[roleCol];
        return r && typeof r === "string" && r.trim() !== ""
          ? r.trim()
          : "viewer";
      }
    }
    return "viewer";
  } catch (e) {
    return "viewer";
  }
}

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

