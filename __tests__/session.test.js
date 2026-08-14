/**
 * Unit Tests: Session Management
 *
 * Menguji fungsi createSession, validateSession, extendSession, destroySession.
 * Semua fungsi ini bergantung pada PropertiesService yang di-mock.
 */
const { loadCode } = require('./helpers/loadCode');
const gasMocks = require('../__mocks__/gas');

describe('Session Management', () => {
  let ctx;

  beforeEach(() => {
    // Reload fresh context for each test to avoid state leakage
    ctx = loadCode();
  });

  // =====================================================
  // createSession
  // =====================================================
  describe('createSession', () => {
    test('creates session and returns a session ID string', () => {
      const sessionId = ctx.createSession('admin_user');
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });

    test('session data is stored in PropertiesService', () => {
      const sessionId = ctx.createSession('test_user');

      // Verify the session was stored
      const stored = gasMocks.PropertiesService.getScriptProperties().getProperty(sessionId);
      expect(stored).toBeTruthy();

      const sessionData = JSON.parse(stored);
      expect(sessionData.username).toBe('test_user');
      expect(sessionData.created).toBeTruthy();
      expect(sessionData.expires).toBeTruthy();
    });

    test('session expiry is in the future', () => {
      const sessionId = ctx.createSession('user1');
      const stored = gasMocks.PropertiesService.getScriptProperties().getProperty(sessionId);
      const sessionData = JSON.parse(stored);

      const expiryTime = new Date(sessionData.expires);
      const now = new Date();

      expect(expiryTime.getTime()).toBeGreaterThan(now.getTime());
    });

    test('different calls generate unique session IDs', () => {
      const id1 = ctx.createSession('user1');
      const id2 = ctx.createSession('user2');
      expect(id1).not.toBe(id2);
    });
  });

  // =====================================================
  // validateSession
  // =====================================================
  describe('validateSession', () => {
    test('null sessionId returns null', () => {
      expect(ctx.validateSession(null)).toBeNull();
    });

    test('undefined sessionId returns null', () => {
      expect(ctx.validateSession(undefined)).toBeNull();
    });

    test('empty string sessionId returns null', () => {
      // Empty string is falsy
      expect(ctx.validateSession('')).toBeNull();
    });

    test('non-existent sessionId returns null', () => {
      expect(ctx.validateSession('fake-session-id')).toBeNull();
    });

    test('valid session returns username', () => {
      const sessionId = ctx.createSession('admin');
      const username = ctx.validateSession(sessionId);
      expect(username).toBe('admin');
    });

    test('expired session returns null', () => {
      // Manually store an expired session
      const sessionId = 'expired-session-test';
      const pastDate = new Date(Date.now() - 10000); // 10 seconds ago
      const sessionData = {
        username: 'old_user',
        created: new Date(Date.now() - 100000).toString(),
        expires: pastDate.toString(),
      };
      gasMocks.PropertiesService.getScriptProperties().setProperty(
        sessionId,
        JSON.stringify(sessionData)
      );

      const result = ctx.validateSession(sessionId);
      expect(result).toBeNull();
    });

    test('expired session is deleted from properties', () => {
      const sessionId = 'expired-cleanup-test';
      const pastDate = new Date(Date.now() - 10000);
      const sessionData = {
        username: 'cleanup_user',
        created: new Date(Date.now() - 100000).toString(),
        expires: pastDate.toString(),
      };
      gasMocks.PropertiesService.getScriptProperties().setProperty(
        sessionId,
        JSON.stringify(sessionData)
      );

      ctx.validateSession(sessionId);

      // Session should be cleaned up
      const remaining = gasMocks.PropertiesService.getScriptProperties().getProperty(sessionId);
      expect(remaining).toBeNull();
    });
  });

  // =====================================================
  // destroySession
  // =====================================================
  describe('destroySession', () => {
    test('null sessionId does not throw', () => {
      expect(() => ctx.destroySession(null)).not.toThrow();
    });

    test('destroys existing session', () => {
      const sessionId = ctx.createSession('destroy_me');

      // Verify it exists first
      const before = gasMocks.PropertiesService.getScriptProperties().getProperty(sessionId);
      expect(before).toBeTruthy();

      ctx.destroySession(sessionId);

      // Should be gone
      const after = gasMocks.PropertiesService.getScriptProperties().getProperty(sessionId);
      expect(after).toBeNull();
    });

    test('destroying non-existent session does not throw', () => {
      expect(() => ctx.destroySession('does-not-exist')).not.toThrow();
    });
  });

  // =====================================================
  // getCurrentUserUsername
  // =====================================================
  describe('getCurrentUserUsername', () => {
    test('with valid sessionId returns username', () => {
      const sessionId = ctx.createSession('current_user');
      const username = ctx.getCurrentUserUsername(sessionId);
      expect(username).toBe('current_user');
    });

    test('with null sessionId returns "Admin" (default)', () => {
      const username = ctx.getCurrentUserUsername(null);
      expect(username).toBe('Admin');
    });

    test('without sessionId (undefined) returns "Admin"', () => {
      const username = ctx.getCurrentUserUsername(undefined);
      expect(username).toBe('Admin');
    });

    test('with invalid sessionId returns "Admin"', () => {
      const username = ctx.getCurrentUserUsername('invalid-session');
      expect(username).toBe('Admin');
    });
  });
});
