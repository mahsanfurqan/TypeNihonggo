import { SetupButton } from './SetupButton.js';
import { formatElapsedTime } from '../utils/formatTime.js';

const MAX_LIVES = 3;

function resolveHudLayout(scene) {
  const viewport = scene.gameplayViewport ?? {
    left: 0,
    right: scene.cameras.main.width,
    width: scene.cameras.main.width,
  };
  const isCompact = viewport.width < 720;

  if (!isCompact) {
    const offsetX = viewport.left;

    return {
      isCompact,
      panel: {
        x: offsetX + 28,
        y: 24,
        width: Math.min(552, viewport.width - 56),
        height: 138,
      },
      title: { x: offsetX + 54, y: 39, fontSize: 22, text: 'SYSTEM - TypeNihongo' },
      session: { x: offsetX + 558, y: 45, fontSize: 14, originX: 1 },
      lives: { x: offsetX + 54, y: 76 },
      heartStartX: offsetX + 126,
      heartTopY: 76,
      heartSize: 22,
      heartSpacing: 32,
      time: { x: offsetX + 278, y: 76 },
      score: { x: offsetX + 414, y: 76 },
      target: { x: offsetX + 54, y: 108 },
      metaFontSize: 18,
      menu: { x: viewport.right - 92, y: 50, width: 136, height: 46, fontSize: 16 },
      sound: { x: viewport.right - 92, y: 104, width: 136, height: 36, fontSize: 13 },
    };
  }

  const left = viewport.left;
  const right = viewport.right;

  return {
    isCompact,
    panel: { x: left + 12, y: 16, width: viewport.width - 24, height: 146 },
    title: { x: left + 30, y: 29, fontSize: 18, text: 'SYSTEM - TypeNihongo' },
    session: { x: left + 30, y: 57, fontSize: 12, originX: 0 },
    lives: { x: left + 30, y: 84 },
    heartStartX: left + 92,
    heartTopY: 84,
    heartSize: 18,
    heartSpacing: 26,
    time: { x: left + 198, y: 84 },
    score: { x: left + 198, y: 116 },
    target: { x: left + 30, y: 116 },
    metaFontSize: 14,
    menu: { x: right - 61, y: 39, width: 96, height: 34, fontSize: 13 },
    sound: { x: right - 61, y: 82, width: 96, height: 30, fontSize: 11 },
  };
}

export class Hud {
  constructor(scene, { onMenu, onToggleSound, isSoundMuted = false } = {}) {
    this.scene = scene;
    this.layout = resolveHudLayout(scene);
    this.currentLives = MAX_LIVES;
    this.lifeHearts = [];

    this.panelGlow = scene.add.graphics().setScrollFactor(0).setDepth(40);
    this.panel = scene.add.graphics().setScrollFactor(0).setDepth(41);
    this.drawStatusWindow();

    this.titleLabel = scene.add
      .text(this.layout.title.x, this.layout.title.y, this.layout.title.text, {
        fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
        fontSize: `${this.layout.title.fontSize}px`,
        color: '#e9f8ff',
        fontStyle: '700',
      })
      .setScrollFactor(0)
      .setDepth(43);

    this.sessionLabel = scene.add
      .text(this.layout.session.x, this.layout.session.y, 'GENERAL - LEVEL 1', {
        fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
        fontSize: `${this.layout.session.fontSize}px`,
        color: '#83d9f5',
        fontStyle: '700',
        letterSpacing: 1,
      })
      .setOrigin(this.layout.session.originX, 0)
      .setScrollFactor(0)
      .setDepth(43);

    this.livesLabel = this.createMetaText(this.layout.lives.x, this.layout.lives.y, 'LIFE');
    this.createHeartIcons();
    this.timeLabel = this.createMetaText(this.layout.time.x, this.layout.time.y, 'Time: 00:00');
    this.scoreLabel = this.createMetaText(this.layout.score.x, this.layout.score.y, 'Score: 0');
    this.targetLabel = this.createMetaText(
      this.layout.target.x,
      this.layout.target.y,
      'Target: ---',
    );

    this.menuButton = new SetupButton(scene, {
      x: this.layout.menu.x,
      y: this.layout.menu.y,
      width: this.layout.menu.width,
      height: this.layout.menu.height,
      label: 'MENU',
      fontSize: this.layout.menu.fontSize,
      onSelect: onMenu,
    })
      .setScrollFactor(0)
      .setDepth(44);

    this.soundButton = new SetupButton(scene, {
      x: this.layout.sound.x,
      y: this.layout.sound.y,
      width: this.layout.sound.width,
      height: this.layout.sound.height,
      label: isSoundMuted ? 'SOUND OFF' : 'SOUND ON',
      fontSize: this.layout.sound.fontSize,
      onSelect: () => {
        const isMuted = onToggleSound?.() ?? false;
        this.setSoundMuted(isMuted);
      },
    })
      .setScrollFactor(0)
      .setDepth(44);

  }

