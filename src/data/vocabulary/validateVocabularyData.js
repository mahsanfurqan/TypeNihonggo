import { VOCABULARY_SCHEMA_VERSION, WRITING_SYSTEM } from './schema.js';
import { VocabularyValidationError } from './VocabularyErrors.js';

const WRITING_SYSTEMS = new Set(Object.values(WRITING_SYSTEM));
const DIFFICULTIES = new Set(['easy', 'hard']);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateCatalog(catalog, catalogIndex, issues, vocabularyIds, vocabularyKeys) {
  const path = `catalogs[${catalogIndex}]`;

  if (!catalog || typeof catalog !== 'object') {
    issues.push(`${path} must be an object`);
    return;
  }

  if (catalog.schemaVersion !== VOCABULARY_SCHEMA_VERSION) {
    issues.push(`${path}.schemaVersion must be ${VOCABULARY_SCHEMA_VERSION}`);
  }

  if (!isNonEmptyString(catalog.catalogId)) {
    issues.push(`${path}.catalogId is required`);
  }

  if (!Array.isArray(catalog.entries)) {
    issues.push(`${path}.entries must be an array`);
    return;
  }

  catalog.entries.forEach((entry, entryIndex) => {
    const entryPath = `${path}.entries[${entryIndex}]`;

    if (!entry || typeof entry !== 'object') {
      issues.push(`${entryPath} must be an object`);
      return;
    }

    for (const field of ['id', 'display', 'reading', 'category']) {
      if (!isNonEmptyString(entry[field])) {
        issues.push(`${entryPath}.${field} is required`);
      }
    }

    if (Object.hasOwn(entry, 'meaning')) {
      issues.push(`${entryPath}.meaning must be stored in a locale file, not the catalog`);
    }

    if (isNonEmptyString(entry.id)) {
      if (vocabularyIds.has(entry.id)) {
        issues.push(`Duplicate vocabulary ID: ${entry.id}`);
      } else {
        vocabularyIds.add(entry.id);
      }
    }

    if (!WRITING_SYSTEMS.has(entry.writingSystem)) {
      issues.push(`${entryPath}.writingSystem is invalid`);
    } else if (isNonEmptyString(entry.display)) {
      const vocabularyKey = `${entry.writingSystem}:${entry.display}`;

      if (vocabularyKeys.has(vocabularyKey)) {
        issues.push(`Duplicate vocabulary entry: ${vocabularyKey}`);
      } else {
        vocabularyKeys.add(vocabularyKey);
      }
    }

    if (!entry.romaji || typeof entry.romaji !== 'object') {
      issues.push(`${entryPath}.romaji is required`);
      return;
    }

    if (!isNonEmptyString(entry.romaji.primary)) {
      issues.push(`${entryPath}.romaji.primary is required`);
    }

    if (
      !Array.isArray(entry.romaji.accepted) ||
      entry.romaji.accepted.length === 0 ||
      entry.romaji.accepted.some((romaji) => !isNonEmptyString(romaji))
    ) {
      issues.push(`${entryPath}.romaji.accepted must contain at least one valid value`);
    } else if (
      isNonEmptyString(entry.romaji.primary) &&
      !entry.romaji.accepted.includes(entry.romaji.primary)
    ) {
      issues.push(`${entryPath}.romaji.accepted must include the primary romaji`);
    }
  });
}

function validateCourseManifest(manifest, manifestIndex, issues, vocabularyIds, courseRanges) {
  const path = `courseManifests[${manifestIndex}]`;

  if (!manifest || typeof manifest !== 'object') {
    issues.push(`${path} must be an object`);
    return;
  }

  if (manifest.schemaVersion !== VOCABULARY_SCHEMA_VERSION) {
    issues.push(`${path}.schemaVersion must be ${VOCABULARY_SCHEMA_VERSION}`);
  }

  if (!isNonEmptyString(manifest.courseId)) {
    issues.push(`${path}.courseId is required`);
  }

  if (!isNonEmptyString(manifest.stageId)) {
    issues.push(`${path}.stageId is required`);
  }

  const { min, max } = manifest.levelRange ?? {};
  const hasValidRange = Number.isInteger(min) && Number.isInteger(max) && min > 0 && max >= min;

  if (!hasValidRange) {
    issues.push(`${path}.levelRange must contain valid min and max levels`);
  } else if (isNonEmptyString(manifest.courseId)) {
    const ranges = courseRanges.get(manifest.courseId) ?? [];
    const overlaps = ranges.some((range) => min <= range.max && max >= range.min);

    if (overlaps) {
      issues.push(`Overlapping level range for course ${manifest.courseId}: ${min}-${max}`);
    }

    ranges.push({ min, max });
    courseRanges.set(manifest.courseId, ranges);
  }

  if (
    !Array.isArray(manifest.focus) ||
    manifest.focus.length === 0 ||
    manifest.focus.some((writingSystem) => !WRITING_SYSTEMS.has(writingSystem))
  ) {
    issues.push(`${path}.focus must contain valid writing systems`);
  }

  if (!DIFFICULTIES.has(manifest.difficulty)) {
    issues.push(`${path}.difficulty must be easy or hard`);
  }

  if (!Array.isArray(manifest.entries)) {
    issues.push(`${path}.entries must be an array`);
    return;
  }

  const manifestVocabularyIds = new Set();

  manifest.entries.forEach((entry, entryIndex) => {
    const entryPath = `${path}.entries[${entryIndex}]`;

    if (!entry || typeof entry !== 'object') {
      issues.push(`${entryPath} must be an object`);
      return;
    }

    if (!isNonEmptyString(entry.vocabularyId)) {
      issues.push(`${entryPath}.vocabularyId is required`);
    } else {
      if (manifestVocabularyIds.has(entry.vocabularyId)) {
        issues.push(`Duplicate vocabulary ID in manifest: ${entry.vocabularyId}`);
      }

      manifestVocabularyIds.add(entry.vocabularyId);

      if (!vocabularyIds.has(entry.vocabularyId)) {
        issues.push(`Vocabulary ID referenced by course was not found: ${entry.vocabularyId}`);
      }
    }

    if (!Number.isInteger(entry.introducedAt)) {
      issues.push(`${entryPath}.introducedAt must be an integer`);
    } else if (hasValidRange && (entry.introducedAt < min || entry.introducedAt > max)) {
      issues.push(`${entryPath}.introducedAt must be inside the manifest level range`);
    }
  });
}

export function validateVocabularyData(catalogs, courseManifests) {
  const issues = [];

  if (!Array.isArray(catalogs) || catalogs.length === 0) {
    issues.push('catalogs must contain at least one catalog');
  }

  if (!Array.isArray(courseManifests) || courseManifests.length === 0) {
    issues.push('courseManifests must contain at least one manifest');
  }

  if (issues.length > 0) {
    throw new VocabularyValidationError(issues);
  }

  const vocabularyIds = new Set();
  const vocabularyKeys = new Set();
  catalogs.forEach((catalog, index) =>
    validateCatalog(catalog, index, issues, vocabularyIds, vocabularyKeys),
  );

  const courseRanges = new Map();
  courseManifests.forEach((manifest, index) =>
    validateCourseManifest(manifest, index, issues, vocabularyIds, courseRanges),
  );

  if (issues.length > 0) {
    throw new VocabularyValidationError(issues);
  }

  return true;
}
