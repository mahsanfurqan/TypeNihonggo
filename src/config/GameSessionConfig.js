const DEFAULT_SESSION = Object.freeze({
  course: 'general',
  currentLevel: 1,
  locale: 'id',
});

export class GameSessionConfig {
  constructor(session = {}) {
    this.setCourse(session.course ?? DEFAULT_SESSION.course);
    this.setCurrentLevel(session.currentLevel ?? DEFAULT_SESSION.currentLevel);
    this.setLocale(session.locale ?? DEFAULT_SESSION.locale);
  }

  static from(value) {
    return value instanceof GameSessionConfig ? value : new GameSessionConfig(value);
  }

  setCourse(course) {
    if (typeof course !== 'string' || course.trim().length === 0) {
      throw new TypeError('Active course must be a non-empty string');
    }

    this.course = course;
    return this;
  }

  setCurrentLevel(level) {
    if (!Number.isInteger(level) || level < 1) {
      throw new RangeError('Current level must be a positive integer');
    }

    this.currentLevel = level;
    return this;
  }

  setLocale(locale) {
    if (typeof locale !== 'string' || locale.trim().length === 0) {
      throw new TypeError('Active locale must be a non-empty string');
    }

    this.locale = locale;
    return this;
  }

  toJSON() {
    return {
      course: this.course,
      currentLevel: this.currentLevel,
      locale: this.locale,
    };
  }
}

export { DEFAULT_SESSION };

