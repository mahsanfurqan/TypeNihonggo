import { SetupButton } from './SetupButton.js';
import { getUiLayout } from './responsiveUi.js';

export class PauseMenu {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.buttons = [];
  }

  show({ currentLevel, onResume, onRestartStage, onBackToSetup }) {
    if (this.container) {
      return;
    }

    const layout = getUiLayout(this.scene, { preferredWidth: 590, margin: 18 });
    const { centerX, centerY, isCompact } = layout;
    const panelWidth = layout.width;
    const panelHeight = 470;
    const panelX = -panelWidth / 2;
    const panelY = -panelHeight / 2;

    const backdrop = this.scene.add
      .rectangle(
        0,
        0,
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
        0x020713,
        0.7,
      )
      .setInteractive();
    const glow = this.scene.add.graphics();
    const panel = this.scene.add.graphics();

    glow.fillStyle(0x27b7ff, 0.1);
    glow.fillRoundedRect(panelX - 12, panelY - 12, panelWidth + 24, panelHeight + 24, 16);
    glow.lineStyle(10, 0x27b7ff, 0.12);
    glow.strokeRoundedRect(panelX - 4, panelY - 4, panelWidth + 8, panelHeight + 8, 12);

    panel.fillStyle(0x061a34, 0.98);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
    panel.lineStyle(2, 0x83ddff, 0.96);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
    panel.lineStyle(1, 0xc3f1ff, 0.72);
    panel.lineBetween(panelX + 64, panelY + 28, panelX + panelWidth - 64, panelY + 28);
    panel.lineBetween(
      panelX + 96,
      panelY + panelHeight - 28,
      panelX + panelWidth - 96,
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
      .text(0, -158, 'SYSTEM - PAUSED', {
        fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
        fontSize: isCompact ? '30px' : '36px',
        color: '#f2fbff',
        fontStyle: '700',
        letterSpacing: 2,
      })
      .setOrigin(0.5);
    const levelLabel = this.scene.add
      .text(0, -105, `GENERAL - LEVEL ${currentLevel}`, {
        fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
        fontSize: '16px',
        color: '#83d9f5',
        fontStyle: '700',
        letterSpacing: 1,
      })
      .setOrigin(0.5);

    this.container = this.scene.add
      .container(centerX, centerY, [backdrop, glow, panel, title, levelLabel])
      .setScrollFactor(0)
      .setDepth(105)
      .setAlpha(0)
      .setScale(0.97);

    const buttonDefinitions = [
      { label: 'RESUME', y: centerY - 35, onSelect: onResume },
      { label: 'RESTART STAGE', y: centerY + 45, onSelect: onRestartStage },
      { label: 'BACK TO SETUP', y: centerY + 125, onSelect: onBackToSetup },
    ];

    this.buttons = buttonDefinitions.map(
      ({ label, y, onSelect }) =>
        new SetupButton(this.scene, {
          x: centerX,
          y,
          width: Math.min(360, panelWidth - 52),
          height: 58,
          label,
          fontSize: 18,
          onSelect: () => {
            this.clear();
            onSelect?.();
          },
        })
          .setScrollFactor(0)
          .setDepth(108)
          .setAlpha(0)
          .setScale(0.97),
    );

    this.scene.tweens.add({
      targets: [this.container, ...this.buttons],
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 160,
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
