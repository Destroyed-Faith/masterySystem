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
// challenge: 'systems/mastery-system/assets/tokens/challenge-1.png',
};
export function specialTokenAsset(specialId) {
    const mapped = SPECIAL_TOKEN_ASSETS[String(specialId || '')];
    return mapped || SPECIAL_TOKEN_FALLBACK;
}
//# sourceMappingURL=special-token-assets.js.map