import assert from 'node:assert/strict';
import test from 'node:test';
import { AUDIO_FEEDBACK } from '../src/config/audioFeedbackConfig.js';

const REQUIRED_SOUNDS = [
  'correctKey',
  'wrongKey',
  'wordCompleted',
  'playerDamage',
  'dangerHint',
  'levelComplete',
  'stageComplete',
  'gameOver',
];

function getSoundDurationMs(sound) {
  if (sound.type === 'arpeggio') {
    return sound.stepMs * sound.frequencies.length;
  }

  if (sound.type === 'warning-beeps') {
    return sound.beepDurationMs * sound.count + sound.gapMs * (sound.count - 1);
  }

  return sound.durationMs;
}

test('audio feedback defines every required gameplay sound', () => {
  REQUIRED_SOUNDS.forEach((soundKey) => {
    assert.ok(AUDIO_FEEDBACK.sounds[soundKey], soundKey);
  });
});

test('audio feedback stays short and soft for lightweight gameplay', () => {
  assert.ok(AUDIO_FEEDBACK.masterVolume <= 0.3);

  Object.entries(AUDIO_FEEDBACK.sounds).forEach(([soundKey, sound]) => {
    if (soundKey === 'dangerHint') {
      return;
    }

    assert.ok(sound.volume <= 0.22);
    assert.ok(getSoundDurationMs(sound) <= 360);
  });
});

test('danger hint uses a noticeable short warning pulse', () => {
  const dangerHint = AUDIO_FEEDBACK.sounds.dangerHint;

  assert.equal(dangerHint.type, 'warning-beeps');
  assert.equal(dangerHint.count, 3);
  assert.ok(dangerHint.frequency >= 700);
  assert.ok(dangerHint.volume >= 0.3);
  assert.ok(getSoundDurationMs(dangerHint) <= 800);
});
