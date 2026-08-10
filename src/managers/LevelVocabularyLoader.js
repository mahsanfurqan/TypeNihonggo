import { resolveBackgroundMapIdForLevel } from '../config/backgroundMaps.js';
import { resolveGameplayBalance } from '../config/gameplayBalance.js';

export class LevelVocabularyLoader {
  constructor({ sessionConfig, vocabularyRepository, localeManager, courseProgression }) {
    this.sessionConfig = sessionConfig;
    this.vocabularyRepository = vocabularyRepository;
    this.localeManager = localeManager;
    this.courseProgression = courseProgression;
  }

  loadVocabulary(level = this.sessionConfig.currentLevel) {
    const courseLevel = this.vocabularyRepository.loadCourseLevel(
      this.sessionConfig.course,
      level,
    );

    return courseLevel.vocabulary.map((entry) => ({
      id: entry.id,
      kana: entry.display,
      reading: entry.reading,
      romaji: entry.romaji.primary,
      acceptedRomaji: [...entry.romaji.accepted],
      meaning: this.localeManager.getMeaning(entry.id),
    }));
  }

  resolveGameplaySettings(level = this.sessionConfig.currentLevel) {
    return resolveGameplayBalance({
      level,
      stage: this.courseProgression.getStage(level),
    });
  }

  resolveBackgroundMapId(level = this.sessionConfig.currentLevel) {
    return resolveBackgroundMapIdForLevel(level);
  }
}
