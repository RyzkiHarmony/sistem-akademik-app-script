function doGet(e) {
  let page = e.parameter.page;
  let sessionId = e.parameter.sessionId;
  let studentId = e.parameter.id; // Add student ID parameter
  let editId = e.parameter.edit; // Add edit ID parameter
  let nis = e.parameter.nis; // Add NIS parameter for grades detail
  let kelas = e.parameter.kelas; // Add kelas parameter for grades detail
  let semester = e.parameter.semester; // Add semester parameter for grades detail

  if (page == null) page = "Login"; //Default page

  // List of pages that require authentication & role
  const protectedPages = [
    "Dashboard",
    "Students_manage",
    "Student_detail",
    "Student_edit",
    "Student_form",
    "Student_grades_detail",
    "Students_grades",
    "KIP_Analysis",
  ];
  const pageRequiredRole = {
    Dashboard: "viewer",
    Students_manage: "staff",
    Student_detail: "staff",
    Students_grades: "staff",
    Student_grades_detail: "staff",
    Student_form: "staff",
    Student_edit: "admin",
    KIP_Analysis: "staff",
  };

  // Check if the requested page requires authentication
  if (protectedPages.includes(page)) {
    const username = validateSession(sessionId);
    if (!username) {
      return HtmlService.createTemplateFromFile("Login")
        .evaluate()
        .setTitle("Buku Induk Siswa - Login")
        .addMetaTag("viewport", "width=device-width, initial-scale=1")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    const role = getUserRoleByUsername(username) || "viewer";
    const required = pageRequiredRole[page] || "viewer";
    if (!roleMeets(role, required)) {
      return HtmlService.createTemplateFromFile("Login")
        .evaluate()
        .setTitle("Tidak Berwenang")
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

  // Add NIS to the template if available (for Student_grades_detail)
  if (nis) {
    output.nis = nis;
  }

  // Add kelas to the template if available (for Student_grades_detail)
  if (kelas) {
    output.kelas = kelas;
  }

  // Add semester to the template if available (for Student_grades_detail)
  if (semester) {
    output.semester = semester;
  }

  return output
    .evaluate()
    .setTitle("Buku Induk Siswa")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function myURL() {
  return ScriptApp.getService().getUrl();
}

function getHomeUrl() {
  return myURL() + "?page=Login";
}

function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}

function includeNavbar() {
  return HtmlService.createTemplateFromFile("Sidebar.html")
    .evaluate()
    .getContent();
}

