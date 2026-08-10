import { generalCourseConfig, CourseNotFoundError } from '../data/vocabulary/index.js';
import { ProgressionConfigurationError } from './ProgressionManager.js';

export class LevelTransitionController {
  constructor(scene) {
    this.scene = scene;
  }

  tryAdvanceToNextLevel() {
    if (
      this.scene.isGameOver ||
      !this.scene.pendingLevelTransition?.isAttackFinished ||
      !this.scene.pendingLevelTransition?.isWordEffectFinished
    ) {
      return;
    }

    this.showLevelCompleteTransition();
  }

  showLevelCompleteTransition() {
    const currentLevel = this.scene.sessionConfig.currentLevel;

    if (this.scene.courseProgression.isStageFinalLevel(currentLevel)) {
      this.showStageCompleteTransition();
      return;
    }

    const nextLevel = currentLevel + 1;
    let nextVocabulary;

    try {
      this.scene.progressionManager.validateLevel(nextLevel);
      nextVocabulary = this.scene.levelVocabularyLoader.loadVocabulary(nextLevel);
    } catch (error) {
      if (
        !(error instanceof ProgressionConfigurationError) &&
        !(error instanceof CourseNotFoundError)
      ) {
        throw error;
      }

      // Future course ranges may exist before their full five-word dataset is populated.
      this.scene.isProgressionBlocked = true;
      this.scene.pendingLevelTransition = null;
      this.scene.typingManager.resume();
      this.scene.wordManager.resumeSpawning();
      return;
    }

    this.scene.audioManager.play('levelComplete');
    this.scene.levelCompleteOverlay.show(currentLevel, nextLevel, () => {
      this.completeLevelTransition(nextLevel, nextVocabulary);
    });
  }

  completeLevelTransition(nextLevel, nextVocabulary) {
    if (this.scene.isGameOver) {
      return;
    }

    this.applyLevelState(nextLevel, nextVocabulary);
    this.scene.pendingLevelTransition = null;
    this.scene.typingManager.resume();
    this.scene.wordManager.resumeSpawning();
  }

  showStageCompleteTransition() {
    const currentLevel = this.scene.sessionConfig.currentLevel;
    const stage = this.scene.courseProgression.getStage(currentLevel);
    const nextStage = this.scene.courseProgression.getNextStage(currentLevel);
    const nextLevel = nextStage?.levelRange.min ?? null;
    let nextVocabulary = null;
    let canStartNextStage = false;

    if (nextLevel !== null) {
      try {
        this.scene.progressionManager.validateLevel(nextLevel);
        nextVocabulary = this.scene.levelVocabularyLoader.loadVocabulary(nextLevel);
        canStartNextStage = true;
      } catch (error) {
        if (
          !(error instanceof ProgressionConfigurationError) &&
          !(error instanceof CourseNotFoundError)
        ) {
          throw error;
        }
      }
    }

    this.scene.hud.setTarget(null);
    this.scene.isAwaitingStageChoice = true;
    this.scene.typingManager.pause();
    this.scene.localProgressManager.setLocale(this.scene.sessionConfig.locale);
    this.scene.localProgressManager.completeStage(generalCourseConfig, stage);
    this.scene.audioManager.play('stageComplete');
    this.scene.stageCompleteOverlay.show({
      stage,
      nextStage,
      canStartNextStage,
      stats: this.createSessionStatsSnapshot(stage),
      onNextStage: () => this.startNextStage(nextLevel, nextVocabulary),
      onBackToMenu: () => this.backToMenu(),
    });
  }

  startNextStage(nextLevel, nextVocabulary) {
    if (nextLevel === null || !nextVocabulary) {
      return;
    }

    this.applyLevelState(nextLevel, nextVocabulary);
    this.scene.pendingLevelTransition = null;
    this.scene.isProgressionBlocked = false;
    this.scene.isAwaitingStageChoice = false;
    this.scene.typingManager.resume();
    this.scene.wordManager.resumeSpawning();
  }

  applyLevelState(nextLevel, nextVocabulary) {
    this.scene.progressionManager.startLevel(nextLevel);
    this.scene.sessionConfig.setCurrentLevel(nextLevel);
    this.scene.localProgressManager.setLastStage(
      generalCourseConfig,
      this.scene.courseProgression.getStage(nextLevel),
    );
    this.scene.gameplaySettings = this.scene.responsiveViewport.applyToSettings(
      this.scene.levelVocabularyLoader.resolveGameplaySettings(nextLevel),
    );
    this.scene.backgroundManager.setMap(
      this.scene.levelVocabularyLoader.resolveBackgroundMapId(nextLevel),
    );
    this.scene.wordManager.setSettings(this.scene.gameplaySettings);
    this.scene.wordManager.setVocabulary(nextVocabulary);
    this.configureLevelSpawnPlan();
    this.scene.hud.setSession(this.scene.sessionConfig.course, nextLevel);
  }

  configureLevelSpawnPlan() {
    this.scene.wordManager?.setLevelVocabularyIds(
      this.scene.progressionManager.getTargetVocabularyIds(),
    );
  }

  createSessionStatsSnapshot(stage) {
    return this.scene.sessionStatsManager.getSnapshot({
      score: this.scene.score,
      elapsedMilliseconds: this.scene.elapsedMilliseconds,
      currentLevel: this.scene.sessionConfig.currentLevel,
      stage,
    });
  }

  backToMenu() {
    this.scene.scene.start('setup');
  }
}
