/**
 * loadCode.js — Helper untuk memuat Code.js ke dalam lingkungan test.
 *
 * Membaca Code.js, menyuntikkan mock GAS global, lalu mengeksekusi
 * sehingga semua fungsi terekspos ke global scope untuk diuji.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const gasMocks = require('../../__mocks__/gas');

/**
 * Memuat Code.js ke dalam sandbox dan mengembalikan objek berisi
 * semua fungsi yang didefinisikan di Code.js.
 *
 * @param {object} [overrides] - Override tambahan untuk global mocks
 * @returns {object} Sandbox context berisi semua fungsi Code.js
 */
function loadCode(overrides = {}) {
  // Reset semua mock sebelum memuat ulang
  gasMocks.resetAllMocks();

  // Buat sandbox dengan semua GAS globals + overrides
  const sandbox = {
    // GAS API mocks
    PropertiesService: gasMocks.PropertiesService,
    Logger: gasMocks.Logger,
    Utilities: gasMocks.Utilities,
    SpreadsheetApp: gasMocks.SpreadsheetApp,
    HtmlService: gasMocks.HtmlService,
    ScriptApp: gasMocks.ScriptApp,
    LockService: gasMocks.LockService,
    DriveApp: gasMocks.DriveApp,
    Session: gasMocks.Session,

    // Standard JS globals yang dibutuhkan
    console,
    Date,
    Math,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    encodeURIComponent,
    decodeURIComponent,
    Array,
    Object,
    String,
    Number,
    RegExp,
    Error,
    TypeError,
    RangeError,

    // Apply overrides
    ...overrides,
  };

  // Buat context VM
  const context = vm.createContext(sandbox);

  const isCoverage = process.env.npm_lifecycle_event === 'test:coverage';
  let instrumenter = null;
  if (isCoverage) {
    const { createInstrumenter } = require('istanbul-lib-instrument');
    instrumenter = createInstrumenter({ preserveComments: true, produceSourceMap: true, compact: false });
  }

  const files = ['Auth.js', 'SessionManager.js', 'Router.js', 'Code.js'];
  for (const file of files) {
    const filePath = path.resolve(__dirname, '../../' + file);
    if (fs.existsSync(filePath)) {
      let source = fs.readFileSync(filePath, 'utf-8');
      
      if (instrumenter) {
        source = instrumenter.instrumentSync(source, filePath);
      }
      
      const script = new vm.Script(source, { filename: filePath });
      script.runInContext(context);
    }
  }

  if (isCoverage && context.__coverage__) {
    global.__coverage__ = global.__coverage__ || {};
    Object.assign(global.__coverage__, context.__coverage__);
  }

  return context;
}

module.exports = { loadCode };
