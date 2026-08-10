import Phaser from 'phaser';
import './style.css';
import { gameConfig } from './config/gameConfig.js';
import { MobileTypingInput } from './ui/dom/MobileTypingInput.js';

new Phaser.Game(gameConfig);
new MobileTypingInput(document.querySelector('#mobile-input-root'));
