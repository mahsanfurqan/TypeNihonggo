import assert from 'node:assert/strict';
import test from 'node:test';
import { GameSessionConfig } from '../src/config/GameSessionConfig.js';

test('uses the default TypeNihongo session', () => {
  const session = new GameSessionConfig();

  assert.deepEqual(session.toJSON(), {
    course: 'general',
    currentLevel: 1,
    locale: 'id',
  });
});

test('accepts a custom course, level, and locale', () => {
  const session = new GameSessionConfig({
    course: 'general',
    currentLevel: 8,
    locale: 'en',
  });

  assert.equal(session.course, 'general');
  assert.equal(session.currentLevel, 8);
  assert.equal(session.locale, 'en');
});

test('updates session values through validated setters', () => {
  const session = new GameSessionConfig();

  session.setCourse('hiragana').setCurrentLevel(4).setLocale('en');

  assert.deepEqual(session.toJSON(), {
    course: 'hiragana',
    currentLevel: 4,
    locale: 'en',
  });
});

test('returns an existing GameSessionConfig instance unchanged', () => {
  const session = new GameSessionConfig();

  assert.equal(GameSessionConfig.from(session), session);
});

test('rejects invalid session values', () => {
  assert.throws(() => new GameSessionConfig({ course: '' }), TypeError);
  assert.throws(() => new GameSessionConfig({ currentLevel: 0 }), RangeError);
  assert.throws(() => new GameSessionConfig({ currentLevel: 1.5 }), RangeError);
  assert.throws(() => new GameSessionConfig({ locale: '' }), TypeError);
});

