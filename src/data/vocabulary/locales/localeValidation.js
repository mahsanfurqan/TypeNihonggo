function isValidMeaning(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function createLocaleEntry(localeData) {
  if (!localeData || typeof localeData !== 'object' || Array.isArray(localeData)) {
    return {
      locale: 'unknown',
      translations: {},
      structuralIssues: ['Locale file must be an object'],
    };
  }

  const structuralIssues = [];

  if (!isValidMeaning(localeData.locale)) {
    structuralIssues.push('Locale file must define a non-empty locale');
  }

  if (
    !localeData.translations ||
    typeof localeData.translations !== 'object' ||
    Array.isArray(localeData.translations)
  ) {
    structuralIssues.push(`Locale ${localeData.locale ?? 'unknown'} must define translations`);
  }

  return {
    locale: isValidMeaning(localeData.locale) ? localeData.locale : 'unknown',
    translations:
      localeData.translations && typeof localeData.translations === 'object'
        ? localeData.translations
        : {},
    structuralIssues,
  };
}

export function createLocaleCoverageReport(vocabularyIds, localeFiles) {
  const ids = Array.from(vocabularyIds).sort();
  const vocabularyIdSet = new Set(ids);

  return localeFiles.map((localeData) => {
    const { locale, translations, structuralIssues } = createLocaleEntry(localeData);
    const missingIds = [];
    const emptyIds = [];

    ids.forEach((vocabularyId) => {
      if (!Object.hasOwn(translations, vocabularyId)) {
        missingIds.push(vocabularyId);
        return;
      }

      if (!isValidMeaning(translations[vocabularyId])) {
        emptyIds.push(vocabularyId);
      }
    });

    const unknownIds = Object.keys(translations)
      .filter((vocabularyId) => !vocabularyIdSet.has(vocabularyId))
      .sort();

    return {
      locale,
      total: ids.length,
      complete: ids.length - missingIds.length - emptyIds.length,
      empty: emptyIds.length,
      missing: missingIds.length,
      unknown: unknownIds.length,
      emptyIds,
      missingIds,
      unknownIds,
      structuralIssues,
    };
  });
}

export function createLocaleCoverageIssues(localeCoverageReport) {
  return localeCoverageReport.flatMap((localeReport) => {
    const issues = [...localeReport.structuralIssues];

    if (localeReport.missing > 0) {
      issues.push(
        `Locale ${localeReport.locale} is missing ${localeReport.missing} translations: ${localeReport.missingIds.join(', ')}`,
      );
    }

    if (localeReport.empty > 0) {
      issues.push(
        `Locale ${localeReport.locale} has ${localeReport.empty} empty translations: ${localeReport.emptyIds.join(', ')}`,
      );
    }

    if (localeReport.unknown > 0) {
      issues.push(
        `Locale ${localeReport.locale} references ${localeReport.unknown} unknown vocabulary IDs: ${localeReport.unknownIds.join(', ')}`,
      );
    }

    return issues;
  });
}

