const HINT_DURATION_MS = 2200;
const HINT_EXIT_MS = 320;
const CARD_WIDTH = 236;
const CARD_HEIGHT = 108;
const CARD_RADIUS = 12;
const ICON_X = 48;
const TEXT_CENTER_X = 146;

export class DangerZoneHint {
  constructor(scene, { left = 0 } = {}) {
    this.scene = scene;
    this.left = left;
    this.container = null;
    this.card = null;
    this.beam = null;
    this.animatedElements = [];
    this.timers = [];
  }

  show() {
    if (this.container) {
      return;
    }

    const camera = this.scene.cameras.main;
    const centerY = camera.height / 2;
    const beam = this.scene.add.graphics();
    const cardGlow = this.scene.add.graphics();
    const cardFace = this.scene.add.graphics();
    const warningGlow = this.scene.add.graphics();
    const warningIcon = this.scene.add.graphics();

    beam.fillStyle(0xff2638, 0.16);
    beam.fillRoundedRect(24, -centerY + 92, 28, camera.height - 184, 14);
    beam.lineStyle(16, 0xff2638, 0.24);
    beam.lineBetween(38, -centerY + 110, 38, centerY - 110);
    beam.lineStyle(4, 0xff7c82, 1);
    beam.lineBetween(38, -centerY + 92, 38, centerY - 92);

    cardGlow.fillStyle(0xff2638, 0.18);
    cardGlow.fillRoundedRect(-8, -CARD_HEIGHT / 2 - 8, CARD_WIDTH + 16, CARD_HEIGHT + 16, 16);
    cardGlow.lineStyle(10, 0xff2638, 0.16);
    cardGlow.strokeRoundedRect(0, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);

    cardFace.fillStyle(0x2b0711, 0.94);
    cardFace.fillRoundedRect(0, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);
    cardFace.lineStyle(2, 0xff6b72, 0.96);
    cardFace.strokeRoundedRect(0, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);
    cardFace.lineStyle(8, 0xff2638, 0.16);
    cardFace.strokeRoundedRect(5, -CARD_HEIGHT / 2 + 5, CARD_WIDTH - 10, CARD_HEIGHT - 10, 10);

    warningGlow.lineStyle(11, 0xff2638, 0.2);
    warningGlow.strokeTriangle(0, -32, 32, 30, -32, 30);
    warningGlow.lineStyle(4, 0xff5060, 0.56);
    warningGlow.strokeTriangle(0, -32, 32, 30, -32, 30);

    warningIcon.fillStyle(0xff4a55, 0.96);
    warningIcon.fillTriangle(0, -27, 28, 27, -28, 27);
    warningIcon.lineStyle(2, 0xffa1a8, 0.95);
    warningIcon.strokeTriangle(0, -27, 28, 27, -28, 27);
    warningIcon.fillStyle(0xfff4f4, 0.98);
    warningIcon.fillRoundedRect(-3, -9, 6, 21, 2);
    warningIcon.fillCircle(0, 21, 3);

    const iconContainer = this.scene.add.container(ICON_X, 1, [warningGlow, warningIcon]);

    const title = this.scene.add
      .text(TEXT_CENTER_X, -15, 'DANGER', {
        fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
        fontSize: '24px',
        color: '#fff3f4',
        fontStyle: '700',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    const label = this.scene.add
      .text(TEXT_CENTER_X, 19, 'ZONE', {
        fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
        fontSize: '17px',
        color: '#ff9aa1',
        fontStyle: '700',
        letterSpacing: 3,
      })
      .setOrigin(0.5);

    const content = this.scene.add.container(0, 0, [iconContainer, title, label]);

    this.animatedElements = [cardGlow, warningGlow, warningIcon, iconContainer, content, title, label];

    this.beam = this.scene.add.container(0, 0, [beam]).setAlpha(0);
    this.card = this.scene.add
      .container(78, 0, [cardGlow, cardFace, content])
      .setAlpha(0)
      .setScale(0.92);
    this.container = this.scene.add
      .container(this.left, centerY, [this.beam, this.card])
      .setScrollFactor(0)
      .setDepth(38)
      .setAlpha(1);

    this.scene.tweens.add({
      targets: this.beam,
      alpha: 0.92,
      duration: 180,
      ease: 'Quad.easeOut',
    });
    this.scene.tweens.add({
      targets: this.beam,
      alpha: 0.58,
      duration: 360,
      delay: 180,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.scene.tweens.add({
      targets: this.card,
      x: 58,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 260,
      ease: 'Back.easeOut',
    });
    this.scene.tweens.add({
      targets: cardGlow,
      alpha: 0.54,
      duration: 360,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.scene.tweens.add({
      targets: this.card,
      scaleX: 1.025,
      scaleY: 1.025,
      duration: 360,
      delay: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.scene.tweens.add({
      targets: content,
      alpha: 0.78,
      scaleX: 1.035,
      scaleY: 1.035,
      duration: 360,
      delay: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.scene.tweens.add({
      targets: warningGlow,
      alpha: 0.42,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 360,
      delay: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.timers.push(this.scene.time.delayedCall(HINT_DURATION_MS, () => this.hide()));
  }

  hide() {
    if (!this.container || !this.card || !this.beam) {
      return;
    }

    this.scene.tweens.killTweensOf([this.card, this.beam, ...this.animatedElements]);
    this.scene.tweens.add({
      targets: this.card,
      x: 76,
      alpha: 0,
      scaleX: 0.94,
      scaleY: 0.94,
      duration: HINT_EXIT_MS,
      ease: 'Quad.easeIn',
    });
    this.scene.tweens.add({
      targets: this.beam,
      alpha: 0,
      duration: HINT_EXIT_MS,
      ease: 'Quad.easeIn',
      onComplete: () => this.clear(),
    });
  }

  clear() {
    if (!this.container) {
      return;
    }

    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.killTweensOf(this.card);
    this.scene.tweens.killTweensOf(this.beam);
    this.scene.tweens.killTweensOf(this.animatedElements);
    this.timers.forEach((timer) => timer.remove(false));
    this.timers = [];
    this.animatedElements = [];
    this.container.destroy(true);
    this.container = null;
    this.card = null;
    this.beam = null;
  }

  destroy() {
    this.clear();
  }
}
