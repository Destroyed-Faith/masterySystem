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
 * Setup raise-plan editor on attack cards (new Raise rules).
 * The chosen Raises are broadcast so the GM sees them without a chat re-render.
 */
type RaiseDraftRow = {
    optionId: string;
    free: boolean;
};
export declare function applyRemoteRaisePlan(payload: {
    messageId?: string;
    draft?: RaiseDraftRow[];
    summary?: string;
}): void;
export declare function registerRaisePlanChatHooks(): void;
//# sourceMappingURL=attack-executor.d.ts.map