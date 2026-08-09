/**
 * Forced movement targeting — Push (away from source) / Pull (toward source).
 *
 * Highlights only legal destination cells within N m of the moved token:
 *   Push → farther from the reference token than the current cell
 *   Pull → closer to the reference token than the current cell
 *
 * Click a highlighted cell to move; Escape / right-click skips (damage already applied).
 */
export type ForcedMoveMode = 'push' | 'pull';
export interface ForcedMoveRequest {
    /** Token that is relocated. */
    movedToken: any;
    /** Source of the force (defender for Counter Damage Push). */
    referenceToken: any;
    meters: number;
    mode: ForcedMoveMode;
    label?: string;
}
export type ForcedMoveOutcome = 'moved' | 'skipped' | 'unavailable';
/** Pure distance rule: Push only farther, Pull only closer. Equal distance is illegal. */
export declare function isForcedMoveDistanceLegal(mode: ForcedMoveMode, originDist: number, destDist: number): boolean;
/** Read Push/Pull metres from a power item (levels / specials objects / "push(2)" strings). */
export declare function readPushPullMetersFromPower(power: any): {
    push: number;
    pull: number;
};
/**
 * Build the set of legal destination hex keys for Push/Pull.
 * Exported for tests when a fake grid is injected via params.
 */
export declare function filterLegalForcedMoveKeys(params: {
    mode: ForcedMoveMode;
    candidateKeys: Iterable<string>;
    blockedKeys: Set<string>;
    originDistSteps: number;
    /** Map key → distance-in-steps from the reference token. */
    distFromRefSteps: (key: string) => number | null;
}): Set<string>;
/**
 * Interactive Push/Pull placement. Resolves when the token is moved or the mode is cancelled.
 */
export declare function startForcedMovementMode(req: ForcedMoveRequest): Promise<ForcedMoveOutcome>;
/**
 * Resolve actor tokens and start Push and/or Pull (Push first if both).
 */
export declare function offerForcedMovementFromActors(params: {
    movedActor: Actor | null | undefined;
    referenceActor: Actor | null | undefined;
    pushM?: number;
    pullM?: number;
    labelPrefix?: string;
}): Promise<ForcedMoveOutcome[]>;
//# sourceMappingURL=forced-movement.d.ts.map