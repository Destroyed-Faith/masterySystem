/**
 * Canonical Stone Powers Definition — universal four-Rank spec.
 *
 * Every Stone Ability has exactly four Ranks; Rank 4 is the hard cap.
 * Normal Abilities cost 1 / 2 / 4 / 8 additional Stones (1 / 3 / 7 / 15
 * total). The eight Premium Abilities (Extra Attack, Parry, Crit, Damage
 * Negation, Special Boost, Damage Reduction, Not a Target, Phasing) cost
 * 2 / 4 / 6 / 8 additional Stones (2 / 6 / 12 / 20 total).
 *
 * Pool layout: Generic + 7 attribute pools (Might / Agility / Vitality /
 * Intellect / Resolve / Influence / Wits). Every pool has 4 powers. Total 32.
 *
 * Effects live in `apply(ctx)` and write into `roundState.stoneBonuses`
 * or set actor / combatant flags. Cleanup of per-turn bonuses happens
 * in `clearCombatStoneTurnBonusesForActor` (see action-economy.ts).
 */
import { type AttributeKey } from '../combat/action-economy.js';
export type StonePowerAttribute = AttributeKey | 'generic';
export interface StoneTier {
    /** Short rules label for a published tier. */
    label: string;
    /** Long-form description used in the dialog tooltip / chat audit. */
    description: string;
    /** Optional numeric scale (used by apply()). Meaning varies per power. */
    value?: number;
}
export interface StonePowerContext {
    actor: any;
    combatant: any;
    /** 1..4 — activation tier (Tier 4 is the hard cap). */
    tier: number;
    /** Stone cost of this activation (1 / 2 / 4 / 8 / …). */
    cost: number;
}
export interface StonePower {
    id: string;
    name: string;
    attribute: StonePowerAttribute;
    category: 'action' | 'passive' | 'reaction';
    /** Short one-liner (the matching tier description is preferred at runtime). */
    description: string;
    /** Compiled multi-Rank tooltip — generated on module load. */
    effect: string;
    /** Premium Abilities cost 2 / 4 / 6 / 8 per Rank instead of 1 / 2 / 4 / 8. */
    premium: boolean;
    /** Published Rank effects (always Rank 1–4). */
    tiers: StoneTier[];
    /**
     * When true, this power may be used only once per combat.
     * Driven by power data / rules — never inferred from category alone.
     */
    oncePerCombat?: boolean;
    /** Apply the effect for the given tier. */
    apply: (ctx: StonePowerContext) => Promise<void>;
}
/** Ranks shown in the dialog / Players Guide. Rank 4 is the last Rank. */
export declare const STONE_TIER_VISIBLE = 4;
/** Highest Rank a Stone Ability can reach. */
export declare const STONE_TIER_PRACTICAL_MAX = 4;
/** Hard cap. There is no Rank 5. */
export declare const STONE_TIER_HARD_MAX = 4;
/** Retired ids that still resolve to a current Stone Power. */
export declare const STONE_POWER_ID_ALIASES: Record<string, string>;
export declare function resolveStonePowerId(powerId: string): string;
/**
 * Premium Stone Abilities (PG "Premium Stone Abilities"): 2 / 4 / 6 / 8
 * additional Stones per Rank. All other Abilities are Normal (1 / 2 / 4 / 8).
 */
export declare const PREMIUM_STONE_POWER_IDS: readonly ["generic.extraAttack", "might.parry", "agility.crit", "vitality.damageNegation", "intellect.specialBoost", "resolve.damageReduction", "influence.notATarget", "wits.phasing"];
export declare function isPremiumStonePower(powerId: string): boolean;
/**
 * Removed abilities. They are not in the registry. Old saves that still name
 * the id are refused so they do not become Spell Penetration.
 * Extra Attack is the only source of extra attacks (spells, ranged, and martial).
 */
export declare const RETIRED_STONE_POWER_IDS: readonly ["intellect.spellAction"];
export declare function isRetiredStonePower(powerId: string): boolean;
export declare const RETIRED_STONE_POWER_MESSAGE = "Spell Action is retired. Extra Attack covers spells, ranged attacks, and martial attacks. Spell Penetration is a different ability.";
/** Per-Rank payment segment sizes for one Ability (Normal 1/2/4/8, Premium 2/4/6/8). */
export declare function stonePowerSegmentSizes(powerId: string): readonly number[];
/** Additional Stones to activate `rank` (1..4) of this Ability. 0 outside 1..4. */
export declare function stonePowerRankCost(powerId: string, rank: number): number;
/** Cumulative Stones to reach `rank` (Normal 1/3/7/15, Premium 2/6/12/20). */
export declare function cumulativeStoneCostForRank(powerId: string, rank: number): number;
/**
 * Read a published Rank value. Ranks past the printed sequence, and anything
 * above Rank 4, do not scale.
 */
