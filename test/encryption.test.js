import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptPassword, comparePassword } from '../utils/helpers/encryption.js';

test('encryptPassword rejects empty passwords', () => {
  assert.throws(() => encryptPassword(''), /Invalid Password/);
  assert.throws(() => encryptPassword(null), /Invalid Password/);
});

test('comparePassword returns false for missing hash', () => {
  assert.equal(comparePassword('secret', null), false);
  assert.equal(comparePassword('secret', undefined), false);
});
