import assert from 'node:assert/strict';
import test from 'node:test';

import { getUiLayout, getUiViewport } from '../src/ui/responsiveUi.js';

function createScene(viewport) {
  return {
    uiViewport: viewport,
    cameras: {
      main: {
        width: 1280,
        height: 720,
        centerX: 640,
        centerY: 360,
      },
    },
  };
}

test('responsive UI uses the scene safe viewport when available', () => {
  const viewport = { left: 420, right: 860, width: 440, height: 720, centerX: 640 };
  const scene = createScene(viewport);

  assert.equal(getUiViewport(scene), viewport);
});

test('compact panels fit inside the mobile safe area', () => {
  const scene = createScene({ left: 420, right: 860, width: 440, height: 720, centerX: 640 });
  const layout = getUiLayout(scene, { preferredWidth: 860, margin: 12 });

  assert.equal(layout.isCompact, true);
  assert.equal(layout.width, 416);
  assert.equal(layout.centerX, 640);
});

test('desktop panels retain their preferred width', () => {
  const scene = createScene({ left: 0, right: 1280, width: 1280, height: 720, centerX: 640 });
  const layout = getUiLayout(scene, { preferredWidth: 860, margin: 12 });

  assert.equal(layout.isCompact, false);
  assert.equal(layout.width, 860);
});
