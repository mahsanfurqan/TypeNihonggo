import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BACKGROUND_LAYER_TYPES,
  BACKGROUND_MAPS,
  getBackgroundMapConfig,
  resolveBackgroundMapIdForLevel,
} from '../src/config/backgroundMaps.js';

test('resolves TypeNihongo background map by level range', () => {
  assert.equal(resolveBackgroundMapIdForLevel(1), 'm1_summer');
  assert.equal(resolveBackgroundMapIdForLevel(20), 'm1_summer');
  assert.equal(resolveBackgroundMapIdForLevel(21), 'm2_taisho');
  assert.equal(resolveBackgroundMapIdForLevel(150), 'm2_taisho');
});

test('background maps use four ordered reusable layers', () => {
  Object.values(BACKGROUND_MAPS).forEach((mapConfig) => {
    assert.equal(mapConfig.layers.length, 4);
    assert.deepEqual(
      mapConfig.layers.map((layer) => layer.type),
      [
        BACKGROUND_LAYER_TYPES.STATIC_FILL,
        BACKGROUND_LAYER_TYPES.SCROLLING,
        BACKGROUND_LAYER_TYPES.SCROLLING,
        BACKGROUND_LAYER_TYPES.STATIC_BOTTOM,
      ],
    );

    const textureKeys = new Set(mapConfig.layers.map((layer) => layer.textureKey));
    assert.equal(textureKeys.size, mapConfig.layers.length);
  });
});

test('rejects invalid map IDs and levels', () => {
  assert.throws(() => getBackgroundMapConfig('missing-map'), /Unknown background map/);
  assert.throws(() => resolveBackgroundMapIdForLevel(0), /positive integer/);
});
