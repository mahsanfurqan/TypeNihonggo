import Phaser from 'phaser';
import { SetupButton } from './SetupButton.js';

function drawDropdownArrow(graphics, x, y, isOpen) {
  graphics.clear();
  graphics.lineStyle(2, 0x9ceaff, 0.92);

  if (isOpen) {
    graphics.lineBetween(x - 7, y + 4, x, y - 4);
    graphics.lineBetween(x, y - 4, x + 7, y + 4);
    return;
  }

  graphics.lineBetween(x - 7, y - 4, x, y + 4);
  graphics.lineBetween(x, y + 4, x + 7, y - 4);
}

function drawLockIcon(graphics, x, y) {
  graphics.lineStyle(3, 0x8fe8ff, 0.86);
  graphics.strokeRoundedRect(x - 9, y - 1, 18, 17, 4);
  graphics.lineStyle(3, 0x6bd6ff, 0.78);
  graphics.beginPath();
  graphics.arc(x, y - 2, 9, Math.PI, Math.PI * 2, false);
  graphics.strokePath();
  graphics.fillStyle(0x1d83b3, 0.42);
  graphics.fillRoundedRect(x - 7, y + 1, 14, 13, 3);
  graphics.fillStyle(0xd9f8ff, 0.9);
  graphics.fillCircle(x, y + 7, 2);
}

function drawFlagIcon(graphics, x, y, flag) {
  graphics.clear();

  if (!flag) {
    return;
  }

  graphics.fillStyle(0x061a34, 0.9);
  graphics.fillRoundedRect(x - 2, y - 2, 32, 22, 3);
  graphics.lineStyle(1, 0x9ceaff, 0.84);
  graphics.strokeRoundedRect(x - 2, y - 2, 32, 22, 3);

  if (flag === 'id') {
    graphics.fillStyle(0xfff7f0, 1);
    graphics.fillRect(x, y, 28, 18);
    graphics.fillStyle(0xd92734, 1);
    graphics.fillRect(x, y, 28, 9);
    return;
  }

  if (flag === 'us') {
    const stripeHeight = 18 / 7;

    for (let index = 0; index < 7; index += 1) {
      graphics.fillStyle(index % 2 === 0 ? 0xd92734 : 0xfff7f0, 1);
      graphics.fillRect(x, y + index * stripeHeight, 28, stripeHeight + 0.2);
    }

    graphics.fillStyle(0x214a86, 1);
    graphics.fillRect(x, y, 12, 10);
    graphics.fillStyle(0xffffff, 0.95);
    graphics.fillCircle(x + 4, y + 3, 1);
    graphics.fillCircle(x + 8, y + 5, 1);
    graphics.fillCircle(x + 4, y + 7, 1);
  }
}

export class Dropdown {
  constructor(scene, {
    x,
    y,
    width,
    height = 50,
    options = [],
    selectedValue,
    onSelect,
    onOpen,
    fontSize = 16,
    optionHeight = 48,
    depth = 70,
  }) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.options = options;
    this.selectedValue = selectedValue;
    this.onSelect = onSelect;
    this.onOpen = onOpen;
    this.fontSize = fontSize;
    this.optionHeight = optionHeight;
    this.depth = depth;
    this.optionButtons = [];
    this.optionIcons = [];
    this.triggerIcon = null;
    this.panel = null;
    this.isOpen = false;

    this.trigger = new SetupButton(scene, {
      x,
      y,
      width,
      height,
      label: this.getSelectedLabel(),
      fontSize,
      onSelect: () => this.toggle(),
    }).setDepth(depth);

    this.arrow = scene.add.graphics().setDepth(depth + 1);
    this.triggerIcon = scene.add.graphics().setDepth(depth + 1);
    drawDropdownArrow(this.arrow, x + width / 2 - 28, y, false);
    this.refreshTriggerIcon();
  }

  getSelectedOption() {
    return this.options.find((option) => option.value === this.selectedValue) ?? null;
  }

  getSelectedLabel() {
    return this.getSelectedOption()?.label ?? 'SELECT';
  }

  refreshTriggerIcon() {
    const flagX = this.x - this.trigger.label.width / 2 - 44;

    drawFlagIcon(
      this.triggerIcon,
      flagX,
      this.y - 9,
      this.getSelectedOption()?.flag,
    );
  }

  setOptions(options) {
    this.options = options;
    this.trigger.setLabel(this.getSelectedLabel());
    this.refreshTriggerIcon();

    if (this.isOpen) {
      this.close();
      this.open();
    }
  }

  setSelectedValue(selectedValue) {
    this.selectedValue = selectedValue;
    this.trigger.setLabel(this.getSelectedLabel());
    this.refreshTriggerIcon();
  }

  toggle() {
    if (this.isOpen) {
      this.close();
      return;
    }

    this.open();
  }

  open() {
    if (this.isOpen) {
      return;
    }

    this.isOpen = true;
    this.onOpen?.();
    drawDropdownArrow(this.arrow, this.x + this.width / 2 - 28, this.y, true);

    const listHeight = this.options.length * this.optionHeight + 12;
    const panelY = this.y + this.height / 2 + listHeight / 2 + 8;

    this.panel = this.scene.add.graphics().setDepth(this.depth + 4);
    this.panel.fillStyle(0x04152b, 0.96);
    this.panel.fillRoundedRect(
      this.x - this.width / 2,
      panelY - listHeight / 2,
      this.width,
      listHeight,
      8,
    );
    this.panel.lineStyle(2, 0x75dfff, 0.8);
    this.panel.strokeRoundedRect(
      this.x - this.width / 2,
      panelY - listHeight / 2,
      this.width,
      listHeight,
      8,
    );

    this.optionButtons = this.options.map((option, index) => {
      const button = new SetupButton(this.scene, {
        x: this.x,
        y: this.y + this.height / 2 + 14 + this.optionHeight / 2 + index * this.optionHeight,
        width: this.width - 14,
        height: this.optionHeight - 6,
        label: option.label,
        fontSize: this.fontSize,
        onSelect: () => {
          if (option.isEnabled === false) {
            return;
          }

          this.selectedValue = option.value;
          this.trigger.setLabel(option.label);
          this.refreshTriggerIcon();
          this.close();
          this.onSelect?.(option.value, option);
        },
      })
        .setDepth(this.depth + 6)
        .setSelected(option.value === this.selectedValue)
        .setEnabled(option.isEnabled !== false);

      if (option.flag) {
        const icon = this.scene.add.graphics().setDepth(this.depth + 7);
        drawFlagIcon(icon, button.x - button.label.width / 2 - 44, button.y - 9, option.flag);
        this.optionIcons.push(icon);
      }

      if (option.isEnabled === false) {
        const icon = this.scene.add.graphics().setDepth(this.depth + 7);
        drawLockIcon(icon, button.x + this.width / 2 - 44, button.y - 8);
        this.optionIcons.push(icon);
      }

      return button;
    });
  }

  close() {
    if (!this.isOpen) {
      return;
    }

    this.isOpen = false;
    drawDropdownArrow(this.arrow, this.x + this.width / 2 - 28, this.y, false);
    this.panel?.destroy();
    this.panel = null;
    this.optionButtons.forEach((button) => button.destroy());
    this.optionIcons.forEach((icon) => icon.destroy());
    this.optionButtons = [];
    this.optionIcons = [];
  }

  destroy() {
    this.close();
    this.trigger.destroy();
    this.arrow.destroy();
    this.triggerIcon.destroy();
  }
}
