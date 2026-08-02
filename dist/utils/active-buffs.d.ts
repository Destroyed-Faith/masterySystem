/**
 * Active Buff utilities for the Mastery System
 * Active Buffs are powers that create effects lasting for "Mastery Rank rounds"
 */
/**
 * Check if a power is a utility (not a true active buff)
 */
export declare function isUtility(power: any): boolean;
/**
 * Check if a power is a true active buff (not a utility)
 */
export declare function isTrueActiveBuff(power: any): boolean;
/**
 * Check if a power is an active buff (includes utilities)
 */
export declare function isActiveBuff(power: any): boolean;
/**
 * Get all true active buffs (excluding utilities) on an actor
 */
export declare function getTrueActiveBuffs(actor: Actor): any[];
/**
 * Activate an active buff power
 * Creates an ActiveEffect that lasts for Mastery Rank rounds
 * Only one true active buff can be active at a time (utilities can stack)
 */
export declare function activateActiveBuff(actor: Actor, power: any): Promise<boolean>;
/**
 * Get all active buffs on an actor
 */
export declare function getActiveBuffs(actor: Actor): any[];
/**
 * Highest Active Buff Critical(X) currently maintained (0 if none).
 * X = Critical-capable attacks per Round (not explode strength).
 * Resolution lives in `src/combat/critical-resolution.ts`.
 */
export declare function getActiveBuffCriticalTier(actor: Actor): number;
/**
 * Check if a specific power is currently active as a buff
 */
export declare function isPowerActiveAsBuff(actor: Actor, powerId: string): boolean;
/**
 * Remove all Mastery-flagged active-buff ActiveEffects from an actor (e.g. combat end).
 */
export declare function deleteAllMasteryActiveBuffEffects(actor: Actor): Promise<void>;
/** Strip buff effects from every combatant when an encounter ends. */
export declare function clearMasteryActiveBuffsForCombatants(combat: Combat): Promise<void>;
//# sourceMappingURL=active-buffs.d.ts.map