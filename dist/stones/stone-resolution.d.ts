/**
 * Stone assignment commit → resolution queue.
 *
 * Placing Stones only plans. Confirm pays once, applies powers whose effect
 * is already determined, and queues powers that still need a target.
 * Tickets are idempotent: the same id is never inserted twice, and a
 * resolved ticket is never rolled again.
 */
export interface StoneBar {
    current: number;
    max: number;
    name?: string;
    penalty?: number;
}
export declare const STONE_RESOLUTION_QUEUE_FLAG = "stoneResolutionQueue";
export type StoneResolutionKind = 'passive' | 'automatic' | 'interactive';
export type StoneResolutionStatus = 'pending' | 'resolved';
export interface StoneResolutionTicket {
    id: string;
    powerId: string;
    tier: number;
    status: StoneResolutionStatus;
}
export interface StoneResolutionQueue {
    combatId: string;
    round: number;
    tickets: StoneResolutionTicket[];
}
export interface PlannedStonePower {
    powerId: string;
    tier: number;
}
export interface AssignmentSimulation {
    locked: boolean;
    /** Automatic and passive powers already applied, `${powerId}:${tier}`. */
    fired: string[];
    queue: StoneResolutionQueue | null;
}
export interface StoneTargetCandidate {
    id: string;
    name: string;
    self: boolean;
    /** Null when the token distance cannot be measured. */
    distanceM: number | null;
}
export interface HealthSnapshot {
    bars: StoneBar[];
    currentBar: number;
}
export declare function stoneResolutionKind(powerId: string): StoneResolutionKind;
/** Allocation never executes a power. Confirm is the only commit point. */
export declare function effectsFromAllocation(): readonly string[];
export declare function stoneResolutionTicketId(combatId: string, round: number, powerId: string, tier: number): string;
export declare function readStoneResolutionQueue(raw: unknown): StoneResolutionQueue | null;
export declare function pendingStoneResolutions(queue: StoneResolutionQueue | null | undefined): StoneResolutionTicket[];
/**
 * Add interactive powers for this combat round. Resolved ids stay resolved.
 * A second confirm with the same power does not create another ticket.
 */
export declare function enqueueStoneResolutions(existing: StoneResolutionQueue | null | undefined, combatId: string, round: number, incoming: readonly PlannedStonePower[]): StoneResolutionQueue;
export declare function markStoneResolutionResolved(queue: StoneResolutionQueue, ticketId: string): StoneResolutionQueue;
export declare function splitCommitEffects(powers: readonly PlannedStonePower[]): {
    onCommit: PlannedStonePower[];
    interactive: PlannedStonePower[];
};
/**
 * Confirm applies each automatic/passive power once and locks the assignment.
 * A later call (view-only reopen, refresh) does not fire them again.
 */
export declare function simulateConfirmAssignment(state: AssignmentSimulation, args: {
    combatId: string;
    round: number;
    powers: readonly PlannedStonePower[];
    onAutomatic: (power: PlannedStonePower) => void;
}): AssignmentSimulation;
export declare function healingRankProfile(tier: number): {
    dice: number;
    rangeM: number;
};
export declare function stressHealingRankProfile(tier: number): {
    dice: number;
    rangeM: number;
};
/** Self is always legal. An ally counts only when the measured distance is inside range. */
export declare function isLegalStoneTarget(candidate: StoneTargetCandidate, rangeM: number): boolean;
export declare function legalStoneTargets(candidates: readonly StoneTargetCandidate[], rangeM: number): StoneTargetCandidate[];
export declare function hpRestoredFromRoll(current: number, max: number, rolled: number): number;
export declare function applyHealingToCurrentBar(health: HealthSnapshot, rolled: number): {
    bars: StoneBar[];
    currentBar: number;
    restored: number;
    rolled: number;
};
export declare function stressRestoredFromBars(before: readonly StoneBar[], after: readonly StoneBar[]): number;
export declare function applyStressHealingToBars(bars: readonly StoneBar[], currentBar: number, rolled: number): {
    bars: StoneBar[];
    currentBar: number;
    restored: number;
    rolled: number;
};
export declare function escapeStoneChat(value: unknown): string;
export declare function healingChatContent(args: {
    sourceName: string;
    targetName: string;
    dice: number;
    rolled: number;
    restored: number;
}): string;
export declare function stressHealingChatContent(args: {
    sourceName: string;
    targetName: string;
    dice: number;
    rolled: number;
    restored: number;
    rangeM: number;
}): string;
export declare function resolveHealingSelection(args: {
    sourceName: string;
    tier: number;
    candidates: readonly StoneTargetCandidate[];
    choose: (legal: readonly StoneTargetCandidate[]) => Promise<string | null>;
    roll: (formula: string) => Promise<number>;
    healthOf: (targetId: string) => HealthSnapshot | null;
    writeHealth: (targetId: string, health: HealthSnapshot) => Promise<void> | void;
    chat: (content: string) => Promise<void> | void;
}): Promise<{
    ok: boolean;
    restored: number;
    targetId: string | null;
}>;
export declare function resolveStressHealingSelection(args: {
    sourceName: string;
    tier: number;
    candidates: readonly StoneTargetCandidate[];
    choose: (legal: readonly StoneTargetCandidate[]) => Promise<string | null>;
    roll: (formula: string) => Promise<number>;
    stressOf: (targetId: string) => HealthSnapshot | null;
    writeStress: (targetId: string, stress: HealthSnapshot) => Promise<void> | void;
    chat: (content: string) => Promise<void> | void;
}): Promise<{
    ok: boolean;
    restored: number;
    targetId: string | null;
}>;
//# sourceMappingURL=stone-resolution.d.ts.map