/**
 * Attack Executor
 * Creates melee/ranged attack chat cards with proper flags for the roll handler
 */
import type { RadialCombatOption } from "../token-radial-menu";
export { getTargetEvade, getTargetSpellResistance } from "./target-defenses.js";
/** Bookkeeping for a single strike of a split-attack pair. */
interface SplitContext {
    splitPairId: string;
    splitIndex: 1 | 2;
    /** Halved attack pool for this strike (Math.floor(original / 2)). */
    attributePool: number;
}
/** One melee AoE declaration → multiple attack cards; only volleyIndex === 1 spends the attack action on roll. */
export interface MeleeBurstVolleyContext {
    volleyId: string;
    volleyIndex: number;
    volleyTotal: number;
}
/**
 * Weapon / martial AoE context. One Attack Roll is compared separately against
 * each creature's Evade (or Final Spell TN for spell AoEs). Every hit receives
 * the full printed payload; Dive for Cover may be used before payload.
 */
export interface AoeMeleeWeaponContext {
    /** Other tokens in the area besides the card's display/primary target. */
    secondaryTokenIds: string[];
    /**
     * Power bonus d8 (damageRider). Kept for UI/debug; secondaries now resolve
     * full payload via the damage dialog, not splash-only dice.
     */
    powerBonusDice: number;
}
/**
 * Get attribute value from actor
 */
export declare function getAttributeValue(actor: any, attributeName: string): number;
/**
 * Get mastery rank from actor
 */
export declare function getMasteryRank(actor: any): number;
/** True when the wielded weapon (real or artifact-virtual) has the Finesse innate. */
export declare function weaponHasFinesse(weapon: any | null): boolean;
export declare function getAttackAttribute(actor: any, weapon: any | null, option: RadialCombatOption, attackType: "melee" | "ranged"): string;
/**
 * Create a melee or ranged attack chat card with roll button (Threatened Ranged for qualifying ranged attacks).
 */
export declare function createAttackCard(attackerToken: any, targetToken: any, option: RadialCombatOption, attackType: "melee" | "ranged", split?: SplitContext | null, burstVolley?: MeleeBurstVolleyContext | null, aoeMelee?: AoeMeleeWeaponContext | null): Promise<string | null>;
export declare function createMeleeAttackCard(attackerToken: any, targetToken: any, option: RadialCombatOption, burstVolley?: MeleeBurstVolleyContext | null, aoeMelee?: AoeMeleeWeaponContext | null): Promise<string | null>;
export declare function createRangedAttackCard(attackerToken: any, targetToken: any, option: RadialCombatOption, aoeZone?: AoeMeleeWeaponContext | null): Promise<string | null>;
//# sourceMappingURL=attack-executor.d.ts.map