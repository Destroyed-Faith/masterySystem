/**
 * Attack Executor
 * Creates melee/ranged attack chat cards with proper flags for the roll handler
 */
import type { RadialCombatOption } from "../token-radial-menu";
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
/** Melee weapon AoE: one roll vs primary; secondaries resolved after primary damage. */
export interface AoeMeleeWeaponContext {
    secondaryTokenIds: string[];
    /** Extra d8 from the power template for secondary targets only. */
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
/**
 * Determine which attribute to use for attack rolls.
 * - Spells: casting attribute on the item / option.
 * - Weapons with Finesse (incl. artifact Free Trait): Agility for To-Hit —
 *   also for weapon-carried attack powers (Melee Single Attack, Smite, …),
 *   where it beats the mastery-tree default (rules: "Attack Roll uses Agility").
 * - Powers: attribute from mastery tree / spell school (`system.tree`) via fixed list; if unknown tree, fall back to `roll.attribute`.
 * - Otherwise: Might for melee, Agility for ranged (weapon or maneuver).
 */
export declare function getAttackAttribute(_actor: any, weapon: any | null, option: RadialCombatOption, attackType: "melee" | "ranged"): string;
/**
 * Create a melee or ranged attack chat card with roll button (Threatened Ranged for qualifying ranged attacks).
 */
export declare function createAttackCard(attackerToken: any, targetToken: any, option: RadialCombatOption, attackType: "melee" | "ranged", split?: SplitContext | null, burstVolley?: MeleeBurstVolleyContext | null, aoeMelee?: AoeMeleeWeaponContext | null): Promise<void>;
export declare function createMeleeAttackCard(attackerToken: any, targetToken: any, option: RadialCombatOption, burstVolley?: MeleeBurstVolleyContext | null, aoeMelee?: AoeMeleeWeaponContext | null): Promise<void>;
export declare function createRangedAttackCard(attackerToken: any, targetToken: any, option: RadialCombatOption): Promise<void>;
export {};
//# sourceMappingURL=attack-executor.d.ts.map