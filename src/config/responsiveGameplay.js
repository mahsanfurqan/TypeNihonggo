import { GAME_VIEW } from './gameSettings.js';

export const RESPONSIVE_GAMEPLAY = Object.freeze({
  maxViewportWidthPx: 1280,
  minimumVisibleWorldWidth: 440,
  playerInset: Object.freeze({ min: 132, max: 190, ratio: 0.18 }),
  dangerBoundaryInset: 38,
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function resolveGameplayViewport({ containerWidth, containerHeight }) {
  const hasValidSize = containerWidth > 0 && containerHeight > 0;
  const isResponsive = hasValidSize && containerWidth <= RESPONSIVE_GAMEPLAY.maxViewportWidthPx;
  const aspectVisibleWidth = hasValidSize
    ? GAME_VIEW.height * (containerWidth / containerHeight)
    : GAME_VIEW.width;
  const width = isResponsive
    ? clamp(
        aspectVisibleWidth,
        RESPONSIVE_GAMEPLAY.minimumVisibleWorldWidth,
        GAME_VIEW.width,
      )
    : GAME_VIEW.width;
  const left = (GAME_VIEW.width - width) / 2;
  const right = left + width;
  const playerInset = clamp(
    width * RESPONSIVE_GAMEPLAY.playerInset.ratio,
    RESPONSIVE_GAMEPLAY.playerInset.min,
    RESPONSIVE_GAMEPLAY.playerInset.max,
  );

  return Object.freeze({
    left,
    right,
    width,
    centerX: left + width / 2,
    height: GAME_VIEW.height,
    isCropped: width < GAME_VIEW.width,
    playerX: left + playerInset,
    dangerBoundaryX: left + RESPONSIVE_GAMEPLAY.dangerBoundaryInset,
  });
}

export function applyGameplayViewport(settings, viewport) {
  if (!viewport?.isCropped) {
    return settings;
  }

  const originalSpawnCenter = (settings.spawnX.min + settings.spawnX.max) / 2;
  const responsiveSpawnCenter = viewport.right + 150;
  const originalTravelDistance = originalSpawnCenter - settings.leftDamageX;
  const responsiveTravelDistance = responsiveSpawnCenter - viewport.dangerBoundaryX;
  const speedScale = responsiveTravelDistance / originalTravelDistance;

  return Object.freeze({
    ...settings,
    spawnX: Object.freeze({
      min: viewport.right + 80,
      max: viewport.right + 220,
    }),
    leftDamageX: viewport.dangerBoundaryX,
    leftDespawnX: viewport.left - 180,
    wordSpeed: Object.freeze({
      min: settings.wordSpeed.min * speedScale,
      max: settings.wordSpeed.max * speedScale,
    }),
  });
}
