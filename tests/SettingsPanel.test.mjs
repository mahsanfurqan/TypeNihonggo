import assert from 'node:assert/strict';
import test from 'node:test';
import { SETTINGS_PANEL_LABELS } from '../src/ui/settingsPanelContent.js';

test('settings panel exposes MVP controls', () => {
  assert.equal(SETTINGS_PANEL_LABELS.title, 'SETTINGS');
  assert.equal(SETTINGS_PANEL_LABELS.soundOn, 'SOUND ON');
  assert.equal(SETTINGS_PANEL_LABELS.soundOff, 'SOUND OFF');
  assert.equal(SETTINGS_PANEL_LABELS.resetProgress, 'RESET PROGRESS');
  assert.equal(SETTINGS_PANEL_LABELS.close, 'CLOSE');
});

