/**
 * Range Preview and Hex Highlighting for Radial Menu
 */
import type { RadialCombatOption } from './types';
/**
 * Meters to paint on radial-menu hover.
 * Prefer AoE footprint (burst / radius) over cast/weapon range — otherwise
 * Ranged AoE shows e.g. 68 m cast range instead of a 7 m radius, and Melee
 * AoE Self often shows 0 / weapon reach instead of the burst.
 */
export declare function resolveHoverPreviewMeters(option: RadialCombatOption | null | undefined): number | undefined;
/**
 * Clear the range preview graphics
 */
export declare function clearRangePreview(): void;
/**
 * Clear the radial menu range preview (6 fields)
 */
export declare function clearRadialMenuRange(): void;
/**
 * Show range preview circle around token
 * @param rangeMeters - Power/option range in meters (Mastery System)
 */
export declare function showRangePreview(token: any, rangeMeters: number): void;
/**
 * Show a fixed 6-field radius around the token when radial menu opens.
 * Uses a fixed color (cyan/blue) to distinguish from movement preview.
 * @param token - The token to show the range around
 */
export declare function showRadialMenuRange(token: any): void;
//# sourceMappingURL=range-preview.d.ts.map