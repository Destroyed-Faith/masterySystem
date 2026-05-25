/**
 * Canonical Stone Powers Definition — new tier-based spec.
 *
 * Each Stone Power has FOUR fixed tiers. The tier a player gets on a
 * given activation is determined by how many times this power has
 * been used this turn (NOT cumulative across activations):
 *
 *   1st use → 1 stone → Tier 1
 *   2nd use → 2 stones → Tier 2
 *   3rd use → 4 stones → Tier 3
 *   4th use → 8 stones → Tier 4
 *
 * Some tiers are intentionally blank (`label === null`). Spending the
 * stones is still required, but no effect triggers — this is the "ramp"
 * mechanic that prevents trivial low-tier spam of the strongest effects.
 *
 * Pool layout: Generic + 7 attribute pools (Might / Agility / Vitality /
 * Intellect / Resolve / Influence / Wits). Every pool has exactly 4
 * powers ⇒ 32 powers total.
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
    /** 1..4 — clamped tier number for this activation. */
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
    /** Tier 1..4 effects. */
    tiers: [StoneTier, StoneTier, StoneTier, StoneTier];
    /** Apply the effect for the given tier. */
    apply: (ctx: StonePowerContext) => Promise<void>;
}
export declare const STONE_POWERS: Record<string, StonePower>;
export declare const STONE_POWERS_BY_ATTRIBUTE: Record<AttributeKey | 'generic', StonePower[]>;
/**
 * Helper — convert a usage count (0-indexed; how many times this turn the
 * power has been activated BEFORE this one) to the matching tier (1..4,
 * clamped). The new spec stops at tier 4; further activations stay at T4.
 */
export declare function tierForUseIndex(usesBefore: number): number;
//# sourceMappingURL=stone-powers.d.ts.map