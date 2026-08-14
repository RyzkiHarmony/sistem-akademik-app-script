/**
 * Google Apps Script API Mocks
 *
 * Menyediakan tiruan (mock) untuk semua layanan GAS yang digunakan Code.js.
 * Setiap mock memiliki state internal yang bisa di-reset dan dikonfigurasi per test.
 */

// ---------- PropertiesService ----------
const _scriptProperties = {};

const PropertiesService = {
  getScriptProperties: () => ({
    getProperty: (key) => _scriptProperties[key] || null,
    setProperty: (key, value) => { _scriptProperties[key] = value; },
    deleteProperty: (key) => { delete _scriptProperties[key]; },
    getProperties: () => ({ ..._scriptProperties }),
  }),
  _store: _scriptProperties,
  _reset: () => {
    Object.keys(_scriptProperties).forEach((k) => delete _scriptProperties[k]);
  },
};

// ---------- Logger ----------
const Logger = {
  log: jest.fn(),
};

// ---------- Utilities ----------
let _uuidCounter = 0;
const Utilities = {
  getUuid: () => `mock-uuid-${++_uuidCounter}`,
  computeHmacSha256Signature: jest.fn((data, key) => {
    // Return a deterministic byte array for testing
    const result = [];
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    for (let i = 0; i < 32; i++) {
      result.push((str.charCodeAt(i % str.length) + i) % 256);
    }
    return result;
  }),
  formatDate: jest.fn((date, tz, fmt) => {
    if (date instanceof Date) return date.toISOString().split('T')[0];
    return String(date);
  }),
  sleep: jest.fn(),
  _resetUuidCounter: () => { _uuidCounter = 0; },
};

// ---------- SpreadsheetApp ----------
function createMockSheet(data = []) {
  const _data = data.map((row) => [...row]); // deep copy rows

  return {
    getDataRange: () => ({
      getValues: () => _data.map((row) => [...row]),
      getNumRows: () => _data.length,
      getNumColumns: () => (_data[0] || []).length,
    }),
    getRange: jest.fn((row, col, numRows, numCols) => ({
      getValues: () => {
        const result = [];
        for (let r = row - 1; r < row - 1 + (numRows || 1); r++) {
          if (_data[r]) {
            const rowSlice = numCols
              ? _data[r].slice(col - 1, col - 1 + numCols)
              : _data[r].slice(col - 1);
            result.push(rowSlice);
          }
        }
        return result;
      },
      setValues: jest.fn((values) => {
        for (let r = 0; r < values.length; r++) {
          const targetRow = row - 1 + r;
          if (!_data[targetRow]) _data[targetRow] = [];
          for (let c = 0; c < values[r].length; c++) {
            _data[targetRow][(col - 1) + c] = values[r][c];
          }
        }
      }),
      setValue: jest.fn((value) => {
        if (!_data[row - 1]) _data[row - 1] = [];
        _data[row - 1][col - 1] = value;
      }),
      setBackground: jest.fn(),
      setFontWeight: jest.fn(),
      setFontColor: jest.fn(),
    })),
    getLastColumn: () => (_data[0] || []).length,
    getLastRow: () => _data.length,
    getSheetName: jest.fn(() => 'MockSheet'),
    getName: jest.fn(() => 'MockSheet'),
    deleteRow: jest.fn((rowIndex) => {
      _data.splice(rowIndex - 1, 1);
    }),
    clear: jest.fn(() => {
      _data.length = 0;
    }),
    autoResizeColumns: jest.fn(),
    _data, // expose for test inspection
  };
}

const _sheets = {};

const SpreadsheetApp = {
  openById: jest.fn((id) => ({
    getSheetByName: (name) => _sheets[name] || null,
    getActiveSheet: () => Object.values(_sheets)[0] || createMockSheet(),
    insertSheet: jest.fn((name) => {
      const sheet = createMockSheet();
      _sheets[name] = sheet;
      return sheet;
    }),
    getId: () => id,
  })),
  create: jest.fn((name) => {
    const id = `mock-spreadsheet-${Date.now()}`;
    const sheet = createMockSheet();
    return {
      getActiveSheet: () => sheet,
      getId: () => id,
    };
  }),
  _sheets,
  _registerSheet: (name, data) => {
    _sheets[name] = createMockSheet(data);
    return _sheets[name];
  },
  _reset: () => {
    Object.keys(_sheets).forEach((k) => delete _sheets[k]);
  },
};

// ---------- HtmlService ----------
const HtmlService = {
  createTemplateFromFile: jest.fn((filename) => {
    const template = {
      evaluate: () => ({
        getContent: () => `<html>${filename}</html>`,
        setTitle: jest.fn().mockReturnThis(),
        addMetaTag: jest.fn().mockReturnThis(),
        setXFrameOptionsMode: jest.fn().mockReturnThis(),
      }),
    };
    return template;
  }),
  createHtmlOutputFromFile: jest.fn((filename) => ({
    getContent: () => `<html>${filename}</html>`,
  })),
  XFrameOptionsMode: {
    ALLOWALL: 'ALLOWALL',
  },
};

// ---------- ScriptApp ----------
const ScriptApp = {
  getService: () => ({
    getUrl: () => 'https://script.google.com/macros/s/MOCK_DEPLOY_ID/exec',
  }),
};

// ---------- LockService ----------
const LockService = {
  getScriptLock: () => ({
    waitLock: jest.fn(),
    releaseLock: jest.fn(),
    tryLock: jest.fn(() => true),
  }),
};

// ---------- DriveApp ----------
const DriveApp = {
  getFolderById: jest.fn((id) => ({
    getFilesByName: jest.fn((name) => ({
      hasNext: () => false,
      next: () => null,
    })),
  })),
  getFileById: jest.fn((id) => ({
    setSharing: jest.fn(),
    getUrl: () => `https://drive.google.com/file/d/${id}`,
  })),
  searchFiles: jest.fn(() => ({
    hasNext: () => false,
    next: () => null,
  })),
  Access: { ANYONE_WITH_LINK: 'ANYONE_WITH_LINK' },
  Permission: { VIEW: 'VIEW' },
};

// ---------- Session ----------
const Session = {
  getActiveUser: () => ({
    getEmail: () => 'test@example.com',
  }),
};

// ---------- Global reset ----------
function resetAllMocks() {
  PropertiesService._reset();
  SpreadsheetApp._reset();
  Utilities._resetUuidCounter();
  Logger.log.mockClear();
  jest.clearAllMocks();
}

module.exports = {
  PropertiesService,
  Logger,
  Utilities,
  SpreadsheetApp,
  HtmlService,
  ScriptApp,
  LockService,
  DriveApp,
  Session,
  createMockSheet,
  resetAllMocks,
};
