/**
 * Diminishing-Special token art.
 *
 * Look up `specialKey → tokenAssetPath`. Missing entries use the 1er Challenge
 * placeholder so later PNGs can drop in without touching HUD or Recovery code.
 * Never derive a Special type from a filename.
 */
export const SPECIAL_TOKEN_FALLBACK = 'systems/mastery-system/assets/Challenge Token 1.png';
/** Per-special token art. Add a path here when the dedicated PNG exists. */
export const SPECIAL_TOKEN_ASSETS = {
    blight: 'systems/mastery-system/assets/special-tokens/blight.png',
    expose: 'systems/mastery-system/assets/special-tokens/expose.png',
    hex: 'systems/mastery-system/assets/special-tokens/hex.png',
    slow: 'systems/mastery-system/assets/special-tokens/slow.png',
    sundered: 'systems/mastery-system/assets/special-tokens/sundered.png',
};
export function specialTokenAsset(specialId) {
    const mapped = SPECIAL_TOKEN_ASSETS[String(specialId || '')];
    return mapped || SPECIAL_TOKEN_FALLBACK;
}
//# sourceMappingURL=special-token-assets.js.map