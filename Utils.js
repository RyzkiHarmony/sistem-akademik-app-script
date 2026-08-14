// Sessions expire after 2 hours

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
