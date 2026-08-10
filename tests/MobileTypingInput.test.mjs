import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeRomajiCharacter } from '../src/utils/romajiInputEvents.js';

test('mobile typing input normalization accepts single alphabet characters only', () => {
  assert.equal(normalizeRomajiCharacter('N'), 'n');
  assert.equal(normalizeRomajiCharacter('a'), 'a');
  assert.equal(normalizeRomajiCharacter('Enter'), null);
  assert.equal(normalizeRomajiCharacter('ね'), null);
  assert.equal(normalizeRomajiCharacter(''), null);
});
