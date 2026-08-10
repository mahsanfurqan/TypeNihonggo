export class SessionStatsManager {
  constructor() {
    this.correctKeyCount = 0;
    this.wrongKeyCount = 0;
    this.completedVocabularyCount = 0;
    this.uniqueCompletedVocabularyIds = new Set();
    this.completedVocabularyReview = new Map();
    this.completionOrder = 0;
  }

  recordCorrectKey(count = 1) {
    this.correctKeyCount += Math.max(0, count);
  }

  recordWrongKey(count = 1) {
    this.wrongKeyCount += Math.max(0, count);
  }

  recordVocabularyCompleted(vocabulary) {
    this.completedVocabularyCount += 1;

    const vocabularyId = typeof vocabulary === 'string' ? vocabulary : vocabulary?.id;

    if (vocabularyId) {
      this.uniqueCompletedVocabularyIds.add(vocabularyId);
      this.completionOrder += 1;

      const existingReview = this.completedVocabularyReview.get(vocabularyId);

      this.completedVocabularyReview.set(vocabularyId, {
        id: vocabularyId,
        display: vocabulary?.kana ?? vocabulary?.display ?? existingReview?.display ?? vocabularyId,
        romaji: vocabulary?.romaji ?? existingReview?.romaji ?? '---',
        meaning: vocabulary?.meaning ?? existingReview?.meaning ?? '---',
        completionCount: (existingReview?.completionCount ?? 0) + 1,
        lastCompletedOrder: this.completionOrder,
      });
    }
  }

  getVocabularyReview(limit = 5) {
    return [...this.completedVocabularyReview.values()]
      .sort((left, right) => right.lastCompletedOrder - left.lastCompletedOrder)
      .slice(0, limit)
      .map(({ lastCompletedOrder, ...review }) => ({ ...review }));
  }

  getAccuracyPercentage() {
    const totalKeyAttempts = this.correctKeyCount + this.wrongKeyCount;

    if (totalKeyAttempts === 0) {
      return 100;
    }

    return Math.round((this.correctKeyCount / totalKeyAttempts) * 100);
  }

  getSnapshot({ score, elapsedMilliseconds, currentLevel, stage }) {
    return {
      totalCorrectKey: this.correctKeyCount,
      totalWrongKey: this.wrongKeyCount,
      vocabularyCompletedCount: this.completedVocabularyCount,
      uniqueVocabularyCompleted: this.uniqueCompletedVocabularyIds.size,
      accuracyPercentage: this.getAccuracyPercentage(),
      vocabularyReview: this.getVocabularyReview(),
      stage,
      currentLevel,
      elapsedMilliseconds,
      score,
    };
  }
}
