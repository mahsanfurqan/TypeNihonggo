import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MOBILE_LIFECYCLE_EVENT,
  MobileLifecycleManager,
} from '../src/managers/MobileLifecycleManager.js';

class FakeEventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(eventName, listener) {
    this.listeners.set(eventName, listener);
  }

  removeEventListener(eventName) {
    this.listeners.delete(eventName);
  }

  emit(eventName, detail) {
    this.listeners.get(eventName)?.({ detail });
  }
}

function createGameStub({ running = true } = {}) {
  const calls = [];

  return {
    calls,
    loop: {
      running,
      sleep: () => calls.push('sleep'),
      wake: () => calls.push('wake'),
    },
    sound: {
      pauseAll: () => calls.push('pause-audio'),
      resumeAll: () => calls.push('resume-audio'),
    },
  };
}

test('mobile lifecycle suspends and resumes Phaser through native events', () => {
  const game = createGameStub();
  const eventTarget = new FakeEventTarget();
  const manager = new MobileLifecycleManager(game, eventTarget);

  eventTarget.emit(MOBILE_LIFECYCLE_EVENT, { state: 'background' });
  eventTarget.emit(MOBILE_LIFECYCLE_EVENT, { state: 'active' });

  assert.deepEqual(game.calls, ['pause-audio', 'sleep', 'resume-audio', 'wake']);
  manager.destroy();
  assert.equal(eventTarget.listeners.has(MOBILE_LIFECYCLE_EVENT), false);
});

test('mobile lifecycle does not wake a loop that was already stopped', () => {
  const game = createGameStub({ running: false });
  const eventTarget = new FakeEventTarget();

  new MobileLifecycleManager(game, eventTarget);
  eventTarget.emit(MOBILE_LIFECYCLE_EVENT, { state: 'background' });
  eventTarget.emit(MOBILE_LIFECYCLE_EVENT, { state: 'active' });

  assert.deepEqual(game.calls, ['pause-audio', 'sleep', 'resume-audio']);
});
