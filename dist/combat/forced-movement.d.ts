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
/** Parse a single Push(N) / Pull(N) label (optionally with trailing notes). */
export declare function parsePushPullMetersFromLine(line: string): {
    push: number;
    pull: number;
};
/** Read Push/Pull metres from damage-card `specialsUsed` lines. */
export declare function readPushPullMetersFromSpecialLines(lines: readonly string[] | null | undefined): {
    push: number;
    pull: number;
};
/** Read Push/Pull metres from a power item (levels / specials objects / "push(2)" strings). */
export declare function readPushPullMetersFromPower(power: any): {
    push: number;
    pull: number;
};
/**
 * Control powers often grant Push and Pull at the same rank — the attacker
 * chooses one axis, not both in sequence.
 */
export declare function chooseForcedMoveAxis(pushM: number, pullM: number): Promise<ForcedMoveMode | null>;
/**
 * After a hit's specials resolve: parse Push/Pull from special lines and open
 * the canvas destination picker (Push-vs-Pull choice lives in
 * `offerForcedMovementFromActors` when both metre values are present).
 */
export declare function resolveForcedMovementFromSpecials(params: {
    movedActor: Actor | null | undefined;
    referenceActor: Actor | null | undefined;
    specialLines: readonly string[] | null | undefined;
    labelPrefix?: string;
}): Promise<ForcedMoveOutcome[]>;
/** Yellow highlight shared with radial / guided movement range previews. */
export declare const FORCED_MOVE_LEGAL_COLOR = 16769126;
export declare const FORCED_MOVE_HOVER_OK = 16769126;
export declare const FORCED_MOVE_HOVER_BAD = 16729156;
export declare const FORCED_MOVE_REF_COLOR = 16763972;
/**
 * True when a move ray from `from` → `to` is blocked by a wall (type move).
 * Inject `testCollision` for unit tests; otherwise uses Foundry wall APIs.
 */
export declare function isMoveRayBlockedByWall(from: {
    x: number;
    y: number;
}, to: {
    x: number;
    y: number;
}, testCollision?: (a: {
    x: number;
    y: number;
}, b: {
    x: number;
    y: number;
}) => boolean): boolean;
/**
 * Drop candidate keys whose center is wall-blocked from the origin center.
 * Pure aside from the optional collision predicate.
 */
export declare function filterKeysBlockedByWalls(params: {
    candidateKeys: Iterable<string>;
    originCenter: {
        x: number;
        y: number;
    };
    cellCenterFromKey: (key: string) => {
        x: number;
        y: number;
    } | null;
    testCollision?: (a: {
        x: number;
        y: number;
    }, b: {
        x: number;
        y: number;
    }) => boolean;
}): Set<string>;
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
/** True while interactive Push/Pull placement is listening on the canvas. */
export declare function isForcedMovementActive(): boolean;
/** Cancel interactive Push/Pull (Esc / stuck-overlay cleanup). No-ops if idle. */
export declare function cancelForcedMovementMode(): void;
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