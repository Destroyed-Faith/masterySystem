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
/** Combat flag: Preparation (for Active Buff activate/replace) closed for this Round. */
export declare const ACTIVE_BUFF_PREP_CLOSED_ROUND_FLAG = "activeBuffPrepClosedRound";
/**
 * True when the actor may legally activate/replace an Active Buff.
 *
 * Batch 6.1: Stone Confirmation does **not** close this window. The window
 * stays open for the whole Preparation Phase (including after stones are
 * confirmed) and closes when Round turns begin (`activeBuffPrepClosedRound`).
 */
export declare function isActiveBuffPreparationWindow(actor: any, combat: any): boolean;
/** Mark Active Buff activate/replace closed for the current Round (turns begun). */
export declare function closeActiveBuffPreparationForRound(combat: any): Promise<void>;
/** Re-open Active Buff Preparation when a new Round begins. */
export declare function openActiveBuffPreparationForRound(combat: any): Promise<void>;
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
 * Legacy: commit the base Attack Action for the upcoming Round (survives resetTurnState).
 * Current Active Buff activation no longer calls this — kept for older fights / tests / refunds.
 */
export declare function commitPrepBaseAttackAction(actor: any, combat: any): Promise<boolean>;
export declare function clearPrepBaseAttackCommitment(actor: any, combat: any): Promise<void>;
/**
 * Full rollback of a Preparation Active Buff activation cost:
 * clears prepBaseAttackCommitted and activeBuffUsedThisRound.
 * Call only when the base Attack was committed for that activation.
 */
export declare function refundPrepActiveBuffActivation(actor: any, combat: any): Promise<boolean>;
/**
 * Expire Active Buffs whose lastActiveRound is strictly before the new Round
 * (i.e. Round End of lastActiveRound has passed). Call when advancing to `newRound`.
 */
export declare function expireActiveBuffsAtRoundEnd(actor: any, combat: any, endingRound: number): Promise<string[]>;
/**
 * Snapshot Prep-scoped DN remaining before an Active Buff effect ends
 * (replace / voluntary end). Survives A→B→A within the same Preparation.
 */
export declare function snapshotActiveBuffPrepResourcesBeforeEnd(actor: any, combat: any, effect: any): Promise<void>;
/**
 * Refresh Active Buff Temporary HP pools at Preparation (once per Round).
 * Raises each buff-owned refresh source to its declared printed value.
 * A→B→A in the same Prep does not re-grant Temp HP for the same template.
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