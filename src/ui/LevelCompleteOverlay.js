const DISPLAY_DURATION_MS = 1300;
const ENTER_DURATION_MS = 160;
const EXIT_DURATION_MS = 220;

export class LevelCompleteOverlay {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.exitTimer = null;
  }

  show(currentLevel, nextLevel, onComplete) {
    if (this.container) {
      return;
    }

    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;
    const panelWidth = Math.min(640, this.scene.cameras.main.width - 80);
    const panelHeight = 210;
    const panelX = -panelWidth / 2;
    const panelY = -panelHeight / 2;

    const backdrop = this.scene.add.rectangle(
      0,
      0,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0x020713,
      0.48,
    );
    const glow = this.scene.add.graphics();
    const panel = this.scene.add.graphics();

    glow.fillStyle(0x27b7ff, 0.08);
    glow.fillRoundedRect(panelX - 10, panelY - 10, panelWidth + 20, panelHeight + 20, 14);
    glow.lineStyle(8, 0x27b7ff, 0.12);
    glow.strokeRoundedRect(panelX - 3, panelY - 3, panelWidth + 6, panelHeight + 6, 10);

    panel.fillStyle(0x071a35, 0.94);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);
    panel.lineStyle(2, 0x83ddff, 0.95);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);
    panel.lineStyle(1, 0xc3f1ff, 0.72);
    panel.lineBetween(panelX + 46, panelY + 24, panelX + panelWidth - 46, panelY + 24);
    panel.lineBetween(
      panelX + 88,
      panelY + panelHeight - 24,
      panelX + panelWidth - 88,
      panelY + panelHeight - 24,
    );
    panel.lineStyle(3, 0x44c8ff, 0.9);
    panel.lineBetween(panelX + 18, panelY + 42, panelX + 18, panelY + panelHeight - 42);
    panel.lineBetween(
      panelX + panelWidth - 18,
      panelY + 42,
      panelX + panelWidth - 18,
      panelY + panelHeight - 42,
    );
    panel.fillStyle(0xa6ebff, 0.95);
    panel.fillTriangle(panelX, panelY + 25, panelX + 25, panelY, panelX + 25, panelY + 6);
    panel.fillTriangle(
      panelX + panelWidth,
      panelY + panelHeight - 25,
      panelX + panelWidth - 25,
      panelY + panelHeight,
      panelX + panelWidth - 25,
      panelY + panelHeight - 6,
    );

    const title = this.scene.add
      .text(0, -34, 'LEVEL COMPLETE', {
        fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
        fontSize: '40px',
        color: '#f2fbff',
        fontStyle: '700',
        letterSpacing: 3,
      })
      .setOrigin(0.5);
    const levelLabel = this.scene.add
      .text(0, 38, `LEVEL ${currentLevel} → LEVEL ${nextLevel}`, {
        fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
        fontSize: '24px',
        color: '#83d9f5',
        fontStyle: '700',
        letterSpacing: 1,
      })
      .setOrigin(0.5);

    this.container = this.scene.add
      .container(centerX, centerY, [backdrop, glow, panel, title, levelLabel])
      .setScrollFactor(0)
      .setDepth(95)
      .setAlpha(0)
      .setScale(0.96);

    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: ENTER_DURATION_MS,
      ease: 'Quad.easeOut',
    });

    this.exitTimer = this.scene.time.delayedCall(DISPLAY_DURATION_MS - EXIT_DURATION_MS, () => {
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        scaleX: 1.02,
        scaleY: 1.02,
        duration: EXIT_DURATION_MS,
        ease: 'Quad.easeIn',
        onComplete: () => {
          this.clear();
          onComplete?.();
        },
      });
    });
  }

  clear() {
    this.exitTimer?.remove(false);
    this.exitTimer = null;

    if (this.container) {
      this.scene.tweens.killTweensOf(this.container);
      this.container.destroy(true);
      this.container = null;
    }
  }

  destroy() {
    this.clear();
  }
}

export { DISPLAY_DURATION_MS as LEVEL_COMPLETE_DURATION_MS };
