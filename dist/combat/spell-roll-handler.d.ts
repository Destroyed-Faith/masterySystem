/**
 * Spell Roll Handler — Active-as-Spell pipeline (Templates refactor §6).
 *
 * Any Active power on a character can be upgraded into a Spell at creation
 * time. Spells reuse the Raise engine, but their resolution differs from a
 * standard attack:
 *
 *   Spell Attack → pool = casting attribute, keep = mastery rank,
 *                  TN = calculateBaseTN(spellLevel) + 4 × raises (casting-table rules).
 *
 *   Saving Throws were removed from the rules: a successful cast resolves the
 *   spell's full listed payload. Resistance only happens through explicitly
 *   named Attribute Checks created by individual rules.
 *
 * Raises (`+4` per Raise) are declared before the roll. **Blood Raises** cost
 * `4 HP` each (ignoring armor) and add `+4` to the final total *and* stamp the
 * actor with a flag so those HP cannot be healed until the current combat ends.
 *
 * This module owns the maths & side-effects; the UI layer just calls
 * `rollSpell` and `canCastSpellAtLevel`.
 */
import type { CastingAttribute, SpellResolution } from '../types/item.js';
import type { MasteryRollResult } from '../types/index';
import { type RaiseOutcome } from './raise-resolution.js';
/** Maximum Spell Level a character can learn/cast: `Mastery Rank × 2`. */
export declare function getMaxSpellLevel(masteryRank: number): number;
/** Whether an actor of `masteryRank` can cast/learn a spell at `spellLevel`. */
export declare function canCastSpellAtLevel(masteryRank: number, spellLevel: number): boolean;
/**
 * Spell Tier I–VIII (Players Guide 7912–7923).
 *
 *   I → 8, II → 16, III → 24, IV → 32, V → 40, VI → 48, VII → 56, VIII → 64.
 *
 * Each Tier covers two consecutive Power Levels (L1+L2 = Tier I, etc.) so the
 * "Spell Tier" surface always lines up with the underlying Active Power Level.
 */
export type SpellTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export declare const SPELL_TIER_TABLE: Record<SpellTier, number>;
/** Spell Tier (I–VIII) that contains the given Power Level (1–16). */
export declare function spellTierForPowerLevel(spellLevel: number): SpellTier;
/** Casting TN for a Spell of Tier I..VIII (Players Guide 7912–7923). */
export declare function castingTNForTier(tier: SpellTier): number;
/**
 * Base Casting TN for a Spell built from a Power of `spellLevel` (1..16).
 *
 * Equivalent to `castingTNForTier(spellTierForPowerLevel(spellLevel))`, kept
 * as a stand-alone export because every existing caller already uses
 * `calculateBaseTN(...)`.
 */
export declare function calculateBaseTN(spellLevel: number): number;
/**
 * Deduct `amount` HP from the actor, bypassing armor (blood magic). Records
 * the amount lost so it cannot be healed until combat ends.
 * Returns the actual HP actually removed (clamped to what was available).
 */
export declare function applyBloodRaiseHpLoss(actor: any, amount: number): Promise<number>;
/**
 * Apply `amount` stress to the actor.
 *
 * Players Guide stress chapter (~6493–6502): `floor(Resolve/8)` Stress
 * Armor reduces every *involuntary* stress hit; voluntary stress (push
 * casts, Focus power-ups, etc.) ignores Stress Armor. Pass
 * `{ voluntary: true }` to bypass the armor.
 */
export declare function applyStressToActor(actor: any, amount: number, options?: {
    voluntary?: boolean;
}): Promise<number>;
/** Roll `1d8` and apply the result as stress. Returns the stress inflicted. */
export declare function applyFizzleStress(actor: any): Promise<number>;
/**
 * `combatEnd`/`deleteCombat` hook target: clears the per-combat Blood Raise
 * flag so HP becomes healable again once the fight is over. Intentionally
 * cheap — runs once per actor, no-op if the flag is absent.
 */
export declare function clearBloodRaiseHpFlagForCombat(combat: any): Promise<void>;
export interface SpellRollParams {
    /** The caster actor. */
    actor: any;
    /** Target actor (required for `spellAttack`; optional for support). */
    target?: any | null;
    /** Spell level (1–16) — typically equals the chosen Power rank. */
    spellLevel: number;
    /** Which attribute rolls the pool. */
    castingAttribute: CastingAttribute;
    /** Resolution type pulled from the power item. */
    resolution: SpellResolution;
    /** Declared raise slots (each +4 to Raise TN; Normal TN unchanged). */
    declaredRaiseSlots?: number;
    /** @deprecated Use declaredRaiseSlots */
    declaredRaises?: number;
    /** Blood Raises bought with 4 HP each (each adds +4 to the final total). */
    bloodRaises?: number;
    /** GM fiction modifier, additive on the final TN (+4 = Challenging etc.). */
    gmModifier?: number;
    /** Optional override for the caster's Mastery Rank. */
    masteryRankOverride?: number;
    /** Power-item name for the chat label. */
    spellName?: string;
    /** Flavor string forwarded to the chat card. */
    flavor?: string;
    /** Support spell: no target required — only the Casting Roll must succeed. */
    supportMode?: boolean;
}
export interface SpellRollResult {
    /** Casting / spell-attack roll result. */
    castingRoll: MasteryRollResult;
    /** Normal casting TN (before raise tier). */
    baseTn: number;
    /** Raise TN when raises declared. */
    raiseTn: number;
    /** @deprecated Final TN — same as raiseTn when raises declared, else baseTn. */
    finalTn: number;
    declaredRaises: number;
    raiseOutcome: RaiseOutcome;
    /** Blood Raises applied (each worth +4 total and −4 HP). */
    bloodRaises: number;
    /** HP actually removed for Blood Raises (clamped to what was available). */
    bloodHpLost: number;
    /** `true` when the casting roll met the final TN. */
    success: boolean;
    /** Raises achieved (includes declared/blood when successful). */
    raises: number;
    /** Stress inflicted on the caster when the spell fizzled. */
    stressTaken: number;
    /** Resolution used. */
    resolution: SpellResolution;
}
/**
 * Execute the full Active-as-Spell roll pipeline:
 *   1. Blood Raises (HP loss) → added to the pool's total as +4 each.
 *   2. Casting Roll via `masteryRoll` (Pool = attribute, Keep = MR).
 *   3. Resolve against the Casting TN.
 *   4. On failure: `1d8` stress; on success: return result for the caller to
 *      apply damage/effects.
 */
export declare function rollSpell(params: SpellRollParams): Promise<SpellRollResult>;
/**
 * Resolution mode for a spell power item. Saving throws were removed —
 * every spell resolves as `spellAttack` (caster roll vs TN).
 */
export declare function inferResolutionFromItem(_powerItem: any): SpellResolution;
//# sourceMappingURL=spell-roll-handler.d.ts.map