  drawStatusWindow() {
    const { x, y, width, height } = this.layout.panel;

    this.panelGlow.fillStyle(0x25a9ff, 0.08);
    this.panelGlow.fillRoundedRect(x - 7, y - 7, width + 14, height + 14, 12);
    this.panelGlow.lineStyle(7, 0x25a9ff, 0.1);
    this.panelGlow.strokeRoundedRect(x, y, width, height, 7);

    this.panel.fillStyle(0x071a35, 0.8);
    this.panel.fillRoundedRect(x, y, width, height, 7);
    this.panel.lineStyle(2, 0x76d9ff, 0.9);
    this.panel.strokeRoundedRect(x, y, width, height, 7);

    this.panel.lineStyle(1, 0xb9edff, 0.75);
    this.panel.lineBetween(x + 138, y + 11, x + width - 22, y + 11);
    this.panel.lineBetween(x + 18, y + height - 10, x + width - 92, y + height - 10);
    this.panel.lineStyle(2, 0x56c8ff, 0.9);
    this.panel.lineBetween(x + 10, y + 28, x + 10, y + height - 30);
    this.panel.lineBetween(x + width - 10, y + 20, x + width - 10, y + 52);

    this.panel.fillStyle(0x8ae3ff, 0.9);
    this.panel.fillTriangle(x, y + 18, x + 18, y, x + 18, y + 5);
    this.panel.fillTriangle(
      x + width,
      y + height - 18,
      x + width - 18,
      y + height,
      x + width - 18,
      y + height - 5,
    );
  }

  createMetaText(x, y, value) {
    return this.scene.add
      .text(x, y, value, {
        fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
        fontSize: `${this.layout.metaFontSize}px`,
        color: '#d8e1f2',
      })
      .setScrollFactor(0)
      .setDepth(43);
  }

  createHeartIcons() {
    for (let index = 0; index < MAX_LIVES; index += 1) {
      this.lifeHearts.push(this.scene.add.graphics().setScrollFactor(0).setDepth(43));
    }

    this.updateHeartIcons();
  }

  drawHeart(graphics, centerX, topY, size, isFilled) {
    const half = size / 2;
    const points = [
      { x: centerX - half, y: topY + size * 0.18 },
      { x: centerX - half * 0.72, y: topY },
      { x: centerX - half * 0.28, y: topY },
      { x: centerX, y: topY + size * 0.22 },
      { x: centerX + half * 0.28, y: topY },
      { x: centerX + half * 0.72, y: topY },
      { x: centerX + half, y: topY + size * 0.18 },
      { x: centerX + half, y: topY + size * 0.48 },
      { x: centerX, y: topY + size },
      { x: centerX - half, y: topY + size * 0.48 },
    ];

    if (isFilled) {
      graphics.fillStyle(0x8ee7ff, 1);
      graphics.fillPoints(points, true);
    }

    graphics.lineStyle(2, isFilled ? 0xe6faff : 0x79b7d1, isFilled ? 1 : 0.75);
    graphics.strokePoints(points, true);
  }

  updateHeartIcons() {
    this.lifeHearts.forEach((heart, index) => {
      heart.clear();
      this.drawHeart(
        heart,
        this.layout.heartStartX + index * this.layout.heartSpacing,
        this.layout.heartTopY,
        this.layout.heartSize,
        index < this.currentLives,
      );
    });
  }

  setLives(lives) {
    this.currentLives = Math.max(0, Math.min(MAX_LIVES, lives));
    this.updateHeartIcons();
  }

  setSession(course, level) {
    this.sessionLabel.setText(`${course.toUpperCase()} - LEVEL ${level}`);
  }

  setTime(totalMilliseconds) {
    this.timeLabel.setText(`Time: ${formatElapsedTime(totalMilliseconds)}`);
  }

  setScore(score) {
    this.scoreLabel.setText(`Score: ${score}`);
  }

  setTarget(word) {
    const targetText = word ? `${word.kana} / ${word.romaji}` : '---';
    this.targetLabel.setText(`Target: ${targetText}`);
  }

  setSoundMuted(isMuted) {
    this.soundButton.setLabel(isMuted ? 'SOUND OFF' : 'SOUND ON');
  }

  destroy() {
    [
      this.panelGlow,
      this.panel,
      this.titleLabel,
      this.sessionLabel,
      this.livesLabel,
      ...this.lifeHearts,
      this.timeLabel,
      this.scoreLabel,
      this.targetLabel,
      this.menuButton,
      this.soundButton,
    ].forEach((element) => element?.destroy());
    this.lifeHearts = [];
  }
}
