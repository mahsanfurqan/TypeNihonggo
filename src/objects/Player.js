import Phaser from 'phaser';

const PLAYER_SCALE = 0.8;
const PLAYER_ATTACK_ANIMATION_KEY = 'player-attack';

export class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    this.sprite = scene.add.sprite(0, 0, 'player-idle').setScale(PLAYER_SCALE);
    this.isAttacking = false;
    this.pendingAttackCount = 0;
    this.pendingAttackCallbacks = [];
    this.currentAttackCompleteCallback = null;

    this.add(this.sprite);
    this.setDepth(30);

    scene.add.existing(this);

    this.startIdleMotion();

    this.sprite.on(
      Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + PLAYER_ATTACK_ANIMATION_KEY,
      this.handleAttackComplete,
      this,
    );
  }

  startIdleMotion() {
    if (!this.scene || !this.active) {
      return;
    }

    this.sprite.stop();
    this.sprite.setTexture('player-idle');
    this.sprite.setScale(PLAYER_SCALE);
    this.stopIdleMotion();
  }

  stopIdleMotion() {
    this.idleTween?.remove();
    this.idleTween = null;
    this.sprite.y = 0;
  }

  playAttack(onComplete = null) {
    if (!this.scene || !this.active) {
      return;
    }

    if (this.isAttacking) {
      this.pendingAttackCount += 1;
      this.pendingAttackCallbacks.push(onComplete);
      return;
    }

    this.startAttackAnimation(onComplete);
  }

  startAttackAnimation(onComplete = null) {
    this.isAttacking = true;
    this.currentAttackCompleteCallback = onComplete;
    this.stopIdleMotion();
    this.sprite.setTexture('player-attack');
    this.sprite.setFrame(0);
    this.sprite.play(PLAYER_ATTACK_ANIMATION_KEY, true);
  }

  handleAttackComplete() {
    if (!this.scene || !this.active) {
      return;
    }

    this.isAttacking = false;
    const onComplete = this.currentAttackCompleteCallback;
    this.currentAttackCompleteCallback = null;
    onComplete?.();

    if (this.pendingAttackCount > 0) {
      this.pendingAttackCount -= 1;
      this.startAttackAnimation(this.pendingAttackCallbacks.shift());
      return;
    }

    this.startIdleMotion();
  }

  destroy(fromScene) {
    this.idleTween?.remove();
    this.sprite.off(
      Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + PLAYER_ATTACK_ANIMATION_KEY,
      this.handleAttackComplete,
      this,
    );

    super.destroy(fromScene);
  }
}
