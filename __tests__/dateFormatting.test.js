/**
 * Unit Tests: formatDate(date) & formatDateForInput(date)
 *
 * Menguji fungsi formatting tanggal untuk tampilan dan input HTML.
 */
const { loadCode } = require('./helpers/loadCode');

describe('Date Formatting Functions', () => {
  let ctx;

  beforeAll(() => {
    ctx = loadCode();
  });

  // =====================================================
  // formatDate
  // =====================================================
  describe('formatDate', () => {
    test('null returns empty string', () => {
      expect(ctx.formatDate(null)).toBe('');
    });

    test('undefined returns empty string', () => {
      expect(ctx.formatDate(undefined)).toBe('');
    });

    test('empty string returns empty string', () => {
      expect(ctx.formatDate('')).toBe('');
    });

    test('string input is returned as-is', () => {
      expect(ctx.formatDate('15 Agustus 2025')).toBe('15 Agustus 2025');
    });

    test('string date format YYYY-MM-DD is returned as-is', () => {
      expect(ctx.formatDate('2025-08-15')).toBe('2025-08-15');
    });

    test('Date object is formatted to Indonesian locale', () => {
      const date = new Date(2025, 7, 15); // August 15, 2025
      const result = ctx.formatDate(date);
      // Should contain the day, month in Indonesian, and year
      expect(typeof result).toBe('string');
      expect(result).not.toBe('');
      expect(result).toContain('2025');
      expect(result).toContain('15');
    });

    test('number input (non-Date) returns empty string', () => {
      expect(ctx.formatDate(12345)).toBe('');
    });

    test('boolean input returns empty string', () => {
      // false is falsy → early return ""
      expect(ctx.formatDate(false)).toBe('');
    });
  });

  // =====================================================
  // formatDateForInput
  // =====================================================
  describe('formatDateForInput', () => {
    test('null returns empty string', () => {
      expect(ctx.formatDateForInput(null)).toBe('');
    });

    test('undefined returns empty string', () => {
      expect(ctx.formatDateForInput(undefined)).toBe('');
    });

    test('empty string returns empty string', () => {
      expect(ctx.formatDateForInput('')).toBe('');
    });

    test('YYYY-MM-DD string is returned as-is', () => {
      expect(ctx.formatDateForInput('2025-08-15')).toBe('2025-08-15');
    });

    test('Date object returns YYYY-MM-DD format', () => {
      const date = new Date(2025, 7, 15); // August 15, 2025
      expect(ctx.formatDateForInput(date)).toBe('2025-08-15');
    });

    test('Date object with single-digit month pads with zero', () => {
      const date = new Date(2025, 0, 5); // January 5, 2025
      expect(ctx.formatDateForInput(date)).toBe('2025-01-05');
    });

    test('Date object December 31', () => {
      const date = new Date(2025, 11, 31); // December 31, 2025
      expect(ctx.formatDateForInput(date)).toBe('2025-12-31');
    });

    test('non-YYYY-MM-DD string returns empty string', () => {
      expect(ctx.formatDateForInput('15 Agustus 2025')).toBe('');
    });

    test('number returns empty string', () => {
      expect(ctx.formatDateForInput(12345)).toBe('');
    });
  });

  // =====================================================
  // parseDate
  // =====================================================
  describe('parseDate', () => {
    test('null returns null', () => {
      expect(ctx.parseDate(null)).toBeNull();
    });

    test('undefined returns null', () => {
      expect(ctx.parseDate(undefined)).toBeNull();
    });

    test('empty string returns null', () => {
      expect(ctx.parseDate('')).toBeNull();
    });

    test('Date object is returned as-is', () => {
      const date = new Date(2025, 7, 15);
      expect(ctx.parseDate(date)).toBe(date);
    });

    test('valid date string "2025-08-15" returns Date object', () => {
      const result = ctx.parseDate('2025-08-15');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
    });

    test('invalid date string returns null', () => {
      expect(ctx.parseDate('not-a-date')).toBeNull();
    });
  });
});
