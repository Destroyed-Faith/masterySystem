/**
 * Defender reactions — prompted when incoming damage is applied (after Phasing).
 * Spends `RoundState.reactionActions`, marks `usedPowerIdsThisRound`, and applies
 * one-hit armor / reaction DR from power `mechanics` where present.
 *
 * Ghost Slip–style powers (`phasing.reactionSingleHit`) are omitted here: they
 * interact with the phasing step, not post-phasing mitigation.
 */
export interface DefenderReactionMitigation {
    /** Extra flat armor for this damage instance only. */
    reactionArmorFlat: number;
    /** Extra DR% for this hit (stacked in mitigation with base DR). */
    reactionDrPct: number;
    /** Power display name if one was used. */
    powerName?: string;
}
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
 * After phasing: offer reaction spend + power selection for this hit.
 * No-op when user cannot prompt for defender, no reactions left, or no eligible powers.
 */
export declare function promptDefenderReactionsBeforeMitigation(params: {
    defender: Actor;
    attacker: Actor;
    combat: Combat | null;
    rawDamage: number;
}): Promise<DefenderReactionMitigation>;
//# sourceMappingURL=defender-reactions.d.ts.map