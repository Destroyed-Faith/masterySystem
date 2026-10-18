export const MODULE_ID = "df-particle-effects";
export const SYSTEM_ID = "mastery-system";

/** Standalone-module subtype. Foundry prefixes module subtypes with the module id. */
export const BEHAVIOR_TYPE = `${MODULE_ID}.particleEffects`;

/** System subtype. No package prefix. This is the entry inside Mastery System. */
export const SYSTEM_BEHAVIOR_TYPE = "particleEffects";

export const EFFECT_NATURAL_FIRE = "naturalFire";
export const ARRANGEMENT_FIELD = "field";
export const ARRANGEMENT_SINGLE = "single";

export const TYPE_LABEL_KEY = "TYPES.RegionBehavior.df-particle-effects.particleEffects";
export const SYSTEM_TYPE_LABEL_KEY = "TYPES.RegionBehavior.particleEffects";

/**
 * True when this file was loaded from the system package, not from Data/modules.
 * The Forge often serves the system from a bazaar URL
 * (`.../mastery-system/<version>/modules/df-particle-effects/...`) that does not
 * contain `/systems/mastery-system/`. A standalone install is `/modules/df-particle-effects/...`.
 */
export function isSystemPackageUrl(url) {
  const decoded = decodeURIComponent(String(url || ""));
  const marker = `/modules/${MODULE_ID}/`;
  const at = decoded.indexOf(marker);
  if (at === -1) return false;
  const before = decoded.slice(0, at);
  return (
    before.includes(`/systems/${SYSTEM_ID}`) ||
    before.includes(`/${SYSTEM_ID}/`) ||
    before.endsWith(`/${SYSTEM_ID}`)
  );
}

export function hostedBySystem() {
  return isSystemPackageUrl(import.meta.url);
}

export function behaviorTypeId() {
  return hostedBySystem() ? SYSTEM_BEHAVIOR_TYPE : BEHAVIOR_TYPE;
}

export function typeLabelKey() {
  return hostedBySystem() ? SYSTEM_TYPE_LABEL_KEY : TYPE_LABEL_KEY;
}

export function assetRoot() {
  return hostedBySystem() ? `systems/${SYSTEM_ID}/modules/${MODULE_ID}` : `modules/${MODULE_ID}`;
}

export function settingsNamespace() {
  return hostedBySystem() ? SYSTEM_ID : MODULE_ID;
}

export function qualitySettingKey() {
  return hostedBySystem() ? "dfParticleFireQuality" : "quality";
}

/** Blank form values for the optional seed. Foundry otherwise rejects "". */
export function blankSeedToNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
}

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
