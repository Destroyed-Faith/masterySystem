/**
 * Canonical Stone Powers Definition — new tier-based spec.
 *
 * Most powers publish T1–T4. A listed set starts at Tier 2: Tier 1 does
 * not exist in data, UI, spending, validation, or serialization. First
 * purchase is T2 (2 Stones total), then T3 (6 total), then T4 (14 total).
 * Tiers continue past the printed table — T5 costs 16, T6 costs 32, up to T8.
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
    /** 1..8 — activation tier (UI currently shows 1..4). */
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
    /** Compiled multi-tier tooltip — generated on module load. */
    effect: string;
    /** First published tier. `2` means Tier 1 does not exist for this ability. */
    startsAtTier: 1 | 2;
    /** Published effects starting at `startsAtTier` (T1–T4 or T2–T4). */
    tiers: StoneTier[];
    /** Apply the effect for the given tier. */
    apply: (ctx: StonePowerContext) => Promise<void>;
}
/** Tiers shown in the dialog / Players Guide. */
export declare const STONE_TIER_VISIBLE = 4;
/** Last wave you can fully pay with 80 Stones (1+2+4+8+16+32 = 63). */
export declare const STONE_TIER_PRACTICAL_MAX = 6;
/** Hard cap while the table is still open-ended. */
export declare const STONE_TIER_HARD_MAX = 8;
/**
 * Continue a published T1–T4 number sequence past the printed table.
 * Doubling sequences keep doubling; otherwise the last delta repeats.
 */
export declare function scaleStoneTier(seq: readonly number[], tier: number): number;
/** Wave cost of an absolute tier: T1=1, T2=2, T3=4, T4=8, … */
export declare function stonePowerWaveCost(tier: number): number;
/** Cumulative stones to reach `tier` when the first published tier is `startsAtTier`. */
export declare function cumulativeStoneCostForTier(tier: number, startsAtTier?: 1 | 2): number;
export declare const STONE_POWERS: Record<string, StonePower>;
export declare const STONE_POWERS_BY_ATTRIBUTE: Record<AttributeKey | 'generic', StonePower[]>;
/**
 * Convert a usage count (0-indexed; activations this turn BEFORE this one)
 * to the matching tier. Published UI is T1–T4; the math continues to T8.
 */
export declare function tierForUseIndex(usesBefore: number): number;
/**
 * Abilities whose first published tier is T2. Tier 1 does not exist.
 * Extra Attack (generic) uses the same start.
 */
export declare const TIER2_START_STONE_POWER_IDS: readonly ["might.parry", "agility.crit", "vitality.damageNegation", "intellect.spellAction", "resolve.damageReduction", "influence.notATarget", "wits.phasing", "generic.extraAttack"];
export declare function stonePowerStartsAtTier(powerId: string): 1 | 2;
/** True when the ability begins at Tier 2 (no Tier-1 slot). */
export declare function stonePowerSkipsFirstTier(powerId: string): boolean;
/** First published tier (2 when Tier 1 does not exist, otherwise 1). */
export declare function firstEffectiveStonePowerTier(powerId: string): number;
/**
 * Printed Support that would land on (or below) the first published tier is
 * lifted one step so the player still pays that tier and the gold prefills
 * sit above it. Crit + Elorian Focus I (printed T2) → T3.
 */
export declare function effectiveStoneSupportPrefillTier(powerId: string, printedTier: number): number;
/** Lane indices for one published tier (T1=anchor, T2=mid, T3=quad, T4=oct). */
export declare function stonePaymentLanesForTier(tier: number): number[];
/**
 * Gold Artifact Support Stone lanes: every published tier above the one the
 * player must pay, up through the effective prefill. Empty when Support
 * cannot raise the first published tier.
 */
export declare function stoneSupportPrefillLanes(powerId: string, printedTier: number): number[];
/**
 * Support may raise the first paid activation to a higher tier. It never
 * grants the first published tier for free (T1, or T2 when T1 does not exist).
 */
export declare function stonePowerSupportPrefillApplies(powerId: string, printedTier: number): boolean;
/** Retired ids that still resolve to a current Stone Power. */
export declare const STONE_POWER_ID_ALIASES: Record<string, string>;
/**
 * Per-power adjustment applied to Artifact Stone Power Support pre-fill tiers.
 * The current rulebook prints Support stages as Tier 2 / 3 / 4 for every power
 * (Elorian Focus PG 4819–4825, Ringchain "Kept from Sight" PG 4253–4261), so
 * no power is shifted. Kept as a map in case a future table diverges.
 */
export declare const STONE_POWER_SUPPORT_TIER_SHIFT: Record<string, number>;
export declare function resolveStonePowerId(powerId: string): string;
/** Retired Stone Power ids that have no successor (cannot auto-remap). */
export declare const UNRESOLVED_STONE_POWER_IDS: readonly ["might.attackPoolReduction", "vitality.endureSpecial", "wits.initiativeShop"];
//# sourceMappingURL=stone-powers.d.ts.map