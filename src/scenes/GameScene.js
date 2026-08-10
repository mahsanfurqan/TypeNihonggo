import Phaser from 'phaser';
import { GameSessionConfig } from '../config/GameSessionConfig.js';
import { GAMEPLAY, PLAYER_POSITION } from '../config/gameSettings.js';
import {
  CourseProgression,
  generalCourseConfig,
  generalCourseManifests,
  vocabularyCatalogs,
  vocabularyLocales,
  VocabularyRepository,
} from '../data/vocabulary/index.js';
import { AudioManager } from '../managers/AudioManager.js';
import { BackgroundManager } from '../managers/BackgroundManager.js';
import { GameFlowController } from '../managers/GameFlowController.js';
import { GameSceneEventBinder } from '../managers/GameSceneEventBinder.js';
import { LocaleManager } from '../managers/LocaleManager.js';
import { LevelVocabularyLoader } from '../managers/LevelVocabularyLoader.js';
import { LocalProgressManager } from '../managers/LocalProgressManager.js';
import { ProgressionManager } from '../managers/ProgressionManager.js';
import { ResponsiveGameplayViewport } from '../managers/ResponsiveGameplayViewport.js';
import { SessionStatsManager } from '../managers/SessionStatsManager.js';
import { TypingManager } from '../managers/TypingManager.js';
import { WordManager } from '../managers/WordManager.js';
import { DangerZoneHint } from '../ui/DangerZoneHint.js';
import { Player } from '../objects/Player.js';
import { GameOverOverlay } from '../ui/GameOverOverlay.js';
import { Hud } from '../ui/Hud.js';
import { LevelCompleteOverlay } from '../ui/LevelCompleteOverlay.js';
import { PauseMenu } from '../ui/PauseMenu.js';
import { StageCompleteOverlay } from '../ui/StageCompleteOverlay.js';

const MAX_FRAME_DELTA_MS = 100;

export class GameScene extends Phaser.Scene {
  constructor() {
    super('game');
  }

  init(data = {}) {
    const receivedConfig = data?.sessionConfig ?? data;
    const hasReceivedConfig =
      receivedConfig &&
      typeof receivedConfig === 'object' &&
      Object.keys(receivedConfig).length > 0;
    const sessionConfig = hasReceivedConfig ? receivedConfig : this.sessionConfig;
    this.sessionConfig = GameSessionConfig.from(sessionConfig);
    this.skipInitialDangerAudio = Boolean(data?.skipInitialDangerAudio);
  }

  create() {
    this.isGameOver = false;
    this.remainingLives = GAMEPLAY.startingLives;
    this.score = GAMEPLAY.startingScore;
    this.elapsedMilliseconds = 0;
    this.pendingLevelTransition = null;
    this.isProgressionBlocked = false;
    this.isAwaitingStageChoice = false;
    this.isPauseMenuOpen = false;

    this.responsiveViewport = new ResponsiveGameplayViewport(this);
    this.gameplayViewport = this.responsiveViewport.bounds;

    this.vocabularyRepository = new VocabularyRepository({
      catalogs: vocabularyCatalogs,
      courseManifests: generalCourseManifests,
    });
    this.localeManager = new LocaleManager({
      translations: vocabularyLocales,
      defaultLocale: this.sessionConfig.locale,
    });
    this.courseProgression = new CourseProgression(generalCourseConfig);
    this.localProgressManager = new LocalProgressManager();
    this.sessionStatsManager = new SessionStatsManager();
    this.progressionManager = new ProgressionManager({
      vocabularyRepository: this.vocabularyRepository,
      courseId: this.sessionConfig.course,
      currentLevel: this.sessionConfig.currentLevel,
      allowStageSampleFallback: generalCourseConfig.contentMode === 'sample',
    });
    this.levelVocabularyLoader = new LevelVocabularyLoader({
      sessionConfig: this.sessionConfig,
      vocabularyRepository: this.vocabularyRepository,
      localeManager: this.localeManager,
      courseProgression: this.courseProgression,
    });
    this.gameplaySettings = this.responsiveViewport.applyToSettings(
      this.levelVocabularyLoader.resolveGameplaySettings(),
    );
    const vocabulary = this.levelVocabularyLoader.loadVocabulary();

    this.backgroundManager = new BackgroundManager(this, {
      mapId: this.levelVocabularyLoader.resolveBackgroundMapId(),
    });
    this.audioManager = new AudioManager();
    this.gameFlowController = new GameFlowController(this);

    this.player = new Player(
      this,
      this.gameplayViewport.isCropped ? this.gameplayViewport.playerX : PLAYER_POSITION.x,
      PLAYER_POSITION.y,
    );
    this.dangerZoneHint = new DangerZoneHint(this, {
      left: this.gameplayViewport.left,
    });
    this.pauseMenu = new PauseMenu(this);
    this.hud = new Hud(this, {
      onMenu: () => this.gameFlowController.openPauseMenu(),
      onToggleSound: () => this.audioManager.toggleMuted(),
      isSoundMuted: this.audioManager.isMuted,
    });
    this.gameOverOverlay = new GameOverOverlay(this);
    this.levelCompleteOverlay = new LevelCompleteOverlay(this);
    this.stageCompleteOverlay = new StageCompleteOverlay(this);
    this.hud.setSession(this.sessionConfig.course, this.sessionConfig.currentLevel);
    this.hud.setLives(this.remainingLives);
    this.hud.setScore(this.score);
    this.hud.setTime(this.elapsedMilliseconds);

    this.wordManager = new WordManager(this, vocabulary, this.gameplaySettings);
    this.gameFlowController.configureLevelSpawnPlan();
    this.typingManager = new TypingManager(this, this.wordManager);
    this.eventBinder = new GameSceneEventBinder({
      wordManager: this.wordManager,
      typingManager: this.typingManager,
      handlers: {
        onWordCompleted: this.gameFlowController.handleWordCompleted,
        onWordCompletionEffectFinished:
          this.gameFlowController.handleWordCompletionEffectFinished,
        onWordEscaped: this.gameFlowController.handleWordEscaped,
        onTargetChanged: this.gameFlowController.handleTargetChanged,
        onCorrectKey: this.gameFlowController.handleCorrectKey,
        onWrongKey: this.gameFlowController.handleWrongKey,
      },
      context: this.gameFlowController,
    });
    this.eventBinder.bind();

    this.dangerZoneHint.show();

    if (!this.skipInitialDangerAudio) {
      this.audioManager.play('dangerHint');
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
  }

  update(_, delta) {
    const frameDelta = Math.min(delta, MAX_FRAME_DELTA_MS);

    if (this.isPauseMenuOpen) {
      return;
    }

    this.backgroundManager?.update(frameDelta);

    if (this.isGameOver || this.isAwaitingStageChoice || this.pendingLevelTransition) {
      return;
    }

    this.elapsedMilliseconds += frameDelta;
    this.hud.setTime(this.elapsedMilliseconds);
    this.wordManager.update(frameDelta);
    this.typingManager.update();
  }

  handleShutdown() {
    this.backgroundManager?.destroy();
    this.eventBinder?.unbind();
    this.typingManager?.destroy();
    this.wordManager?.destroy();
    this.audioManager?.destroy();
    this.dangerZoneHint?.destroy();
    this.levelCompleteOverlay?.destroy();
    this.pauseMenu?.destroy();
    this.stageCompleteOverlay?.destroy();
    this.gameOverOverlay?.destroy();
    this.hud?.destroy();
    this.player?.destroy();
    this.responsiveViewport?.destroy();
  }
}
