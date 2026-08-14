import { SETTINGS_PANEL_LABELS } from './settingsPanelContent.js';
import { SetupButton } from './SetupButton.js';
import { getUiLayout } from './responsiveUi.js';

export class SettingsOverlay {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.buttons = [];
    this.soundButton = null;
  }

  get isOpen() {
    return Boolean(this.container);
  }

  show({ isSoundMuted, onToggleSound, onResetProgress }) {
    if (this.container) {
      return;
    }

    const layout = getUiLayout(this.scene, { preferredWidth: 620, margin: 18 });
    const { centerX, centerY, isCompact } = layout;
    const panelWidth = layout.width;
    const panelHeight = isCompact ? 420 : 390;
    const panelX = -panelWidth / 2;
    const panelY = -panelHeight / 2;

    const backdrop = this.scene.add
      .rectangle(
        0,
        0,
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
        0x020713,
        0.62,
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
    panel.lineBetween(panelX + 70, panelY + 28, panelX + panelWidth - 70, panelY + 28);
    panel.lineBetween(
      panelX + 110,
      panelY + panelHeight - 28,
      panelX + panelWidth - 110,
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
      .text(0, isCompact ? -148 : -132, SETTINGS_PANEL_LABELS.title, {
        fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
        fontSize: isCompact ? '30px' : '38px',
        color: '#f2fbff',
        fontStyle: '700',
        letterSpacing: 3,
      })
      .setOrigin(0.5);
    const subtitle = this.scene.add
      .text(0, isCompact ? -108 : -92, SETTINGS_PANEL_LABELS.subtitle, {
        fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
        fontSize: '14px',
        color: '#83d9f5',
        fontStyle: '700',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.container = this.scene.add
      .container(centerX, centerY, [backdrop, glow, panel, title, subtitle])
      .setScrollFactor(0)
      .setDepth(120)
      .setAlpha(0)
      .setScale(0.97);

    this.soundButton = new SetupButton(this.scene, {
      x: centerX,
      y: centerY - 30,
      width: Math.min(320, panelWidth - 56),
      height: 56,
      label: isSoundMuted ? SETTINGS_PANEL_LABELS.soundOff : SETTINGS_PANEL_LABELS.soundOn,
      fontSize: 18,
      onSelect: () => {
        const nextIsMuted = onToggleSound?.() ?? false;
        this.setSoundMuted(nextIsMuted);
      },
    });

    const resetButton = new SetupButton(this.scene, {
      x: centerX,
      y: centerY + 42,
      width: Math.min(320, panelWidth - 56),
      height: 56,
      label: SETTINGS_PANEL_LABELS.resetProgress,
      fontSize: 18,
      onSelect: () => onResetProgress?.(),
    });
    const closeButton = new SetupButton(this.scene, {
      x: centerX,
      y: centerY + 116,
      width: Math.min(320, panelWidth - 56),
      height: 56,
      label: SETTINGS_PANEL_LABELS.close,
      fontSize: 18,
      onSelect: () => this.clear(),
    });

    this.buttons = [this.soundButton, resetButton, closeButton].map((button) =>
      button.setScrollFactor(0).setDepth(123).setAlpha(0).setScale(0.97),
    );

    this.scene.tweens.add({
      targets: [this.container, ...this.buttons],
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 170,
      ease: 'Quad.easeOut',
    });
  }

  setSoundMuted(isMuted) {
    this.soundButton?.setLabel(
      isMuted ? SETTINGS_PANEL_LABELS.soundOff : SETTINGS_PANEL_LABELS.soundOn,
    );
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
    this.soundButton = null;
  }

  destroy() {
    this.clear();
  }
}
