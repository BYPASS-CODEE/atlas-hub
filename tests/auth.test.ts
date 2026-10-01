import { test, describe } from 'node:test';
import assert from 'node:assert';
import { hashPassword, comparePassword, signToken, verifyToken } from '../server/src/utils/auth.js';

describe('Authentication & Security Tests', () => {
  test('should securely hash password and verify match', async () => {
    const rawPassword = 'SecurePassword@2026';
    const hash = await hashPassword(rawPassword);

    assert.notStrictEqual(hash, rawPassword);
    assert.strictEqual(hash.startsWith('$2'), true);

    const isMatch = await comparePassword(rawPassword, hash);
    assert.strictEqual(isMatch, true);

    const isBadMatch = await comparePassword('WrongPassword', hash);
    assert.strictEqual(isBadMatch, false);
  });

  test('should sign and verify valid JWT token', () => {
    const payload = {
      userId: 'user-uuid-1234',
      email: 'lead@atlashub.io',
      role: 'ADMIN',
      organizationId: 'org-uuid-5678',
    };

    const token = signToken(payload);
    assert.ok(token);
    assert.strictEqual(typeof token, 'string');

    const verified = verifyToken(token);
    assert.ok(verified);
    assert.strictEqual(verified.userId, payload.userId);
    assert.strictEqual(verified.email, payload.email);
    assert.strictEqual(verified.role, payload.role);
    assert.strictEqual(verified.organizationId, payload.organizationId);
  });

  test('should reject invalid or tampered token', () => {
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature';
    const verified = verifyToken(invalidToken);
    assert.strictEqual(verified, null);
  });
});
