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
/**
 * Carousel / status-bar copies. 128px, about 40 KB each.
 * The full tokens above stay on the effect-token area; the map does not
 * preload them, so the carousel must not point at those files.
 */
export declare const SPECIAL_TOKEN_ICONS: Record<string, string>;
export declare function specialTokenAsset(specialId: string): string;
/** Small icon for a Special that has effect-token art. Null until that art exists. */
export declare function specialTokenIcon(specialId: string): string | null;
//# sourceMappingURL=special-token-assets.d.ts.map