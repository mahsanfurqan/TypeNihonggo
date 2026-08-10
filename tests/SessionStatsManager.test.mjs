import assert from 'node:assert/strict';
import test from 'node:test';
import { SessionStatsManager } from '../src/managers/SessionStatsManager.js';

const stage = Object.freeze({
  id: 'general-easy-hiragana',
  title: 'Easy Hiragana',
  levelRange: { min: 1, max: 10 },
});

test('session stats starts empty with perfect neutral accuracy', () => {
  const stats = new SessionStatsManager();
  const snapshot = stats.getSnapshot({
    score: 0,
    elapsedMilliseconds: 0,
    currentLevel: 1,
    stage,
  });

  assert.equal(snapshot.totalCorrectKey, 0);
  assert.equal(snapshot.totalWrongKey, 0);
  assert.equal(snapshot.vocabularyCompletedCount, 0);
  assert.equal(snapshot.uniqueVocabularyCompleted, 0);
  assert.equal(snapshot.accuracyPercentage, 100);
});

test('session stats tracks key accuracy and completed vocabulary', () => {
  const stats = new SessionStatsManager();

  stats.recordCorrectKey(7);
  stats.recordWrongKey(3);
  stats.recordVocabularyCompleted({
    id: 'jp-neko',
    kana: 'ねこ',
    romaji: 'neko',
    meaning: 'cat',
  });
  stats.recordVocabularyCompleted({
    id: 'jp-neko',
    kana: 'ねこ',
    romaji: 'neko',
    meaning: 'cat',
  });
  stats.recordVocabularyCompleted({
    id: 'jp-mizu',
    kana: 'みず',
    romaji: 'mizu',
    meaning: 'water',
  });

  const snapshot = stats.getSnapshot({
    score: 120,
    elapsedMilliseconds: 65000,
    currentLevel: 3,
    stage,
  });

  assert.equal(snapshot.totalCorrectKey, 7);
  assert.equal(snapshot.totalWrongKey, 3);
  assert.equal(snapshot.vocabularyCompletedCount, 3);
  assert.equal(snapshot.uniqueVocabularyCompleted, 2);
  assert.equal(snapshot.accuracyPercentage, 70);
  assert.equal(snapshot.score, 120);
  assert.equal(snapshot.elapsedMilliseconds, 65000);
  assert.equal(snapshot.currentLevel, 3);
  assert.equal(snapshot.stage, stage);
  assert.deepEqual(snapshot.vocabularyReview, [
    {
      id: 'jp-mizu',
      display: 'みず',
      romaji: 'mizu',
      meaning: 'water',
      completionCount: 1,
    },
    {
      id: 'jp-neko',
      display: 'ねこ',
      romaji: 'neko',
      meaning: 'cat',
      completionCount: 2,
    },
  ]);
});

test('session vocabulary review is limited to five most recent unique entries', () => {
  const stats = new SessionStatsManager();

  for (let index = 1; index <= 6; index += 1) {
    stats.recordVocabularyCompleted({
      id: `jp-${index}`,
      display: `言葉${index}`,
      romaji: `kotoba${index}`,
      meaning: `word ${index}`,
    });
  }

  const snapshot = stats.getSnapshot({
    score: 0,
    elapsedMilliseconds: 0,
    currentLevel: 1,
    stage,
  });

  assert.deepEqual(
    snapshot.vocabularyReview.map(({ id }) => id),
    ['jp-6', 'jp-5', 'jp-4', 'jp-3', 'jp-2'],
  );
});
