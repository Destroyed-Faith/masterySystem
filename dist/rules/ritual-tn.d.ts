/**
 * Core Ritual TN / Stone costs — DF Players Guide 2026-10-23.
 */
/** Base Ritual TN = 4 × max(3, taskLevel). Minimum 12. */
export declare function ritualBaseTn(taskLevel: number): number;
export declare function finalRitualTn(baseTn: number, paidRaises: number): number;
/** Sealed Stones from total declared Raises (Paid + Free). Cap 3. */
export declare function ritualSealedStoneCost(totalRaises: number): number;
export declare const RITUAL_MAX_TOTAL_RAISES = 8;
export declare const RITUAL_MAX_NAMED_TIER = 4;
/** Free Raises a relevant Specialization contributes to a Ritual (Ranks 4/6/8). */
export declare function ritualFreeRaisesFromSpecialization(rank: number): number;
export interface RitualRaisePlan {
    namedTier: number;
    genericRaises: number;
    freeRaises: number;
    paidRaises: number;
    totalRaises: number;
    baseTn: number;
    finalTn: number;
    sealedStones: number;
    ok: boolean;
    error?: string;
}
export declare function planRitualRaises(opts: {
    taskLevel: number;
    namedTier: number;
    genericRaises?: number;
    specializationRank?: number;
}): RitualRaisePlan;
//# sourceMappingURL=ritual-tn.d.ts.map