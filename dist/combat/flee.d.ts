/**
 * Universal Flee. One Movement and one Attack Action, then up to 4 × Speed
 * along a normal path. The lock lasts until the start of the creature's next
 * Turn. Flee does not start a Pursuit.
 */
/** Flee is a path. It is not Safe Movement and not a teleport. */
export declare const FLEE_TRAVERSAL: "path";
export declare function fleeAllowanceMeters(input: {
    speed: number;
    enhancement?: number;
    reduced?: boolean;
}): number;
export declare function canDeclareFlee(actor: any, combat: any): {
    ok: boolean;
    reason?: string;
};
/**
 * Spend Movement and the Attack Action, then lock Attacks, Reactions, and Stones.
 * A second call in the same Turn does not spend again.
 * A failed check spends nothing and does not lock.
 */
export declare function commitFlee(actor: any, combat: any): Promise<{
    ok: boolean;
    already?: boolean;
    meters: number;
    reason?: string;
}>;
//# sourceMappingURL=flee.d.ts.map