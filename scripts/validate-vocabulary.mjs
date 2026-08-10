import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VocabularyRepository } from '../src/data/vocabulary/VocabularyRepository.js';
import { CourseProgression } from '../src/data/vocabulary/courses/CourseProgression.js';
import {
  createLocaleCoverageIssues,
  createLocaleCoverageReport,
} from '../src/data/vocabulary/locales/localeValidation.js';
import { LocaleManager } from '../src/managers/LocaleManager.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vocabularyRoot = path.join(projectRoot, 'src', 'data', 'vocabulary');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readJsonDirectory(directoryPath) {
  return fs
    .readdirSync(directoryPath)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .map((fileName) => readJson(path.join(directoryPath, fileName)));
}

const catalogs = readJsonDirectory(path.join(vocabularyRoot, 'catalog'));
const generalCourseRoot = path.join(vocabularyRoot, 'courses', 'general');
const courseManifests = fs
  .readdirSync(generalCourseRoot)
  .filter((fileName) => fileName.startsWith('levels-') && fileName.endsWith('.json'))
  .sort()
  .map((fileName) => readJson(path.join(generalCourseRoot, fileName)));
const courseConfig = readJson(path.join(generalCourseRoot, 'course.json'));
const progression = new CourseProgression(courseConfig);
progression.validateManifests(courseManifests);
const repository = new VocabularyRepository({ catalogs, courseManifests });
progression.validateStageVocabulary(
  courseManifests,
  (vocabularyId) => repository.loadVocabularyById(vocabularyId),
);
const vocabularyIds = new Set(catalogs.flatMap((catalog) => catalog.entries.map(({ id }) => id)));
const localeFiles = readJsonDirectory(path.join(vocabularyRoot, 'locales'));
const translations = Object.fromEntries(
  localeFiles.map((locale) => [locale.locale, locale.translations]),
);
const localeManager = new LocaleManager({ translations });
const localeCoverageReport = createLocaleCoverageReport(vocabularyIds, localeFiles);
const localeIssues = createLocaleCoverageIssues(localeCoverageReport);

if (localeIssues.length > 0) {
  throw new Error(`Vocabulary locale validation failed:\n- ${localeIssues.join('\n- ')}`);
}

for (const vocabularyId of vocabularyIds) {
  localeManager.getMeaning(vocabularyId);
}

for (const localeReport of localeCoverageReport) {
  console.log(
    `Locale ${localeReport.locale}: ${localeReport.complete}/${localeReport.total} complete, ${localeReport.empty} empty, ${localeReport.missing} missing.`,
  );
}

console.log(
  `Vocabulary valid: ${vocabularyIds.size} entries, ${repository.loadCourse('general').length} General manifests, ${localeFiles.length} locales.`,
);
