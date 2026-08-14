const FONT_FAMILY = '"Trebuchet MS", "Segoe UI", sans-serif';
const JAPANESE_FONT_FAMILY = '"Noto Sans JP", "Yu Gothic UI", "Hiragino Sans", sans-serif';

function createReviewLine(scene, y, vocabulary, width) {
  const rowBackground = scene.add
    .rectangle(0, y, width, 35, 0x081f3a, 0.48)
    .setStrokeStyle(1, 0x2f8fbd, 0.34);
  const displayText = scene.add
    .text(-width / 2 + 14, y - 7, vocabulary.display, {
      fontFamily: JAPANESE_FONT_FAMILY,
      fontSize: '16px',
      color: '#f5fbff',
      fontStyle: '700',
    })
    .setOrigin(0, 0.5);
  const detailText = scene.add
    .text(
      -width / 2 + 14,
      y + 9,
      `${vocabulary.romaji} - ${vocabulary.meaning} - x${vocabulary.completionCount}`,
      {
        fontFamily: FONT_FAMILY,
        fontSize: '12px',
        color: '#aac6d8',
        wordWrap: { width: width - 28, useAdvancedWrap: true },
      },
    )
    .setOrigin(0, 0.5);

  return [rowBackground, displayText, detailText];
}

export function createVocabularyReviewPanel(
  scene,
  x,
  y,
  vocabularyReview = [],
  { width = 348, height = 290, maxItems = 5 } = {},
) {
  const background = scene.add.graphics();

  background.fillStyle(0x04152b, 0.66);
  background.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
  background.lineStyle(1, 0x64d6ff, 0.56);
  background.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);

  const title = scene.add
    .text(0, -height / 2 + 18, 'VOCABULARY REVIEW', {
      fontFamily: FONT_FAMILY,
      fontSize: '13px',
      color: '#7fcff0',
      fontStyle: '700',
      letterSpacing: 1,
    })
    .setOrigin(0.5);

  const children = [background, title];

  if (vocabularyReview.length > 0) {
    children.push(
      ...vocabularyReview
        .slice(0, maxItems)
        .flatMap((vocabulary, index) =>
          createReviewLine(scene, -height / 2 + 58 + index * 43, vocabulary, width - 26),
        ),
    );
  } else {
    children.push(
      scene.add
        .text(0, -72, 'No completed vocabulary yet.', {
          fontFamily: FONT_FAMILY,
          fontSize: '14px',
          color: '#7daac2',
        })
        .setOrigin(0.5),
    );
  }

  return scene.add.container(x, y, children);
}

export function createCompactVocabularyReview(
  scene,
  vocabularyReview,
  { width = 560, y = 130 } = {},
) {
  if (!vocabularyReview?.length) {
    return [];
  }

  const reviewWidth = width;
  const reviewHeight = 44;
  const background = scene.add.graphics();

  background.fillStyle(0x04152b, 0.58);
  background.fillRoundedRect(-reviewWidth / 2, -reviewHeight / 2, reviewWidth, reviewHeight, 10);
  background.lineStyle(1, 0x64d6ff, 0.42);
  background.strokeRoundedRect(-reviewWidth / 2, -reviewHeight / 2, reviewWidth, reviewHeight, 10);

  const title = scene.add
    .text(0, -8, 'RECENT VOCABULARY', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#79cdec',
      fontStyle: '700',
      letterSpacing: 1,
    })
    .setOrigin(0.5);
  const line = vocabularyReview
    .slice(0, 3)
    .map((vocabulary) => `${vocabulary.display}  ${vocabulary.romaji}  x${vocabulary.completionCount}`)
    .join('   ·   ');
  const review = scene.add
    .text(0, 10, line, {
      fontFamily: '"Noto Sans JP", "Yu Gothic UI", "Trebuchet MS", sans-serif',
      fontSize: '14px',
      color: '#eefbff',
      fontStyle: '700',
      wordWrap: { width: reviewWidth - 42, useAdvancedWrap: true },
    })
    .setOrigin(0.5);

  return [scene.add.container(0, y, [background, title, review])];
}
