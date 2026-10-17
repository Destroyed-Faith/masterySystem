/**
 * Blocks ordinary token drags from bypassing guided Flee / Movement Power commits.
 * Resolver writes must pass `masteryAuthorizedMove: true` in the update options.
 */
export declare const MASTERY_AUTHORIZED_MOVE = "masteryAuthorizedMove";
export type TokenMoveGateInput = {
    change: {
        x?: number;
        y?: number;
    };
    options?: Record<string, unknown> | null;
    /** True when this client owns the update. */
    isLocalUser: boolean;
    combatStarted: boolean;
    /** Guided movement is open for this token. */
    guidedActive: boolean;
    currentAction?: {
        category?: string;
        optionId?: string;
        powerType?: string;
        kind?: string;
    } | null;
    traversal?: string;
};
export type TokenMoveGateResult = {
    allow: true;
    reason?: string;
} | {
    allow: false;
    reason: string;
};
export declare function isMasteryAuthorizedMove(options?: Record<string, unknown> | null): boolean;
export declare function isResolverBoundMovementAction(action: TokenMoveGateInput['currentAction']): boolean;
/**
 * Pure gate used by `preUpdateToken`. Returns whether the position change may proceed.
 */
export declare function gateTokenMovementUpdate(input: TokenMoveGateInput): TokenMoveGateResult;
//# sourceMappingURL=token-move-gate.d.ts.map