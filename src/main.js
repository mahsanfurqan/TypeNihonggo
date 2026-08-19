import Phaser from 'phaser';
import './style.css';
import { gameConfig } from './config/gameConfig.js';
import { MobileLifecycleManager } from './managers/MobileLifecycleManager.js';
import { MobileTypingInput } from './ui/dom/MobileTypingInput.js';

const game = new Phaser.Game(gameConfig);

new MobileLifecycleManager(game);
new MobileTypingInput(document.querySelector('#mobile-input-root'));
