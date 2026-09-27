/** Pure helpers for multi-leg guided movement budgets. */
export interface MovementBudget {
    remainingMeters: number;
    remainingSteps: number;
    maxMeters: number;
    maxSteps: number;
}
export declare function createMovementBudget(maxMeters: number, maxSteps: number): MovementBudget;
/** Spend a hex/grid step leg. Returns the updated budget. */
export declare function spendMovementSteps(budget: MovementBudget, stepsUsed: number): MovementBudget;
/** Spend a gridless/scene-distance leg in meters. */
export declare function spendMovementMeters(budget: MovementBudget, metersUsed: number): MovementBudget;
export declare function movementBudgetExhausted(budget: MovementBudget): boolean;
//# sourceMappingURL=guided-movement-budget.d.ts.map