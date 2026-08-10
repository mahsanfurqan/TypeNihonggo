import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  ProgressionConfigurationError,
  ProgressionManager,
} from '../src/managers/ProgressionManager.js';
import { VocabularyRepository } from '../src/data/vocabulary/VocabularyRepository.js';

function loadJson(relativePath) {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
}

function createRepository() {
  return {
    loadCourse(courseId) {
      assert.equal(courseId, 'general');

      return [
        {
          courseId: 'general',
          levelRange: { min: 1, max: 2 },
          entries: [
            { vocabularyId: 'level-1-a', introducedAt: 1 },
            { vocabularyId: 'level-1-b', introducedAt: 1 },
            { vocabularyId: 'level-1-c', introducedAt: 1 },
            { vocabularyId: 'level-1-d', introducedAt: 1 },
            { vocabularyId: 'level-1-e', introducedAt: 1 },
            { vocabularyId: 'level-2-a', introducedAt: 2 },
            { vocabularyId: 'level-2-b', introducedAt: 2 },
            { vocabularyId: 'level-2-c', introducedAt: 2 },
            { vocabularyId: 'level-2-d', introducedAt: 2 },
            { vocabularyId: 'level-2-e', introducedAt: 2 },
          ],
        },
      ];
    },
  };
}

function createManager(level = 1) {
  return new ProgressionManager({
    vocabularyRepository: createRepository(),
    courseId: 'general',
    currentLevel: level,
  });
}

test('loads exactly five new vocabulary targets for the current level', () => {
  const manager = createManager();

  assert.deepEqual(manager.getTargetVocabularyIds(), [
    'level-1-a',
    'level-1-b',
    'level-1-c',
    'level-1-d',
    'level-1-e',
  ]);
  assert.deepEqual(manager.getProgress(), {
    courseId: 'general',
    currentLevel: 1,
    completedCount: 0,
    targetCount: 5,
    remainingCount: 5,
    isLevelComplete: false,
  });
});

test('counts a target vocabulary completion once', () => {
  const manager = createManager();

  const firstResult = manager.recordVocabularyCompleted('level-1-a');
  const duplicateResult = manager.recordVocabularyCompleted('level-1-a');

  assert.equal(firstResult.isTarget, true);
  assert.equal(firstResult.isNewCompletion, true);
  assert.equal(duplicateResult.isNewCompletion, false);
  assert.equal(manager.getProgress().completedCount, 1);
});

test('ignores cumulative vocabulary from a previous level', () => {
  const manager = createManager(2);
  const result = manager.recordVocabularyCompleted('level-1-a');

  assert.equal(result.isTarget, false);
  assert.equal(result.isNewCompletion, false);
  assert.equal(manager.getProgress().completedCount, 0);
});

test('completes a level only after every new vocabulary ID is completed', () => {
  const manager = createManager();
  const targets = manager.getTargetVocabularyIds();

  targets.slice(0, -1).forEach((id) => manager.recordVocabularyCompleted(id));
  assert.equal(manager.isLevelComplete(), false);

  const finalResult = manager.recordVocabularyCompleted(targets.at(-1));
  assert.equal(finalResult.isLevelComplete, true);
  assert.equal(manager.getProgress().remainingCount, 0);
});

test('starting another level resets completion and loads its new targets', () => {
  const manager = createManager();
  manager.recordVocabularyCompleted('level-1-a');

  manager.startLevel(2);

  assert.deepEqual(manager.getCompletedVocabularyIds(), []);
  assert.deepEqual(manager.getTargetVocabularyIds(), [
    'level-2-a',
    'level-2-b',
    'level-2-c',
    'level-2-d',
    'level-2-e',
  ]);
  assert.equal(manager.getProgress().currentLevel, 2);
});

test('validating the next level does not change current progression state', () => {
  const manager = createManager();
  manager.recordVocabularyCompleted('level-1-a');

  assert.deepEqual(manager.validateLevel(2), [
    'level-2-a',
    'level-2-b',
    'level-2-c',
    'level-2-d',
    'level-2-e',
  ]);
  assert.deepEqual(manager.getProgress(), {
    courseId: 'general',
    currentLevel: 1,
    completedCount: 1,
    targetCount: 5,
    remainingCount: 4,
    isLevelComplete: false,
  });
});

