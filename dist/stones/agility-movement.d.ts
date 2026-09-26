/**
 * Agility Stone Abilities: Safe Movement and Slip.
 *
 * Safe Movement replaces the actor's normal Movement for that use.
 * Slip is a separate reactive move and does not touch that budget.
 */
export declare const SAFE_MOVEMENT_METERS: readonly [4, 8, 12, 16];
export declare const SLIP_METERS: readonly [4, 8, 12, 16];
export declare const PENDING_SAFE_MOVEMENT_FLAG = "pendingSafeMovement";
export declare const PENDING_SLIP_FLAG = "pendingSlip";
export declare const SLIP_MOVEMENT_ACTIVE_FLAG = "slipMovementActive";
export declare function safeMovementMeters(tier: number): number;
export declare function slipMeters(tier: number): number;
export interface MovementBudget {
    movementTotal: number;
    movementUsed: number;
    movementPowerUsed: boolean;
    attackUsed: number;
    reactionUsed: number;
}
/** Safe Movement needs an unspent Movement action and must not already have replaced Movement. */
export declare function canCommitSafeMovement(budget: MovementBudget): boolean;
/**
 * Spend the Movement budget on Safe Movement.
 * Attack Actions and Reactions are left untouched.
 * Returns null when Movement is already gone.
 */
export declare function commitSafeMovement(budget: MovementBudget): MovementBudget | null;
export declare function movementProvokesReactions(kind: 'normal' | 'safe' | 'slip'): boolean;
export interface SlipArm {
    meters: number;
    used: boolean;
    actorId: string;
    armedCombatId: string | null;
    armedRound: number;
    armedTurn: number;
}
export interface SlipTriggerEvent {
    defenderId: string;
    attackerId: string;
    /** True when the Attack meets the defender's TN. */
    hit: boolean;
    /** False for spells, skill checks, and effects that are not an Attack. */
    isAttack: boolean;
}
export declare function readSlipArm(raw: unknown): SlipArm | null;
/** An enemy Attack missed this actor, and Slip is still armed. */
export declare function slipCanTrigger(slip: SlipArm | null | undefined, event: SlipTriggerEvent): boolean;
export declare function markSlipUsed(slip: SlipArm): SlipArm;
/** Unused Slip ends when this actor's next Turn starts. A used Slip is already spent. */
export declare function expireSlipOnOwnTurnStart(slip: SlipArm | null | undefined): null;
//# sourceMappingURL=agility-movement.d.ts.map