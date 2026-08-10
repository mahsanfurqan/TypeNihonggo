import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  CourseProgression,
  CourseProgressionValidationError,
} from '../src/data/vocabulary/courses/CourseProgression.js';

const generalCourseConfig = JSON.parse(
  readFileSync(
    new URL('../src/data/vocabulary/courses/general/course.json', import.meta.url),
    'utf8',
  ),
);
const generalManifestFiles = [
  'levels-001-010.json',
  'levels-011-020.json',
  'levels-021-050.json',
  'levels-051-060.json',
  'levels-061-100.json',
  'levels-101-150.json',
];
const generalManifests = generalManifestFiles.map((fileName) =>
  JSON.parse(
    readFileSync(
      new URL(`../src/data/vocabulary/courses/general/${fileName}`, import.meta.url),
      'utf8',
    ),
  ),
);

function createConfig() {
  return {
    schemaVersion: 1,
    courseId: 'general',
    levelRange: { min: 1, max: 20 },
    stages: [
      {
        id: 'hiragana',
        levelRange: { min: 1, max: 10 },
        difficulty: 'easy',
        writingSystems: ['hiragana'],
        composition: 'single-script',
      },
      {
        id: 'katakana',
        levelRange: { min: 11, max: 20 },
        difficulty: 'easy',
        writingSystems: ['katakana'],
        composition: 'single-script',
      },
    ],
  };
}

test('resolves progression stages at their boundaries', () => {
  const progression = new CourseProgression(createConfig());

  assert.equal(progression.getStage(1).id, 'hiragana');
  assert.equal(progression.getStage(10).id, 'hiragana');
  assert.equal(progression.getStage(11).id, 'katakana');
  assert.equal(progression.getStage(20).id, 'katakana');
});

test('resolves every General stage boundary and next stage', () => {
  const progression = new CourseProgression(generalCourseConfig);
  const expectedRanges = [
    [1, 10],
    [11, 20],
    [21, 50],
    [51, 60],
    [61, 100],
    [101, 150],
  ];

  expectedRanges.forEach(([minimumLevel, maximumLevel], index) => {
    const stage = progression.getStage(minimumLevel);

    assert.equal(stage.levelRange.min, minimumLevel);
    assert.equal(progression.getStage(maximumLevel).id, stage.id);
    assert.equal(progression.isStageFinalLevel(minimumLevel), minimumLevel === maximumLevel);
    assert.equal(progression.isStageFinalLevel(maximumLevel), true);

    const nextStage = progression.getNextStage(maximumLevel);
    const expectedNextLevel = expectedRanges[index + 1]?.[0] ?? null;
    assert.equal(nextStage?.levelRange.min ?? null, expectedNextLevel);
  });
});

test('every General stage option starts with five vocabulary targets', () => {
  generalCourseConfig.stages.forEach((stage) => {
    const manifest = generalManifests.find(({ stageId }) => stageId === stage.id);
    const startingVocabulary = manifest.entries.filter(
      ({ introducedAt }) => introducedAt === stage.levelRange.min,
    );

    assert.equal(startingVocabulary.length, 5, stage.id);
  });
});

test('restart stage resolves the first level for every General stage', () => {
  const progression = new CourseProgression(generalCourseConfig);
  const expectedStageStarts = [
    [1, 1],
    [10, 1],
    [11, 11],
    [20, 11],
    [21, 21],
    [50, 21],
    [51, 51],
    [60, 51],
    [61, 61],
    [100, 61],
    [101, 101],
    [150, 101],
  ];

  expectedStageStarts.forEach(([currentLevel, expectedStart]) => {
    assert.equal(progression.getStageStartLevel(currentLevel), expectedStart);
  });
});

test('Hard Kana + Kanji ends at level 150 without auto-starting another stage', () => {
  const progression = new CourseProgression(generalCourseConfig);
  const finalStage = progression.getStage(150);

  assert.equal(finalStage.id, 'general-hard-kana-kanji');
  assert.equal(progression.isStageFinalLevel(150), true);
  assert.equal(progression.getNextStage(150), null);
});

test('rejects levels outside the configured course', () => {
  const progression = new CourseProgression(createConfig());

  assert.throws(() => progression.getStage(0), RangeError);
  assert.throws(() => progression.getStage(21), RangeError);
});

test('detects progression gaps and overlaps', () => {
  const config = createConfig();
  config.stages[1].levelRange.min = 12;

  assert.throws(() => new CourseProgression(config), CourseProgressionValidationError);
});

test('validates manifests against progression rules', () => {
  const progression = new CourseProgression(createConfig());
  const manifests = createConfig().stages.map((stage) => ({
    courseId: 'general',
    stageId: stage.id,
    levelRange: stage.levelRange,
    difficulty: stage.difficulty,
    focus: stage.writingSystems,
  }));

  assert.equal(progression.validateManifests(manifests), true);
  manifests[0].difficulty = 'hard';
  assert.throws(
    () => progression.validateManifests(manifests),
    CourseProgressionValidationError,
  );
});

test('validates vocabulary composition for mixed stages', () => {
  const config = createConfig();
  config.stages[0].writingSystems = ['hiragana', 'katakana'];
  config.stages[0].composition = 'mixed-kana';
  const progression = new CourseProgression(config);
  const manifests = [
    {
      stageId: 'hiragana',
      levelRange: { min: 1, max: 10 },
      entries: [{ vocabularyId: 'hira' }, { vocabularyId: 'kata' }],
    },
  ];
  const vocabulary = {
    hira: { writingSystem: 'hiragana' },
    kata: { writingSystem: 'katakana' },
  };

  assert.equal(
    progression.validateStageVocabulary(manifests, (id) => vocabulary[id]),
    true,
  );

  manifests[0].entries = [{ vocabularyId: 'hira' }];
  assert.throws(
    () => progression.validateStageVocabulary(manifests, (id) => vocabulary[id]),
    CourseProgressionValidationError,
  );
});

test('accepts kanji entries with kana in the display for mixed kana-kanji stages', () => {
  const config = createConfig();
  config.stages[0].writingSystems = ['hiragana', 'katakana', 'kanji'];
  config.stages[0].composition = 'mixed-kana-kanji';
  const progression = new CourseProgression(config);
  const manifests = [
    {
      stageId: 'hiragana',
      levelRange: { min: 1, max: 10 },
      entries: [{ vocabularyId: 'mixed-kanji' }],
    },
  ];
  const vocabulary = {
    'mixed-kanji': { display: '食べる', writingSystem: 'kanji' },
  };

  assert.equal(
    progression.validateStageVocabulary(manifests, (id) => vocabulary[id]),
    true,
  );
});
