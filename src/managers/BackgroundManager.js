import {
  BACKGROUND_LAYER_TYPES,
  DEFAULT_BACKGROUND_MAP_ID,
  getBackgroundMapConfig,
} from '../config/backgroundMaps.js';

export class BackgroundManager {
  constructor(scene, { mapId = DEFAULT_BACKGROUND_MAP_ID } = {}) {
    this.scene = scene;
    this.viewportWidth = scene.cameras.main.width;
    this.viewportHeight = scene.cameras.main.height;
    this.mapId = null;
    this.staticSprites = [];
    this.layers = [];

    this.setMap(mapId);
  }

  setMap(mapId) {
    if (this.mapId === mapId) {
      return;
    }

    this.clearLayers();
    this.mapId = mapId;
    this.mapConfig = getBackgroundMapConfig(mapId);
    this.mapConfig.layers.forEach((layerConfig) => this.createLayer(layerConfig));
  }

  createLayer(layerConfig) {
    if (layerConfig.type === BACKGROUND_LAYER_TYPES.STATIC_FILL) {
      this.createStaticFillLayer(layerConfig);
      return;
    }

    if (layerConfig.type === BACKGROUND_LAYER_TYPES.STATIC_BOTTOM) {
      this.createStaticBottomLayer(layerConfig);
      return;
    }

    if (layerConfig.type === BACKGROUND_LAYER_TYPES.SCROLLING) {
      this.createScrollingLayer(layerConfig);
      return;
    }

    throw new Error(`Unsupported background layer type: ${layerConfig.type}`);
  }

  createStaticFillLayer(layerConfig) {
    const sprite = this.scene.add
      .image(0, 0, layerConfig.textureKey)
      .setOrigin(0, 0)
      .setDisplaySize(this.viewportWidth, this.viewportHeight)
      .setDepth(layerConfig.depth);

    this.staticSprites.push(sprite);
  }

  createStaticBottomLayer(layerConfig) {
    const texture = this.scene.textures.get(layerConfig.textureKey).getSourceImage();
    const scale = this.viewportWidth / texture.width;
    const height = texture.height * scale;

    const sprite = this.scene.add
      .image(0, this.viewportHeight, layerConfig.textureKey)
      .setOrigin(0, 1)
      .setDisplaySize(this.viewportWidth, height)
      .setDepth(layerConfig.depth);

    this.staticSprites.push(sprite);
  }

  createScrollingLayer(layerConfig) {
    const texture = this.scene.textures.get(layerConfig.textureKey).getSourceImage();
    const layerScale = this.viewportHeight / texture.height;
    const layerWidth = texture.width * layerScale;
    const layerHeight = texture.height * layerScale;

    const sprites = [0, 1].map((index) =>
      this.scene.add
        .image(index * layerWidth, 0, layerConfig.textureKey)
        .setOrigin(0, 0)
        .setDisplaySize(layerWidth, layerHeight)
        .setDepth(layerConfig.depth),
    );

    this.layers.push({
      speedPxPerSecond: layerConfig.speedPxPerSecond,
      spriteWidth: layerWidth,
      sprites,
    });
  }

  update(delta) {
    const elapsedSeconds = delta / 1000;

    this.layers.forEach((layer) => {
      layer.sprites.forEach((sprite) => {
        sprite.x -= layer.speedPxPerSecond * elapsedSeconds;
      });

      layer.sprites.forEach((sprite) => {
        if (sprite.x + layer.spriteWidth <= 0) {
          const rightmostSpriteX = Math.max(...layer.sprites.map((layerSprite) => layerSprite.x));
          sprite.x = rightmostSpriteX + layer.spriteWidth;
        }
      });
    });
  }

  clearLayers() {
    this.layers.forEach((layer) => {
      layer.sprites.forEach((sprite) => sprite.destroy());
    });

    this.staticSprites.forEach((sprite) => sprite.destroy());
    this.staticSprites = [];
    this.layers = [];
  }

  destroy() {
    this.clearLayers();
  }
}
