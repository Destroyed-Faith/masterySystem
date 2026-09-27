/** Pure helpers for multi-leg guided movement budgets. */
export function createMovementBudget(maxMeters, maxSteps) {
    const meters = Math.max(0, Number(maxMeters) || 0);
    const steps = Math.max(0, Math.floor(Number(maxSteps) || 0));
    return {
        maxMeters: meters,
        maxSteps: steps,
        remainingMeters: meters,
        remainingSteps: steps,
    };
}
/** Spend a hex/grid step leg. Returns the updated budget. */
export function spendMovementSteps(budget, stepsUsed) {
    const used = Math.max(0, Math.floor(Number(stepsUsed) || 0));
    const remainingSteps = Math.max(0, budget.remainingSteps - used);
    const metersPerStep = budget.maxSteps > 0 ? budget.maxMeters / budget.maxSteps : budget.maxMeters;
    const remainingMeters = Math.max(0, remainingSteps * metersPerStep);
    return { ...budget, remainingSteps, remainingMeters };
}
/** Spend a gridless/scene-distance leg in meters. */
export function spendMovementMeters(budget, metersUsed) {
    const used = Math.max(0, Number(metersUsed) || 0);
    const remainingMeters = Math.max(0, budget.remainingMeters - used);
    const remainingSteps = budget.maxMeters > 0
        ? Math.max(0, Math.floor((remainingMeters / budget.maxMeters) * budget.maxSteps))
        : 0;
    return { ...budget, remainingMeters, remainingSteps };
}
export function movementBudgetExhausted(budget) {
    return budget.remainingSteps <= 0 || budget.remainingMeters <= 0.01;
}
//# sourceMappingURL=guided-movement-budget.js.map