import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { GameSessionConfig } from '../src/config/GameSessionConfig.js';
import { CourseProgression } from '../src/data/vocabulary/courses/CourseProgression.js';

const generalCourseConfig = JSON.parse(
  readFileSync(
    new URL('../src/data/vocabulary/courses/general/course.json', import.meta.url),
    'utf8',
  ),
);

function createRestartConfig(currentLevel) {
  const progression = new CourseProgression(generalCourseConfig);
  const sessionConfig = new GameSessionConfig({
    course: 'general',
    currentLevel,
    locale: 'id',
  });

  return new GameSessionConfig({
    ...sessionConfig.toJSON(),
    currentLevel: progression.getStageStartLevel(sessionConfig.currentLevel),
  });
}

test('game over retry stage restarts from the active stage first level', () => {
  assert.equal(createRestartConfig(1).currentLevel, 1);
  assert.equal(createRestartConfig(7).currentLevel, 1);
  assert.equal(createRestartConfig(48).currentLevel, 21);
  assert.equal(createRestartConfig(97).currentLevel, 61);
  assert.equal(createRestartConfig(132).currentLevel, 101);
});

test('game over retry stage preserves course and locale selections', () => {
  const restartConfig = createRestartConfig(132);

  assert.deepEqual(restartConfig.toJSON(), {
    course: 'general',
    currentLevel: 101,
    locale: 'id',
  });
});
