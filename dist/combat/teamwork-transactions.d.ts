/**
 * Teamwork writes that touch two actors (Core 2026-11-19 Tactical Choices):
 * - Regular Attack Action Transfer (declared in Preparation, spent on the
 *   recipient's own Turn)
 * - Shared Free Raise allocation (the donor assigns part of an unchanged
 *   Intellect Raises pool; the recipient spends only what it was assigned)
 *
 * A client that may write both Round states applies the transaction itself;
 * otherwise the active GM re-validates and applies the identical transaction.
 * Transactions run one at a time per client, write the recipient first and
 * restore it when the donor write fails, so nothing is lost or granted twice.
 */
export type TeamworkFailure = 'missing-actor' | 'self' | 'not-ally' | 'range' | 'perception' | 'permission' | 'not-in-combat' | 'stale-round' | 'not-preparation' | 'donor-base-unavailable' | 'donor-already-spent' | 'invalid-amount' | 'no-raises' | 'write-failed' | 'gm-unavailable' | 'gm-timeout' | 'gm-rejected';
export type TeamworkResult = {
    ok: true;
} | {
    ok: false;
    reason: TeamworkFailure;
};
export type TeamworkContext = {
    donorToken?: any;
    recipientToken?: any;
    /** GM-only console/API shortcut; ignored for players and for relayed requests. */
    skipRangeCheck?: boolean;
};
/** Run transactions one after another so two requests never read the same stale state. */
export declare function serializeTeamwork<T>(fn: () => Promise<T>): Promise<T>;
/** Validate and apply a transfer on a client that may write both actors. */
export declare function applyAttackActionTransfer(donor: any, recipient: any, combat: Combat | null, ctx?: TeamworkContext): Promise<TeamworkResult>;
/** Validate and apply a Free Raise allocation on a client that may write both actors. */
export declare function applyFreeRaiseAllocation(donor: any, recipient: any, amount: number, combat: Combat | null, ctx?: TeamworkContext): Promise<TeamworkResult>;
/** Prep: give the regular Attack Action to an ally (directly or through the GM). */
export declare function requestAttackActionTransfer(donor: any, recipient: any, combat: Combat | null, ctx?: TeamworkContext): Promise<TeamworkResult>;
/** Donor assigns `amount` of its current Intellect Free Raises to an ally. */
export declare function requestFreeRaiseAllocation(donor: any, recipient: any, amount: number, combat: Combat | null, ctx?: TeamworkContext): Promise<TeamworkResult>;
/**
 * Active GM side of a relayed request. Nothing from the requester is trusted:
 * ownership, live combat/Round, allegiance, range, perception and the donor's
 * remaining budget are all checked again against the GM's documents.
 */
export declare function handleGmTeamworkRequest(payload: any, requester: any): Promise<TeamworkResult>;
/** Player-facing text for a rejected teamwork request. */
export declare function teamworkFailureMessage(reason: TeamworkFailure, what: 'transfer' | 'raises'): string;
//# sourceMappingURL=teamwork-transactions.d.ts.map