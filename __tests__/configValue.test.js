/**
 * Unit Tests: getConfigValue(key, fallback)
 *
 * Menguji helper konfigurasi yang membaca Script Properties
 * dengan fallback ke nilai default.
 */
const { loadCode } = require('./helpers/loadCode');
const gasMocks = require('../__mocks__/gas');

describe('getConfigValue', () => {
  let ctx;

  beforeEach(() => {
    ctx = loadCode();
  });

  test('returns property value when it exists', () => {
    gasMocks.PropertiesService.getScriptProperties().setProperty(
      'TEST_KEY',
      'test_value'
    );

    const result = ctx.getConfigValue('TEST_KEY', 'fallback');
    expect(result).toBe('test_value');
  });

  test('returns fallback when property does not exist', () => {
    const result = ctx.getConfigValue('NON_EXISTENT_KEY', 'my_fallback');
    expect(result).toBe('my_fallback');
  });

  test('returns fallback when property is empty string', () => {
    gasMocks.PropertiesService.getScriptProperties().setProperty(
      'EMPTY_KEY',
      ''
    );

    const result = ctx.getConfigValue('EMPTY_KEY', 'fallback_value');
    expect(result).toBe('fallback_value');
  });

  test('returns fallback when property is whitespace only', () => {
    gasMocks.PropertiesService.getScriptProperties().setProperty(
      'SPACE_KEY',
      '   '
    );

    const result = ctx.getConfigValue('SPACE_KEY', 'fallback_value');
    expect(result).toBe('fallback_value');
  });

  test('returns property value even with leading/trailing spaces', () => {
    gasMocks.PropertiesService.getScriptProperties().setProperty(
      'PADDED_KEY',
      '  actual_value  '
    );

    const result = ctx.getConfigValue('PADDED_KEY', 'fallback');
    expect(result).toBe('  actual_value  ');
  });
});

// =====================================================
// Config getter functions
// =====================================================
describe('Config Getter Functions', () => {
  let ctx;

  beforeEach(() => {
    ctx = loadCode();
  });

  describe('getSpreadsheetAccountId', () => {
    test('returns default ID when property not set', () => {
      const result = ctx.getSpreadsheetAccountId();
      // Should return the hardcoded constant
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('returns property value when set', () => {
      gasMocks.PropertiesService.getScriptProperties().setProperty(
        'SPREADSHEET_ACCOUNT_ID',
        'custom-spreadsheet-id'
      );

      const result = ctx.getSpreadsheetAccountId();
      expect(result).toBe('custom-spreadsheet-id');
    });
  });

  describe('getBukuIndukSpreadsheetId', () => {
    test('returns default ID when property not set', () => {
      const result = ctx.getBukuIndukSpreadsheetId();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('returns property value when set', () => {
      gasMocks.PropertiesService.getScriptProperties().setProperty(
        'BUKU_INDUK_SPREADSHEET_ID',
        'custom-buku-induk-id'
      );

      const result = ctx.getBukuIndukSpreadsheetId();
      expect(result).toBe('custom-buku-induk-id');
    });
  });

  describe('getStudentPdfFolderId', () => {
    test('returns default ID when property not set', () => {
      const result = ctx.getStudentPdfFolderId();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
