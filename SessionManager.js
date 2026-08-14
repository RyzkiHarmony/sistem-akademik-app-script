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

