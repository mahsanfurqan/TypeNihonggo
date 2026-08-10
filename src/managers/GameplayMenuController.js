import { GameSessionConfig } from '../config/GameSessionConfig.js';

export class GameplayMenuController {
  constructor(scene, { createSessionStatsSnapshot }) {
    this.scene = scene;
    this.createSessionStatsSnapshot = createSessionStatsSnapshot;
  }

  openPauseMenu() {
    if (
      this.scene.isPauseMenuOpen ||
      this.scene.isGameOver ||
      this.scene.isAwaitingStageChoice ||
      this.scene.pendingLevelTransition
    ) {
      return;
    }

    this.scene.isPauseMenuOpen = true;
    this.scene.typingManager.pause();
    this.scene.pauseMenu.show({
      currentLevel: this.scene.sessionConfig.currentLevel,
      onResume: () => this.resumeGameplay(),
      onRestartStage: () => this.restartActiveStage(),
      onBackToSetup: () => this.backToSetup(),
    });
  }

  resumeGameplay() {
    this.scene.pauseMenu.clear();
    this.scene.isPauseMenuOpen = false;
    this.scene.typingManager.resume();
  }

  restartActiveStage() {
    const restartConfig = this.createStageRestartConfig();

    this.scene.pauseMenu.clear();
    this.scene.scene.restart({ sessionConfig: restartConfig });
  }

  retryStage() {
    this.scene.scene.restart({ sessionConfig: this.createStageRestartConfig() });
  }

  createStageRestartConfig() {
    const startingLevel = this.scene.courseProgression.getStageStartLevel(
      this.scene.sessionConfig.currentLevel,
    );

    return new GameSessionConfig({
      ...this.scene.sessionConfig.toJSON(),
      currentLevel: startingLevel,
    });
  }

  backToSetup() {
    this.scene.pauseMenu.clear();
    this.scene.scene.start('setup');
  }

  triggerGameOver() {
    this.scene.isGameOver = true;
    this.scene.wordManager.stop();
    this.scene.typingManager.disable();
    this.scene.hud.setTarget(null);
    this.scene.audioManager.play('gameOver');
    this.scene.gameOverOverlay.show({
      score: this.scene.score,
      elapsedMilliseconds: this.scene.elapsedMilliseconds,
      currentLevel: this.scene.sessionConfig.currentLevel,
      stage: this.scene.courseProgression.getStage(this.scene.sessionConfig.currentLevel),
      stats: this.createSessionStatsSnapshot(
        this.scene.courseProgression.getStage(this.scene.sessionConfig.currentLevel),
      ),
      onRetryStage: () => this.retryStage(),
      onBackToSetup: () => this.backToSetup(),
    });
  }
}
