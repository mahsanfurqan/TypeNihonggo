import { GAME_VIEW, GAMEPLAY } from './gameSettings.js';

function freezeRange(range) {
  return Object.freeze({ ...range });
}

function interpolate(start, end, progress) {
  return start + (end - start) * progress;
}

function interpolateInteger(start, end, progress) {
  return Math.round(interpolate(start, end, progress));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getStageProgress(level, levelRange) {
  if (levelRange.max === levelRange.min) {
    return 0;
  }

  return clamp(
    (level - levelRange.min) / (levelRange.max - levelRange.min),
    0,
    1,
  );
}

const STAGE_BALANCE = Object.freeze({
  'general-easy-hiragana': Object.freeze({
    spawnIntervalMs: freezeRange({ start: 3600, end: 2850 }),
    wordSpeed: Object.freeze({
      min: freezeRange({ start: 52, end: 64 }),
      max: freezeRange({ start: 68, end: 82 }),
    }),
    maxActiveWords: freezeRange({ start: 2, end: 2 }),
  }),
  'general-easy-katakana': Object.freeze({
    spawnIntervalMs: freezeRange({ start: 3350, end: 2650 }),
    wordSpeed: Object.freeze({
      min: freezeRange({ start: 58, end: 72 }),
      max: freezeRange({ start: 76, end: 92 }),
    }),
    maxActiveWords: freezeRange({ start: 2, end: 3 }),
  }),
  'general-hard-kana': Object.freeze({
    spawnIntervalMs: freezeRange({ start: 3000, end: 2200 }),
    wordSpeed: Object.freeze({
      min: freezeRange({ start: 70, end: 92 }),
      max: freezeRange({ start: 92, end: 118 }),
    }),
    maxActiveWords: freezeRange({ start: 3, end: 3 }),
  }),
  'general-easy-kanji': Object.freeze({
    spawnIntervalMs: freezeRange({ start: 3200, end: 2650 }),
    wordSpeed: Object.freeze({
      min: freezeRange({ start: 64, end: 78 }),
      max: freezeRange({ start: 84, end: 100 }),
    }),
    maxActiveWords: freezeRange({ start: 2, end: 3 }),
  }),
  'general-easy-kana-kanji': Object.freeze({
    spawnIntervalMs: freezeRange({ start: 2850, end: 2050 }),
    wordSpeed: Object.freeze({
      min: freezeRange({ start: 78, end: 100 }),
      max: freezeRange({ start: 100, end: 128 }),
    }),
    maxActiveWords: freezeRange({ start: 3, end: 4 }),
  }),
  'general-hard-kana-kanji': Object.freeze({
    spawnIntervalMs: freezeRange({ start: 2550, end: 1750 }),
    wordSpeed: Object.freeze({
      min: freezeRange({ start: 88, end: 112 }),
      max: freezeRange({ start: 112, end: 142 }),
    }),
    maxActiveWords: freezeRange({ start: 3, end: 4 }),
  }),
});

export function resolveGameplayBalance({ level, stage }) {
  if (!stage?.id || !stage?.levelRange) {
    throw new TypeError('Gameplay balance requires a progression stage');
  }

  const stageBalance = STAGE_BALANCE[stage.id];

  if (!stageBalance) {
    throw new Error(`Missing gameplay balance for stage: ${stage.id}`);
  }

  const progress = getStageProgress(level, stage.levelRange);

  return Object.freeze({
    ...GAMEPLAY,
    spawnIntervalMs: interpolateInteger(
      stageBalance.spawnIntervalMs.start,
      stageBalance.spawnIntervalMs.end,
      progress,
    ),
    maxActiveWords: interpolateInteger(
      stageBalance.maxActiveWords.start,
      stageBalance.maxActiveWords.end,
      progress,
    ),
    wordSpeed: Object.freeze({
      min: interpolateInteger(
        stageBalance.wordSpeed.min.start,
        stageBalance.wordSpeed.min.end,
        progress,
      ),
      max: interpolateInteger(
        stageBalance.wordSpeed.max.start,
        stageBalance.wordSpeed.max.end,
        progress,
      ),
    }),
  });
}

export function estimateWordTravelSeconds(settings) {
  const spawnX = (settings.spawnX.min + settings.spawnX.max) / 2;
  const averageSpeed = (settings.wordSpeed.min + settings.wordSpeed.max) / 2;

  return (spawnX - settings.leftDamageX + GAME_VIEW.width * 0.02) / averageSpeed;
}

export { STAGE_BALANCE };
