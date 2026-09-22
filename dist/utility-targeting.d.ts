/**
 * Utility Targeting System for Mastery System
 *
 * Provides targeting preview and selection for utility powers, especially AoE utilities
 * Supports single-target and radius AoE with manual target selection
 */
import type { RadialCombatOption } from './token-radial-menu';
import { utilitySingleTargetAllowsSelf } from './utility-targeting-rules.js';
export { utilitySingleTargetAllowsSelf };
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
/**
 * Cone attack from the figure. The mouse only turns the 60° slice; the
 * apex stays on the caster. Each ring is one cell wider.
 */
export declare function startConeAttackMode(token: any, option: RadialCombatOption): void;
export declare function endUtilityTargeting(success: boolean): void;
/**
 * Check if utility targeting is currently active
 */
export declare function isUtilityTargetingActive(): boolean;
//# sourceMappingURL=utility-targeting.d.ts.map