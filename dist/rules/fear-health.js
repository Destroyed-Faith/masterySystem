/**
 * Fear bands and Incapacitated / pool-floor helpers — DF Guide 2026-10-23.
 */
/** Fear Check is Resolve k1. Result bands → Fear gained. */
export function fearGainFromResolveCheck(result) {
    const n = Math.floor(Number(result) || 0);
    if (n >= 16)
        return 0;
    if (n >= 8)
        return 1;
    return 2;
}
/**
 * Normal pool reductions protect a floor of two rolled dice when the original
 * pool had at least two. Keep is unchanged (Fear stays Resolve k1).
 */
export function applyPoolReductionFloor(opts) {
    const original = Math.max(0, Math.floor(Number(opts.originalDice) || 0));
    const reduced = Math.max(0, Math.floor(Number(opts.reducedDice) || 0));
    if (original >= 2)
        return Math.max(2, reduced);
    return Math.max(0, reduced);
}
export function diceAfterFear(attributeDice, fear) {
    const dice = Math.max(0, Math.floor(Number(attributeDice) || 0));
    const f = Math.max(0, Math.floor(Number(fear) || 0));
    return applyPoolReductionFloor({ originalDice: dice, reducedDice: dice - f });
}
/** All available Health Bars Scarred → Incapacitated (not automatic death). */
export function isIncapacitated(opts) {
    const available = Math.max(0, Math.floor(Number(opts.availableBars) || 0));
    const scarred = Math.max(0, Math.floor(Number(opts.scarredBars) || 0));
    return available > 0 && scarred >= available;
}
/** Emergency Medicine Base TN = patient MR × 4. */
export function emergencyMedicineBaseTn(patientMasteryRank) {
    return Math.max(1, Math.floor(Number(patientMasteryRank) || 1)) * 4;
}
/**
 * Safe Haven scar recovery: 1 base + Medicine aftercare.
 * Rank 4–7 → +1; Rank 8 → +2; one patient per healer.
 */
export function safeHavenScarBarsRecovered(medicineRank) {
    const rank = Math.floor(Number(medicineRank) || 0);
    let bonus = 0;
    if (rank >= 8)
        bonus = 2;
    else if (rank >= 4)
        bonus = 1;
    return 1 + bonus;
}
//# sourceMappingURL=fear-health.js.map