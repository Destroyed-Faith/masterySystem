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
export function shouldSpendMaximizationAfterNegation(opts) {
    return opts.wantMaximization === true && Math.floor(Number(opts.remainingDice) || 0) > 0;
}
/**
 * Pure: maximize a remaining d8 pool after Negation removed `removed` dice from `original`.
 * Returns the maximized flat total string when Maximization applies; otherwise the remaining formula.
 */
export function maximizedRemainingPool(opts) {
    const original = Math.max(0, Math.floor(Number(opts.originalDice) || 0));
    const removed = Math.max(0, Math.min(original, Math.floor(Number(opts.diceRemovedByNegation) || 0)));
    const remaining = original - removed;
    if (!shouldSpendMaximizationAfterNegation({ wantMaximization: opts.maximize, remainingDice: remaining })) {
        return {
            remainingDice: remaining,
            formula: remaining > 0 ? `${remaining}d8` : '0',
            spentMaximization: false,
        };
    }
    return {
        remainingDice: remaining,
        formula: opts.maximizeFormula(`${remaining}d8`),
        spentMaximization: true,
    };
}
//# sourceMappingURL=maximization-order.js.map