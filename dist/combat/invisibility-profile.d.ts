/**
 * Resolve Passive / Active Buff Invisibility into a combat profile.
 * Powers are the source of truth; perceptionCombat flags store Cloak Disruption.
 */
import type { CombatSenseId } from './combat-senses.js';
/** Default Special Combat Senses blocked when the Passive grants slots (until the player picks). */
export declare const DEFAULT_SPECIAL_SENSE_BLOCK_ORDER: CombatSenseId[];
export interface InvisibilityProfile {
    /** Combined Passive + Active Buff Invisibility Bonus (before Cloak Disruption). */
    baseBonus: number;
    /** How many Special Combat Sense slots the Passive grants (Active Buff adds 0). */
    specialSenseSlots: number;
    /** Full blocked-sense list for targeting gates. */
    blockedSenses: CombatSenseId[];
    /** True when any invisibility source is present. */
    active: boolean;
}
/**
 * Live Invisibility profile from owned Passive: Invisibility + Active Buff: Invisibility.
 */
export declare function resolveInvisibilityFromActor(actor: any): InvisibilityProfile;
/** Effective bonus after Cloak Disruption, with Passive/Buff as the floor base. */
export declare function effectiveInvisibilityBonusForActor(actor: any): number;
/** Sense blocked using live Passive/Buff profile (not only stored flags). */
export declare function isSenseBlockedForActor(target: any, senseId: CombatSenseId): boolean;
/** Sync perceptionCombat base + blocked senses from powers (keeps disruption current when set). */
export declare function syncInvisibilityFromPowers(actor: any): Promise<InvisibilityProfile>;
//# sourceMappingURL=invisibility-profile.d.ts.map