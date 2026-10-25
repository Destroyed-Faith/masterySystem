/**
 * Instant AoE — confirm the *affected* creature set before an Attack Card.
 *
 * No Primary Target: every listed token is an equal participant of one shared
 * Attack Roll vs its own Evade. Hits are decided after the roll.
 */
export type AoeAffectedConfirmResult = 'cancelled' | {
    affectedTokenIds: string[];
};
/**
 * Show a self-centered radius preview, list affected creatures (not "hits"),
 * and ask the player to confirm. Cancel returns without spending resources.
 */
export declare function promptMeleeAoeAffectedConfirm(params: {
    attackerToken: any;
    candidateTokenIds: string[];
    radiusMeters: number;
    powerName: string;
}): Promise<AoeAffectedConfirmResult>;
//# sourceMappingURL=aoe-affected-confirm.d.ts.map