/**
 * Unit Tests: roleMeets(role, required)
 *
 * Menguji fungsi RBAC yang membandingkan level role pengguna
 * dengan level minimum yang dibutuhkan.
 * Hirarki: viewer(1) < staff(2) < admin(3)
 */
const { loadCode } = require('./helpers/loadCode');

describe('roleMeets', () => {
  let ctx;

  beforeAll(() => {
    ctx = loadCode();
  });

  // --- Kasus: role memenuhi syarat ---
  test('viewer meets viewer requirement', () => {
    expect(ctx.roleMeets('viewer', 'viewer')).toBe(true);
  });

  test('staff meets viewer requirement', () => {
    expect(ctx.roleMeets('staff', 'viewer')).toBe(true);
  });

  test('staff meets staff requirement', () => {
    expect(ctx.roleMeets('staff', 'staff')).toBe(true);
  });

  test('admin meets viewer requirement', () => {
    expect(ctx.roleMeets('admin', 'viewer')).toBe(true);
  });

  test('admin meets staff requirement', () => {
    expect(ctx.roleMeets('admin', 'staff')).toBe(true);
  });

  test('admin meets admin requirement', () => {
    expect(ctx.roleMeets('admin', 'admin')).toBe(true);
  });

  // --- Kasus: role TIDAK memenuhi syarat ---
  test('viewer does NOT meet staff requirement', () => {
    expect(ctx.roleMeets('viewer', 'staff')).toBe(false);
  });

  test('viewer does NOT meet admin requirement', () => {
    expect(ctx.roleMeets('viewer', 'admin')).toBe(false);
  });

  test('staff does NOT meet admin requirement', () => {
    expect(ctx.roleMeets('staff', 'admin')).toBe(false);
  });

  // --- Edge cases ---
  test('unknown role defaults to rank 1 (viewer)', () => {
    expect(ctx.roleMeets('unknown_role', 'viewer')).toBe(true);
    expect(ctx.roleMeets('unknown_role', 'staff')).toBe(false);
  });

  test('unknown required role defaults to rank 1', () => {
    expect(ctx.roleMeets('viewer', 'unknown_required')).toBe(true);
  });

  test('both unknown roles default to rank 1 — should be equal', () => {
    expect(ctx.roleMeets('abc', 'xyz')).toBe(true);
  });
});
