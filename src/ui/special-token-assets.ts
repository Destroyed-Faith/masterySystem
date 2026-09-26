/**
 * Diminishing-Special token art.
 *
 * Look up `specialKey → tokenAssetPath`. Missing entries use the 1er Challenge
 * placeholder so later PNGs can drop in without touching HUD or Recovery code.
 * Never derive a Special type from a filename.
 */

export const SPECIAL_TOKEN_FALLBACK = 'systems/mastery-system/assets/Challenge Token 1.png';

/** Per-special token art. Add a path here when the dedicated PNG exists. */
export const SPECIAL_TOKEN_ASSETS: Record<string, string> = {
  blight: 'systems/mastery-system/assets/special-tokens/blight.png',
  expose: 'systems/mastery-system/assets/special-tokens/expose.png',
  hex: 'systems/mastery-system/assets/special-tokens/hex.png',
  slow: 'systems/mastery-system/assets/special-tokens/slow.png',
  sundered: 'systems/mastery-system/assets/special-tokens/sundered.png',
};

/**
 * Carousel / status-bar copies. 128px, about 40 KB each.
 * The full tokens above stay on the effect-token area; the map does not
 * preload them, so the carousel must not point at those files.
 */
export const SPECIAL_TOKEN_ICONS: Record<string, string> = {
  blight: 'systems/mastery-system/assets/special-tokens/icons/blight.png',
  expose: 'systems/mastery-system/assets/special-tokens/icons/expose.png',
  hex: 'systems/mastery-system/assets/special-tokens/icons/hex.png',
  slow: 'systems/mastery-system/assets/special-tokens/icons/slow.png',
  sundered: 'systems/mastery-system/assets/special-tokens/icons/sundered.png',
};

export function specialTokenAsset(specialId: string): string {
  const mapped = SPECIAL_TOKEN_ASSETS[String(specialId || '')];
  return mapped || SPECIAL_TOKEN_FALLBACK;
}

/** Small icon for a Special that has effect-token art. Null until that art exists. */
export function specialTokenIcon(specialId: string): string | null {
  const mapped = SPECIAL_TOKEN_ICONS[String(specialId || '').trim().toLowerCase()];
  return mapped || null;
}
