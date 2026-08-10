import { CourseNotFoundError, VocabularyNotFoundError } from './VocabularyErrors.js';
import { validateVocabularyData } from './validateVocabularyData.js';

export class VocabularyRepository {
  constructor({ catalogs, courseManifests }) {
    validateVocabularyData(catalogs, courseManifests);

    this.vocabularyById = new Map();
    catalogs.forEach((catalog) => {
      catalog.entries.forEach((entry) => this.vocabularyById.set(entry.id, entry));
    });

    this.manifestsByCourse = new Map();
    courseManifests.forEach((manifest) => {
      const manifests = this.manifestsByCourse.get(manifest.courseId) ?? [];
      manifests.push(manifest);
      this.manifestsByCourse.set(manifest.courseId, manifests);
    });

    this.manifestsByCourse.forEach((manifests) => {
      manifests.sort((left, right) => left.levelRange.min - right.levelRange.min);
    });
  }

  loadVocabularyById(id) {
    const vocabulary = this.vocabularyById.get(id);

    if (!vocabulary) {
      throw new VocabularyNotFoundError(id);
    }

    return vocabulary;
  }

  loadCourse(courseId) {
    const manifests = this.manifestsByCourse.get(courseId);

    if (!manifests) {
      throw new CourseNotFoundError(courseId);
    }

    return manifests;
  }

  loadCourseLevel(courseId, level) {
    const manifests = this.loadCourse(courseId);
    const manifest = manifests.find(
      ({ levelRange }) => level >= levelRange.min && level <= levelRange.max,
    );

    if (!manifest) {
      throw new CourseNotFoundError(courseId, level);
    }

    const vocabulary = manifest.entries
      .filter(({ introducedAt }) => introducedAt <= level)
      .map(({ vocabularyId, introducedAt }) => ({
        ...this.loadVocabularyById(vocabularyId),
        course: {
          courseId,
          stageId: manifest.stageId,
          introducedAt,
          difficulty: manifest.difficulty,
          focus: [...manifest.focus],
        },
      }));

    return {
      courseId,
      level,
      levelRange: { ...manifest.levelRange },
      vocabulary,
    };
  }
}
