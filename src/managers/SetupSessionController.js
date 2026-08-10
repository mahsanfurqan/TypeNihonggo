import { GameSessionConfig } from '../config/GameSessionConfig.js';
import { TESTING_MODE_CONFIG } from '../config/testingModeConfig.js';

export class SetupSessionController {
  constructor({ courseConfig, localProgressManager }) {
    this.courseConfig = courseConfig;
    this.localProgressManager = localProgressManager;
    this.isTestingModeEnabled = TESTING_MODE_CONFIG.initialEnabled;

    const initialStage = this.localProgressManager.getInitialStage(this.courseConfig);
    this.sessionConfig = new GameSessionConfig({
      course: this.courseConfig.courseId,
      currentLevel: initialStage.levelRange.min,
      locale: this.localProgressManager.getLocale(),
    });
  }

  createStageOptions() {
    return this.courseConfig.stages.map((stage) => {
      const levelRange = `LEVEL ${stage.levelRange.min}-${stage.levelRange.max}`;

      return {
        value: stage.levelRange.min,
        label: `${stage.title.toUpperCase()} - ${levelRange}`,
        stage,
        isEnabled: this.isStageSelectable(stage),
      };
    });
  }

  selectLocale(locale) {
    this.sessionConfig.setLocale(locale);
    this.localProgressManager.setLocale(locale);
  }

  selectStage(stage) {
    if (!this.isStageSelectable(stage)) {
      return false;
    }

    this.sessionConfig.setCurrentLevel(stage.levelRange.min);

    if (!this.isTestingModeEnabled) {
      this.localProgressManager.setLastStage(this.courseConfig, stage);
    }

    return true;
  }

  isStageSelectable(stage) {
    return (
      this.isTestingModeEnabled ||
      this.localProgressManager.isStageUnlocked(this.courseConfig, stage)
    );
  }

  getTestingModeLabel() {
    return this.isTestingModeEnabled
      ? TESTING_MODE_CONFIG.labels.enabled
      : TESTING_MODE_CONFIG.labels.disabled;
  }

  toggleTestingMode() {
    this.isTestingModeEnabled = !this.isTestingModeEnabled;

    if (!this.isTestingModeEnabled) {
      this.resetLockedTestingStageSelection();
    }

    return this.isTestingModeEnabled;
  }

  resetLockedTestingStageSelection() {
    const selectedStage = this.courseConfig.stages.find(
      ({ levelRange }) => levelRange.min === this.sessionConfig.currentLevel,
    );

    if (
      !selectedStage ||
      this.localProgressManager.isStageUnlocked(this.courseConfig, selectedStage)
    ) {
      return;
    }

    const fallbackStage = this.localProgressManager.getInitialStage(this.courseConfig);
    this.sessionConfig.setCurrentLevel(fallbackStage.levelRange.min);
  }

  resetProgress() {
    this.localProgressManager.reset();

    const initialStage = this.localProgressManager.getInitialStage(this.courseConfig);
    this.sessionConfig = new GameSessionConfig({
      course: this.courseConfig.courseId,
      currentLevel: initialStage.levelRange.min,
      locale: this.localProgressManager.getLocale(),
    });

    return this.sessionConfig;
  }

  prepareStartSession() {
    const selectedStage = this.courseConfig.stages.find(
      ({ levelRange }) => levelRange.min === this.sessionConfig.currentLevel,
    );

    this.localProgressManager.setLocale(this.sessionConfig.locale);

    if (!this.isTestingModeEnabled && selectedStage) {
      this.localProgressManager.setLastStage(this.courseConfig, selectedStage);
    }

    return this.sessionConfig;
  }
}
