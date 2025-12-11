/**
 * Utility Targeting System for Mastery System
 *
 * Provides targeting preview and selection for utility powers, especially AoE utilities
 * Supports single-target and radius AoE with manual target selection
 */
import type { RadialCombatOption } from './token-radial-menu';
/**
 * Start single-target utility mode
 */
export declare function startUtilitySingleTargetMode(token: any, option: RadialCombatOption): void;
/**
 * Start radius utility mode
 */
export declare function startUtilityRadiusMode(token: any, option: RadialCombatOption): void;
/**
 * End utility targeting mode
 */
export declare function endUtilityTargeting(success: boolean): void;
/**
 * Check if utility targeting is currently active
 */
export declare function isUtilityTargetingActive(): boolean;
//# sourceMappingURL=utility-targeting.d.ts.map