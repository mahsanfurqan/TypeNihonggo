import assert from 'node:assert/strict';
import test from 'node:test';
import { TESTING_MODE_CONFIG } from '../src/config/testingModeConfig.js';

test('testing mode is an explicit temporary opt-in', () => {
  assert.equal(TESTING_MODE_CONFIG.initialEnabled, false);
  assert.equal(TESTING_MODE_CONFIG.labels.enabled, 'TESTING MODE ON');
  assert.equal(TESTING_MODE_CONFIG.labels.disabled, 'TESTING MODE OFF');
});