export declare function scaleStoneTier(seq: readonly number[], tier: number): number;
/**
 * Highest fully paid Rank on one card given the placed Stone count and this
 * Ability's cost curve. A pre-filled Rank costs nothing; every other Rank up
 * to the result must be covered by the placed Stones in order.
 */
export declare function highestCompleteStoneTierFromPlaced(powerId: string, placed: number, prefillRank?: number, maxTier?: number): number;
/**
 * Ranks a single Apply can turn on from the stones sitting on the card.
 * Costs are additional and in order (Premium Extra Attack: 2, then 4).
 * Six stones from Rank 0 therefore reach Rank 2 and spend all six — not
 * only the first wave of two. A pre-filled Rank costs nothing and is
 * included once the ranks below it are covered. Stones past the last
 * complete Rank stay unspent (`placed - spendCount`).
 */
export interface CompleteStoneRankPayment {
    /** Highest Rank reached, inclusive. */
    tier: number;
    /** Stones that pay the newly completed Ranks. */
    spendCount: number;
    /** How many usage steps this payment records. */
    ranksGained: number;
}
export declare function completeStoneRankPayment(powerId: string, placed: number, usesBefore?: number, prefillRank?: number): CompleteStoneRankPayment | null;
/** Payable lane indexes for Ranks `fromRank`..`toRank` (the pre-filled Rank is omitted). */
export declare function paidLaneSetForStoneRanks(powerId: string, fromRank: number, toRank: number, prefillRank?: number): Set<number>;
/**
 * Split occupied lanes into the complete Rank prefix and the leftover.
 * Returns null when the stone count would pay a Rank but those lanes are
 * not actually filled (a gap). That pile must not be charged.
 */
export declare function partitionStoneLanesByCompleteRanks<T extends {
    lane: number;
}>(powerId: string, lanes: readonly T[], usesBefore?: number, prefillRank?: number): {
    payment: CompleteStoneRankPayment;
    spend: T[];
    leftover: T[];
} | null;
/**
 * Once-per-combat powers apply the highest complete cluster once. A Support
 * prefill makes its named Rank free; every other Rank is paid from the
 * placed Stones in order.
 */
export declare function resolveOncePerCombatStoneTier(powerId: string, placedCount: number, prefillTier?: number): {
    tier: number;
    playerTier: number;
};
export declare const STONE_POWERS: Record<string, StonePower>;
export declare const STONE_POWERS_BY_ATTRIBUTE: Record<AttributeKey | 'generic', StonePower[]>;
/**
 * Convert a usage count (0-indexed; activations this turn BEFORE this one)
 * to the matching tier. Tier 4 is the last tier.
 */
export declare function tierForUseIndex(usesBefore: number): number;
/** Printed Support Rank, clamped to the real Rank range (0 = no Support). */
export declare function effectiveStoneSupportPrefillTier(powerId: string, printedTier: number): number;
/** Lane indices for one Rank of this Ability (segments sized by its cost curve). */
export declare function stonePaymentLanesForTier(powerId: string, rank: number): number[];
/** Total payment lanes for this Ability (Normal 15, Premium 20). */
export declare function stonePaymentLaneCount(powerId: string): number;
/**
 * Gold Artifact Support Stone lanes: exactly the pre-filled Rank. Every other
 * Rank keeps its normal payable lanes.
 */
export declare function stoneSupportPrefillLanes(powerId: string, printedTier: number): number[];
/** True when a Support prefill exists (Rank 1–4). The named Rank costs no Stones. */
export declare function stonePowerSupportPrefillApplies(powerId: string, printedTier: number): boolean;
/**
 * Per-power adjustment applied to Artifact Stone Power Support pre-fill Ranks.
 * No power is currently shifted: printed support Ranks are used as-is. Kept
 * as a map in case a future table diverges.
 */
export declare const STONE_POWER_SUPPORT_TIER_SHIFT: Record<string, number>;
/** Retired Stone Power ids that have no successor (cannot auto-remap). */
export declare const UNRESOLVED_STONE_POWER_IDS: readonly ["might.attackPoolReduction", "vitality.endureSpecial", "wits.initiativeShop"];
//# sourceMappingURL=stone-powers.d.ts.map