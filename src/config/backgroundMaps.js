export const BACKGROUND_LAYER_TYPES = Object.freeze({
  STATIC_FILL: 'static-fill',
  SCROLLING: 'scrolling',
  STATIC_BOTTOM: 'static-bottom',
});

export const DEFAULT_BACKGROUND_MAP_ID = 'm1_summer';
export const FALLBACK_BACKGROUND_MAP_ID = 'm2_taisho';

const CLOUD_SPEEDS = Object.freeze({
  slow: 10,
  medium: 22,
});

function createMap(id, title, texturePrefix) {
  return Object.freeze({
    id,
    title,
    layers: Object.freeze([
      Object.freeze({
        id: `${id}-sky`,
        textureKey: `${texturePrefix}-1`,
        type: BACKGROUND_LAYER_TYPES.STATIC_FILL,
        depth: 0,
      }),
      Object.freeze({
        id: `${id}-back-clouds`,
        textureKey: `${texturePrefix}-2`,
        type: BACKGROUND_LAYER_TYPES.SCROLLING,
        depth: 1,
        speedPxPerSecond: CLOUD_SPEEDS.slow,
      }),
      Object.freeze({
        id: `${id}-front-clouds`,
        textureKey: `${texturePrefix}-3`,
        type: BACKGROUND_LAYER_TYPES.SCROLLING,
        depth: 2,
        speedPxPerSecond: CLOUD_SPEEDS.medium,
      }),
      Object.freeze({
        id: `${id}-ground`,
        textureKey: `${texturePrefix}-4`,
        type: BACKGROUND_LAYER_TYPES.STATIC_BOTTOM,
        depth: 3,
      }),
    ]),
  });
}

export const BACKGROUND_MAPS = Object.freeze({
  m1_summer: createMap('m1_summer', 'Summer Field', 'background-m1-summer'),
  m2_taisho: createMap('m2_taisho', 'Taisho District', 'background-m2-taisho'),
});

export const BACKGROUND_MAP_LEVEL_RULES = Object.freeze([
  Object.freeze({
    minLevel: 1,
    maxLevel: 20,
    mapId: 'm1_summer',
  }),
  Object.freeze({
    minLevel: 21,
    maxLevel: Number.POSITIVE_INFINITY,
    mapId: 'm2_taisho',
  }),
]);

export function getBackgroundMapConfig(mapId = DEFAULT_BACKGROUND_MAP_ID) {
  const mapConfig = BACKGROUND_MAPS[mapId];

  if (!mapConfig) {
    throw new Error(`Unknown background map: ${mapId}`);
  }

  return mapConfig;
}

export function resolveBackgroundMapIdForLevel(level) {
  if (!Number.isInteger(level) || level < 1) {
    throw new TypeError('Background map level must be a positive integer');
  }

  const rule = BACKGROUND_MAP_LEVEL_RULES.find(
    (candidate) => level >= candidate.minLevel && level <= candidate.maxLevel,
  );

  return rule?.mapId ?? FALLBACK_BACKGROUND_MAP_ID;
}
