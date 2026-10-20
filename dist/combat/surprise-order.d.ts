/**
 * Round-1 Surprise ordering: surprised combatants act last (among themselves
 * still sorted by initiative). Initiative Scores are never modified.
 */
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
/** @deprecated Legacy edge shape — migrated into surprisedCombatantIds (targets). */
export interface SurpriseEdge {
    attackerId: string;
    targetId: string;
}
/** Migrate legacy attacker→target edges into a set of surprised (target) ids. */
export declare function surprisedIdsFromLegacyEdges(edges: SurpriseEdge[]): string[];
export declare function readSurpriseEdges(combat: any): SurpriseEdge[];
export declare function readSurprisedCombatantIds(combat: any): string[];
export declare function isCombatantSurprised(combat: any, combatantId: string): boolean;
export declare function readSurpriseOrderIds(combat: any): string[];
/** Base initiative order without Surprise (higher initiative first). */
export declare function sortByInitiativeOnly(combatants: SurpriseOrderCombatant[]): SurpriseOrderCombatant[];
/**
 * Round-1 order: non-surprised by initiative, then surprised by initiative.
 * Accepts either a surprised-id list or (legacy) edges — edges are flattened to targets.
 */
export declare function buildSurpriseRound1Order(combatants: SurpriseOrderCombatant[], surprisedIdsOrEdges: string[] | SurpriseEdge[]): SurpriseOrderResult;
export declare function writeSurprisedCombatantIds(combat: any, ids: string[]): Promise<void>;
export declare function writeSurpriseOrderIds(combat: any, orderIds: string[]): Promise<void>;
export declare function clearSurpriseOrderState(combat: any): Promise<void>;
export declare function computeSurpriseOrderForCombat(combat: any): SurpriseOrderResult;
export declare function applySurpriseOrderToCombat(combat: any): Promise<SurpriseOrderResult>;
/** Mark combatants as surprised (Round 1: act last). Idempotent union. */
export declare function markCombatantsSurprised(combat: any, combatantIds: string[]): Promise<SurpriseOrderResult>;
/** Toggle one combatant’s surprised state for Round 1. */
export declare function toggleSurprisedCombatant(combat: any, combatantId: string): Promise<SurpriseOrderResult & {
    surprised: boolean;
}>;
/**
 * @deprecated Use markCombatantsSurprised(targetIds). Kept for callers that
 * still pass attacker/target pairs — only targets are marked surprised.
 */
export declare function addSurpriseEdges(combat: any, _attackerIds: string[], targetIds: string[]): Promise<SurpriseOrderResult>;
/** Clear actor surprisePriority flags after Round 1. */
export declare function clearActorSurprisePriorityFlags(combat: any): Promise<void>;
//# sourceMappingURL=surprise-order.d.ts.map