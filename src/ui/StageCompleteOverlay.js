import { createResultStatsGraph } from './ResultStatsGraph.js';
import { SetupButton } from './SetupButton.js';
import { createCompactVocabularyReview } from './VocabularyReviewPanel.js';
import { getUiLayout } from './responsiveUi.js';

const FONT_FAMILY = '"Trebuchet MS", "Segoe UI", sans-serif';

export class StageCompleteOverlay {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.buttons = [];
  }

  show({ stage, nextStage, canStartNextStage, stats, onNextStage, onBackToMenu }) {
    if (this.container) {
      return;
    }

    const layout = getUiLayout(this.scene, { preferredWidth: 760, margin: 12 });
    const { centerX, centerY, isCompact } = layout;
    const panelWidth = layout.width;
    const panelHeight = isCompact ? 590 : 530;
    const panelX = -panelWidth / 2;
    const panelY = -panelHeight / 2;

    const backdrop = this.scene.add
      .rectangle(
        0,
        0,
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
        0x020713,
        0.68,
      )
      .setInteractive();
    const glow = this.scene.add.graphics();
    const panel = this.scene.add.graphics();

    glow.fillStyle(0x27b7ff, 0.1);
    glow.fillRoundedRect(panelX - 12, panelY - 12, panelWidth + 24, panelHeight + 24, 16);
    glow.lineStyle(10, 0x27b7ff, 0.12);
    glow.strokeRoundedRect(panelX - 4, panelY - 4, panelWidth + 8, panelHeight + 8, 12);

    panel.fillStyle(0x061a34, 0.97);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
    panel.lineStyle(2, 0x83ddff, 0.96);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
    panel.lineStyle(1, 0xc3f1ff, 0.72);
    panel.lineBetween(panelX + 70, panelY + 28, panelX + panelWidth - 70, panelY + 28);
    panel.lineBetween(
      panelX + 110,
      panelY + panelHeight - 28,
      panelX + panelWidth - 110,
      panelY + panelHeight - 28,
    );
    panel.lineStyle(3, 0x44c8ff, 0.9);
    panel.lineBetween(panelX + 20, panelY + 56, panelX + 20, panelY + panelHeight - 56);
    panel.lineBetween(
      panelX + panelWidth - 20,
      panelY + 56,
      panelX + panelWidth - 20,
      panelY + panelHeight - 56,
    );
    panel.fillStyle(0xa6ebff, 0.95);
    panel.fillTriangle(panelX, panelY + 28, panelX + 28, panelY, panelX + 28, panelY + 7);
    panel.fillTriangle(
      panelX + panelWidth,
      panelY + panelHeight - 28,
      panelX + panelWidth - 28,
      panelY + panelHeight,
      panelX + panelWidth - 28,
      panelY + panelHeight - 7,
    );

    const title = this.scene.add
      .text(0, isCompact ? -240 : -160, 'STAGE COMPLETE', {
        fontFamily: FONT_FAMILY,
        fontSize: isCompact ? '34px' : '42px',
        color: '#f2fbff',
        fontStyle: '700',
        letterSpacing: 3,
      })
      .setOrigin(0.5);
    const stageLabel = this.scene.add
      .text(0, isCompact ? -193 : -104, `LEVEL ${stage.levelRange.min} - ${stage.levelRange.max} CLEARED`, {
        fontFamily: FONT_FAMILY,
        fontSize: isCompact ? '17px' : '21px',
        color: '#83d9f5',
        fontStyle: '700',
        letterSpacing: 1,
      })
      .setOrigin(0.5);
    const statusLabel = this.scene.add
      .text(
        0,
        isCompact ? -160 : -73,
        nextStage ? `NEXT PROTOCOL - LEVEL ${nextStage.levelRange.min}` : 'GENERAL COURSE CLEARED',
        {
          fontFamily: FONT_FAMILY,
          fontSize: '15px',
          color: '#7daac2',
          letterSpacing: 1,
        },
      )
      .setOrigin(0.5);
    const summary = stats
      ? [
          createResultStatsGraph(this.scene, stats, {
            x: 0,
            y: isCompact ? -55 : 16,
            compact: true,
            narrow: isCompact,
          }),
        ]
      : [];
    const vocabularyReview = createCompactVocabularyReview(
      this.scene,
      stats?.vocabularyReview,
      isCompact ? { width: panelWidth - 48, y: 62 } : undefined,
    );

    this.container = this.scene.add
      .container(centerX, centerY, [
        backdrop,
        glow,
        panel,
        title,
        stageLabel,
        statusLabel,
        ...summary,
        ...vocabularyReview,
      ])
      .setScrollFactor(0)
      .setDepth(95)
      .setAlpha(0)
      .setScale(0.97);

    const nextButton = new SetupButton(this.scene, {
      x: centerX - (isCompact ? 94 : 165),
      y: centerY + (isCompact ? 245 : 202),
      width: isCompact ? 174 : 280,
      height: isCompact ? 48 : 58,
      label: 'NEXT STAGE',
      fontSize: isCompact ? 14 : 18,
      onSelect: () => {
        this.clear();
        onNextStage?.();
      },
    })
      .setDepth(98)
      .setEnabled(Boolean(nextStage && canStartNextStage))
      .setAlpha(0)
      .setScale(0.97);
    const menuButton = new SetupButton(this.scene, {
      x: centerX + (isCompact ? 94 : 165),
      y: centerY + (isCompact ? 245 : 202),
      width: isCompact ? 174 : 280,
      height: isCompact ? 48 : 58,
      label: 'BACK TO MENU',
      fontSize: isCompact ? 14 : 18,
      onSelect: () => {
        this.clear();
        onBackToMenu?.();
      },
    })
      .setDepth(98)
      .setAlpha(0)
      .setScale(0.97);

    this.buttons = [nextButton, menuButton];

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
