import { describe, expect, it } from 'vitest';
import { remainingActiveBuffActions } from '../src/combat/action-economy.js';

describe('Active Buff radial remaining (1 or 0 per round)', () => {
  it('shows 1 when unused and at least one Attack Action remains', () => {
    expect(remainingActiveBuffActions(false, 10)).toBe(1);
    expect(remainingActiveBuffActions(undefined, 1)).toBe(1);
  });

  it('shows 0 after the one Active Buff this round, even with leftover attacks', () => {
    expect(remainingActiveBuffActions(true, 10)).toBe(0);
  });

  it('shows 0 when Attack Actions are spent', () => {
    expect(remainingActiveBuffActions(false, 0)).toBe(0);
    expect(remainingActiveBuffActions(true, 0)).toBe(0);
  });
});
