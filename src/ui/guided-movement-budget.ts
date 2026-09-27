/** Pure helpers for multi-leg guided movement budgets. */

export interface MovementBudget {
  remainingMeters: number;
  remainingSteps: number;
  maxMeters: number;
  maxSteps: number;
}

export function createMovementBudget(maxMeters: number, maxSteps: number): MovementBudget {
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
export function spendMovementSteps(budget: MovementBudget, stepsUsed: number): MovementBudget {
  const used = Math.max(0, Math.floor(Number(stepsUsed) || 0));
  const remainingSteps = Math.max(0, budget.remainingSteps - used);
  const metersPerStep =
    budget.maxSteps > 0 ? budget.maxMeters / budget.maxSteps : budget.maxMeters;
  const remainingMeters = Math.max(0, remainingSteps * metersPerStep);
  return { ...budget, remainingSteps, remainingMeters };
}

/** Spend a gridless/scene-distance leg in meters. */
export function spendMovementMeters(budget: MovementBudget, metersUsed: number): MovementBudget {
  const used = Math.max(0, Number(metersUsed) || 0);
  const remainingMeters = Math.max(0, budget.remainingMeters - used);
  const remainingSteps =
    budget.maxMeters > 0
      ? Math.max(0, Math.floor((remainingMeters / budget.maxMeters) * budget.maxSteps))
      : 0;
  return { ...budget, remainingMeters, remainingSteps };
}

export function movementBudgetExhausted(budget: MovementBudget): boolean {
  return budget.remainingSteps <= 0 || budget.remainingMeters <= 0.01;
}
