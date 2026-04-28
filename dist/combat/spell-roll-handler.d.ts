/**
 * Spell Roll Handler — Active-as-Spell pipeline (Templates refactor §6).
 *
 * Any Active power on a character can be upgraded into a Spell at creation
 * time. Spells reuse the Raise engine, but their resolution differs from a
 * standard attack:
 *
 *   1. Spell Attack  → pool = casting attribute, keep = mastery rank,
 *                      TN = calculateBaseTN(spellLevel) + 4 × raises (same as casting-table rules).
 *   2. Save Spell    → caster rolls Casting Roll vs Base TN (+ 4 × raises).
 *                      On success, each target rolls Save vs Save DC
 *                      (= 8 × caster mastery rank).
 *   3. Support Spell → Save Spell without a target save — only the Casting
 *                      Roll needs to succeed for the effect to land.
 *
 * Raises (`+4` per Raise) are declared before the roll. **Blood Raises** cost
 * `4 HP` each (ignoring armor) and add `+4` to the final total *and* stamp the
 * actor with a flag so those HP cannot be healed until the current combat ends.
 *
 * This module owns the maths & side-effects; the UI layer just calls
 * `rollSpell` and `canCastSpellAtLevel`.
 */
import type { CastingAttribute, SpellResolution, SpellSaveType } from '../types/item.js';
import type { MasteryRollResult } from '../types/index';
/** Maximum Spell Level a character can learn/cast: `Mastery Rank × 2`. */
export declare function getMaxSpellLevel(masteryRank: number): number;
/** Whether an actor of `masteryRank` can cast/learn a spell at `spellLevel`. */
export declare function canCastSpellAtLevel(masteryRank: number, spellLevel: number): boolean;
/** Base TN for a Casting Roll by Spell Level — `8 × ceil(level / 2)`. */
export declare function calculateBaseTN(spellLevel: number): number;
/** Save DC a target must beat for a Save Spell — `8 × caster Mastery Rank`. */
export declare function calculateSaveDC(masteryRank: number): number;
/**
 * Deduct `amount` HP from the actor, bypassing armor (blood magic). Records
 * the amount lost so it cannot be healed until combat ends.
 * Returns the actual HP actually removed (clamped to what was available).
 */
export declare function applyBloodRaiseHpLoss(actor: any, amount: number): Promise<number>;
/**
 * Apply `amount` stress to the actor (fizzled spell penalty). Returns the
 * actual new current-bar index.
 */
export declare function applyStressToActor(actor: any, amount: number): Promise<number>;
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
    /** Target actor (required for `spellAttack`; optional for save/support). */
    target?: any | null;
    /** Spell level (1–16) — typically equals the chosen Power rank. */
    spellLevel: number;
    /** Which attribute rolls the pool. */
    castingAttribute: CastingAttribute;
    /** Resolution type pulled from the power item. */
    resolution: SpellResolution;
    /** Save type for Save Spells; ignored for `spellAttack`. */
    saveType?: SpellSaveType;
    /** Declared Raises (each +4 TN against the relevant target number). */
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
    /** Support spell: skip the target-save step even if resolution === 'saveSpell'. */
    supportMode?: boolean;
}
export interface SpellRollResult {
    /** Casting / spell-attack roll result. */
    castingRoll: MasteryRollResult;
    /** Base TN used (before raises / modifiers). */
    baseTn: number;
    /** Final TN actually compared against (after raises + modifiers). */
    finalTn: number;
    /** Raises declared by the caster (non-blood). */
    declaredRaises: number;
    /** Blood Raises applied (each worth +4 total and −4 HP). */
    bloodRaises: number;
    /** HP actually removed for Blood Raises (clamped to what was available). */
    bloodHpLost: number;
    /** `true` when the casting roll met the final TN. */
    success: boolean;
    /** Raises achieved (includes declared/blood when successful). */
    raises: number;
    /** Save DC (Save Spell only). `null` for Spell Attack. */
    saveDc: number | null;
    /** Stress inflicted on the caster when the spell fizzled. */
    stressTaken: number;
    /** Resolution used. */
    resolution: SpellResolution;
}
/**
 * Execute the full Active-as-Spell roll pipeline:
 *   1. Blood Raises (HP loss) → added to the pool's total as +4 each.
 *   2. Casting Roll via `masteryRoll` (Pool = attribute, Keep = MR).
 *   3. Resolve against the correct TN (Evade vs spell, Base TN vs save).
 *   4. On failure: `1d8` stress; on success: return result for the caller to
 *      apply damage/effects (targets' saves are rolled in the UI layer).
 */
export declare function rollSpell(params: SpellRollParams): Promise<SpellRollResult>;
/**
 * Quick helper the UI uses to surface "this would need a Save Spell"/"Spell
 * Attack" to the player. Pulls the declared resolution from the power item,
 * falling back to `saveSpell` when the item is missing the hint.
 */
export declare function inferResolutionFromItem(powerItem: any): SpellResolution;
//# sourceMappingURL=spell-roll-handler.d.ts.map