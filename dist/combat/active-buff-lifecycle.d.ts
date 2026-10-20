/**
 * Active Buff lifecycle — Preparation-Phase activation, complete-Round duration,
 * Round-End expiry, and Preparation resource refresh (Temp HP / DN Pool).
 *
 * Duration: lastActiveRound = activationRound + effectiveDuration - 1.
 * MR1 activated in Prep for Round 1 lasts all of Round 1 and expires at Round End.
 */
/** Pure duration math (authoritative). */
export declare function computeLastActiveRound(activationRound: number, effectiveDuration: number): number;
export declare function isBuffActiveInRound(activationRound: number, lastActiveRound: number, currentRound: number): boolean;
/** Upcoming combat Round for Preparation (Foundry prep often uses round 0). */
export declare function preparationTargetRound(combat: any): number;
/**
 * True when the actor may legally activate/replace an Active Buff:
 * combat exists and Preparation for the upcoming Round is still open for them.
 */
export declare function isActiveBuffPreparationWindow(actor: any, combat: any): boolean;
export declare function readBuffLifecycleFlags(effect: any): {
    activationRound: number;
    effectiveDuration: number;
    lastActiveRound: number;
    combatId: string;
    durationMode: string;
} | null;
/** Remaining complete Rounds including the current Round (0 if expired). */
export declare function remainingCompleteRounds(lastActiveRound: number, currentRound: number): number;
/**
 * Commit the base Attack Action for the upcoming Round (survives resetTurnState).
 */
export declare function commitPrepBaseAttackAction(actor: any, combat: any): Promise<boolean>;
export declare function clearPrepBaseAttackCommitment(actor: any, combat: any): Promise<void>;
/**
 * Expire Active Buffs whose lastActiveRound is strictly before the new Round
 * (i.e. Round End of lastActiveRound has passed). Call when advancing to `newRound`.
 */
export declare function expireActiveBuffsAtRoundEnd(actor: any, combat: any, endingRound: number): Promise<string[]>;
/**
 * Refresh Active Buff Temporary HP pools at Preparation (once per Round).
 * Raises each buff-owned refresh source to its declared printed value.
 */
export declare function refreshActiveBuffTempHPAtPreparation(actor: any, combat: any): Promise<void>;
/**
 * Preparation tick for one actor: refresh Round resources for maintained Buffs.
 * Call after Round End expiry for the previous Round / at Prep open for the new Round.
 */
export declare function processActiveBuffPreparation(actor: any, combat: any): Promise<void>;
/**
 * Round advance pipeline helper: expire buffs that ended with `previousRound`,
 * then refresh surviving buffs for `newRound` Preparation.
 */
export declare function onCombatRoundAdvanceActiveBuffs(combat: any, newRound: number): Promise<void>;
/** List true Active Buff power items the actor owns (for Preparation UI). */
export declare function listActivatableActiveBuffPowers(actor: any): Promise<any[]>;
export declare function formatActiveBuffDurationLabel(activationRound: number, lastActiveRound: number, currentRound: number): string;
/** Skip turnStartSelf Temp HP for Active Buffs that refresh at Preparation. */
export declare function buffUsesPreparationTempHPRefresh(effect: any): boolean;
//# sourceMappingURL=active-buff-lifecycle.d.ts.map