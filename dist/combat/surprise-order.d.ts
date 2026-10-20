/**
 * Round-1 Surprise Priority ordering from explicit attacker→target edges.
 * Initiative Scores are never modified — only turn sequence.
 */
export interface SurpriseEdge {
    attackerId: string;
    targetId: string;
}
export interface SurpriseOrderCombatant {
    id: string;
    initiative: number;
    defeated?: boolean;
    /** Secondary keys for stable initiative ties (higher wins). */
    masteryRank?: number;
    agility?: number;
    tieD8?: number;
}
export type SurpriseOrderResult = {
    ok: true;
    orderIds: string[];
} | {
    ok: false;
    error: string;
    cycleIds?: string[];
};
export declare function readSurpriseEdges(combat: any): SurpriseEdge[];
export declare function readSurpriseOrderIds(combat: any): string[];
/** Base initiative order without Surprise (higher initiative first). */
export declare function sortByInitiativeOnly(combatants: SurpriseOrderCombatant[]): SurpriseOrderCombatant[];
/**
 * Build Round-1 order: preserve initiative priority wherever compatible with
 * edges “attacker before target”. Detect cycles.
 */
export declare function buildSurpriseRound1Order(combatants: SurpriseOrderCombatant[], edges: SurpriseEdge[]): SurpriseOrderResult;
export declare function writeSurpriseEdges(combat: any, edges: SurpriseEdge[]): Promise<void>;
export declare function writeSurpriseOrderIds(combat: any, orderIds: string[]): Promise<void>;
export declare function clearSurpriseOrderState(combat: any): Promise<void>;
/** Recalculate and persist Round-1 order from edges; returns result. */
export declare function computeSurpriseOrderForCombat(combat: any): SurpriseOrderResult;
export declare function applySurpriseOrderToCombat(combat: any): Promise<SurpriseOrderResult>;
export declare function addSurpriseEdges(combat: any, attackerIds: string[], targetIds: string[]): Promise<SurpriseOrderResult>;
/** Clear actor surprisePriority flags after Round 1. */
export declare function clearActorSurprisePriorityFlags(combat: any): Promise<void>;
//# sourceMappingURL=surprise-order.d.ts.map