import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createLocaleCoverageIssues,
  createLocaleCoverageReport,
} from '../src/data/vocabulary/locales/localeValidation.js';

test('reports complete, empty, missing, and unknown locale translations', () => {
  const vocabularyIds = new Set(['jp-001', 'jp-002', 'jp-003']);
  const [localeReport] = createLocaleCoverageReport(vocabularyIds, [
    {
      locale: 'fr',
      translations: {
        'jp-001': 'chat',
        'jp-002': '',
        'jp-999': 'unknown',
      },
    },
  ]);

  assert.equal(localeReport.locale, 'fr');
  assert.equal(localeReport.total, 3);
  assert.equal(localeReport.complete, 1);
  assert.equal(localeReport.empty, 1);
  assert.equal(localeReport.missing, 1);
  assert.equal(localeReport.unknown, 1);
  assert.deepEqual(localeReport.emptyIds, ['jp-002']);
  assert.deepEqual(localeReport.missingIds, ['jp-003']);
  assert.deepEqual(localeReport.unknownIds, ['jp-999']);
});

test('creates readable locale validation issues', () => {
  const vocabularyIds = new Set(['jp-001']);
  const localeCoverageReport = createLocaleCoverageReport(vocabularyIds, [
    {
      locale: 'es',
      translations: {},
    },
  ]);
  const issues = createLocaleCoverageIssues(localeCoverageReport);

  assert.equal(issues.length, 1);
  assert.match(issues[0], /Locale es is missing 1 translations: jp-001/);
});

