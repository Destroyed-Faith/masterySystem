/**
 * Defender reactions — prompted when incoming damage is applied (after Phasing).
 * Spends `RoundState.reactionActions`, marks `usedPowerIdsThisRound`, and applies
 * one-hit armor / reaction DR from power `mechanics` where present.
 *
 * Reaction: Evade adds its bonus to the Evade TN of the triggering attack.
 * If (Evade + bonus) > attack total, the hit is negated — no damage. No roll.
 *
 * Ghost Slip–style powers (`phasing.reactionSingleHit`) are omitted here: they
 * interact with the phasing step, not post-phasing mitigation.
 */
export interface DefenderReactionMitigation {
    /** Extra flat armor for this damage instance only. */
    reactionArmorFlat: number;
    /** Extra DR% for this hit (stacked in mitigation with base DR). */
    reactionDrPct: number;
    /** Initiative gained after the attack fully resolves (Reaction: Initiative Gain). */
    initiativeGain?: number;
    /** Power display name if one was used. */
    powerName?: string;
    /** Reaction Evade raised the TN above the attack total — no damage. */
    negatedByEvade?: boolean;
    /** Evade bonus from the chosen reaction (0 if none). */
    reactionEvadeBonus?: number;
    /** Evade TN used for the comparison (base + bonus when negated/applied). */
    effectiveEvade?: number;
}
export interface ReactionEvadeEval {
    baseEvade: number;
    bonus: number;
    effectiveEvade: number;
    attackTotal: number | null;
    /** True when attack total is known and effective Evade exceeds it. */
    negates: boolean;
    /** True when we cannot decide (missing attack total). */
    unknown: boolean;
}
/**
 * Reaction Evade vs a known attack total.
 * Hit rule is attack ≥ Evade, so the reaction negates only when
 * (baseEvade + bonus) > attackTotal.
 */
export declare function evaluateReactionEvadeNegation(baseEvade: number, bonus: number, attackTotal: number | null | undefined): ReactionEvadeEval;
/**
 * Reaction-type power items the defender can still use this round (equipped, not used).
 *
 * Includes:
 *   - regular `power` items with `system.powerType === 'reaction'`, and
 *   - synthetic items materialized from each equipped artifact's
 *     `system.levelProgression` rows of type `'Reaction'` (up to
 *     `system.currentLevel`). Synthetic items carry an `id` like
 *     `artifact-reaction:<artifactItemId>:<level>` so they participate
 *     in the same once-per-round bookkeeping.
 */
export declare function getEligibleReactionPowers(defender: Actor, combat: Combat | null): any[];
/** Ally-protection reactions (help another creature in range). */
export declare function isAllyReactionPower(item: any): boolean;
export interface ReactionWindowActorEntry {
    actor: Actor;
    name: string;
    remaining: number;
    total: number;
    powers: any[];
    role: 'defender' | 'ally';
    distanceM: number | null;
}
/**
 * Defender + nearby allies who still have a Reaction and at least one eligible power
 * for this damage window (defender: own reactions; allies: Ally-* reactions only).
 */
export declare function collectReactionWindowEntries(params: {
    defender: Actor;
    attacker: Actor | null;
    combat: Combat;
}): ReactionWindowActorEntry[];
/**
 * After phasing: announce the public Reaction Window in chat, then offer the
 * defender's spend dialog (owner/GM only).
 */
export declare function promptDefenderReactionsBeforeMitigation(params: {
    defender: Actor;
    attacker: Actor;
    combat: Combat | null;
    rawDamage: number;
    /** Kept attack total from the triggering roll (for Reaction Evade). */
    attackTotal?: number | null;
    /** Evade / Normal TN the attack was rolled against. */
    evadeTn?: number | null;
}): Promise<DefenderReactionMitigation>;
//# sourceMappingURL=defender-reactions.d.ts.map