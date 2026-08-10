import Phaser from 'phaser';
import { GAME_VIEW } from './gameSettings.js';
import { BootScene } from '../scenes/BootScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { SetupScene } from '../scenes/SetupScene.js';

export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  backgroundColor: '#050910',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_VIEW.width,
    height: GAME_VIEW.height,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
  },
  input: {
    keyboard: true,
  },
  scene: [BootScene, SetupScene, GameScene],
};
