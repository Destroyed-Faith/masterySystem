/**
 * Keep Ready / Sealed / Burned stone pools in sync across world actors and
 * unlinked token actors. Seals written via getActionEconomyActor often land on
 * the token while Safe Haven / sheet GM tools update the world prototype.
 */
/** Same shape as SafeHavenSealHold — kept local to avoid import cycles. */
export interface StonePoolSealHold {
    attrCounts?: Record<string, number>;
    generic?: number;
}
/**
 * System used for Lifetime stone math. Token deltas often lack progression;
 * the world prototype keeps `stoneSlotOrder` / `v099Stones`.
 */
export declare function resolveActorStoneSystem(actor: any): any;
/** Pool capacity for Ready refill (matches Safe Haven / Actor.prepareBaseData). */
export declare function stonePoolReadyMax(system: any, attr: string, pool: {
    max?: unknown;
} | null | undefined): number;
/**
 * Every document that may hold combat stone pool state for this character:
 * the given actor, its economy owner, the world prototype, and placed tokens.
 */
export declare function listStonePoolSyncActors(actor: any): any[];
/** Plain stonePools object with Sealed/Burned cleared (Word of Recall hold respected). */
export declare function buildReadyStonePoolsObject(system: any, sealHold?: StonePoolSealHold | null, 
/** Optional progression donor (world actor system) when `system` is a token delta. */
progressionDonor?: any): Record<string, {
    current: number;
    max: number;
    sustained: number;
    sealed: number;
    burned: number;
}>;
/** Dotted-path updates for callers that prefer partial writes. */
export declare function buildReadyStonePoolUpdates(system: any, sealHold?: StonePoolSealHold | null): Record<string, unknown>;
/**
 * Align stonePools.max/current and stoneAssignments with the Lifetime track.
 * Does not clear Sealed/Burned — only repairs caps that still follow ÷8.
 * Uses world progression when the target is a token delta without the track.
 */
export declare function syncStonePoolCapsFromAssignments(actor: any): Promise<boolean>;
/**
 * Force every economy document for this character to Ready stone pools.
 * Uses a whole `system.stonePools` replace so Foundry cannot leave a nested
 * `sealed` field behind on a DataModel fragment.
 */
export declare function forceReadyStonePoolsOnCharacter(actor: any, sealHold?: StonePoolSealHold | null): Promise<{
    actors: number;
    vitalityReady: number;
    vitalitySealed: number;
}>;
//# sourceMappingURL=stone-pool-sync.d.ts.map