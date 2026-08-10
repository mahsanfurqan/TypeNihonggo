import english from './en.json';
import indonesian from './id.json';

export const vocabularyLocales = Object.freeze({
  [indonesian.locale]: indonesian.translations,
  [english.locale]: english.translations,
});

