import Phaser from 'phaser';
import { LOCALE_OPTIONS } from '../config/localeOptions.js';
import { generalCourseConfig } from '../data/vocabulary/index.js';
import { AudioManager } from '../managers/AudioManager.js';
import { BackgroundManager } from '../managers/BackgroundManager.js';
import { LocalProgressManager } from '../managers/LocalProgressManager.js';
import { ResponsiveGameplayViewport } from '../managers/ResponsiveGameplayViewport.js';
import { SetupSessionController } from '../managers/SetupSessionController.js';
import { Dropdown } from '../ui/Dropdown.js';
import { SettingsOverlay } from '../ui/SettingsOverlay.js';
import { SetupButton } from '../ui/SetupButton.js';
import { SetupPanel } from '../ui/SetupPanel.js';

export class SetupScene extends Phaser.Scene {
  constructor() {
    super('setup');
  }

  create() {
    this.responsiveViewport = new ResponsiveGameplayViewport(this);
    this.uiViewport = this.responsiveViewport.bounds;
    const centerX = this.uiViewport.centerX;
    const centerY = this.cameras.main.centerY;
    const isCompact = this.uiViewport.width < 720;
    const controlWidth = isCompact ? this.uiViewport.width - 56 : 780;

    this.localProgressManager = new LocalProgressManager();
    this.setupSessionController = new SetupSessionController({
      courseConfig: generalCourseConfig,
      localProgressManager: this.localProgressManager,
    });
    this.sessionConfig = this.setupSessionController.sessionConfig;
    this.languageDropdown = null;
    this.stageDropdown = null;
    this.audioManager = new AudioManager();
    this.backgroundManager = new BackgroundManager(this);
    this.settingsOverlay = new SettingsOverlay(this);
    this.setupPanel = new SetupPanel(this, { viewport: this.uiViewport });
    this.setupPanel.create(centerX, centerY);
    this.createLanguageDropdown(centerX, centerY, controlWidth, isCompact);
    this.createStageDropdown(centerX, centerY, controlWidth, isCompact);
    this.createTestingModeButton(centerX, centerY);
    this.createSettingsButton(centerX, centerY);
    this.createStartButton(centerX, centerY);

    this.input.keyboard.on('keydown-ENTER', this.startGame, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
  }

  update(_, delta) {
    this.backgroundManager?.update(delta);
  }

  createLanguageDropdown(centerX, centerY, width, isCompact) {
    this.languageDropdown = new Dropdown(this, {
      x: centerX,
      y: centerY - 100,
      width,
      height: 50,
      selectedValue: this.sessionConfig.locale,
      options: LOCALE_OPTIONS.map((locale) => ({
        value: locale.id,
        label: locale.label,
        flag: locale.flag,
      })),
      fontSize: isCompact ? 13 : 16,
      depth: 60,
      onOpen: () => this.stageDropdown?.close(),
      onSelect: (locale) => this.selectLocale(locale),
    });
  }

  createStageDropdown(centerX, centerY, width, isCompact) {
    this.stageDropdown = new Dropdown(this, {
      x: centerX,
      y: centerY - 20,
      width,
      height: 54,
      selectedValue: this.sessionConfig.currentLevel,
      options: this.createStageOptions(),
      fontSize: isCompact ? 12 : 14,
      optionHeight: 48,
      depth: 54,
      onOpen: () => this.languageDropdown?.close(),
      onSelect: (_, option) => this.selectStage(option.stage),
    });
  }

  createStageOptions() {
    return this.setupSessionController.createStageOptions();
  }

  createTestingModeButton(centerX, centerY) {
    this.testingModeButton = new SetupButton(this, {
      x: centerX,
      y: centerY + 96,
      width: 250,
      height: 44,
      label: this.getTestingModeLabel(),
      fontSize: 14,
      onSelect: () => this.toggleTestingMode(),
    }).setSelected(this.setupSessionController.isTestingModeEnabled);
  }

  createStartButton(centerX, centerY) {
    this.startButton = new SetupButton(this, {
      x: centerX,
      y: centerY + 218,
      width: 310,
      height: 58,
      label: 'START SESSION',
      fontSize: 20,
      onSelect: () => this.startGame(),
    }).setSelected(true);

    this.add
      .text(centerX, centerY + 264, 'Press Enter to confirm', {
        fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
        fontSize: '14px',
        color: '#779bb1',
      })
      .setOrigin(0.5)
      .setDepth(23);
  }

  createSettingsButton(centerX, centerY) {
    this.settingsButton = new SetupButton(this, {
      x: centerX,
      y: centerY + 154,
      width: 250,
      height: 44,
      label: 'SETTINGS',
      fontSize: 16,
      onSelect: () => this.openSettings(),
    });
  }

  selectLocale(locale) {
    this.setupSessionController.selectLocale(locale);
    this.sessionConfig = this.setupSessionController.sessionConfig;
    this.languageDropdown?.setSelectedValue(locale);
  }

  selectStage(stage) {
    if (!this.setupSessionController.selectStage(stage)) {
      return;
    }

    this.sessionConfig = this.setupSessionController.sessionConfig;
    this.stageDropdown?.setSelectedValue(stage.levelRange.min);
  }

  isStageSelectable(stage) {
    return this.setupSessionController.isStageSelectable(stage);
  }

  getTestingModeLabel() {
    return this.setupSessionController.getTestingModeLabel();
  }

  toggleTestingMode() {
    this.setupSessionController.toggleTestingMode();
    this.sessionConfig = this.setupSessionController.sessionConfig;

    this.testingModeButton
      ?.setLabel(this.getTestingModeLabel())
      .setSelected(this.setupSessionController.isTestingModeEnabled);
    this.stageDropdown?.setOptions(this.createStageOptions());
  }

  resetLockedTestingStageSelection() {
    this.setupSessionController.resetLockedTestingStageSelection();
    this.sessionConfig = this.setupSessionController.sessionConfig;
    this.stageDropdown?.setSelectedValue(this.sessionConfig.currentLevel);
  }

  resetProgress() {
    this.sessionConfig = this.setupSessionController.resetProgress();
    this.languageDropdown?.setSelectedValue(this.sessionConfig.locale);
    this.stageDropdown?.setOptions(this.createStageOptions());
    this.stageDropdown?.setSelectedValue(this.sessionConfig.currentLevel);
    this.testingModeButton
      ?.setLabel(this.getTestingModeLabel())
      .setSelected(this.setupSessionController.isTestingModeEnabled);
  }

  openSettings() {
    this.languageDropdown?.close();
    this.stageDropdown?.close();
    this.settingsOverlay.show({
      isSoundMuted: this.audioManager.isMuted,
      onToggleSound: () => this.audioManager.toggleMuted(),
      onResetProgress: () => this.resetProgress(),
    });
  }

  startGame() {
    if (
      this.settingsOverlay?.isOpen ||
      this.languageDropdown?.isOpen ||
      this.stageDropdown?.isOpen
    ) {
      return;
    }

    this.sessionConfig = this.setupSessionController.prepareStartSession();

    this.audioManager.unlock();
    this.audioManager.play('dangerHint');
    this.scene.start('game', {
      sessionConfig: this.sessionConfig,
      skipInitialDangerAudio: true,
    });
  }

  handleShutdown() {
    this.input.keyboard.off('keydown-ENTER', this.startGame, this);
    this.testingModeButton?.destroy();
    this.settingsButton?.destroy();
    this.languageDropdown?.destroy();
    this.stageDropdown?.destroy();
    this.settingsOverlay?.destroy();
    this.setupPanel?.destroy();
    this.backgroundManager?.destroy();
    this.audioManager?.destroy();
    this.responsiveViewport?.destroy();
  }
}
