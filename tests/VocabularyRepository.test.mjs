import assert from 'node:assert/strict';
import test from 'node:test';
import { VocabularyRepository } from '../src/data/vocabulary/VocabularyRepository.js';
import {
  CourseNotFoundError,
  VocabularyNotFoundError,
  VocabularyValidationError,
} from '../src/data/vocabulary/VocabularyErrors.js';

function createData() {
  return {
    catalogs: [
      {
        schemaVersion: 1,
        catalogId: 'hiragana',
        entries: [
          {
            id: 'jp-test-001',
            display: 'ねこ',
            reading: 'ねこ',
            writingSystem: 'hiragana',
            romaji: { primary: 'neko', accepted: ['neko'] },
            category: 'animals',
          },
          {
            id: 'jp-test-002',
            display: 'みず',
            reading: 'みず',
            writingSystem: 'hiragana',
            romaji: { primary: 'mizu', accepted: ['mizu'] },
            category: 'nature',
          },
        ],
      },
    ],
    courseManifests: [
      {
        schemaVersion: 1,
        courseId: 'general',
        stageId: 'general-easy-hiragana',
        levelRange: { min: 1, max: 10 },
        focus: ['hiragana'],
        difficulty: 'easy',
        entries: [
          { vocabularyId: 'jp-test-001', introducedAt: 1 },
          { vocabularyId: 'jp-test-002', introducedAt: 3 },
        ],
      },
    ],
  };
}

test('loads vocabulary by permanent ID', () => {
  const repository = new VocabularyRepository(createData());
  assert.equal(repository.loadVocabularyById('jp-test-001').display, 'ねこ');
});

test('loads and combines a course level with catalog entries', () => {
  const repository = new VocabularyRepository(createData());
  const result = repository.loadCourseLevel('general', 3);

  assert.equal(result.vocabulary.length, 2);
  assert.equal(result.vocabulary[1].id, 'jp-test-002');
  assert.equal(result.vocabulary[1].course.introducedAt, 3);
});

test('only includes vocabulary introduced at the requested level', () => {
  const repository = new VocabularyRepository(createData());
  const result = repository.loadCourseLevel('general', 1);

  assert.deepEqual(result.vocabulary.map(({ id }) => id), ['jp-test-001']);
});

test('throws when a vocabulary ID is not found', () => {
  const repository = new VocabularyRepository(createData());
  assert.throws(() => repository.loadVocabularyById('missing'), VocabularyNotFoundError);
});

test('throws when a course or level is not found', () => {
  const repository = new VocabularyRepository(createData());
  assert.throws(() => repository.loadCourse('missing'), CourseNotFoundError);
  assert.throws(() => repository.loadCourseLevel('general', 99), CourseNotFoundError);
});

test('detects duplicate vocabulary IDs', () => {
  const data = createData();
  data.catalogs[0].entries.push({ ...data.catalogs[0].entries[0] });
  assert.throws(() => new VocabularyRepository(data), VocabularyValidationError);
});

test('detects duplicate vocabulary entries with different IDs', () => {
  const data = createData();
  data.catalogs[0].entries.push({
    ...data.catalogs[0].entries[0],
    id: 'jp-test-duplicate',
  });
  assert.throws(() => new VocabularyRepository(data), VocabularyValidationError);
});

test('detects missing required fields', () => {
  const data = createData();
  delete data.catalogs[0].entries[0].reading;
  assert.throws(() => new VocabularyRepository(data), VocabularyValidationError);
});

test('rejects meaning stored directly in the vocabulary catalog', () => {
  const data = createData();
  data.catalogs[0].entries[0].meaning = 'kucing';
  assert.throws(() => new VocabularyRepository(data), VocabularyValidationError);
});

test('detects course references to missing vocabulary IDs', () => {
  const data = createData();
  data.courseManifests[0].entries[0].vocabularyId = 'missing';
  assert.throws(() => new VocabularyRepository(data), VocabularyValidationError);
});
