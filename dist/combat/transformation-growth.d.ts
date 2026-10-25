/**
 * Universal Transformation Growth (Core — Form and Transformation).
 *
 * Growth G occupies `1 + 3×G×(G+1)` Hexes, adds +2 m melee Reach per Growth,
 * grants G additional 0-penalty Growth Health Bars, and reduces Push/Pull by
 * Growth × MR meters. Uses: Mastery Rank times per Safe Haven Rest.
 *
 * Titan Scars grants max Growth 1 / 2 / 3 at Artifact Levels 1 / 4 / 7.
 * This is an Artifact Function (Transformation), not Active Buff: Growth Form.
 */
export type GrowthRank = 0 | 1 | 2 | 3;
export interface GrowthGeometry {
    growth: GrowthRank;
    occupiedHexes: number;
    adjacentHexes: number;
    /** Total base melee reach in meters (2 m + 2 m × Growth). */
    meleeReachM: number;
    /** Additional reach beyond the normal 2 m base. */
    reachBonusM: number;
    additionalHealthBars: number;
    /** Subtract Growth × MR from incoming Push/Pull (meters). */
    pushPullReductionFactor: number;
    /** Physical ranged and Spell Range doubled once at Growth ≥ 2. */
    rangeDoubled: boolean;
}
export interface GrowthHealthBarState {
    name: string;
    max: number;
    current: number;
    penalty: number;
    scarred?: boolean;
    growthBar?: true;
}
export declare function clampGrowthRank(raw: unknown): GrowthRank;
/** Max Growth granted by Titan Scars at the given Artifact Level. */
export declare function titanScarsMaxGrowth(artifactLevel: number): GrowthRank;
export declare function growthGeometry(growth: GrowthRank): GrowthGeometry;
/** Occupied Hex count for Growth G: 1 + 3×G×(G+1). */
export declare function growthOccupiedHexes(growth: GrowthRank): number;
export declare function pushPullReductionMeters(growth: GrowthRank, masteryRank: number): number;
/** Safe Haven Rest uses for size-changing Transformation = Mastery Rank. */
export declare function transformationUsesPerRest(masteryRank: number): number;
export declare function peekActorGrowth(actor: any): GrowthRank;
/**
 * Ensure persisted Growth Bars exist up to `count` (Vitality×4 HP, 0 penalty).
 * Existing damage / Scarred state is preserved; new bars start full.
 */
export declare function ensureGrowthBarStates(existing: GrowthHealthBarState[], count: number, hpPerBar: number): GrowthHealthBarState[];
/**
 * Sync visible Growth Bars onto actor.system.health.bars for the active Growth rank.
 * When Growth is 0, Growth Bars are removed from the visible list but persist in the flag.
 */
export declare function syncGrowthHealthBars(actor: any, rank: GrowthRank): Promise<void>;
export declare function setActorGrowth(actor: any, rank: GrowthRank, opts?: {
    quiet?: boolean;
}): Promise<GrowthRank>;
/** Activate Titan Growth to the highest rank the artifact currently grants. */
export declare function activateTitanGrowth(actor: any, artifactLevel: number): Promise<{
    ok: boolean;
    rank: GrowthRank;
    reason?: string;
}>;
//# sourceMappingURL=transformation-growth.d.ts.map