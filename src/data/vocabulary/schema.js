export const VOCABULARY_SCHEMA_VERSION = 1;

export const WRITING_SYSTEM = Object.freeze({
  HIRAGANA: 'hiragana',
  KATAKANA: 'katakana',
  KANJI: 'kanji',
});

/**
 * @typedef {Object} VocabularyEntry
 * @property {string} id Permanent identifier used by courses and locales.
 * @property {string} display Japanese text shown on the word card.
 * @property {string} reading Kana reading for the displayed word.
 * @property {'hiragana'|'katakana'|'kanji'} writingSystem
 * @property {{primary: string, accepted: string[]}} romaji
 * @property {string} category Stable category key, independent of locale.
 */

/**
 * @typedef {Object} CourseManifest
 * @property {number} schemaVersion
 * @property {string} courseId
 * @property {string} stageId
 * @property {{min: number, max: number}} levelRange
 * @property {string[]} focus
 * @property {'easy'|'hard'} difficulty
 * @property {{vocabularyId: string, introducedAt: number}[]} entries
 */
