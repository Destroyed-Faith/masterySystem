/**
 * Diminishing-Special token art.
 *
 * Look up `specialKey → tokenAssetPath`. Missing entries use the 1er Challenge
 * placeholder so later PNGs can drop in without touching HUD or Recovery code.
 * Never derive a Special type from a filename.
 */
export declare const SPECIAL_TOKEN_FALLBACK = "systems/mastery-system/assets/Challenge Token 1.png";
/** Per-special token art. Add a path here when the dedicated PNG exists. */
export declare const SPECIAL_TOKEN_ASSETS: Record<string, string>;
export declare function specialTokenAsset(specialId: string): string;
//# sourceMappingURL=special-token-assets.d.ts.map