/**
 * Fear bands and Incapacitated / pool-floor helpers — DF Guide 2026-10-23.
 */
/** Fear Check is Resolve k1. Result bands → Fear gained. */
export declare function fearGainFromResolveCheck(result: number): 0 | 1 | 2;
/**
 * Normal pool reductions protect a floor of two rolled dice when the original
 * pool had at least two. Keep is unchanged (Fear stays Resolve k1).
 */
export declare function applyPoolReductionFloor(opts: {
    originalDice: number;
    reducedDice: number;
}): number;
export declare function diceAfterFear(attributeDice: number, fear: number): number;
/** All available Health Bars Scarred → Incapacitated (not automatic death). */
export declare function isIncapacitated(opts: {
    availableBars: number;
    scarredBars: number;
}): boolean;
/** Emergency Medicine Base TN = patient MR × 4. */
export declare function emergencyMedicineBaseTn(patientMasteryRank: number): number;
/**
 * Safe Haven scar recovery: 1 base + Medicine aftercare.
 * Rank 4–7 → +1; Rank 8 → +2; one patient per healer.
 */
export declare function safeHavenScarBarsRecovered(medicineRank: number | null | undefined): number;
//# sourceMappingURL=fear-health.d.ts.map