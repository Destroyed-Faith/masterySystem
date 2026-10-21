/**
 * Attack Executor
 * Creates melee/ranged attack chat cards with proper flags for the roll handler
 */
import type { RadialCombatOption } from "../token-radial-menu";
export { getTargetEvade, getTargetSpellResistance, spellResistanceAfterPenetration, } from "./target-defenses.js";
/** Bookkeeping for a single strike of a split-attack pair. */
interface SplitContext {
    splitPairId: string;
    splitIndex: 1 | 2;
    /** This strike's share of the attack pool. Strike 2 carries the remainder. */
    attributePool: number;
    secondPool?: number;
    sharedRaisePlan?: string;
    sharedRaiseSlots?: string;
    sharedRaiseFree?: string;
    sharedRaiseTn?: string;
}
/** Split one attack pool across two strikes. No Mastery Rank floor. */
export declare function divideSplitAttackPool(total: number): {
    first: number;
    second: number;
};
/** Combatants other than the attacker. One alternative target is enough. */
export declare function listSplitSecondTargetIds(tokenIds: readonly string[], attackerTokenId: string): string[];
export declare function rememberSplitSharedRaises(pairId: string, raises: {
    plan?: string;
    slots?: string;
    free?: string;
    tn?: string;
}): void;
export declare function peekPendingSplit(pairId: string): {
    targetTokenId: string;
    secondPool: number;
    sharedRaisePlan?: string;
} | null;
type SplitSecondTargetFn = (attackerToken: any, primaryTargetToken: any, option: RadialCombatOption) => Promise<string | null>;
/** Tests and the attack card use this to choose the second Split Attack token. */
export declare function setSplitSecondTargetResolver(fn: SplitSecondTargetFn | null): void;
/**
 * After Strike 1 of a Split Attack fully resolves (hit or miss), post Strike 2.
 * Safe to call more than once — the pending entry is consumed on first spawn.
 */
export declare function spawnSplitStrike2IfPending(splitPairId: string | null | undefined): Promise<void>;
/** One melee AoE declaration → multiple attack cards; only volleyIndex === 1 spends the attack action on roll. */
export interface MeleeBurstVolleyContext {
    volleyId: string;
    volleyIndex: number;
    volleyTotal: number;
}
/**
 * Instant AoE Attack context (Melee / Ranged AoE Attack, AoE Special Attacks).
 *
 * One shared Attack/Casting roll is compared separately against each creature's
 * Evade (or Final Spell TN for spell AoEs). One shared Power damage roll is applied
 * to every creature hit, with the full printed Special. There is NO Primary Target:
 * the attack card is anchored to one token only as the roll carrier (TN preview);
 * on Roll, the anchor and every token in `secondaryTokenIds` are resolved equally via
 * `resolveAoeFromSharedRoll`. Instant AoE never adds Weapon Damage or Spell Focus.
 */
export interface AoeMeleeWeaponContext {
    /**
     * All other tokens in the area besides the card's roll carrier. The carrier is
     * NOT a primary target — it is resolved like every other creature.
     */
    secondaryTokenIds: string[];
    /**
     * Printed Power bonus d8 (damageRider). Informational (Crit legality / UI);
     * damage is rolled once through the damage dialog.
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
/** Queue strike 2 against a chosen token. One other combatant is a valid choice. */
export declare function openSplitPair(attackerToken: any, targetToken: any, option: RadialCombatOption, attackType: 'melee' | 'ranged'): Promise<{
    pairId: string;
    secondTargetId: string;
}>;
/**
 * Create a melee or ranged attack chat card with roll button (Threatened Ranged for qualifying ranged attacks).
 */
export declare function createAttackCard(attackerToken: any, targetToken: any, option: RadialCombatOption, attackType: "melee" | "ranged", split?: SplitContext | null, burstVolley?: MeleeBurstVolleyContext | null, aoeMelee?: AoeMeleeWeaponContext | null): Promise<string | null>;
export declare function createMeleeAttackCard(attackerToken: any, targetToken: any, option: RadialCombatOption, burstVolley?: MeleeBurstVolleyContext | null, aoeMelee?: AoeMeleeWeaponContext | null): Promise<string | null>;
export declare function createRangedAttackCard(attackerToken: any, targetToken: any, option: RadialCombatOption, aoeZone?: AoeMeleeWeaponContext | null): Promise<string | null>;
/**
 * Pre-roll Raise counts on attack cards (effects allocated after a hit).
 */
type RaiseCountDraft = {
    paid: number;
    free: number;
};
export declare function applyRemoteRaisePlan(payload: {
    messageId?: string;
    draft?: RaiseCountDraft | Array<{
        optionId?: string;
        free?: boolean;
    }>;
    summary?: string;
    paid?: number;
    free?: number;
}): void;
export declare function registerRaisePlanChatHooks(): void;
//# sourceMappingURL=attack-executor.d.ts.map