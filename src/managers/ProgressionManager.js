const DEFAULT_VOCABULARY_PER_LEVEL = 5;

export class ProgressionConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProgressionConfigurationError';
  }
}

export class ProgressionManager {
  constructor({
    vocabularyRepository,
    courseId,
    currentLevel,
    vocabularyPerLevel = DEFAULT_VOCABULARY_PER_LEVEL,
    allowStageSampleFallback = false,
  }) {
    if (!vocabularyRepository || typeof vocabularyRepository.loadCourse !== 'function') {
      throw new TypeError('ProgressionManager requires a vocabulary repository');
    }

    if (typeof courseId !== 'string' || courseId.trim().length === 0) {
      throw new TypeError('ProgressionManager requires a course ID');
    }

    if (!Number.isInteger(vocabularyPerLevel) || vocabularyPerLevel < 1) {
      throw new RangeError('Vocabulary per level must be a positive integer');
    }

    this.vocabularyRepository = vocabularyRepository;
    this.courseId = courseId;
    this.vocabularyPerLevel = vocabularyPerLevel;
    this.allowStageSampleFallback = allowStageSampleFallback;
    this.startLevel(currentLevel);
  }

  startLevel(level) {
    const targetIds = this.validateLevel(level);

    this.currentLevel = level;
    this.targetVocabularyIds = new Set(targetIds);
    this.completedVocabularyIds = new Set();

    return this.getProgress();
  }

  validateLevel(level) {
    if (!Number.isInteger(level) || level < 1) {
      throw new RangeError('Current level must be a positive integer');
    }

    const targetIds = this.resolveTargetVocabularyIds(level);

    if (targetIds.length !== this.vocabularyPerLevel) {
      throw new ProgressionConfigurationError(
        `Course ${this.courseId} level ${level} must introduce exactly ${this.vocabularyPerLevel} vocabulary entries; found ${targetIds.length}`,
      );
    }

    const uniqueTargetIds = new Set(targetIds);

    if (uniqueTargetIds.size !== targetIds.length) {
      throw new ProgressionConfigurationError(
        `Course ${this.courseId} level ${level} contains duplicate target vocabulary IDs`,
      );
    }

    return [...uniqueTargetIds];
  }

  resolveTargetVocabularyIds(level) {
    const manifests = this.vocabularyRepository.loadCourse(this.courseId);
    const manifest = manifests.find(
      ({ levelRange }) => level >= levelRange.min && level <= levelRange.max,
    );

    if (!manifest) {
      throw new ProgressionConfigurationError(
        `Course ${this.courseId} does not contain level ${level}`,
      );
    }

    const levelTargetIds = manifest.entries
      .filter(({ introducedAt }) => introducedAt === level)
      .map(({ vocabularyId }) => vocabularyId);

    if (
      levelTargetIds.length === this.vocabularyPerLevel ||
      !this.allowStageSampleFallback
    ) {
      return levelTargetIds;
    }

    return manifest.entries
      .filter(({ introducedAt }) => introducedAt === manifest.levelRange.min)
      .map(({ vocabularyId }) => vocabularyId)
      .slice(0, this.vocabularyPerLevel);
  }

  recordVocabularyCompleted(vocabularyId) {
    const isTarget = this.targetVocabularyIds.has(vocabularyId);
    const wasAlreadyCompleted = this.completedVocabularyIds.has(vocabularyId);
    const isNewCompletion = isTarget && !wasAlreadyCompleted;

    if (isNewCompletion) {
      this.completedVocabularyIds.add(vocabularyId);
    }

    return {
      vocabularyId,
      isTarget,
      isNewCompletion,
      isLevelComplete: this.isLevelComplete(),
      progress: this.getProgress(),
    };
  }

  isLevelComplete() {
    return this.completedVocabularyIds.size === this.targetVocabularyIds.size;
  }

  getProgress() {
    const completedCount = this.completedVocabularyIds.size;
    const targetCount = this.targetVocabularyIds.size;

    return {
      courseId: this.courseId,
      currentLevel: this.currentLevel,
      completedCount,
      targetCount,
      remainingCount: targetCount - completedCount,
      isLevelComplete: completedCount === targetCount,
    };
  }

  getTargetVocabularyIds() {
    return [...this.targetVocabularyIds];
  }

  getCompletedVocabularyIds() {
    return [...this.completedVocabularyIds];
  }

  getRemainingVocabularyIds() {
    return [...this.targetVocabularyIds].filter(
      (vocabularyId) => !this.completedVocabularyIds.has(vocabularyId),
    );
  }
}

export { DEFAULT_VOCABULARY_PER_LEVEL };
