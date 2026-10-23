/**
 * Spell Roll Handler — Active-as-Spell pipeline (Templates refactor §6).
 *
 * Any Active power on a character can be upgraded into a Spell at creation
 * time. Spells reuse the Raise engine, but their resolution differs from a
 * standard attack:
 *
 *   Casting Roll → pool = casting attribute, keep = mastery rank.
 *   Spell Base TN = used Power Level × 4.
 *   Final Spell TN = Spell Base TN + effective SR + 4×Paid Combat Raises
 *   (+4 only for printed Mind Probe / Mental Control Final TN surcharge).
 *   Spell Penetration reduces only the Spell Resistance part, never the base.
 *
 *   Below the Spell Base TN (or Mental Power Base TN): the Spell fizzles and
 *   the caster takes 1d8 Stress. Reaching the base but missing the Final TN
 *   means the target resisted: no effect and no Stress.
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
/**
 * Maximum Power Level a character can learn/cast (spells use the normal
 * Power Level cap by Mastery Rank: MR1–2 → 4, MR3 → 8, MR4 → 12, MR5+ → 16).
 */
export declare function canCastSpellAtLevel(masteryRank: number, spellLevel: number): boolean;
/**
 * Spell Base TN = used Power Level × 4 (DF Guide 2026-10-23).
 * Mastery Rank sets Keep / legal PL cap, not this TN.
 * There is NO generic +4 for “Mental” Spells.
 */
export declare function castingBaseTnForPowerLevel(powerLevel: number): number;
/**
 * Printed Final Mental Power TN surcharge (+4) for Mind Probe / Mental Control only
 * (Power catalogue technical text). Not applied to Mental Attack or other Spells.
 */
export declare const MENTAL_FINAL_TN_SURCHARGE_TEMPLATE_IDS: Set<string>;
export declare function mentalFinalTnSurchargeForTemplate(templateId: string | null | undefined): number;
/**
 * @deprecated Prefer {@link castingBaseTnForPowerLevel}. Legacy MR-based Spell TN
 * is retired; this wrapper maps an unknown PL by treating MR as a temporary stand-in.
 */
export declare function castingBaseTnForMasteryRank(masteryRank: number): number;
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
/** Legacy mechanical Stress — retired (Fear replaces mental pressure). No-op. */
export declare function applyStressToActor(_actor: any, _amount: number, _options?: {
    voluntary?: boolean;
}): Promise<number>;
/** Legacy fizzle Stress — retired. No-op; returns 0 stress inflicted. */
export declare function applyFizzleStress(_actor: any): Promise<number>;
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
    /** @deprecated Ignored — generic Mental +4 removed. Use template surcharge helper. */
    mentalPower?: boolean;
    /** Power templateId for printed Mind Probe / Mental Control Final TN +4. */
    templateId?: string | null;
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