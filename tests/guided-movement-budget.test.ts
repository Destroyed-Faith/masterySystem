import { describe, expect, it } from 'vitest';

import {
  createMovementBudget,
  movementBudgetExhausted,
  reconcileGuidedSpendAfterHalt,
  spendMovementMeters,
  spendMovementSteps,
} from '../src/ui/guided-movement-budget.js';

describe('guided movement budget', () => {
  it('spends hex steps and reports leftover meters', () => {
    const budget = createMovementBudget(12, 12);
    const after = spendMovementSteps(budget, 4);
    expect(after.remainingSteps).toBe(8);
    expect(after.remainingMeters).toBeCloseTo(8);
    expect(movementBudgetExhausted(after)).toBe(false);
  });

  it('exhausts when the last meters are spent', () => {
    const budget = createMovementBudget(6, 6);
    const after = spendMovementMeters(budget, 6);
    expect(movementBudgetExhausted(after)).toBe(true);
    expect(after.remainingMeters).toBe(0);
  });

  it('reconciles a region halt so leftover meters stay available', () => {
    const budget = createMovementBudget(12, 6);
    const halt = reconcileGuidedSpendAfterHalt({
      intendedSteps: 4,
      intendedMeters: 0,
      actualSteps: 1,
      actualMeters: 0,
      gridless: false,
    });
    const after = spendMovementSteps(budget, halt.stepsUsed);
    expect(halt.haltedShort).toBe(true);
    expect(after.remainingSteps).toBe(5);
    expect(after.remainingMeters).toBeCloseTo(10);
  });
});
