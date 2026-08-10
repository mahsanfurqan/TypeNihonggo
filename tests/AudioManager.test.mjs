import assert from 'node:assert/strict';
import test from 'node:test';
import { AudioManager } from '../src/managers/AudioManager.js';

test('audio manager supports mute toggling without requiring browser audio APIs', () => {
  const audioManager = new AudioManager();

  audioManager.setMuted(false);
  assert.equal(audioManager.isMuted, false);
  assert.equal(audioManager.toggleMuted(), true);
  assert.equal(audioManager.isMuted, true);

  assert.doesNotThrow(() => audioManager.play('correctKey'));

  audioManager.setMuted(false);
  assert.equal(audioManager.isMuted, false);
  assert.doesNotThrow(() => audioManager.play('unknownSound'));

  audioManager.destroy();
});

test('audio manager exposes an unlock hook for browser user gestures', () => {
  const audioManager = new AudioManager();

  assert.equal(audioManager.unlock(), false);
  audioManager.destroy();
});
