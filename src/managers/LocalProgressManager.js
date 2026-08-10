const STORAGE_KEY = 'typenihongo.progress.v1';
const SCHEMA_VERSION = 1;
const DEFAULT_LOCALE = 'id';

function createDefaultProgress() {
  return {
    schemaVersion: SCHEMA_VERSION,
    locale: DEFAULT_LOCALE,
    lastStageByCourse: {},
    highestUnlockedLevelByCourse: {},
    highestCompletedLevelByCourse: {},
  };
}

function resolveBrowserStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage ?? null;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export class LocalProgressManager {
  constructor({ storage = resolveBrowserStorage(), storageKey = STORAGE_KEY } = {}) {
    this.storage = storage;
    this.storageKey = storageKey;
    this.progress = this.load();
  }

  load() {
    if (!this.storage) {
      return createDefaultProgress();
    }

    try {
      const rawProgress = this.storage.getItem(this.storageKey);

      if (!rawProgress) {
        return createDefaultProgress();
      }

      return this.sanitize(JSON.parse(rawProgress));
    } catch {
      return createDefaultProgress();
    }
  }

  sanitize(progress) {
    if (!isPlainObject(progress) || progress.schemaVersion !== SCHEMA_VERSION) {
      return createDefaultProgress();
    }

    return {
      schemaVersion: SCHEMA_VERSION,
      locale: typeof progress.locale === 'string' && progress.locale ? progress.locale : DEFAULT_LOCALE,
      lastStageByCourse: isPlainObject(progress.lastStageByCourse)
        ? { ...progress.lastStageByCourse }
        : {},
      highestUnlockedLevelByCourse: isPlainObject(progress.highestUnlockedLevelByCourse)
        ? { ...progress.highestUnlockedLevelByCourse }
        : {},
      highestCompletedLevelByCourse: isPlainObject(progress.highestCompletedLevelByCourse)
        ? { ...progress.highestCompletedLevelByCourse }
        : {},
    };
  }

  save() {
    if (!this.storage) {
      return;
    }

    try {
      this.storage.setItem(this.storageKey, JSON.stringify(this.progress));
    } catch {
      // Saving progress should never interrupt gameplay.
    }
  }

  reset() {
    this.progress = createDefaultProgress();

    if (!this.storage) {
      return;
    }

    try {
      this.storage.removeItem(this.storageKey);
    } catch {
      // Reset is a testing convenience; ignore unavailable storage.
    }
  }

  getLocale() {
    return this.progress.locale;
  }

  setLocale(locale) {
    if (typeof locale !== 'string' || locale.trim().length === 0) {
      return;
    }

    this.progress.locale = locale;
    this.save();
  }

  getHighestUnlockedLevel(courseConfig) {
    const savedLevel = this.progress.highestUnlockedLevelByCourse[courseConfig.courseId];

    if (Number.isInteger(savedLevel) && savedLevel >= courseConfig.levelRange.min) {
      return Math.min(savedLevel, courseConfig.levelRange.max);
    }

    return courseConfig.stages[0].levelRange.min;
  }

  getHighestCompletedLevel(courseConfig) {
    const savedLevel = this.progress.highestCompletedLevelByCourse[courseConfig.courseId];

    if (Number.isInteger(savedLevel) && savedLevel >= courseConfig.levelRange.min) {
      return Math.min(savedLevel, courseConfig.levelRange.max);
    }

    return 0;
  }

  isStageUnlocked(courseConfig, stage) {
    return stage.levelRange.min <= this.getHighestUnlockedLevel(courseConfig);
  }

  getLastStageId(courseId) {
    return this.progress.lastStageByCourse[courseId] ?? null;
  }

  setLastStage(courseConfig, stage) {
    if (!stage?.id) {
      return;
    }

    this.progress.lastStageByCourse[courseConfig.courseId] = stage.id;
    this.save();
  }

  getInitialStage(courseConfig) {
    const lastStageId = this.getLastStageId(courseConfig.courseId);
    const lastStage = courseConfig.stages.find(({ id }) => id === lastStageId);

    if (lastStage && this.isStageUnlocked(courseConfig, lastStage)) {
      return lastStage;
    }

    return [...courseConfig.stages]
      .reverse()
      .find((stage) => this.isStageUnlocked(courseConfig, stage))
      ?? courseConfig.stages[0];
  }

  completeStage(courseConfig, completedStage) {
    const courseId = courseConfig.courseId;
    const currentCompletedLevel = this.getHighestCompletedLevel(courseConfig);
    const nextCompletedLevel = Math.max(currentCompletedLevel, completedStage.levelRange.max);
    const currentUnlockedLevel = this.getHighestUnlockedLevel(courseConfig);
    const completedStageIndex = courseConfig.stages.findIndex(
      ({ id }) => id === completedStage.id,
    );
    const nextStage = courseConfig.stages[completedStageIndex + 1] ?? null;
    const nextUnlockedLevel = nextStage?.levelRange.min ?? completedStage.levelRange.max;

    this.progress.highestCompletedLevelByCourse[courseId] = nextCompletedLevel;
    this.progress.highestUnlockedLevelByCourse[courseId] = Math.max(
      currentUnlockedLevel,
      nextUnlockedLevel,
    );
    this.progress.lastStageByCourse[courseId] = completedStage.id;
    this.save();

    return {
      highestCompletedLevel: this.progress.highestCompletedLevelByCourse[courseId],
      highestUnlockedLevel: this.progress.highestUnlockedLevelByCourse[courseId],
      nextStage,
    };
  }
}

export { STORAGE_KEY as LOCAL_PROGRESS_STORAGE_KEY };
