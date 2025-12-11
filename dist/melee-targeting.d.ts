/**
 * Melee Targeting System for Mastery System
 *
 * Provides reach preview and target highlighting for melee attacks
 * Similar to movement preview but for attack targeting
 */
import type { RadialCombatOption } from './token-radial-menu';
/**
 * Start melee targeting mode
 * @param token - The attacking token
 * @param option - The combat option (must be melee)
 */
export declare function startMeleeTargeting(token: any, option: RadialCombatOption): void;
/**
 * End melee targeting mode
 * @param success - Whether targeting was successful (target selected) or cancelled
 */
export declare function endMeleeTargeting(success: boolean): void;
/**
 * Check if melee targeting is currently active
 */
export declare function isMeleeTargetingActive(): boolean;
//# sourceMappingURL=melee-targeting.d.ts.map