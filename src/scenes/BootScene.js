import Phaser from 'phaser';
import idleTextureUrl from '../assets/character/idle.png';
import attackTextureUrl from '../assets/character/attack.png';
import { BACKGROUND_MAP_ASSETS } from '../config/backgroundMapAssets.js';

const PLAYER_FRAME_SIZE = 256;
const PLAYER_ATTACK_FRAME_RATE = 10;
const PLAYER_ATTACK_FRAME_COUNT = 4;

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    Object.entries(BACKGROUND_MAP_ASSETS).forEach(([textureKey, textureUrl]) => {
      this.load.image(textureKey, textureUrl);
    });
    this.load.image('player-idle', idleTextureUrl);
    this.load.spritesheet('player-attack', attackTextureUrl, {
      frameWidth: PLAYER_FRAME_SIZE,
      frameHeight: PLAYER_FRAME_SIZE,
      endFrame: PLAYER_ATTACK_FRAME_COUNT - 1,
    });
  }

  create() {
    if (!this.anims.exists('player-attack')) {
      this.anims.create({
        key: 'player-attack',
        frames: this.anims.generateFrameNumbers('player-attack', {
          start: 0,
          end: PLAYER_ATTACK_FRAME_COUNT - 1,
        }),
        frameRate: PLAYER_ATTACK_FRAME_RATE,
        repeat: 0,
      });
    }

    this.scene.start('setup');
  }
}
