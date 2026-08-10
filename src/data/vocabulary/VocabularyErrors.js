export class VocabularyValidationError extends Error {
  constructor(issues) {
    super(`Vocabulary data validation failed:\n- ${issues.join('\n- ')}`);
    this.name = 'VocabularyValidationError';
    this.issues = issues;
  }
}

export class VocabularyNotFoundError extends Error {
  constructor(id) {
    super(`Vocabulary ID not found: ${id}`);
    this.name = 'VocabularyNotFoundError';
    this.vocabularyId = id;
  }
}

export class CourseNotFoundError extends Error {
  constructor(courseId, level = null) {
    const levelContext = level === null ? '' : ` for level ${level}`;
    super(`Course not found: ${courseId}${levelContext}`);
    this.name = 'CourseNotFoundError';
    this.courseId = courseId;
    this.level = level;
  }
}

