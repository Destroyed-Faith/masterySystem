/**
 * Resolve Passive / Active Buff Invisibility into a combat profile.
 * Powers are the source of truth. Cloak Disruption no longer applies.
 */
import type { CombatSenseId } from './combat-senses.js';
/** Default Special Combat Senses Obscured when the Passive grants slots (until the player picks). */
export declare const DEFAULT_SPECIAL_SENSE_BLOCK_ORDER: CombatSenseId[];
export interface InvisibilityProfile {
    /** Combined Passive + Active Buff Invisibility Bonus. */
    baseBonus: number;
    /** How many Special Combat Sense slots the Passive grants (Active Buff adds 0). */
    specialSenseSlots: number;
    /**
     * Covered (Obscured) senses — Normal + Darkvision always when active,
     * plus chosen Special Combat Senses from the Passive.
     */
    blockedSenses: CombatSenseId[];
    /** True when any invisibility source is present and not health-suppressed. */
    active: boolean;
}
/**
 * Live Invisibility profile from owned Passive: Invisibility + Active Buff: Invisibility.
 */
export declare function resolveInvisibilityFromActor(actor: any): InvisibilityProfile;
/** Live Invisibility Bonus (0 when Incapacitated / suppressed). */
export declare function effectiveInvisibilityBonusForActor(actor: any): number;
/**
 * Covered (Obscured) sense under Invisibility.
 * Uncovered Special Combat Senses are unaffected — callers treat them as auto-perceive.
 */
export declare function isSenseBlockedForActor(target: any, senseId: CombatSenseId): boolean;
/** Sync perceptionCombat base + covered senses from powers (+ visual presentation). */
export declare function syncInvisibilityFromPowers(actor: any): Promise<InvisibilityProfile>;
//# sourceMappingURL=invisibility-profile.d.ts.map