export const MODULE_ID = "df-particle-effects";

/** Document subtype stored on RegionBehavior.type. The module id is the required prefix. */
export const BEHAVIOR_TYPE = `${MODULE_ID}.particleEffects`;

export const EFFECT_NATURAL_FIRE = "naturalFire";

export const TYPE_LABEL_KEY = "TYPES.RegionBehavior.df-particle-effects.particleEffects";

export const LOG_PREFIX = "df-particle-effects |";

/**
 * Flame sites per grid cell when Density is 100, before the quality cap.
 * Density 40 on a 10×10 cell region is about 25 sites.
 */
export const FLAMES_PER_CELL_AT_FULL_DENSITY = 0.62;

/** Texture height, in grid cells, at Flame Scale 1. The art includes padding. */
export const FLAME_HEIGHT_IN_CELLS = {
  large: 1.85,
  medium: 1.25,
  small: 0.78,
};

/**
 * Foundry GRID_TYPES: 0 gridless, 1 square, 2–5 hex.
 * Hex cell area is 3/4 of the sizeX×sizeY bounding box.
 */
export const HEX_GRID_TYPES = new Set([2, 3, 4, 5]);

export const QUALITY_LIMITS = {
  low: { perRegionFlames: 36, perRegionEmbers: 24, sceneFlames: 70, sceneEmbers: 48 },
  medium: { perRegionFlames: 80, perRegionEmbers: 60, sceneFlames: 180, sceneEmbers: 140 },
  high: { perRegionFlames: 140, perRegionEmbers: 110, sceneFlames: 360, sceneEmbers: 280 },
};

/** Tiles sit above the scene background (0) and below tokens (700) in Foundry v14. */
export const PRIMARY_TILE_SORT = 500;
