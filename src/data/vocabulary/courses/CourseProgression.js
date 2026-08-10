const DIFFICULTIES = new Set(['easy', 'hard']);
const COMPOSITIONS = new Set(['single-script', 'mixed-kana', 'mixed-kana-kanji']);
const WRITING_SYSTEMS = new Set(['hiragana', 'katakana', 'kanji']);
const KANA_PATTERN = /[\u3040-\u30ff]/;

export class CourseProgressionValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CourseProgressionValidationError';
  }
}

export class CourseProgression {
  constructor(config) {
    this.validateConfig(config);
    this.config = config;
  }

  getStage(level) {
    if (!Number.isInteger(level)) {
      throw new RangeError('Course level must be an integer');
    }

    const stage = this.config.stages.find(
      ({ levelRange }) => level >= levelRange.min && level <= levelRange.max,
    );

    if (!stage) {
      throw new RangeError(
        `Level ${level} is outside course ${this.config.courseId} (${this.config.levelRange.min}-${this.config.levelRange.max})`,
      );
    }

    return stage;
  }

  isStageFinalLevel(level) {
    return this.getStage(level).levelRange.max === level;
  }

  getStageStartLevel(level) {
    return this.getStage(level).levelRange.min;
  }

  getNextStage(level) {
    const currentStage = this.getStage(level);
    const currentStageIndex = this.config.stages.findIndex(
      ({ id }) => id === currentStage.id,
    );

    return this.config.stages[currentStageIndex + 1] ?? null;
  }

  validateManifests(manifests) {
    if (!Array.isArray(manifests)) {
      throw new CourseProgressionValidationError('Course manifests must be an array');
    }

    for (const stage of this.config.stages) {
      const matches = manifests.filter((manifest) => manifest.stageId === stage.id);

      if (matches.length !== 1) {
        throw new CourseProgressionValidationError(
          `Stage ${stage.id} must have exactly one manifest`,
        );
      }

      const [manifest] = matches;
      const hasMatchingRange =
        manifest.levelRange.min === stage.levelRange.min &&
        manifest.levelRange.max === stage.levelRange.max;
      const hasMatchingWritingSystems =
        manifest.focus.length === stage.writingSystems.length &&
        manifest.focus.every((writingSystem) => stage.writingSystems.includes(writingSystem));

      if (
        manifest.courseId !== this.config.courseId ||
        manifest.difficulty !== stage.difficulty ||
        !hasMatchingRange ||
        !hasMatchingWritingSystems
      ) {
        throw new CourseProgressionValidationError(
          `Manifest ${stage.id} does not match its progression rule`,
        );
      }
    }

    if (manifests.length !== this.config.stages.length) {
      throw new CourseProgressionValidationError('Course contains a manifest without a stage');
    }

    return true;
  }

  validateStageVocabulary(manifests, loadVocabularyById) {
    for (const manifest of manifests) {
      const stage = this.getStage(manifest.levelRange.min);
      const vocabularyEntries = manifest.entries.map(({ vocabularyId }) =>
        loadVocabularyById(vocabularyId),
      );
      const writingSystems = new Set(vocabularyEntries.map(({ writingSystem }) => writingSystem));
      const hasKana =
        writingSystems.has('hiragana') ||
        writingSystems.has('katakana') ||
        vocabularyEntries.some(({ display }) => KANA_PATTERN.test(display));

      for (const writingSystem of writingSystems) {
        if (!stage.writingSystems.includes(writingSystem)) {
          throw new CourseProgressionValidationError(
            `Stage ${stage.id} contains disallowed writing system: ${writingSystem}`,
          );
        }
      }

      if (
        stage.composition === 'mixed-kana' &&
        (!writingSystems.has('hiragana') || !writingSystems.has('katakana'))
      ) {
        throw new CourseProgressionValidationError(
          `Stage ${stage.id} must contain both Hiragana and Katakana`,
        );
      }

      if (
        stage.composition === 'mixed-kana-kanji' &&
        (!hasKana || !writingSystems.has('kanji'))
      ) {
        throw new CourseProgressionValidationError(
          `Stage ${stage.id} must contain Kana and Kanji`,
        );
      }
    }

    return true;
  }

  validateConfig(config) {
    if (!config || typeof config !== 'object' || !config.courseId) {
      throw new CourseProgressionValidationError('Course configuration is invalid');
    }

    const { min, max } = config.levelRange ?? {};

    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min) {
      throw new CourseProgressionValidationError('Course level range is invalid');
    }

    if (!Array.isArray(config.stages) || config.stages.length === 0) {
      throw new CourseProgressionValidationError('Course must contain progression stages');
    }

    let expectedLevel = min;
    const stageIds = new Set();

    for (const stage of config.stages) {
      if (!stage.id || stageIds.has(stage.id)) {
        throw new CourseProgressionValidationError(`Invalid or duplicate stage ID: ${stage.id}`);
      }

      stageIds.add(stage.id);

      if (
        stage.levelRange?.min !== expectedLevel ||
        !Number.isInteger(stage.levelRange?.max) ||
        stage.levelRange.max < stage.levelRange.min
      ) {
        throw new CourseProgressionValidationError(
          `Progression has a gap or overlap at level ${expectedLevel}`,
        );
      }

      if (!DIFFICULTIES.has(stage.difficulty)) {
        throw new CourseProgressionValidationError(`Invalid difficulty for stage ${stage.id}`);
      }

      if (!COMPOSITIONS.has(stage.composition)) {
        throw new CourseProgressionValidationError(`Invalid composition for stage ${stage.id}`);
      }

      if (
        !Array.isArray(stage.writingSystems) ||
        stage.writingSystems.length === 0 ||
        stage.writingSystems.some((system) => !WRITING_SYSTEMS.has(system))
      ) {
        throw new CourseProgressionValidationError(
          `Invalid writing systems for stage ${stage.id}`,
        );
      }

      expectedLevel = stage.levelRange.max + 1;
    }

    if (expectedLevel !== max + 1) {
      throw new CourseProgressionValidationError(`Progression must end at level ${max}`);
    }
  }
}
