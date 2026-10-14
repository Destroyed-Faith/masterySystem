/**
 * Chat summaries for Stone Powers assignments — per combatant on confirm,
 * plus a round rollup when everyone is done.
 */
export declare const STONE_POWERS_ROUND_PLAN_FLAG = "stonePowersRoundPlan";
export interface StonePowersLaneSnapshot {
    accKey: string;
    value: unknown;
}
/** Human lines from a paid stone receipt (accKey → stones). */
export declare function formatStoneReceiptLines(receipt: StonePowersLaneSnapshot[] | null | undefined): string[];
export declare function announceActorStoneAssignment(actor: any, receipt: StonePowersLaneSnapshot[] | null | undefined, round: number): Promise<void>;
/**
 * After every PC/NPC with stone flow is done: one chat card listing who spent what
 * and Natural Special Recovery plans (incl. auto single-effect).
 * Idempotent per combat round (safe if multiple complete paths fire).
 */
export declare function announceRoundStoneAssignments(combat: Combat, round: number): Promise<void>;
//# sourceMappingURL=stone-assignment-chat.d.ts.map