import { SetupButton } from './SetupButton.js';
import { formatElapsedTime } from '../utils/formatTime.js';

const MAX_LIVES = 3;

export class Hud {
  constructor(scene, { onMenu, onToggleSound, isSoundMuted = false } = {}) {
    this.scene = scene;
    this.currentLives = MAX_LIVES;
    this.lifeHearts = [];

    this.panelGlow = scene.add.graphics().setScrollFactor(0).setDepth(40);
    this.panel = scene.add.graphics().setScrollFactor(0).setDepth(41);
    this.drawStatusWindow();

    this.titleLabel = scene.add
      .text(54, 39, 'SYSTEM - TypeNihongo', {
        fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
        fontSize: '22px',
        color: '#e9f8ff',
        fontStyle: '700',
      })
      .setScrollFactor(0)
      .setDepth(43);

    this.sessionLabel = scene.add
      .text(558, 45, 'GENERAL - LEVEL 1', {
        fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
        fontSize: '14px',
        color: '#83d9f5',
        fontStyle: '700',
        letterSpacing: 1,
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(43);

    this.livesLabel = this.createMetaText(54, 76, 'LIFE');
    this.createHeartIcons();
    this.timeLabel = this.createMetaText(278, 76, 'Time: 00:00');
    this.scoreLabel = this.createMetaText(414, 76, 'Score: 0');
    this.targetLabel = this.createMetaText(54, 108, 'Target: ---');

    this.menuButton = new SetupButton(scene, {
      x: scene.cameras.main.width - 92,
      y: 50,
      width: 136,
      height: 46,
      label: 'MENU',
      fontSize: 16,
      onSelect: onMenu,
    })
      .setScrollFactor(0)
      .setDepth(44);

    this.soundButton = new SetupButton(scene, {
      x: scene.cameras.main.width - 92,
      y: 104,
      width: 136,
      height: 36,
      label: isSoundMuted ? 'SOUND OFF' : 'SOUND ON',
      fontSize: 13,
      onSelect: () => {
        const isMuted = onToggleSound?.() ?? false;
        this.setSoundMuted(isMuted);
      },
    })
      .setScrollFactor(0)
      .setDepth(44);

  }

  drawStatusWindow() {
    const x = 28;
    const y = 24;
    const width = Math.min(552, this.scene.cameras.main.width - 56);
    const height = 138;

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
        fontSize: '18px',
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
      this.drawHeart(heart, 126 + index * 32, 76, 22, index < this.currentLives);
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
