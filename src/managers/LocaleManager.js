const DEFAULT_LOCALE = 'id';
const FALLBACK_LOCALE = 'en';
const MISSING_TRANSLATION = '---';

export class UnsupportedLocaleError extends Error {
  constructor(locale) {
    super(`Unsupported vocabulary locale: ${locale}`);
    this.name = 'UnsupportedLocaleError';
    this.locale = locale;
  }
}

export class LocaleManager {
  constructor({ translations, defaultLocale = DEFAULT_LOCALE } = {}) {
    this.validateTranslations(translations);
    this.translations = translations;
    this.fallbackLocale = FALLBACK_LOCALE;
    this.setLocale(defaultLocale);
  }

  validateTranslations(translations) {
    if (!translations || typeof translations !== 'object' || Array.isArray(translations)) {
      throw new TypeError('Vocabulary translations must be an object keyed by locale');
    }

    for (const requiredLocale of [DEFAULT_LOCALE, FALLBACK_LOCALE]) {
      const localeTranslations = translations[requiredLocale];

      if (
        !localeTranslations ||
        typeof localeTranslations !== 'object' ||
        Array.isArray(localeTranslations)
      ) {
        throw new TypeError(`Vocabulary translations must support locale: ${requiredLocale}`);
      }
    }
  }

  setLocale(locale) {
    if (!this.translations[locale]) {
      throw new UnsupportedLocaleError(locale);
    }

    this.currentLocale = locale;
  }

  getLocale() {
    return this.currentLocale;
  }

  getMeaning(vocabularyId) {
    const selectedMeaning = this.translations[this.currentLocale]?.[vocabularyId];

    if (this.isValidMeaning(selectedMeaning)) {
      return selectedMeaning;
    }

    const fallbackMeaning = this.translations[this.fallbackLocale]?.[vocabularyId];
    return this.isValidMeaning(fallbackMeaning) ? fallbackMeaning : MISSING_TRANSLATION;
  }

  localizeVocabulary(vocabulary) {
    if (!vocabulary?.id) {
      throw new TypeError('Vocabulary with a permanent ID is required');
    }

    return {
      ...vocabulary,
      meaning: this.getMeaning(vocabulary.id),
    };
  }

  isValidMeaning(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }
}

