import { describe, expect, it } from 'vitest';
import { remainingActiveBuffActions } from '../src/combat/action-economy.js';

describe('Active Buff radial remaining (Z01 — no per-Prep lock)', () => {
  it('always shows 1 (Prep gate lives in activateActiveBuff)', () => {
    expect(remainingActiveBuffActions(false, 10)).toBe(1);
    expect(remainingActiveBuffActions(undefined, 1)).toBe(1);
    expect(remainingActiveBuffActions(false, 0)).toBe(1);
    expect(remainingActiveBuffActions(false)).toBe(1);
    expect(remainingActiveBuffActions(true, 10)).toBe(1);
    expect(remainingActiveBuffActions(true, 0)).toBe(1);
  });
});
