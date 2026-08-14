/**
 * Unit Tests: bytesToHex(bytes)
 *
 * Menguji konversi byte array (signed/unsigned) ke hex string.
 */
const { loadCode } = require('./helpers/loadCode');

describe('bytesToHex', () => {
  let ctx;

  beforeAll(() => {
    ctx = loadCode();
  });

  test('empty array returns empty string', () => {
    expect(ctx.bytesToHex([])).toBe('');
  });

  test('single byte 0 returns "00"', () => {
    expect(ctx.bytesToHex([0])).toBe('00');
  });

  test('single byte 255 returns "ff"', () => {
    expect(ctx.bytesToHex([255])).toBe('ff');
  });

  test('[0, 255, 128] returns "00ff80"', () => {
    expect(ctx.bytesToHex([0, 255, 128])).toBe('00ff80');
  });

  test('[1, 2, 3, 15, 16] returns "0102030f10"', () => {
    expect(ctx.bytesToHex([1, 2, 3, 15, 16])).toBe('0102030f10');
  });

  test('negative byte (signed) -1 is converted to 255 → "ff"', () => {
    // GAS returns signed bytes: -1 should map to 255
    expect(ctx.bytesToHex([-1])).toBe('ff');
  });

  test('negative byte -128 is converted to 128 → "80"', () => {
    expect(ctx.bytesToHex([-128])).toBe('80');
  });

  test('mixed signed and unsigned bytes', () => {
    // -1 → 255 → "ff", 0 → "00", -128 → 128 → "80", 127 → "7f"
    expect(ctx.bytesToHex([-1, 0, -128, 127])).toBe('ff00807f');
  });

  test('all zeros [0, 0, 0] returns "000000"', () => {
    expect(ctx.bytesToHex([0, 0, 0])).toBe('000000');
  });
});
