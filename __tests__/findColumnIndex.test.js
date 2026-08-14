/**
 * Unit Tests: findColumnIndex(headers, possibleNames)
 *
 * Menguji pencarian index kolom dari array header berdasarkan
 * daftar kemungkinan nama kolom (fallback search).
 */
const { loadCode } = require('./helpers/loadCode');

describe('findColumnIndex', () => {
  let ctx;

  beforeAll(() => {
    ctx = loadCode();
  });

  const sampleHeaders = ['NIS', 'Nama Siswa', 'Status Akademik', 'Kelas', 'Jenis Kelamin'];

  test('first possible name found → returns its index', () => {
    expect(ctx.findColumnIndex(sampleHeaders, ['Status Akademik', 'Status', 'status'])).toBe(2);
  });

  test('first name not found, second name found → returns second index', () => {
    const headers = ['NIS', 'Nama', 'Status', 'Kelas'];
    expect(ctx.findColumnIndex(headers, ['Status Akademik', 'Status', 'status'])).toBe(2);
  });

  test('none of the possible names found → returns -1', () => {
    expect(ctx.findColumnIndex(sampleHeaders, ['Tanggal Lahir', 'TTL'])).toBe(-1);
  });

  test('empty possible names array → returns -1', () => {
    expect(ctx.findColumnIndex(sampleHeaders, [])).toBe(-1);
  });

  test('empty headers → returns -1', () => {
    expect(ctx.findColumnIndex([], ['NIS'])).toBe(-1);
  });

  test('exact match only (case-sensitive)', () => {
    expect(ctx.findColumnIndex(sampleHeaders, ['nis'])).toBe(-1);
    expect(ctx.findColumnIndex(sampleHeaders, ['NIS'])).toBe(0);
  });

  test('first exact match wins when multiple headers could match', () => {
    const headers = ['ID', 'NIS', 'Nama Siswa'];
    expect(ctx.findColumnIndex(headers, ['NIS', 'ID'])).toBe(1); // 'NIS' is checked first
  });

  test('finds last column', () => {
    expect(ctx.findColumnIndex(sampleHeaders, ['Jenis Kelamin'])).toBe(4);
  });

  test('finds first column', () => {
    expect(ctx.findColumnIndex(sampleHeaders, ['NIS'])).toBe(0);
  });
});