test('a failed level transition preserves the current progression state', () => {
  const manager = createManager();
  manager.recordVocabularyCompleted('level-1-a');

  assert.throws(() => manager.startLevel(99), ProgressionConfigurationError);
  assert.deepEqual(manager.getProgress(), {
    courseId: 'general',
    currentLevel: 1,
    completedCount: 1,
    targetCount: 5,
    remainingCount: 4,
    isLevelComplete: false,
  });
});

test('rejects a level that does not introduce exactly five vocabulary entries', () => {
  const repository = createRepository();
  repository.loadCourse = () => [
    {
      levelRange: { min: 1, max: 1 },
      entries: [{ vocabularyId: 'only-one', introducedAt: 1 }],
    },
  ];

  assert.throws(
    () =>
      new ProgressionManager({
        vocabularyRepository: repository,
        courseId: 'general',
        currentLevel: 1,
      }),
    ProgressionConfigurationError,
  );
});

test('reuses stage sample targets for incomplete levels only when enabled', () => {
  const repository = createRepository();
  repository.loadCourse = () => [
    {
      levelRange: { min: 11, max: 20 },
      entries: [
        { vocabularyId: 'sample-a', introducedAt: 11 },
        { vocabularyId: 'sample-b', introducedAt: 11 },
        { vocabularyId: 'sample-c', introducedAt: 11 },
        { vocabularyId: 'sample-d', introducedAt: 11 },
        { vocabularyId: 'sample-e', introducedAt: 11 },
        { vocabularyId: 'partial-level-word', introducedAt: 12 },
      ],
    },
  ];

  const manager = new ProgressionManager({
    vocabularyRepository: repository,
    courseId: 'general',
    currentLevel: 12,
    allowStageSampleFallback: true,
  });

  assert.deepEqual(manager.getTargetVocabularyIds(), [
    'sample-a',
    'sample-b',
    'sample-c',
    'sample-d',
    'sample-e',
  ]);
});

test('sample fallback provides five targets for every General level', () => {
  const vocabularyCatalogs = [
    loadJson('../src/data/vocabulary/catalog/hiragana.json'),
    loadJson('../src/data/vocabulary/catalog/katakana.json'),
    loadJson('../src/data/vocabulary/catalog/kanji.json'),
  ];
  const generalCourseManifests = [
    loadJson('../src/data/vocabulary/courses/general/levels-001-010.json'),
    loadJson('../src/data/vocabulary/courses/general/levels-011-020.json'),
    loadJson('../src/data/vocabulary/courses/general/levels-021-050.json'),
    loadJson('../src/data/vocabulary/courses/general/levels-051-060.json'),
    loadJson('../src/data/vocabulary/courses/general/levels-061-100.json'),
    loadJson('../src/data/vocabulary/courses/general/levels-101-150.json'),
  ];
  const repository = new VocabularyRepository({
    catalogs: vocabularyCatalogs,
    courseManifests: generalCourseManifests,
  });
  const manager = new ProgressionManager({
    vocabularyRepository: repository,
    courseId: 'general',
    currentLevel: 1,
    allowStageSampleFallback: true,
  });

  for (let level = 1; level <= 150; level += 1) {
    assert.equal(manager.validateLevel(level).length, 5, `General level ${level}`);
  }
});

