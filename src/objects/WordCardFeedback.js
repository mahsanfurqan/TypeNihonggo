import Phaser from 'phaser';

const TYPING_NUDGE_DISTANCE = 4;
const TYPING_FEEDBACK_SCALE = 1.06;
const TYPING_FEEDBACK_DURATION_MS = 90;
const WRONG_KEY_SHAKE_DISTANCE = 5;
const WRONG_KEY_DURATION_MS = 100;
const CORRECT_FLASH_ALPHA = 0.16;
const WRONG_FLASH_ALPHA = 0.28;
const FLASH_COLOR_CORRECT = 0xffffff;
const FLASH_COLOR_WRONG = 0xff7b7b;

export class WordCardFeedback {
  constructor(wordCard) {
    this.wordCard = wordCard;
    this.feedbackTween = null;
    this.flashTween = null;
  }

  playCorrectTypingFeedback() {
    if (!this.canPlayFeedback()) {
      return;
    }

    this.stopTweens();
    this.resetContentTransform();
    this.startFlash(FLASH_COLOR_CORRECT, CORRECT_FLASH_ALPHA);

    this.feedbackTween = this.wordCard.scene.tweens.add({
      targets: this.wordCard.content,
      x: -TYPING_NUDGE_DISTANCE,
      scaleX: TYPING_FEEDBACK_SCALE,
      scaleY: TYPING_FEEDBACK_SCALE,
      duration: TYPING_FEEDBACK_DURATION_MS,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.resetContentTransform();
        this.feedbackTween = null;
      },
    });

    this.fadeFlash(TYPING_FEEDBACK_DURATION_MS);
  }

  playWrongTypingFeedback() {
    if (!this.canPlayFeedback()) {
      return;
    }

    this.stopTweens();
    this.resetContentTransform();
    this.startFlash(FLASH_COLOR_WRONG, WRONG_FLASH_ALPHA);

    this.feedbackTween = this.wordCard.scene.tweens.add({
      targets: this.wordCard.content,
      x: WRONG_KEY_SHAKE_DISTANCE,
      duration: WRONG_KEY_DURATION_MS / 4,
      ease: 'Quad.easeOut',
      yoyo: true,
      repeat: 1,
      onYoyo: () => {
        this.wordCard.content.x = -WRONG_KEY_SHAKE_DISTANCE;
      },
      onComplete: () => {
        this.wordCard.content.x = 0;
        this.feedbackTween = null;
      },
    });

    this.fadeFlash(WRONG_KEY_DURATION_MS);
  }

  playDestroyEffect(onComplete) {
    if (this.wordCard.isResolving) {
      return;
    }

    this.wordCard.isResolving = true;
    this.spawnCompletionParticles(onComplete);

    this.wordCard.scene.tweens.add({
      targets: this.wordCard,
      alpha: 0,
      scaleX: 1.12,
      scaleY: 1.12,
      y: this.wordCard.y - 10,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => this.wordCard.destroy(),
    });
  }

  spawnCompletionParticles(onComplete) {
    const burstColors = [0xffd166, 0x9ae6b4, 0x4cc9f0];
    const particleCount = 8;
    let remainingParticles = particleCount;

    for (let index = 0; index < particleCount; index += 1) {
      const particle = this.wordCard.scene.add.circle(
        this.wordCard.x,
        this.wordCard.y,
        3,
        burstColors[index % burstColors.length],
      );
      const offsetX = Phaser.Math.Between(-44, 44);
      const offsetY = Phaser.Math.Between(-28, 28);

      this.wordCard.scene.tweens.add({
        targets: particle,
        x: this.wordCard.x + offsetX,
        y: this.wordCard.y + offsetY,
        alpha: 0,
        scale: 0,
        duration: 220,
        ease: 'Quad.easeOut',
        onComplete: () => {
          particle.destroy();
          remainingParticles -= 1;

          if (remainingParticles === 0) {
            onComplete?.();
          }
        },
      });
    }
  }

  canPlayFeedback() {
    return (
      this.wordCard.scene &&
      this.wordCard.active &&
      !this.wordCard.isResolving &&
      !this.wordCard.hasTriggeredLifeLoss
    );
  }

  startFlash(color, alpha) {
    this.wordCard.flashColor = color;
    this.wordCard.flashAlpha = alpha;
    this.wordCard.drawFlashOverlay();
  }

  fadeFlash(duration) {
    this.flashTween = this.wordCard.scene.tweens.add({
      targets: this.wordCard,
      flashAlpha: 0,
      duration,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        this.wordCard.drawFlashOverlay();
      },
      onComplete: () => {
        this.wordCard.flashAlpha = 0;
        this.wordCard.drawFlashOverlay();
        this.flashTween = null;
      },
    });
  }

  resetContentTransform() {
    this.wordCard.content.x = 0;
    this.wordCard.content.scaleX = 1;
    this.wordCard.content.scaleY = 1;
  }

  stopTweens() {
    this.feedbackTween?.stop();
    this.flashTween?.stop();
  }

  destroy() {
    this.stopTweens();
    this.wordCard = null;
  }
}
