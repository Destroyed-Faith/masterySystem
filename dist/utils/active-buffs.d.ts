/**
 * Active Buff utilities for the Mastery System
 * Active Buffs are powers that create effects lasting for "Mastery Rank rounds"
 */
/**
 * Check if a power is a utility (not a true active buff)
 */
export declare function isUtility(power: any): boolean;
/**
 * Check if a power is a true active buff (not a utility)
 */
export declare function isTrueActiveBuff(power: any): boolean;
/**
 * Check if a power is an active buff (includes utilities)
 */
export declare function isActiveBuff(power: any): boolean;
/** Active Buff duration in rounds before Extend Active Buff. */
export declare function activeBuffDurationRounds(actor: any): number;
/**
 * Get all true active buffs (excluding utilities) on an actor
 */
export declare function getTrueActiveBuffs(actor: Actor): any[];
export interface ActivateActiveBuffOptions {
    /**
     * When true, skip the Preparation-window gate (internal/tests only).
     * Normal callers must activate during Preparation.
     */
    allowOutsidePreparation?: boolean;
    /** When true, do not commit the base Attack Action (caller already did / maintain). */
    skipActionCommit?: boolean;
}
/**
 * Activate an active buff power during the Preparation Phase.
 * Duration is complete Combat Rounds ending at Round End:
 * lastActiveRound = activationRound + effectiveDuration - 1.
 * Only one true active buff can be active at a time (utilities can stack).
 */
export declare function activateActiveBuff(actor: Actor, power: any, opts?: ActivateActiveBuffOptions): Promise<boolean>;
export interface RetractActiveBuffOptions {
    /** Override user for permission checks (tests). */
    user?: {
        isGM?: boolean;
    } | null;
}
export type RetractActiveBuffResult = {
    ok: boolean;
    refunded: boolean;
    reason?: 'none' | 'denied' | 'error';
};
/**
 * Sync permission helper when Preparation window / ownership are already known (UI context).
 * Players: only during Preparation. GMs: anytime a true buff is maintained.
 */
export declare function canRetractActiveBuffFromFlags(opts: {
    maintaining: boolean;
    isGM: boolean;
    isOwner: boolean;
    windowOpen: boolean;
}): boolean;
/**
 * Whether the current user may retract a maintained true Active Buff.
 * Players: only during Preparation. GMs: anytime a true buff is maintained.
 */
export declare function canRetractActiveBuffActivation(actor: Actor, combat: any, user?: {
    isGM?: boolean;
} | null): Promise<boolean>;
/**
 * Retract a maintained Active Buff: delete the effect and, when the base Attack
 * was committed for this activation, refund prepBaseAttackCommitted + activeBuffUsedThisRound.
 * Players may only retract during Preparation; GMs may retract anytime.
 */
export declare function retractActiveBuffActivation(actor: Actor, opts?: RetractActiveBuffOptions): Promise<RetractActiveBuffResult>;
/**
 * Get all active buffs on an actor
 */
export declare function getActiveBuffs(actor: Actor): any[];
/**
 * Highest Active Buff Critical(X) currently maintained (0 if none).
 * X = Critical-capable attacks per Round (not explode strength).
 * Resolution lives in `src/combat/critical-resolution.ts`.
 */
export declare function getActiveBuffCriticalTier(actor: Actor): number;
/**
 * Check if a specific power is currently active as a buff
 */
export declare function isPowerActiveAsBuff(actor: Actor, powerId: string): boolean;
/**
 * Remove all Mastery-flagged active-buff ActiveEffects from an actor (e.g. combat end).
 */
export declare function deleteAllMasteryActiveBuffEffects(actor: Actor): Promise<void>;
//# sourceMappingURL=active-buffs.d.ts.map