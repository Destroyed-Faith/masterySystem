/**
 * Active Buff utilities for the Mastery System
 * Active Buffs are powers that create effects lasting for "Mastery Rank rounds"
 */
/**
 * Extend the currently maintained true Active Buff by complete Rounds.
 * Used by Resolve Stone Ability: Active Buff Empowerment (immediate apply).
 */
export declare function extendMaintainedActiveBuffRounds(actor: Actor, extraRounds: number): Promise<{
    ok: boolean;
    name?: string;
    lastActiveRound?: number;
    addedRounds?: number;
}>;
/**
 * Effect Power Level for an Active Buff snapshot.
 * Uses the power's purchased `rank` / `level` — never Mastery Rank (that only
 * sets duration). Missing rank previously fell back to MR and could snapshot
 * Active Buff: Armor at +17 (PL4) while the sheet still showed PL1/+5.
 */
export declare function resolveActiveBuffEffectLevel(powerSys: any, empowerPowerLevels?: number): number;
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
    /**
     * @deprecated Z01 — no Attack Action / once-per-Prep slot. Kept for callers.
     */
    skipActionCommit?: boolean;
}
/**
 * Activate an active buff power during the Preparation Phase.
 * Duration is complete Combat Rounds ending at Round End:
 * lastActiveRound = activationRound + effectiveDuration - 1.
 * Only one true active buff can be active at a time (utilities can stack).
 * Activation does not spend an Attack Action or Stones. There is no general
 * per-Combat or per-Preparation activation limit — replace ends the prior Buff
 * fully before the new one begins (Z01).
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
 * Sync permission helper: voluntary end is free anytime for the owner / GM (Z01).
 * `windowOpen` is ignored for ending — kept for call-site compatibility.
 */
export declare function canRetractActiveBuffFromFlags(opts: {
    maintaining: boolean;
    isGM: boolean;
    isOwner: boolean;
    windowOpen?: boolean;
}): boolean;
/**
 * Whether the current user may voluntarily end a maintained true Active Buff.
 * Owners and GMs may end anytime at no cost (Z01). Activation still requires Preparation.
 */
export declare function canRetractActiveBuffActivation(actor: Actor, _combat?: any, user?: {
    isGM?: boolean;
} | null): Promise<boolean>;
/**
 * Voluntarily end a maintained Active Buff (free, anytime).
 * Clears legacy prepBaseAttackCommitted / activeBuffUsedThisRound if present.
 * Does not restore Critical / Maximization / other limited Buff resources.
 */
export declare function retractActiveBuffActivation(actor: Actor, opts?: RetractActiveBuffOptions): Promise<RetractActiveBuffResult>;
/** Alias — voluntary end of the maintained Active Buff (Z01). */
export declare const endActiveBuff: typeof retractActiveBuffActivation;
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