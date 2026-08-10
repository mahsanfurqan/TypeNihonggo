import assert from 'node:assert/strict';
import test from 'node:test';
import { LocaleManager, UnsupportedLocaleError } from '../src/managers/LocaleManager.js';

function createTranslations() {
  return {
    id: {
      'jp-001': 'kucing',
      'jp-blank': '',
    },
    en: {
      'jp-001': 'cat',
      'jp-002': 'water',
      'jp-blank': 'school',
    },
  };
}

test('uses Indonesian as the default locale', () => {
  const localeManager = new LocaleManager({ translations: createTranslations() });

  assert.equal(localeManager.getLocale(), 'id');
  assert.equal(localeManager.getMeaning('jp-001'), 'kucing');
});

test('supports English as the selected locale', () => {
  const localeManager = new LocaleManager({ translations: createTranslations() });
  localeManager.setLocale('en');

  assert.equal(localeManager.getMeaning('jp-001'), 'cat');
});

test('falls back to English when Indonesian is missing', () => {
  const localeManager = new LocaleManager({ translations: createTranslations() });

  assert.equal(localeManager.getMeaning('jp-002'), 'water');
  assert.equal(localeManager.getMeaning('jp-blank'), 'school');
});

test('returns --- when selected and English translations are missing', () => {
  const localeManager = new LocaleManager({ translations: createTranslations() });

  assert.equal(localeManager.getMeaning('missing'), '---');
});

test('creates a localized view without mutating catalog vocabulary', () => {
  const localeManager = new LocaleManager({ translations: createTranslations() });
  const vocabulary = { id: 'jp-001', display: 'ねこ' };
  const localized = localeManager.localizeVocabulary(vocabulary);

  assert.equal(localized.meaning, 'kucing');
  assert.equal(Object.hasOwn(vocabulary, 'meaning'), false);
});

test('rejects unsupported locales', () => {
  const localeManager = new LocaleManager({ translations: createTranslations() });

  assert.throws(() => localeManager.setLocale('ja'), UnsupportedLocaleError);
});

test('requires Indonesian and English translation maps', () => {
  assert.throws(() => new LocaleManager({ translations: { id: {} } }), TypeError);
  assert.throws(() => new LocaleManager({ translations: { en: {} } }), TypeError);
});

