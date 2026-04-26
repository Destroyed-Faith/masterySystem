/**
 * Token adjacency for passive `conditionExpr` gates (e.g. Surrounded Bulwark).
 * Uses scene grid distance between token centers (same rule as one grid step).
 */
/** Prefer controlled token on the active scene, else first placeable for this actor. */
export declare function getPrimaryTokenForActor(actor: any): any;
/** Hostile tokens in the same scene whose base is within one grid step of `selfToken`. */
export declare function countAdjacentHostileTokenCount(selfToken: any): number;
/**
 * Non-hostile other tokens adjacent (party-style allies: not mutually hostile).
 */
export declare function countAdjacentAllyTokenCount(selfToken: any): number;
//# sourceMappingURL=mechanics-adjacency.d.ts.map