import Phaser from 'phaser';
import {
  normalizeRomajiCharacter,
  ROMAJI_INPUT_EVENT,
} from '../utils/romajiInputEvents.js';

export class TypingManager {
  constructor(scene, wordManager, { inputTarget = globalThis.window } = {}) {
    this.scene = scene;
    this.wordManager = wordManager;
    this.activeWord = null;
    this.isEnabled = true;
    this.events = new Phaser.Events.EventEmitter();
    this.inputTarget = inputTarget;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleRomajiInput = this.handleRomajiInput.bind(this);

    this.scene.input.keyboard.on('keydown', this.handleKeyDown);
    this.inputTarget?.addEventListener?.(ROMAJI_INPUT_EVENT, this.handleRomajiInput);
    this.wordManager.events.on('word-completed', this.handleResolvedWord, this);
    this.wordManager.events.on('word-escaped', this.handleResolvedWord, this);
  }

  update() {
    if (this.activeWord && !this.wordManager.hasWord(this.activeWord)) {
      this.clearResolvedWord();
    }
  }

  disable() {
    this.pause();
    this.setActiveWord(null);
  }

  pause() {
    this.isEnabled = false;
  }

  resume() {
    this.isEnabled = true;
  }

  destroy() {
    this.events.removeAllListeners();
    this.scene.input.keyboard.off('keydown', this.handleKeyDown);
    this.inputTarget?.removeEventListener?.(ROMAJI_INPUT_EVENT, this.handleRomajiInput);
    this.wordManager.events.off('word-completed', this.handleResolvedWord, this);
    this.wordManager.events.off('word-escaped', this.handleResolvedWord, this);
  }

  handleResolvedWord(resolvedWord) {
    if (this.activeWord === resolvedWord) {
      this.clearResolvedWord();
    }
  }

  handleKeyDown(event) {
    this.handleCharacterInput(event.key);
  }

  handleRomajiInput(event) {
    this.handleCharacterInput(event.detail?.character);
  }

  handleCharacterInput(value) {
    if (!this.isEnabled) {
      return;
    }

    const typedCharacter = normalizeRomajiCharacter(value);

    if (!typedCharacter) {
      return;
    }

    if (!this.activeWord) {
      const matchingWord = this.wordManager.findBestStartingWord(typedCharacter);

      if (!matchingWord) {
        return;
      }

      this.setActiveWord(matchingWord);
    }

    if (!this.activeWord?.matchesNextCharacter(typedCharacter)) {
      this.activeWord?.playWrongTypingFeedback();
      this.events.emit('wrong-key');
      return;
    }

    const hasCompletedWord = this.activeWord.commitCharacter(typedCharacter);

    if (hasCompletedWord) {
      const completedWord = this.activeWord;
      this.setActiveWord(null);
      this.wordManager.completeWord(completedWord);
      return;
    }

    this.activeWord.playCorrectTypingFeedback();
    this.events.emit('correct-key');
  }

  clearResolvedWord() {
    this.activeWord = null;
    this.events.emit('target-changed', null);
  }

  setActiveWord(word) {
    if (this.activeWord === word) {
      return;
    }

    if (this.activeWord) {
      this.activeWord.setTargeted(false);
    }

    this.activeWord = word;

    if (this.activeWord) {
      this.activeWord.setTargeted(true);
    }

    this.events.emit('target-changed', word);
  }
}
