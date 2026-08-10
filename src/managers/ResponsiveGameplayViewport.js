import {
  applyGameplayViewport,
  resolveGameplayViewport,
} from '../config/responsiveGameplay.js';

const GAMEPLAY_CLASS = 'typenihongo-gameplay-active';

export class ResponsiveGameplayViewport {
  constructor(scene) {
    this.scene = scene;
    this.gameRoot = scene.game.canvas?.parentElement ?? null;
    this.documentRoot = globalThis.document?.documentElement ?? null;
    this.documentRoot?.classList.add(GAMEPLAY_CLASS);
    this.bounds = this.resolveBounds();
  }

  resolveBounds() {
    return resolveGameplayViewport({
      containerWidth: this.gameRoot?.clientWidth ?? this.scene.scale.parentSize.width,
      containerHeight: this.gameRoot?.clientHeight ?? this.scene.scale.parentSize.height,
    });
  }

  applyToSettings(settings) {
    return applyGameplayViewport(settings, this.bounds);
  }

  destroy() {
    this.documentRoot?.classList.remove(GAMEPLAY_CLASS);
    this.scene = null;
    this.gameRoot = null;
    this.documentRoot = null;
  }
}
