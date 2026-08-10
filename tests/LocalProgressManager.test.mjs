import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LOCAL_PROGRESS_STORAGE_KEY,
  LocalProgressManager,
} from '../src/managers/LocalProgressManager.js';

function createStorage(seed = {}) {
  const values = new Map(Object.entries(seed));

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    snapshot: () => Object.fromEntries(values.entries()),
  };
}

function createCourseConfig() {
  return {
    courseId: 'general',
    levelRange: { min: 1, max: 30 },
    stages: [
      { id: 'stage-1', title: 'Stage 1', levelRange: { min: 1, max: 10 } },
      { id: 'stage-2', title: 'Stage 2', levelRange: { min: 11, max: 20 } },
      { id: 'stage-3', title: 'Stage 3', levelRange: { min: 21, max: 30 } },
    ],
  };
}

test('local progress starts with Indonesian locale and first stage unlocked', () => {
  const manager = new LocalProgressManager({ storage: createStorage() });
  const course = createCourseConfig();

  assert.equal(manager.getLocale(), 'id');
  assert.equal(manager.getInitialStage(course).id, 'stage-1');
  assert.equal(manager.isStageUnlocked(course, course.stages[0]), true);
  assert.equal(manager.isStageUnlocked(course, course.stages[1]), false);
});

test('local progress saves locale and last selected unlocked stage', () => {
  const storage = createStorage();
  const manager = new LocalProgressManager({ storage });
  const course = createCourseConfig();

  manager.setLocale('en');
  manager.setLastStage(course, course.stages[0]);

  const reloaded = new LocalProgressManager({ storage });

  assert.equal(reloaded.getLocale(), 'en');
  assert.equal(reloaded.getInitialStage(course).id, 'stage-1');
});

test('completing a stage records completion and unlocks the next stage', () => {
  const storage = createStorage();
  const manager = new LocalProgressManager({ storage });
  const course = createCourseConfig();

  const result = manager.completeStage(course, course.stages[0]);

  assert.equal(result.highestCompletedLevel, 10);
  assert.equal(result.highestUnlockedLevel, 11);
  assert.equal(manager.isStageUnlocked(course, course.stages[1]), true);
  assert.equal(manager.isStageUnlocked(course, course.stages[2]), false);
});

test('stored locked last stage falls back to highest unlocked stage', () => {
  const storage = createStorage({
    [LOCAL_PROGRESS_STORAGE_KEY]: JSON.stringify({
      schemaVersion: 1,
      locale: 'en',
      lastStageByCourse: { general: 'stage-3' },
      highestUnlockedLevelByCourse: { general: 11 },
      highestCompletedLevelByCourse: { general: 10 },
    }),
  });
  const manager = new LocalProgressManager({ storage });
  const course = createCourseConfig();

  assert.equal(manager.getInitialStage(course).id, 'stage-2');
});

test('reset clears saved progress', () => {
  const storage = createStorage();
  const manager = new LocalProgressManager({ storage });
  const course = createCourseConfig();

  manager.setLocale('en');
  manager.completeStage(course, course.stages[0]);
  manager.reset();

  assert.equal(manager.getLocale(), 'id');
  assert.deepEqual(storage.snapshot(), {});
});
