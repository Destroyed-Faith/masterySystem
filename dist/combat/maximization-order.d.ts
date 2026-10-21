/**
 * Damage Negation → Maximization sequencing (Players Guide).
 *
 * Order for every eligible Damage Roll (Single Target, Instant AoE, Autofire):
 *   1. Build the complete eligible Damage Pool
 *   2. Resolve defender Damage Negation (remove designated dice)
 *   3. Offer Maximization on the *remaining* dice only
 *   4. If chosen and remainingDice > 0, spend exactly one charge
 *   5. Roll / resolve the remaining pool
 *
 * Maximization must never be spent before Negation, and never for a zero-dice pool.
 */
/** True when a Maximization charge may be spent after Negation for this roll. */
export declare function shouldSpendMaximizationAfterNegation(opts: {
    wantMaximization: boolean;
    remainingDice: number;
}): boolean;
/**
 * Pure: maximize a remaining d8 pool after Negation removed `removed` dice from `original`.
 * Returns the maximized flat total string when Maximization applies; otherwise the remaining formula.
 */
export declare function maximizedRemainingPool(opts: {
    originalDice: number;
    diceRemovedByNegation: number;
    maximize: boolean;
    maximizeFormula: (formula: string) => string;
}): {
    remainingDice: number;
    formula: string;
    spentMaximization: boolean;
};
//# sourceMappingURL=maximization-order.d.ts.map