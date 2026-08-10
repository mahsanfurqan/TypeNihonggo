import Phaser from 'phaser';
import { WordEnemy } from '../objects/WordEnemy.js';

const SPAWN_LANE_SPACING = 72;
const INITIAL_SPAWN_DELAY_MS = 600;

export class WordManager {
  constructor(scene, vocabulary, settings) {
    this.scene = scene;
    this.vocabulary = vocabulary;
    this.settings = settings;
    this.activeWords = [];
    this.spawnTimerMs = INITIAL_SPAWN_DELAY_MS;
    this.isRunning = true;
    this.isSpawning = false;
    this.levelVocabularyIds = new Set();
    this.pendingVocabularyIds = [];
    this.events = new Phaser.Events.EventEmitter();
    this.spawnLanes = this.createSpawnLanes();
  }

  createSpawnLanes() {
    const lanes = [];

    for (let y = this.settings.spawnY.min; y <= this.settings.spawnY.max; y += SPAWN_LANE_SPACING) {
      lanes.push(y);
    }

    return lanes;
  }

  update(delta) {
    if (!this.isRunning) {
      return;
    }

    if (this.isSpawning && this.canSpawnMoreWords()) {
      this.spawnTimerMs -= delta;

      while (this.spawnTimerMs <= 0 && this.canSpawnMoreWords()) {
        if (!this.spawnWord()) {
          break;
        }

        this.spawnTimerMs += this.settings.spawnIntervalMs;
      }
    }

    const escapedWords = [];
    const expiredWords = [];

    this.activeWords.forEach((word) => {
      word.update(delta);

      if (word.hasReachedDamageBoundary(this.settings.leftDamageX)) {
        escapedWords.push(word);
      }

      if (word.isFullyOutsideLeft(this.settings.leftDespawnX)) {
        expiredWords.push(word);
      }
    });

    escapedWords.forEach((word) => this.handleWordEscape(word));
    expiredWords.forEach((word) => this.removeExpiredWord(word));
  }

  spawnWord() {
    if (!this.canSpawnMoreWords()) {
      return null;
    }

    const selectedWord = this.takeNextWordData();

    if (!selectedWord) {
      this.isSpawning = false;
      return null;
    }

    const x = Phaser.Math.Between(this.settings.spawnX.min, this.settings.spawnX.max);
    const y = this.pickSpawnY();
    const speed = Phaser.Math.FloatBetween(this.settings.wordSpeed.min, this.settings.wordSpeed.max);
    const word = new WordEnemy(this.scene, selectedWord, x, y, speed);

    this.activeWords.push(word);
    this.events.emit('word-spawned', word);

    if (this.pendingVocabularyIds.length === 0) {
      this.isSpawning = false;
    }

    return word;
  }

  canSpawnMoreWords() {
    return this.activeWords.length < this.settings.maxActiveWords;
  }

  pickSpawnY() {
    const shuffledLanes = Phaser.Utils.Array.Shuffle([...this.spawnLanes]);

    return shuffledLanes.sort(
      (leftLane, rightLane) => this.getLaneClearance(rightLane) - this.getLaneClearance(leftLane),
    )[0];
  }

  getLaneClearance(laneY) {
    if (this.activeWords.length === 0) {
      return Number.POSITIVE_INFINITY;
    }

    return this.activeWords.reduce(
      (closestDistance, word) => Math.min(closestDistance, Math.abs(word.y - laneY)),
      Number.POSITIVE_INFINITY,
    );
  }

  takeNextWordData() {
    const vocabularyId = this.pendingVocabularyIds.shift();

    if (!vocabularyId) {
      return null;
    }

    return this.vocabulary.find((word) => word.id === vocabularyId) ?? null;
  }

  setLevelVocabularyIds(vocabularyIds) {
    if (!Array.isArray(vocabularyIds) || vocabularyIds.length === 0) {
      throw new TypeError('WordManager requires a non-empty level vocabulary plan');
    }

    const availableVocabularyIds = new Set(this.vocabulary.map((word) => word.id));
    const missingVocabularyIds = vocabularyIds.filter(
      (vocabularyId) => !availableVocabularyIds.has(vocabularyId),
    );

    if (missingVocabularyIds.length > 0) {
      throw new Error(
        `Level vocabulary is missing from the loaded pool: ${missingVocabularyIds.join(', ')}`,
      );
    }

    this.levelVocabularyIds = new Set(vocabularyIds);
    this.pendingVocabularyIds = [...vocabularyIds];
    this.spawnTimerMs = INITIAL_SPAWN_DELAY_MS;
    this.isSpawning = this.isRunning;
  }

  completeWord(word) {
    if (!this.hasWord(word)) {
      return;
    }

    this.removeWord(word);
    this.events.emit('word-completed', word);
    word.playDestroyEffect(() => {
      this.events.emit('word-completion-effect-finished', word);
    });
  }

  handleWordEscape(word) {
    if (!this.hasWord(word) || !word.markEscaped()) {
      return;
    }

    this.events.emit('word-escaped', word);
  }

  removeExpiredWord(word) {
    if (!this.hasWord(word)) {
      return;
    }

    const shouldRetry =
      word.hasTriggeredLifeLoss &&
      this.levelVocabularyIds.has(word.id) &&
      !this.pendingVocabularyIds.includes(word.id);

    this.removeWord(word);
    word.destroy();

    if (shouldRetry && this.isRunning) {
      this.pendingVocabularyIds.push(word.id);
      this.spawnTimerMs = INITIAL_SPAWN_DELAY_MS;
      this.isSpawning = true;
    }
  }

  removeWord(word) {
    this.activeWords = this.activeWords.filter((activeWord) => activeWord !== word);
  }

  findBestStartingWord(character) {
    const candidates = this.activeWords
      .filter((word) => word.canStartWith(character))
      .sort((leftWord, rightWord) => leftWord.x - rightWord.x);

    return candidates[0] ?? null;
  }

  hasWord(word) {
    return this.activeWords.includes(word);
  }

  stop() {
    this.isRunning = false;
    this.isSpawning = false;
  }

  pauseSpawning() {
    this.isSpawning = false;
  }

  resumeSpawning() {
    if (this.isRunning && this.pendingVocabularyIds.length > 0) {
      this.isSpawning = true;
    }
  }

  setVocabulary(vocabulary) {
    if (!Array.isArray(vocabulary) || vocabulary.length === 0) {
      throw new TypeError('WordManager requires a non-empty vocabulary pool');
    }

    this.vocabulary = vocabulary;
    this.spawnTimerMs = INITIAL_SPAWN_DELAY_MS;
  }

  setSettings(settings) {
    this.settings = settings;
    this.spawnLanes = this.createSpawnLanes();
  }

  clearActiveWords() {
    this.activeWords.forEach((word) => word.destroy());
    this.activeWords = [];
  }

  destroy() {
    this.events.removeAllListeners();
    this.clearActiveWords();
  }
}
