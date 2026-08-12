/**
 * Defender reactions — eligibility + Evade negation helpers.
 *
 * Interactive spend UI lives in `reaction-window-chat.ts` (chat buttons posted
 * after the damage roll). Ghost Slip–style powers (`phasing.reactionSingleHit`)
 * are omitted here: they interact with the phasing step, not post-phasing mitigation.
 */
export interface DefenderReactionMitigation {
    /** Extra flat armor for this damage instance only. */
    reactionArmorFlat: number;
    /** Extra DR% for this hit (stacked in mitigation with base DR). */
    reactionDrPct: number;
    /** Temporary HP granted by a reaction before this damage applies. */
    reactionTempHP?: number;
    /** Initiative gained after the attack fully resolves (Reaction: Initiative Gain). */
    initiativeGain?: number;
    /** Power display name if one was used. */
    powerName?: string;
    /** Reaction Evade raised the TN above the attack total — no damage. */
    negatedByEvade?: boolean;
    /** Ghost Slip / reaction phasing ignored the hit. */
    phasedByReaction?: boolean;
    /** Evade bonus from the chosen reaction (0 if none). */
    reactionEvadeBonus?: number;
    /** Evade TN used for the comparison (base + bonus when negated/applied). */
    effectiveEvade?: number;
    /** Basic Counterattack: spawn a Basic Attack after this hit resolves. */
    counterattack?: boolean;
    /** Interpose: ally actor id taking half of the damage. */
    interposeActorId?: string;
    interposeActorName?: string;
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
/**
 * If the actor already has a real Evade/Guard reaction power, hide the matching
 * Basic Reaction so the window does not list "Reaction: Evade" and "Evade".
 */
export declare function dedupeOverlappingBasicReactions(powers: any[]): any[];
/** Ally-protection reactions (help another creature in range). */
export declare function isAllyReactionPower(item: any): boolean;
export interface ReactionWindowActorEntry {
    actor: Actor;
    name: string;
    remaining: number;
    total: number;
    powers: any[];
    role: 'defender' | 'ally' | 'opportunity';
    distanceM: number | null;
}
/** Synthetic Interpose button (ally ≤2 m takes half damage). */
export declare function buildInterposeReactionItem(): any;
/**
 * @deprecated No universal Opportunity Attack (reactions.md). Kept only so old
 * chat cards / tests referencing the id do not crash on import.
 */
export declare function buildOpportunityAttackReactionItem(actor: any): any;
/**
 * Offensive reactions for Threatened Ranged (shooter in your melee reach).
 * Not the attack target — Guard/Evade/Ally mitigation do not apply here.
 */
export declare function isThreatenedRangedOffensiveReaction(item: any): boolean;
/**
 * Defender + nearby allies + Threatened Ranged reactors.
 * - defender: own reactions
 * - allies: Ally-* reactions only (within 4 m)
 * - opportunity: offensive reactions vs the shooter (token ids from Threatened Ranged)
 */
export declare function collectReactionWindowEntries(params: {
    defender: Actor;
    attacker: Actor | null;
    combat: Combat;
    /** Token ids of enemies in melee reach of the shooter (Threatened Ranged). */
    opportunityEnemyTokenIds?: string[] | null;
}): ReactionWindowActorEntry[];
/**
 * @deprecated Prefer `runInteractiveReactionWindow` from `reaction-window-chat.ts`.
 */
export declare function promptDefenderReactionsBeforeMitigation(params: {
    defender: Actor;
    attacker: Actor;
    combat: Combat | null;
    rawDamage: number;
    attackTotal?: number | null;
    evadeTn?: number | null;
}): Promise<DefenderReactionMitigation>;
//# sourceMappingURL=defender-reactions.d.ts.map