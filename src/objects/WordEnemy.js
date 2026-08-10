import Phaser from 'phaser';
import { COLORS } from '../config/gameSettings.js';
import { WordCardFeedback } from './WordCardFeedback.js';

const KANA_TEXT_STYLE = {
  fontFamily: '"Noto Sans JP", "Yu Gothic UI", "Hiragino Sans", sans-serif',
  fontSize: '24px',
  color: '#f5f7ff',
  fontStyle: '700',
};

const ROMAJI_TEXT_STYLE = {
  fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
  fontSize: '16px',
  color: COLORS.pendingChar,
  fontStyle: '700',
};

const MEANING_TEXT_STYLE = {
  fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
  fontSize: '13px',
  color: '#a9bad2',
};

const CARD_PADDING_X = 24;
const CARD_HEIGHT = 78;
const CARD_CORNER_RADIUS = 8;
const LETTER_SPACING = 1;
const FLASH_COLOR_CORRECT = 0xffffff;

export class WordEnemy extends Phaser.GameObjects.Container {
  constructor(scene, wordData, x, y, moveSpeed) {
    super(scene, x, y);

    this.id = wordData.id;
    this.kana = wordData.kana;
    this.romaji = wordData.romaji.toLowerCase();
    this.meaning = wordData.meaning ?? '---';
    this.moveSpeed = moveSpeed;
    this.typedLength = 0;
    this.isTargeted = false;
    this.isResolving = false;
    this.hasTriggeredLifeLoss = false;
    this.flashAlpha = 0;
    this.flashColor = FLASH_COLOR_CORRECT;

    this.content = scene.add.container(0, 0);

    this.kanaLabel = scene.add.text(0, -19, this.kana, KANA_TEXT_STYLE).setOrigin(0.5);
    this.romajiLetters = this.createRomajiLetters(scene);
    this.meaningLabel = scene.add
      .text(0, 25, this.meaning, MEANING_TEXT_STYLE)
      .setOrigin(0.5);

    const romajiWidth = this.getRomajiWidth();
    const containerWidth =
      Math.max(this.kanaLabel.width, romajiWidth, this.meaningLabel.width) + CARD_PADDING_X;

    this.cardWidth = containerWidth;
    this.cardHeight = CARD_HEIGHT;

    this.background = scene.add.graphics();
    this.flashOverlay = scene.add.graphics();

    this.content.add([
      this.background,
      this.flashOverlay,
      this.kanaLabel,
      ...this.romajiLetters,
      this.meaningLabel,
    ]);
    this.add(this.content);
    this.setSize(containerWidth, CARD_HEIGHT);
    this.setDepth(20);

    scene.add.existing(this);

    this.feedback = new WordCardFeedback(this);
    this.updateTypingVisuals();
  }

  createRomajiLetters(scene) {
    const letters = this.romaji.split('').map((character) =>
      scene.add.text(0, 3, character, ROMAJI_TEXT_STYLE).setOrigin(0, 0.5),
    );

    const totalWidth = this.getTextRowWidth(letters);
    let currentX = -totalWidth / 2;

    letters.forEach((letter) => {
      letter.x = currentX;
      currentX += letter.width + LETTER_SPACING;
    });

    return letters;
  }

  getTextRowWidth(letters) {
    return letters.reduce(
      (width, letter, index) => width + letter.width + (index > 0 ? LETTER_SPACING : 0),
      0,
    );
  }

  getRomajiWidth() {
    return this.getTextRowWidth(this.romajiLetters);
  }

  update(delta) {
    if (this.isResolving) {
      return;
    }

    this.x -= this.moveSpeed * (delta / 1000);
  }

  canStartWith(character) {
    return !this.hasTriggeredLifeLoss && !this.isResolving && this.typedLength === 0 && this.romaji.startsWith(character);
  }

  matchesNextCharacter(character) {
    return !this.hasTriggeredLifeLoss && !this.isResolving && this.romaji[this.typedLength] === character;
  }

