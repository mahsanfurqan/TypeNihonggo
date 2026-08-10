import { formatElapsedTime } from '../utils/formatTime.js';

const FONT_FAMILY = '"Trebuchet MS", "Segoe UI", sans-serif';

function drawArc(graphics, x, y, radius, progress, color) {
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + Math.PI * 2 * Math.max(0, Math.min(1, progress));
  const segmentCount = 48;
  const step = (endAngle - startAngle) / segmentCount;

  graphics.lineStyle(7, color, 0.96);

  for (let index = 0; index < segmentCount; index += 1) {
    const angleA = startAngle + step * index;
    const angleB = startAngle + step * (index + 1);

    if (angleA > endAngle) {
      break;
    }

    graphics.lineBetween(
      x + Math.cos(angleA) * radius,
      y + Math.sin(angleA) * radius,
      x + Math.cos(angleB) * radius,
      y + Math.sin(angleB) * radius,
    );
  }
}

function createHoverableCard(scene, x, y, width, height, title, value, hint) {
  const background = scene.add
    .rectangle(0, 0, width, height, 0x0a2545, 0.84)
    .setStrokeStyle(1, 0x72d7ff, 0.72)
    .setInteractive({ useHandCursor: true });
  const titleText = scene.add
    .text(0, -height * 0.22, title, {
      fontFamily: FONT_FAMILY,
      fontSize: '11px',
      color: '#77d7f6',
      fontStyle: '700',
      letterSpacing: 1,
    })
    .setOrigin(0.5);
  const valueText = scene.add
    .text(0, height * 0.12, value, {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: '#f2fbff',
      fontStyle: '700',
    })
    .setOrigin(0.5);
  const card = scene.add.container(x, y, [background, titleText, valueText]);

  background.on('pointerover', () => {
    background.setFillStyle(0x123b66, 0.95);
    background.setStrokeStyle(2, 0xa6edff, 0.96);
    scene.tweens.add({
      targets: card,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 90,
      ease: 'Quad.easeOut',
    });
  });
  background.on('pointerout', () => {
    background.setFillStyle(0x0a2545, 0.84);
    background.setStrokeStyle(1, 0x72d7ff, 0.72);
    scene.tweens.add({
      targets: card,
      scaleX: 1,
      scaleY: 1,
      duration: 90,
      ease: 'Quad.easeOut',
    });
  });

  card.hint = hint;
  return card;
}

function createBar(scene, x, y, width, label, value, maxValue, color) {
  const progress = maxValue > 0 ? value / maxValue : 0;
  const graphics = scene.add.graphics();

  graphics.fillStyle(0x09213e, 0.9);
  graphics.fillRoundedRect(x, y, width, 14, 7);
  graphics.fillStyle(color, 0.92);
  graphics.fillRoundedRect(x, y, Math.max(8, width * progress), 14, 7);
  graphics.lineStyle(1, 0x95e6ff, 0.55);
  graphics.strokeRoundedRect(x, y, width, 14, 7);

  const labelText = scene.add
    .text(x, y - 16, label, {
      fontFamily: FONT_FAMILY,
      fontSize: '11px',
      color: '#8adff8',
      fontStyle: '700',
    })
    .setOrigin(0, 0.5);
  const valueText = scene.add
    .text(x + width, y - 16, String(value), {
      fontFamily: FONT_FAMILY,
      fontSize: '13px',
      color: '#f2fbff',
      fontStyle: '700',
    })
    .setOrigin(1, 0.5);

  return [graphics, labelText, valueText];
}

export function createResultStatsGraph(scene, stats, { x = 0, y = 0, compact = false } = {}) {
  const totalKeys = stats.totalCorrectKey + stats.totalWrongKey;
  const maxKeyCount = Math.max(stats.totalCorrectKey, stats.totalWrongKey, 1);
  const accuracy = Math.max(0, Math.min(100, stats.accuracyPercentage));
  const panelWidth = compact ? 580 : 390;
  const panelHeight = compact ? 118 : 276;
  const panel = scene.add.graphics();

  panel.fillStyle(0x04152b, 0.66);
  panel.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 12);
  panel.lineStyle(1, 0x64d6ff, 0.56);
  panel.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 12);

  const title = scene.add
    .text(0, -panelHeight / 2 + 18, compact ? 'SESSION SNAPSHOT' : 'RESULT GRAPH', {
      fontFamily: FONT_FAMILY,
      fontSize: compact ? '12px' : '13px',
      color: '#7fd9f5',
      fontStyle: '700',
      letterSpacing: 1,
    })
    .setOrigin(0.5);

  const children = [panel, title];

  if (compact) {
    children.push(
      createHoverableCard(scene, -215, 14, 116, 62, 'SCORE', String(stats.score), 'Final score'),
      createHoverableCard(
        scene,
        -72,
        14,
        116,
        62,
        'WORDS',
        String(stats.vocabularyCompletedCount),
        'Vocabulary cleared',
      ),
      createHoverableCard(scene, 72, 14, 116, 62, 'ACCURACY', `${accuracy}%`, 'Typing accuracy'),
      createHoverableCard(
        scene,
        215,
        14,
        116,
        62,
        'TIME',
        formatElapsedTime(stats.elapsedMilliseconds),
        'Play time',
      ),
    );

    return scene.add.container(x, y, children);
  }

  const ring = scene.add.graphics();
  ring.lineStyle(7, 0x173b5b, 0.85);
  ring.strokeCircle(-116, -58, 54);
  drawArc(ring, -116, -58, 54, accuracy / 100, 0x8deeff);

  const accuracyText = scene.add
    .text(-116, -62, `${accuracy}%`, {
      fontFamily: FONT_FAMILY,
      fontSize: '29px',
      color: '#f4fcff',
      fontStyle: '700',
    })
    .setOrigin(0.5);
  const accuracyLabel = scene.add
    .text(-116, -29, 'ACCURACY', {
      fontFamily: FONT_FAMILY,
      fontSize: '11px',
      color: '#8adff8',
      fontStyle: '700',
      letterSpacing: 1,
    })
    .setOrigin(0.5);
  const keyLabel = scene.add
    .text(32, -96, `${totalKeys} KEYS`, {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#f2fbff',
      fontStyle: '700',
      letterSpacing: 1,
    })
    .setOrigin(0, 0.5);

  children.push(
    ring,
    accuracyText,
    accuracyLabel,
    keyLabel,
    ...createBar(scene, 32, -64, 142, 'CORRECT', stats.totalCorrectKey, maxKeyCount, 0x8deeff),
    ...createBar(scene, 32, -20, 142, 'WRONG', stats.totalWrongKey, maxKeyCount, 0xff6f7c),
    createHoverableCard(scene, -120, 52, 104, 66, 'WORDS', String(stats.vocabularyCompletedCount), 'Words completed'),
    createHoverableCard(scene, 0, 52, 104, 66, 'SCORE', String(stats.score), 'Final score'),
    createHoverableCard(
      scene,
      120,
      52,
      104,
      66,
      'TIME',
      formatElapsedTime(stats.elapsedMilliseconds),
      'Total play time',
    ),
  );

  return scene.add.container(x, y, children);
}
