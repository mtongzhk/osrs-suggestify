import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidRsn, normalizeRsn } from './rsn.js';

describe('isValidRsn', () => {
  it('accepts typical display names', () => {
    for (const name of ['Zezima', 'Iron man', 'A', 'abc_def', 'x-y-z', 'Player 2007']) {
      assert.equal(isValidRsn(name), true, name);
    }
  });

  it('rejects names over 12 characters', () => {
    assert.equal(isValidRsn('a'.repeat(13)), false);
    assert.equal(isValidRsn('a'.repeat(12)), true);
  });

  it('rejects empty, non-string, and illegal characters', () => {
    assert.equal(isValidRsn(''), false);
    assert.equal(isValidRsn('   '), false);
    assert.equal(isValidRsn(null), false);
    assert.equal(isValidRsn(42), false);
    assert.equal(isValidRsn('bad@name'), false);
    assert.equal(isValidRsn("o'brien"), false);
  });

  it('trims surrounding whitespace before validating', () => {
    assert.equal(isValidRsn(' Zezima '), true);
  });

  it('rejects interior leading/trailing separators', () => {
    assert.equal(isValidRsn('_name'), false);
    assert.equal(isValidRsn('name-'), false);
    assert.equal(isValidRsn('-name-'), false);
  });
});

describe('normalizeRsn', () => {
  it('trims and collapses whitespace', () => {
    assert.equal(normalizeRsn('  Iron   man  '), 'Iron man');
    assert.equal(normalizeRsn('Zezima'), 'Zezima');
  });

  it('returns null for invalid input', () => {
    assert.equal(normalizeRsn('bad@name'), null);
    assert.equal(normalizeRsn(''), null);
    assert.equal(normalizeRsn(null), null);
  });
});
