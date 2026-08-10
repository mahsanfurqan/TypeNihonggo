import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  estimateWordTravelSeconds,
  resolveGameplayBalance,
} from '../src/config/gameplayBalance.js';
import { GAME_VIEW, PLAYER_POSITION } from '../src/config/gameSettings.js';
import { CourseProgression } from '../src/data/vocabulary/courses/CourseProgression.js';

const generalCourseConfig = JSON.parse(
  readFileSync(
    new URL('../src/data/vocabulary/courses/general/course.json', import.meta.url),
    'utf8',
  ),
);

const progression = new CourseProgression(generalCourseConfig);

function resolveLevel(level) {
  return resolveGameplayBalance({
    level,
    stage: progression.getStage(level),
  });
}

test('level 1 starts calm and readable for beginners', () => {
  const settings = resolveLevel(1);

  assert.equal(settings.spawnIntervalMs, 3600);
  assert.deepEqual(settings.wordSpeed, { min: 52, max: 68 });
  assert.equal(settings.maxActiveWords, 2);
  assert.ok(estimateWordTravelSeconds(settings) > 20);
});

test('gameplay pressure increases across the full General course', () => {
  const level1 = resolveLevel(1);
  const level50 = resolveLevel(50);
  const level100 = resolveLevel(100);
  const level150 = resolveLevel(150);

  assert.ok(level50.spawnIntervalMs < level1.spawnIntervalMs);
  assert.ok(level100.spawnIntervalMs < level50.spawnIntervalMs);
  assert.ok(level150.spawnIntervalMs < level100.spawnIntervalMs);
  assert.ok(level150.wordSpeed.max > level1.wordSpeed.max);
  assert.ok(level150.maxActiveWords > level1.maxActiveWords);
});

test('late hard kana kanji levels stay fair for longer romaji words', () => {
  const level150 = resolveLevel(150);

  assert.deepEqual(level150.wordSpeed, { min: 112, max: 142 });
  assert.equal(level150.maxActiveWords, 4);
  assert.ok(estimateWordTravelSeconds(level150) > 11);
});

test('every General stage resolves a gameplay balance profile', () => {
  generalCourseConfig.stages.forEach((stage) => {
    const start = resolveGameplayBalance({ level: stage.levelRange.min, stage });
    const end = resolveGameplayBalance({ level: stage.levelRange.max, stage });

    assert.ok(start.spawnIntervalMs >= end.spawnIntervalMs, stage.id);
    assert.ok(start.wordSpeed.min <= end.wordSpeed.min, stage.id);
    assert.ok(start.wordSpeed.max <= end.wordSpeed.max, stage.id);
    assert.ok(start.maxActiveWords <= end.maxActiveWords, stage.id);
  });
});

test('word spawn lanes stay clear of HUD and player breathing room', () => {
  const settings = resolveLevel(1);
  const approximateCardHalfHeight = 42;
  const hudBottomY = 170;
  const playerBreathingRoomTopY = PLAYER_POSITION.y - 64;

  assert.ok(settings.spawnY.min - approximateCardHalfHeight > hudBottomY);
  assert.ok(settings.spawnY.max + approximateCardHalfHeight < playerBreathingRoomTopY);
  assert.ok(settings.spawnX.min > GAME_VIEW.width);
});
