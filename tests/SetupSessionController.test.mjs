import assert from 'node:assert/strict';
import test from 'node:test';
import { LocalProgressManager } from '../src/managers/LocalProgressManager.js';
import { SetupSessionController } from '../src/managers/SetupSessionController.js';

function createStorage(seed = {}) {
  const values = new Map(Object.entries(seed));

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

function createCourseConfig() {
  return {
    courseId: 'general',
    levelRange: { min: 1, max: 30 },
    stages: [
      { id: 'stage-1', title: 'Easy Hiragana', levelRange: { min: 1, max: 10 } },
      { id: 'stage-2', title: 'Easy Katakana', levelRange: { min: 11, max: 20 } },
      { id: 'stage-3', title: 'Hard Kana', levelRange: { min: 21, max: 30 } },
    ],
  };
}

function createController() {
  return new SetupSessionController({
    courseConfig: createCourseConfig(),
    localProgressManager: new LocalProgressManager({ storage: createStorage() }),
  });
}

test('setup session starts from saved initial stage and locale', () => {
  const controller = createController();

  assert.equal(controller.sessionConfig.course, 'general');
  assert.equal(controller.sessionConfig.currentLevel, 1);
  assert.equal(controller.sessionConfig.locale, 'id');
});

test('setup session only enables unlocked stages unless testing mode is on', () => {
  const controller = createController();

  assert.deepEqual(
    controller.createStageOptions().map(({ isEnabled }) => isEnabled),
    [true, false, false],
  );

  controller.toggleTestingMode();

  assert.deepEqual(
    controller.createStageOptions().map(({ isEnabled }) => isEnabled),
    [true, true, true],
  );
});

test('setup session resets a testing-only stage when testing mode is disabled', () => {
  const controller = createController();
  const stageThree = createCourseConfig().stages[2];

  controller.toggleTestingMode();
  assert.equal(controller.selectStage(stageThree), true);
  assert.equal(controller.sessionConfig.currentLevel, 21);

  controller.toggleTestingMode();

  assert.equal(controller.sessionConfig.currentLevel, 1);
});