test('Easy Kana + Kanji levels use real level targets instead of sample fallback', () => {
  const vocabularyCatalogs = [
    loadJson('../src/data/vocabulary/catalog/hiragana.json'),
    loadJson('../src/data/vocabulary/catalog/katakana.json'),
    loadJson('../src/data/vocabulary/catalog/kanji.json'),
  ];
  const generalCourseManifests = [
    loadJson('../src/data/vocabulary/courses/general/levels-001-010.json'),
    loadJson('../src/data/vocabulary/courses/general/levels-011-020.json'),
    loadJson('../src/data/vocabulary/courses/general/levels-021-050.json'),
    loadJson('../src/data/vocabulary/courses/general/levels-051-060.json'),
    loadJson('../src/data/vocabulary/courses/general/levels-061-100.json'),
    loadJson('../src/data/vocabulary/courses/general/levels-101-150.json'),
  ];
  const repository = new VocabularyRepository({
    catalogs: vocabularyCatalogs,
    courseManifests: generalCourseManifests,
  });
  const manifest = generalCourseManifests.find(
    ({ stageId }) => stageId === 'general-easy-kana-kanji',
  );
  const manager = new ProgressionManager({
    vocabularyRepository: repository,
    courseId: 'general',
    currentLevel: 61,
    allowStageSampleFallback: true,
  });

  for (let level = 61; level <= 100; level += 1) {
    const realLevelTargets = manifest.entries
      .filter(({ introducedAt }) => introducedAt === level)
      .map(({ vocabularyId }) => vocabularyId);

    assert.equal(realLevelTargets.length, 5, `General level ${level}`);
    assert.deepEqual(manager.validateLevel(level), realLevelTargets);
  }
});

test('Hard Kana + Kanji levels use real level targets instead of sample fallback', () => {
  const vocabularyCatalogs = [
    loadJson('../src/data/vocabulary/catalog/hiragana.json'),
    loadJson('../src/data/vocabulary/catalog/katakana.json'),
    loadJson('../src/data/vocabulary/catalog/kanji.json'),
  ];
  const generalCourseManifests = [
    loadJson('../src/data/vocabulary/courses/general/levels-001-010.json'),
    loadJson('../src/data/vocabulary/courses/general/levels-011-020.json'),
    loadJson('../src/data/vocabulary/courses/general/levels-021-050.json'),
    loadJson('../src/data/vocabulary/courses/general/levels-051-060.json'),
    loadJson('../src/data/vocabulary/courses/general/levels-061-100.json'),
    loadJson('../src/data/vocabulary/courses/general/levels-101-150.json'),
  ];
  const repository = new VocabularyRepository({
    catalogs: vocabularyCatalogs,
    courseManifests: generalCourseManifests,
  });
  const manifest = generalCourseManifests.find(
    ({ stageId }) => stageId === 'general-hard-kana-kanji',
  );
  const manager = new ProgressionManager({
    vocabularyRepository: repository,
    courseId: 'general',
    currentLevel: 101,
    allowStageSampleFallback: true,
  });

  for (let level = 101; level <= 150; level += 1) {
    const realLevelTargets = manifest.entries
      .filter(({ introducedAt }) => introducedAt === level)
      .map(({ vocabularyId }) => vocabularyId);

    assert.equal(realLevelTargets.length, 5, `General level ${level}`);
    assert.deepEqual(manager.validateLevel(level), realLevelTargets);
  }
});

test('rejects duplicate target vocabulary IDs', () => {
  const repository = createRepository();
  repository.loadCourse = () => [
    {
      levelRange: { min: 1, max: 1 },
      entries: Array.from({ length: 5 }, () => ({
        vocabularyId: 'duplicate',
        introducedAt: 1,
      })),
    },
  ];

  assert.throws(
    () =>
      new ProgressionManager({
        vocabularyRepository: repository,
        courseId: 'general',
        currentLevel: 1,
      }),
    ProgressionConfigurationError,
  );
});

test('rejects invalid configuration and missing levels', () => {
  assert.throws(
    () =>
      new ProgressionManager({
        vocabularyRepository: null,
        courseId: 'general',
        currentLevel: 1,
      }),
    TypeError,
  );

  const manager = createManager();
  assert.throws(() => manager.startLevel(99), ProgressionConfigurationError);
  assert.throws(() => manager.startLevel(0), RangeError);
});

test('reports only target vocabulary IDs that have not been completed', () => {
  const manager = createManager();

  manager.recordVocabularyCompleted('level-1-b');
  manager.recordVocabularyCompleted('previous-level-word');

  assert.deepEqual(manager.getRemainingVocabularyIds(), [
    'level-1-a',
    'level-1-c',
    'level-1-d',
    'level-1-e',
  ]);
});
