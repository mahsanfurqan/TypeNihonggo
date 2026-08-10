export const GAME_VIEW = Object.freeze({
  width: 1280,
  height: 720,
});

export const PLAYER_POSITION = Object.freeze({
  x: 230,
  y: GAME_VIEW.height - 150,
});

export const GAMEPLAY = Object.freeze({
  startingLives: 3,
  startingScore: 0,
  spawnIntervalMs: 2200,
  spawnX: Object.freeze({
    min: GAME_VIEW.width + 80,
    max: GAME_VIEW.width + 220,
  }),
  spawnY: Object.freeze({
    min: 215,
    max: GAME_VIEW.height - 270,
  }),
  leftDamageX: 0,
  leftDespawnX: -180,
  maxActiveWords: 3,
  wordSpeed: Object.freeze({
    min: 92,
    max: 118,
  }),
});

export const COLORS = Object.freeze({
  backgroundTop: 0x09111f,
  backgroundBottom: 0x050910,
  horizonGlow: 0x153561,
  gridLine: 0x2c3f64,
  wordFill: 0x13233c,
  wordStroke: 0x4cc9f0,
  wordTargetFill: 0x20385f,
  wordTargetStroke: 0xffc857,
  typedChar: '#ffd166',
  nextChar: '#9ae6b4',
  pendingChar: '#f5f7ff',
  inactiveChar: '#8ea0bd',
});
