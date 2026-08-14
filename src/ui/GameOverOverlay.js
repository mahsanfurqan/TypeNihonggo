import { createResultStatsGraph } from './ResultStatsGraph.js';
import { SetupButton } from './SetupButton.js';
import { createVocabularyReviewPanel } from './VocabularyReviewPanel.js';
import { getUiLayout } from './responsiveUi.js';

const FONT_FAMILY = '"Trebuchet MS", "Segoe UI", sans-serif';

function createMetaBadge(scene, x, y, width, label, value) {
  const background = scene.add
    .rectangle(x, y, width, 38, 0x081f3a, 0.82)
    .setStrokeStyle(1, 0x6bd6ff, 0.52);
  const labelText = scene.add
    .text(x - width / 2 + 18, y - 1, label, {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#7fcff0',
      fontStyle: '700',
      letterSpacing: 1,
    })
    .setOrigin(0, 0.5);
  const valueText = scene.add
    .text(x - width / 2 + 108, y - 1, value, {
      fontFamily: FONT_FAMILY,
      fontSize: label === 'STAGE' ? '13px' : '16px',
      color: '#eefbff',
      fontStyle: '700',
    })
    .setOrigin(0, 0.5);

  return [background, labelText, valueText];
}

export class GameOverOverlay {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.buttons = [];
  }

  show({ score, elapsedMilliseconds, currentLevel, stage, stats, onRetryStage, onBackToSetup }) {
    if (this.container) {
      return;
    }

    const layout = getUiLayout(this.scene, { preferredWidth: 860, margin: 12 });
    const { centerX, centerY, isCompact } = layout;
    const panelWidth = layout.width;
    const panelHeight = isCompact ? 690 : Math.min(548, this.scene.cameras.main.height - 34);
    const panelX = -panelWidth / 2;
    const panelY = -panelHeight / 2;

    const backdrop = this.scene.add
      .rectangle(
        0,
        0,
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
        0x020713,
        0.76,
      )
      .setInteractive();
    const glow = this.scene.add.graphics();
    const panel = this.scene.add.graphics();

    glow.fillStyle(0x27b7ff, 0.1);
    glow.fillRoundedRect(panelX - 14, panelY - 14, panelWidth + 28, panelHeight + 28, 18);
    glow.lineStyle(12, 0x27b7ff, 0.12);
    glow.strokeRoundedRect(panelX - 5, panelY - 5, panelWidth + 10, panelHeight + 10, 14);

    panel.fillStyle(0x061a34, 0.98);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
    panel.lineStyle(2, 0x83ddff, 0.96);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
    panel.lineStyle(1, 0xc3f1ff, 0.72);
    panel.lineBetween(panelX + 72, panelY + 28, panelX + panelWidth - 72, panelY + 28);
    panel.lineBetween(
      panelX + 112,
      panelY + panelHeight - 28,
      panelX + panelWidth - 112,
      panelY + panelHeight - 28,
    );
    panel.lineStyle(3, 0x44c8ff, 0.9);
    panel.lineBetween(panelX + 20, panelY + 58, panelX + 20, panelY + panelHeight - 58);
    panel.lineBetween(
      panelX + panelWidth - 20,
      panelY + 58,
      panelX + panelWidth - 20,
      panelY + panelHeight - 58,
    );
    panel.fillStyle(0xa6ebff, 0.95);
    panel.fillTriangle(panelX, panelY + 30, panelX + 30, panelY, panelX + 30, panelY + 8);
    panel.fillTriangle(
      panelX + panelWidth,
      panelY + panelHeight - 30,
      panelX + panelWidth - 30,
      panelY + panelHeight,
      panelX + panelWidth - 30,
      panelY + panelHeight - 8,
    );

    const title = this.scene.add
      .text(0, isCompact ? -305 : -218, 'GAME OVER', {
        fontFamily: FONT_FAMILY,
        fontSize: isCompact ? '38px' : '48px',
        color: '#f2fbff',
        fontStyle: '700',
        letterSpacing: 4,
      })
      .setOrigin(0.5);
    const subtitle = this.scene.add
      .text(0, isCompact ? -264 : -188, 'SYSTEM - SESSION RESULT', {
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
        color: '#83d9f5',
        fontStyle: '700',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    const stageLabel = `${stage.title.toUpperCase()} - LEVEL ${stage.levelRange.min}-${stage.levelRange.max}`;
    const resultStats = stats ?? {
      score,
      elapsedMilliseconds,
      currentLevel,
      stage,
      totalCorrectKey: 0,
      totalWrongKey: 0,
      vocabularyCompletedCount: 0,
      uniqueVocabularyCompleted: 0,
      accuracyPercentage: 100,
      vocabularyReview: [],
    };
    const statsGraph = createResultStatsGraph(this.scene, resultStats, {
      x: isCompact ? 0 : -190,
      y: isCompact ? -126 : -20,
    });

    if (isCompact) {
      statsGraph.setScale(0.88);
    }

    const reviewPanel = createVocabularyReviewPanel(
      this.scene,
      isCompact ? 0 : 218,
      isCompact ? 104 : -20,
      resultStats.vocabularyReview,
      isCompact ? { width: panelWidth - 48, height: 216, maxItems: 4 } : undefined,
    );
    const contextBadges = isCompact
      ? [
          ...createMetaBadge(
            this.scene,
            0,
            236,
            panelWidth - 48,
            'LEVEL',
            String(resultStats.currentLevel),
          ),
          ...createMetaBadge(this.scene, 0, 280, panelWidth - 48, 'STAGE', stageLabel),
        ]
      : [
          ...createMetaBadge(this.scene, -190, 151, 260, 'LEVEL', String(resultStats.currentLevel)),
          ...createMetaBadge(this.scene, 218, 151, 348, 'STAGE', stageLabel),
        ];

    this.container = this.scene.add
      .container(centerX, centerY, [
        backdrop,
        glow,
        panel,
        title,
        subtitle,
        statsGraph,
        reviewPanel,
        ...contextBadges,
      ])
      .setScrollFactor(0)
      .setDepth(110)
      .setAlpha(0)
      .setScale(0.97);

    this.buttons = [
      new SetupButton(this.scene, {
        x: centerX - (isCompact ? 94 : 150),
        y: centerY + (isCompact ? 319 : 226),
        width: isCompact ? 174 : 270,
        height: isCompact ? 46 : 58,
        label: 'RETRY STAGE',
        fontSize: isCompact ? 14 : 18,
        onSelect: () => {
          this.clear();
          onRetryStage?.();
        },
      }),
      new SetupButton(this.scene, {
        x: centerX + (isCompact ? 94 : 150),
        y: centerY + (isCompact ? 319 : 226),
        width: isCompact ? 174 : 270,
        height: isCompact ? 46 : 58,
        label: 'BACK TO SETUP',
        fontSize: isCompact ? 14 : 18,
        onSelect: () => {
          this.clear();
          onBackToSetup?.();
        },
      }),
    ].map((button) => button.setScrollFactor(0).setDepth(113).setAlpha(0).setScale(0.97));

    this.scene.tweens.add({
      targets: [this.container, ...this.buttons],
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      ease: 'Quad.easeOut',
    });
  }

  clear() {
    if (this.container) {
      this.scene.tweens.killTweensOf(this.container);
      this.container.destroy(true);
      this.container = null;
    }

    this.buttons.forEach((button) => {
      this.scene.tweens.killTweensOf(button);
      button.destroy();
    });
    this.buttons = [];
  }

  destroy() {
    this.clear();
  }
}
