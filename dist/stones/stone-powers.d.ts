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
 * its first real effect is Tier 2 (Extra Attack, Spell Action, Damage
 * Reduction, Phasing, Crit, Parry, Damage Negation, Not a Target).
 *
 * Players Guide "Spending Stones" (cost ladder 1/2/4/8): the blank Tier 1 is
 * a REAL, payable step — the 1st use costs 1 Stone and has no effect; the
 * 2nd use costs 2 Stones and resolves Tier 2. The lane is therefore rendered
 * and charged like any other Anchor segment, never skipped.
 */
export declare function stonePowerSkipsFirstTier(_powerId: string): boolean;
/** Whether a power's printed Tier 1 is a blank ramp step (no effect). */
export declare function stonePowerHasBlankFirstTier(powerId: string): boolean;
/**
 * One Ramp Stone Ability per Attribute whose Tier 1 is intentionally blank.
 * Extra Attack (generic) is also a blank-T1 ramp and uses the same gate.
 */
export declare const BLANK_T1_STONE_POWER_IDS: readonly ["might.parry", "agility.crit", "vitality.damageNegation", "intellect.spellAction", "resolve.damageReduction", "influence.notATarget", "wits.phasing"];
/** First tier that produces an effect (T2 for blank-T1 ramps, otherwise T1). */
export declare function firstEffectiveStonePowerTier(powerId: string): number;
/**
 * Support may only improve an already-activated ability. The character must
 * pay through the first effective tier themselves before a prefill applies.
 * `rawUsesBefore` is the number of completed activations this turn.
 */
export declare function stonePowerSupportPrefillApplies(powerId: string, rawUsesBefore: number): boolean;
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