/**
 * Unit Tests: KIP Scoring Functions
 *
 * Menguji semua fungsi penilaian KIP:
 * - getIncomeScore(income)
 * - calculateIncomeScore(ayah, ibu, wali)
 * - calculateFamilyStatusScore(status)
 * - calculateDependentsScore(jumlah)
 * - calculateScholarshipScore(b1, b2, b3)
 */
const { loadCode } = require('./helpers/loadCode');

describe('KIP Scoring Functions', () => {
  let ctx;

  beforeAll(() => {
    ctx = loadCode();
  });

  // =====================================================
  // getIncomeScore
  // =====================================================
  describe('getIncomeScore', () => {
    test('empty string returns 100 (tidak berpenghasilan)', () => {
      expect(ctx.getIncomeScore('')).toBe(100);
    });

    test('null returns 100', () => {
      expect(ctx.getIncomeScore(null)).toBe(100);
    });

    test('"-" returns 100', () => {
      expect(ctx.getIncomeScore('-')).toBe(100);
    });

    test('"Tidak Berpenghasilan" returns 100', () => {
      expect(ctx.getIncomeScore('Tidak Berpenghasilan')).toBe(100);
    });

    test('"Kurang dari Rp1.000.000" returns 100', () => {
      expect(ctx.getIncomeScore('Kurang dari Rp1.000.000')).toBe(100);
    });

    test('"Rp1.000.000 - Rp1.999.999" returns 80', () => {
      expect(ctx.getIncomeScore('Rp1.000.000 - Rp1.999.999')).toBe(80);
    });

    test('"Rp2.000.000 - Rp2.999.999" returns 60', () => {
      expect(ctx.getIncomeScore('Rp2.000.000 - Rp2.999.999')).toBe(60);
    });

    test('"Rp3.000.000 - Rp4.999.999" returns 40', () => {
      expect(ctx.getIncomeScore('Rp3.000.000 - Rp4.999.999')).toBe(40);
    });

    test('"Rp5.000.000 - Rp9.999.999" returns 20', () => {
      expect(ctx.getIncomeScore('Rp5.000.000 - Rp9.999.999')).toBe(20);
    });

    test('"Rp10.000.000 - Rp20.000.000" returns 10', () => {
      expect(ctx.getIncomeScore('Rp10.000.000 - Rp20.000.000')).toBe(10);
    });

    test('"Rp20.000.000 - Rp50.000.000" returns 10', () => {
      expect(ctx.getIncomeScore('Rp20.000.000 - Rp50.000.000')).toBe(10);
    });

    test('unrecognized income string returns 50 (default)', () => {
      expect(ctx.getIncomeScore('Penghasilan Tidak Diketahui')).toBe(50);
    });
  });

  // =====================================================
  // calculateIncomeScore
  // =====================================================
  describe('calculateIncomeScore', () => {
    test('no income data → returns 100 (asumsi tidak berpenghasilan)', () => {
      expect(ctx.calculateIncomeScore('', '', '')).toBe(100);
    });

    test('all null → returns 100', () => {
      expect(ctx.calculateIncomeScore(null, null, null)).toBe(100);
    });

    test('single parent income "Kurang dari Rp1.000.000" → 100', () => {
      expect(ctx.calculateIncomeScore('Kurang dari Rp1.000.000', '', '')).toBe(100);
    });

    test('two incomes → average score', () => {
      // Ayah: Rp1.000.000-Rp1.999.999 → 80, Ibu: Rp2.000.000-Rp2.999.999 → 60
      const result = ctx.calculateIncomeScore(
        'Rp1.000.000 - Rp1.999.999',
        'Rp2.000.000 - Rp2.999.999',
        ''
      );
      expect(result).toBe(70); // (80+60)/2
    });

    test('three incomes → average of three scores', () => {
      // 80 + 60 + 40 = 180 / 3 = 60
      const result = ctx.calculateIncomeScore(
        'Rp1.000.000 - Rp1.999.999',
        'Rp2.000.000 - Rp2.999.999',
        'Rp3.000.000 - Rp4.999.999'
      );
      expect(result).toBe(60);
    });

    test('"-" values are treated as empty (not valid income)', () => {
      expect(ctx.calculateIncomeScore('-', '-', '-')).toBe(100);
    });
  });

  // =====================================================
  // calculateFamilyStatusScore
  // =====================================================
  describe('calculateFamilyStatusScore', () => {
    test('empty string → 40 (default lengkap)', () => {
      expect(ctx.calculateFamilyStatusScore('')).toBe(40);
    });

    test('null → 40', () => {
      expect(ctx.calculateFamilyStatusScore(null)).toBe(40);
    });

    test('"-" → 40', () => {
      expect(ctx.calculateFamilyStatusScore('-')).toBe(40);
    });

    test('"Lengkap" → 40', () => {
      expect(ctx.calculateFamilyStatusScore('Lengkap')).toBe(40);
    });

    test('"Yatim" → 80', () => {
      expect(ctx.calculateFamilyStatusScore('Yatim')).toBe(80);
    });

    test('"Piatu" → 80', () => {
      expect(ctx.calculateFamilyStatusScore('Piatu')).toBe(80);
    });

    test('"Yatim Piatu" → 100', () => {
      expect(ctx.calculateFamilyStatusScore('Yatim Piatu')).toBe(100);
    });

    test('unknown status → 40 (default)', () => {
      expect(ctx.calculateFamilyStatusScore('Cerai')).toBe(40);
    });
  });

  // =====================================================
  // calculateDependentsScore
  // =====================================================
  describe('calculateDependentsScore', () => {
    test('empty string → 20 (anak tunggal default)', () => {
      expect(ctx.calculateDependentsScore('')).toBe(20);
    });

    test('null → 20', () => {
      expect(ctx.calculateDependentsScore(null)).toBe(20);
    });

    test('"-" → 20', () => {
      expect(ctx.calculateDependentsScore('-')).toBe(20);
    });

    test('NaN string → 20', () => {
      expect(ctx.calculateDependentsScore('banyak')).toBe(20);
    });

    test('0 saudara → 20 (anak tunggal)', () => {
      expect(ctx.calculateDependentsScore('0')).toBe(20);
    });

    test('0 as number → 20', () => {
      expect(ctx.calculateDependentsScore(0)).toBe(20);
    });

    test('1 saudara → 40', () => {
      expect(ctx.calculateDependentsScore('1')).toBe(40);
    });

    test('1 as number → 40', () => {
      expect(ctx.calculateDependentsScore(1)).toBe(40);
    });

    test('2 saudara → 60', () => {
      expect(ctx.calculateDependentsScore('2')).toBe(60);
    });

    test('3 saudara → 80', () => {
      expect(ctx.calculateDependentsScore('3')).toBe(80);
    });

    test('4 saudara → 100', () => {
      expect(ctx.calculateDependentsScore('4')).toBe(100);
    });

    test('5+ saudara → 100', () => {
      expect(ctx.calculateDependentsScore('7')).toBe(100);
    });
  });

  // =====================================================
  // calculateScholarshipScore
  // =====================================================
  describe('calculateScholarshipScore', () => {
    test('no scholarship data → 100 (belum pernah)', () => {
      expect(ctx.calculateScholarshipScore('', '', '')).toBe(100);
    });

    test('all null → 100', () => {
      expect(ctx.calculateScholarshipScore(null, null, null)).toBe(100);
    });

    test('all "-" → 100', () => {
      expect(ctx.calculateScholarshipScore('-', '-', '-')).toBe(100);
    });

    test('has beasiswa1 → 20 (sudah pernah)', () => {
      expect(ctx.calculateScholarshipScore('KIP', '', '')).toBe(20);
    });

    test('has beasiswa2 only → 20', () => {
      expect(ctx.calculateScholarshipScore('', 'PIP', '')).toBe(20);
    });

    test('has beasiswa3 only → 20', () => {
      expect(ctx.calculateScholarshipScore('', '', 'BSM')).toBe(20);
    });

    test('multiple scholarships → 20', () => {
      expect(ctx.calculateScholarshipScore('KIP', 'PIP', 'BSM')).toBe(20);
    });
  });
});
