const PANEL = Object.freeze({
  width: 980,
  height: 660,
});

const TEXT_STYLE = Object.freeze({
  fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
});

export class SetupPanel {
  constructor(scene) {
    this.scene = scene;
    this.graphics = [];
    this.texts = [];
  }

  create(centerX, centerY) {
    const dimmer = this.scene.add
      .rectangle(
        centerX,
        centerY,
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
        0x03101f,
        0.35,
      )
      .setDepth(10);

    this.graphics.push(dimmer);
    this.drawSystemPanel(centerX, centerY);
    this.createLabels(centerX, centerY);
    this.createCourseDisplay(centerX, centerY);
  }

  drawSystemPanel(centerX, centerY) {
    const x = centerX - PANEL.width / 2;
    const y = centerY - PANEL.height / 2;
    const panelGlow = this.scene.add.graphics().setDepth(20);
    const panel = this.scene.add.graphics().setDepth(21);

    panelGlow.fillStyle(0x24a9ff, 0.1);
    panelGlow.fillRoundedRect(x - 9, y - 9, PANEL.width + 18, PANEL.height + 18, 16);
    panelGlow.lineStyle(10, 0x24a9ff, 0.08);
    panelGlow.strokeRoundedRect(x, y, PANEL.width, PANEL.height, 10);

    panel.fillStyle(0x061a34, 0.92);
    panel.fillRoundedRect(x, y, PANEL.width, PANEL.height, 10);
    panel.lineStyle(2, 0x7cdbff, 0.95);
    panel.strokeRoundedRect(x, y, PANEL.width, PANEL.height, 10);

    panel.lineStyle(1, 0xb7edff, 0.7);
    panel.lineBetween(x + 190, y + 18, x + PANEL.width - 28, y + 18);
    panel.lineBetween(x + 28, y + PANEL.height - 18, x + PANEL.width - 150, y + PANEL.height - 18);
    panel.lineStyle(2, 0x59c9ff, 0.9);
    panel.lineBetween(x + 14, y + 42, x + 14, y + 125);
    panel.lineBetween(x + PANEL.width - 14, y + PANEL.height - 125, x + PANEL.width - 14, y + PANEL.height - 42);

    panel.fillStyle(0x9ae7ff, 0.9);
    panel.fillTriangle(x, y + 26, x + 26, y, x + 26, y + 6);
    panel.fillTriangle(
      x + PANEL.width,
      y + PANEL.height - 26,
      x + PANEL.width - 26,
      y + PANEL.height,
      x + PANEL.width - 26,
      y + PANEL.height - 6,
    );

    this.graphics.push(panelGlow, panel);
  }

  createLabels(centerX, centerY) {
    this.texts.push(
      this.scene.add
        .text(centerX, centerY - 292, 'SYSTEM - SESSION CONFIGURATION', {
          ...TEXT_STYLE,
          fontSize: '25px',
          color: '#eaf9ff',
          fontStyle: '700',
        })
        .setOrigin(0.5)
        .setDepth(23),
      this.scene.add
        .text(centerX, centerY - 258, 'Configure your training protocol', {
          ...TEXT_STYLE,
          fontSize: '15px',
          color: '#87b8d3',
          letterSpacing: 1,
        })
        .setOrigin(0.5)
        .setDepth(23),
    );

    this.createSectionLabel(centerX - 390, centerY - 220, 'COURSE');
    this.createSectionLabel(centerX - 390, centerY - 134, 'LANGUAGE');
    this.createSectionLabel(centerX - 390, centerY - 54, 'SELECT STAGE');
  }

  createSectionLabel(x, y, label) {
    this.texts.push(
      this.scene.add
        .text(x, y, label, {
          ...TEXT_STYLE,
          fontSize: '14px',
          color: '#75cdec',
          fontStyle: '700',
          letterSpacing: 2,
        })
        .setOrigin(0, 1)
        .setDepth(23),
    );
  }

  createCourseDisplay(centerX, centerY) {
    this.graphics.push(
      this.scene.add
        .rectangle(centerX, centerY - 188, 780, 42, 0x124b70, 0.88)
        .setStrokeStyle(2, 0xa2e8ff, 0.9)
        .setDepth(22),
    );

    this.texts.push(
      this.scene.add
        .text(centerX, centerY - 188, 'GENERAL', {
          ...TEXT_STYLE,
          fontSize: '20px',
          color: '#effbff',
          fontStyle: '700',
          letterSpacing: 3,
        })
        .setOrigin(0.5)
        .setDepth(23),
    );
  }

  destroy() {
    this.graphics.forEach((graphic) => graphic.destroy());
    this.texts.forEach((text) => text.destroy());
    this.graphics = [];
    this.texts = [];
  }
}
