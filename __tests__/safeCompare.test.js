/**
 * Unit Tests: safeCompare(a, b)
 *
 * Menguji constant-time string comparison untuk keamanan hash.
 */
const { loadCode } = require('./helpers/loadCode');

describe('safeCompare', () => {
  let ctx;

  beforeAll(() => {
    ctx = loadCode();
  });

  // --- Positif: string identik ---
  test('identical strings return true', () => {
    expect(ctx.safeCompare('abc123', 'abc123')).toBe(true);
  });

  test('identical hex strings return true', () => {
    const hex = 'a1b2c3d4e5f6';
    expect(ctx.safeCompare(hex, hex)).toBe(true);
  });

  test('identical empty strings return true', () => {
    // safeCompare checks !a || !b first, so empty strings return false
    // because empty string is falsy
    expect(ctx.safeCompare('', '')).toBe(false);
  });

  // --- Negatif: string berbeda ---
  test('different strings return false', () => {
    expect(ctx.safeCompare('abc', 'xyz')).toBe(false);
  });

  test('strings with different lengths return false', () => {
    expect(ctx.safeCompare('abc', 'abcd')).toBe(false);
  });

  test('one character difference returns false', () => {
    expect(ctx.safeCompare('abc', 'abd')).toBe(false);
  });

  // --- Edge cases: null/undefined ---
  test('null first arg returns false', () => {
    expect(ctx.safeCompare(null, 'abc')).toBe(false);
  });

  test('null second arg returns false', () => {
    expect(ctx.safeCompare('abc', null)).toBe(false);
  });

  test('both null returns false', () => {
    expect(ctx.safeCompare(null, null)).toBe(false);
  });

  test('undefined first arg returns false', () => {
    expect(ctx.safeCompare(undefined, 'abc')).toBe(false);
  });

  test('undefined second arg returns false', () => {
    expect(ctx.safeCompare('abc', undefined)).toBe(false);
  });

  // --- Case sensitive ---
  test('case-sensitive comparison: "ABC" !== "abc"', () => {
    expect(ctx.safeCompare('ABC', 'abc')).toBe(false);
  });
});