  commitCharacter(character) {
    if (!this.matchesNextCharacter(character)) {
      return false;
    }

    this.typedLength += 1;
    this.updateTypingVisuals();

    return this.isComplete();
  }

  isComplete() {
    return this.typedLength >= this.romaji.length;
  }

  hasReachedDamageBoundary(boundaryX) {
    return !this.hasTriggeredLifeLoss && this.x - this.width / 2 <= boundaryX;
  }

  isFullyOutsideLeft(boundaryX) {
    return this.x + this.width / 2 <= boundaryX;
  }

  markEscaped() {
    if (this.hasTriggeredLifeLoss || this.isResolving) {
      return false;
    }

    this.hasTriggeredLifeLoss = true;
    this.isTargeted = false;
    this.alpha = 0.45;
    this.updateTypingVisuals();

    return true;
  }

  setTargeted(isTargeted) {
    if (
      !this.scene ||
      !this.active ||
      this.hasTriggeredLifeLoss ||
      this.isResolving ||
      this.isTargeted === isTargeted
    ) {
      return;
    }

    this.isTargeted = isTargeted;
    this.scene.tweens.add({
      targets: this,
      scaleX: isTargeted ? 1.03 : 1,
      scaleY: isTargeted ? 1.03 : 1,
      duration: 120,
      ease: 'Sine.easeOut',
    });

    this.updateTypingVisuals();
  }

  updateTypingVisuals() {
    if (!this.scene || !this.active || !this.background?.active) {
      return;
    }

    const fillColor = this.isTargeted ? COLORS.wordTargetFill : COLORS.wordFill;
    const strokeColor = this.isTargeted ? COLORS.wordTargetStroke : COLORS.wordStroke;
    const strokeAlpha = this.hasTriggeredLifeLoss ? 0.1 : this.isTargeted ? 0.7 : 0.22;

    this.background.clear();
    this.background.fillStyle(fillColor, this.hasTriggeredLifeLoss ? 0.55 : 0.92);
    this.background.lineStyle(2, strokeColor, strokeAlpha);
    this.background.fillRoundedRect(
      -this.cardWidth / 2,
      -this.cardHeight / 2,
      this.cardWidth,
      this.cardHeight,
      CARD_CORNER_RADIUS,
    );
    this.background.strokeRoundedRect(
      -this.cardWidth / 2,
      -this.cardHeight / 2,
      this.cardWidth,
      this.cardHeight,
      CARD_CORNER_RADIUS,
    );
    this.drawFlashOverlay();

    this.romajiLetters.forEach((letter, index) => {
      if (!letter?.active) {
        return;
      }

      let color = this.hasTriggeredLifeLoss ? COLORS.inactiveChar : COLORS.pendingChar;

      if (!this.hasTriggeredLifeLoss && index < this.typedLength) {
        color = COLORS.typedChar;
      } else if (!this.hasTriggeredLifeLoss && this.isTargeted && index === this.typedLength) {
        color = COLORS.nextChar;
      }

      letter.setColor(color);
    });
  }

  drawFlashOverlay() {
    if (!this.flashOverlay?.active) {
      return;
    }

    this.flashOverlay.clear();

    if (this.flashAlpha <= 0) {
      return;
    }

    this.flashOverlay.fillStyle(this.flashColor, this.flashAlpha);
    this.flashOverlay.fillRoundedRect(
      -this.cardWidth / 2,
      -this.cardHeight / 2,
      this.cardWidth,
      this.cardHeight,
      CARD_CORNER_RADIUS,
    );
  }

  playCorrectTypingFeedback() {
    this.feedback.playCorrectTypingFeedback();
  }

  playWrongTypingFeedback() {
    this.feedback.playWrongTypingFeedback();
  }

  playDestroyEffect(onComplete) {
    this.feedback.playDestroyEffect(onComplete);
  }

  destroy(fromScene) {
    this.feedback?.destroy();
    this.feedback = null;

    super.destroy(fromScene);
  }
}
