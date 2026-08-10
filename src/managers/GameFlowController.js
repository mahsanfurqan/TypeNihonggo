import { GameplayMenuController } from './GameplayMenuController.js';
import { LevelTransitionController } from './LevelTransitionController.js';

export class GameFlowController {
  constructor(scene) {
    this.scene = scene;
    this.levelTransitionController = new LevelTransitionController(scene);
    this.menuController = new GameplayMenuController(scene, {
      createSessionStatsSnapshot: (stage) =>
        this.levelTransitionController.createSessionStatsSnapshot(stage),
    });
  }

  handleTargetChanged(word) {
    this.scene.hud.setTarget(word);
  }

  handleCorrectKey() {
    this.scene.sessionStatsManager.recordCorrectKey();
    this.scene.audioManager.play('correctKey');
  }

  handleWrongKey() {
    this.scene.sessionStatsManager.recordWrongKey();
    this.scene.audioManager.play('wrongKey');
  }

  handleWordCompleted(word) {
    if (this.scene.isGameOver) {
      return;
    }

    this.scene.score += this.getWordScore(word);
    this.scene.hud.setScore(this.scene.score);
    this.scene.sessionStatsManager.recordCorrectKey();
    this.scene.sessionStatsManager.recordVocabularyCompleted(word);
    this.scene.audioManager.play('wordCompleted');
    this.scene.player.playAttack(() => this.handleWordAttackFinished(word));

    const progressionResult = this.scene.progressionManager.recordVocabularyCompleted(word.id);

    if (
      progressionResult.isLevelComplete &&
      !this.scene.pendingLevelTransition &&
      !this.scene.isProgressionBlocked
    ) {
      this.scene.pendingLevelTransition = {
        word,
        isAttackFinished: false,
        isWordEffectFinished: false,
      };
      this.scene.wordManager.pauseSpawning();
      this.scene.typingManager.pause();
    }
  }

  handleWordCompletionEffectFinished(word) {
    if (this.scene.pendingLevelTransition?.word !== word) {
      return;
    }

    this.scene.pendingLevelTransition.isWordEffectFinished = true;
    this.levelTransitionController.tryAdvanceToNextLevel();
  }

  handleWordAttackFinished(word) {
    if (this.scene.pendingLevelTransition?.word !== word) {
      return;
    }

    this.scene.pendingLevelTransition.isAttackFinished = true;
    this.levelTransitionController.tryAdvanceToNextLevel();
  }

  handleWordEscaped() {
    if (this.scene.isGameOver) {
      return;
    }

    this.scene.remainingLives -= 1;
    this.scene.hud.setLives(this.scene.remainingLives);
    this.scene.cameras.main.shake(120, 0.002);

    if (this.scene.remainingLives <= 0) {
      this.menuController.triggerGameOver();
      return;
    }

    this.scene.audioManager.play('playerDamage');
  }

  configureLevelSpawnPlan() {
    this.levelTransitionController.configureLevelSpawnPlan();
  }

  openPauseMenu() {
    this.menuController.openPauseMenu();
  }

  getWordScore(word) {
    return word.romaji.length * 10;
  }
}
