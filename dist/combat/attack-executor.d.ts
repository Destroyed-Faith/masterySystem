/**
 * Attack Executor
 * Creates melee/ranged attack chat cards with proper flags for the roll handler
 */
import type { RadialCombatOption } from "../token-radial-menu";
import { splitTargetsForPowerLevel } from "./split-attack-targets.js";
export { getTargetEvade, getTargetSpellResistance, spellResistanceAfterPenetration, } from "./target-defenses.js";
/** Bookkeeping for a single strike of a Split Attack. */
interface SplitContext {
    splitPairId: string;
    /** 1-based strike number. */
    splitIndex: number;
    /** Number of chosen targets (= strikes) for this Power use. */
    splitTotal: number;
    /** This strike's share of the attack pool (recomputed on Strike 1). */
    attributePool: number;
    sharedRaisePlan?: string;
    sharedRaiseSlots?: string;
    sharedRaiseFree?: string;
    sharedRaiseTn?: string;
}
export { splitTargetsForPowerLevel };
/** Maximum different targets for this Split Attack option (NPC rows: 2 unless stated). */
export declare function splitAttackMaxTargets(option: RadialCombatOption): number;
/** Divide one attack pool across N strikes; earlier strikes take the remainder. No MR floor. */
export declare function divideSplitAttackPoolN(total: number, parts: number): number[];
/** Split one attack pool across two strikes. */
export declare function divideSplitAttackPool(total: number): {
    first: number;
    second: number;
};
/** Combatants other than the attacker (deduplicated). */
export declare function listSplitSecondTargetIds(tokenIds: readonly string[], attackerTokenId: string): string[];
export declare function rememberSplitSharedRaises(pairId: string, raises: {
    plan?: string;
    slots?: string;
    free?: string;
    tn?: string;
}): void;
/** Next queued strike of a Split Attack (target + pool), or null when none is left. */
export declare function peekPendingSplit(pairId: string): {
    targetTokenId: string;
    secondPool: number;
    nextIndex: number;
    splitTotal: number;
    sharedRaisePlan?: string;
} | null;
type SplitSecondTargetFn = (attackerToken: any, primaryTargetToken: any, option: RadialCombatOption, chosenTokenIds?: readonly string[]) => Promise<string | null>;
/**
 * Tests and the attack card use this to choose additional Split Attack targets.
 * Called once per additional target; return null (or an already chosen id) to stop.
 */
export declare function setSplitSecondTargetResolver(fn: SplitSecondTargetFn | null): void;
/**
 * After a Split Attack strike fully resolves (hit or miss), post the next strike.
 * Safe to call more than once — each queued strike is consumed on first spawn.
 */
export declare function spawnNextSplitStrikeIfPending(splitPairId: string | null | undefined): Promise<void>;
/** @deprecated Name from the two-strike version — posts the next queued strike. */
export declare const spawnSplitStrike2IfPending: typeof spawnNextSplitStrikeIfPending;
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
 * the attack card is anchored to one token only as the roll UI carrier (TN preview);
 * on Roll, the carrier and every other affected token are resolved equally via
 * `resolveAoeFromSharedRoll`. Instant AoE never adds Weapon Damage or Spell Focus
 * (Dragon Head Damage Breath is the Bite exception, flagged separately).
 */
export interface AoeMeleeWeaponContext {
    /**
     * Other affected tokens besides the card's roll UI carrier. Prefer
     * `affectedTokenIds` when building new call sites — the carrier is never a
     * Primary Target; every id is resolved equally.
     * @deprecated Name is historical; use with carrier id as a flat affected set.
     */
    secondaryTokenIds: string[];
    /**
     * Printed Power bonus d8 (damageRider). Informational (Crit legality / UI);
     * damage is rolled once through the damage dialog.
     */
    powerBonusDice: number;
}
/** Build Instant AoE card context from a flat affected-token list (no Primary). */
export declare function aoeContextFromAffectedTokenIds(affectedTokenIds: string[], powerBonusDice?: number): {
    carrierTokenId: string;
    aoe: AoeMeleeWeaponContext;
} | null;
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
    targetTokenIds: string[];
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