import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyGameplayViewport,
  resolveGameplayViewport,
} from '../src/config/responsiveGameplay.js';

test('desktop keeps the complete 1280-wide world visible', () => {
  const viewport = resolveGameplayViewport({ containerWidth: 1440, containerHeight: 810 });

  assert.equal(viewport.left, 0);
  assert.equal(viewport.right, 1280);
  assert.equal(viewport.isCropped, false);
});

test('portrait mobile crops the world equally from both horizontal sides', () => {
  const viewport = resolveGameplayViewport({ containerWidth: 390, containerHeight: 590 });

  assert.ok(viewport.width < 1280);
  assert.ok(viewport.width >= 440);
  assert.equal(viewport.left, (1280 - viewport.width) / 2);
  assert.equal(viewport.right, 1280 - viewport.left);
  assert.ok(viewport.playerX > viewport.left);
  assert.ok(viewport.playerX < viewport.centerX);
});

test('gameplay boundaries and spawning follow the cropped safe viewport', () => {
  const viewport = resolveGameplayViewport({ containerWidth: 390, containerHeight: 590 });
  const settings = applyGameplayViewport(
    {
      spawnX: { min: 1360, max: 1500 },
      leftDamageX: 0,
      leftDespawnX: -180,
      wordSpeed: { min: 52, max: 68 },
    },
    viewport,
  );

  assert.equal(settings.leftDamageX, viewport.dangerBoundaryX);
  assert.equal(settings.leftDespawnX, viewport.left - 180);
  assert.equal(settings.spawnX.min, viewport.right + 80);
  assert.equal(settings.spawnX.max, viewport.right + 220);
  assert.ok(settings.wordSpeed.min < 52);
  assert.ok(settings.wordSpeed.max < 68);
});
