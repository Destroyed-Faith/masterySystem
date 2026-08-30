/**
 * Canonical Stone Powers Definition — new tier-based spec.
 *
 * Each Stone Power has a published T1–T4 table (what the UI shows).
 * Tiers continue past that — T5 costs 16, T6 costs 32, up to T8.
 * Dumping every Stone in the game (80) pays through T6 (1+2+4+8+16+32=63).
 * Extra payment lanes for T5+ are future UI; Artifact Support can already
 * prefill T5+ so Elorian Crit at L7–10 keeps the old 4-charge effect.
 *
 * Some tiers are intentionally blank (`label === null`). Spending the
 * stones is still required, but no effect triggers — this is the "ramp"
 * mechanic that prevents trivial low-tier spam of the strongest effects.
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
    /** Short rules label. `null` ⇒ tier has no effect (still paid for as a ramp step). */
    label: string | null;
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
    /** Published Tier 1..4 effects. Higher tiers continue the same scale. */
    tiers: [StoneTier, StoneTier, StoneTier, StoneTier];
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
export declare const STONE_POWERS: Record<string, StonePower>;
export declare const STONE_POWERS_BY_ATTRIBUTE: Record<AttributeKey | 'generic', StonePower[]>;
/**
 * Convert a usage count (0-indexed; activations this turn BEFORE this one)
 * to the matching tier. Published UI is T1–T4; the math continues to T8.
 */
export declare function tierForUseIndex(usesBefore: number): number;
/**
 * True when a power's Tier 1 is a no-op "ramp step" (label === null), meaning
 * its first real effect is Tier 2. Such powers start one segment higher: the
 * Tier-1 / Anchor field is omitted and the first activation costs 2 stones.
 * Used by Extra Attack, Spell Action, Damage Reduction, Phasing, Crit,
 * Parry, Damage Negation, and Not a Target.
 */
export declare function stonePowerSkipsFirstTier(powerId: string): boolean;
/** Retired ids that still resolve to a current Stone Power. */
export declare const STONE_POWER_ID_ALIASES: Record<string, string>;
/**
 * Powers whose published table shifted one tier (old T1 became empty).
 * Artifact Support that prefills T2/T3/T4 is raised by this many tiers
 * so the stored effect still matches the old numbered tier (L7–10 Crit → T5).
 */
export declare const STONE_POWER_SUPPORT_TIER_SHIFT: Record<string, number>;
export declare function resolveStonePowerId(powerId: string): string;
/** Retired Stone Power ids that have no successor (cannot auto-remap). */
export declare const UNRESOLVED_STONE_POWER_IDS: readonly ["might.attackPoolReduction", "vitality.endureSpecial", "wits.initiativeShop"];
//# sourceMappingURL=stone-powers.d.ts.map