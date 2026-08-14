export const COMPACT_UI_WIDTH = 720;

export function getUiViewport(scene) {
  return (
    scene.uiViewport ??
    scene.gameplayViewport ?? {
      left: 0,
      right: scene.cameras.main.width,
      width: scene.cameras.main.width,
      height: scene.cameras.main.height,
      centerX: scene.cameras.main.centerX,
    }
  );
}

export function getUiLayout(scene, { preferredWidth, margin = 24 } = {}) {
  const viewport = getUiViewport(scene);
  const isCompact = viewport.width < COMPACT_UI_WIDTH;
  const width = Math.min(preferredWidth ?? viewport.width, viewport.width - margin * 2);

  return Object.freeze({
    viewport,
    isCompact,
    width,
    centerX: viewport.centerX,
    centerY: scene.cameras.main.centerY,
  });
}
