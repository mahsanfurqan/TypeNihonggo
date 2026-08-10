import Phaser from 'phaser';

const BUTTON_COLORS = Object.freeze({
  idleFill: 0x0b2342,
  idleStroke: 0x4f91b8,
  hoverFill: 0x12365f,
  hoverStroke: 0x85ddff,
  selectedFill: 0x17608a,
  selectedStroke: 0xa9ecff,
  disabledFill: 0x09182b,
  disabledStroke: 0x355269,
});

export class SetupButton extends Phaser.GameObjects.Container {
  constructor(scene, { x, y, width, height, label, onSelect, fontSize = 18 }) {
    super(scene, x, y);

    this.onSelect = onSelect;
    this.isSelected = false;
    this.isHovered = false;
    this.isEnabled = true;

    this.background = scene.add
      .rectangle(0, 0, width, height, BUTTON_COLORS.idleFill, 0.92)
      .setStrokeStyle(2, BUTTON_COLORS.idleStroke, 0.8)
      .setInteractive({ useHandCursor: true });

    this.label = scene.add
      .text(0, 0, label, {
        fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
        fontSize: `${fontSize}px`,
        color: '#e8f7ff',
        fontStyle: '700',
      })
      .setOrigin(0.5);

    this.add([this.background, this.label]);
    this.setDepth(24);
    scene.add.existing(this);

    this.background.on('pointerover', this.handlePointerOver, this);
    this.background.on('pointerout', this.handlePointerOut, this);
    this.background.on('pointerdown', this.handlePointerDown, this);
  }

  handlePointerOver() {
    if (!this.isEnabled) {
      return;
    }

    this.isHovered = true;
    this.refreshStyle();
  }

  handlePointerOut() {
    this.isHovered = false;
    this.refreshStyle();
  }

  handlePointerDown() {
    if (!this.isEnabled) {
      return;
    }

    this.onSelect?.();
  }

  setSelected(isSelected) {
    this.isSelected = isSelected;
    this.refreshStyle();
    return this;
  }

  setEnabled(isEnabled) {
    this.isEnabled = isEnabled;
    this.isHovered = false;

    if (isEnabled) {
      this.background.setInteractive({ useHandCursor: true });
    } else {
      this.background.disableInteractive();
    }

    this.refreshStyle();
    return this;
  }

  setLabel(label) {
    this.label.setText(label);
    return this;
  }

  refreshStyle() {
    let fillColor = BUTTON_COLORS.idleFill;
    let strokeColor = BUTTON_COLORS.idleStroke;
    let strokeAlpha = 0.8;

    if (!this.isEnabled) {
      fillColor = BUTTON_COLORS.disabledFill;
      strokeColor = BUTTON_COLORS.disabledStroke;
      strokeAlpha = 0.55;
    } else if (this.isSelected) {
      fillColor = BUTTON_COLORS.selectedFill;
      strokeColor = BUTTON_COLORS.selectedStroke;
      strokeAlpha = 1;
    } else if (this.isHovered) {
      fillColor = BUTTON_COLORS.hoverFill;
      strokeColor = BUTTON_COLORS.hoverStroke;
      strokeAlpha = 0.95;
    }

    this.background.setFillStyle(fillColor, 0.92);
    this.background.setStrokeStyle(2, strokeColor, strokeAlpha);
    this.label.setAlpha(this.isEnabled ? 1 : 0.45);
  }

  destroy(fromScene) {
    this.background.off('pointerover', this.handlePointerOver, this);
    this.background.off('pointerout', this.handlePointerOut, this);
    this.background.off('pointerdown', this.handlePointerDown, this);
    super.destroy(fromScene);
  }
}
