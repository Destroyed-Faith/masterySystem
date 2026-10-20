import { describe, it, expect } from 'vitest';
import {
  buildAvailableRaiseOptions,
  computeFinalTn,
  declaredRaiseFromOptionId,
  isRaiseAllocationComplete,
  resolvePowerSnapshot,
  resolveRaiseOutcome,
  successfulRaiseSlotCount,
  type DeclaredRaise,
  type PowerSnapshot,
} from '../src/combat/raise-resolution.js';

function power(): PowerSnapshot {
  return {
    damageDice: 3,
    specials: [
      { key: 'sundered', rank: 2 },
      { key: 'slow', rank: 1 },
    ],
    rangeM: null,
    aoeRadiusM: null,
    durationSteps: 0,
    hasRange: false,
    hasAoe: false,
    hasDuration: false,
  };
}

describe('Combat Raise declare → allocate', () => {
  it('declares Paid/Free counts before rolling (TN from Paid only)', () => {
    const paid = 2;
    const free = 2;
    expect(computeFinalTn(14, paid)).toBe(22);
    expect(successfulRaiseSlotCount(paid, free)).toBe(4);
    expect(resolveRaiseOutcome(21, 14, paid)).toBe('fail');
    expect(resolveRaiseOutcome(22, 14, paid)).toBe('full');
  });

  it('allocation is only meaningful after a successful Final TN', () => {
    const opts = buildAvailableRaiseOptions(power(), false);
    const plan: DeclaredRaise[] = [
      { effect: 'damage', slots: 1 },
      { effect: 'damage', slots: 1 },
      { effect: 'specialPlus', targetSpecialKey: 'sundered', slots: 1 },
      { effect: 'specialPlus', targetSpecialKey: 'slow', slots: 1 },
    ];
    expect(isRaiseAllocationComplete(plan, 4, opts)).toBe(true);
    const miss = resolvePowerSnapshot({
      base: power(),
      declaredRaises: plan,
      outcome: 'fail',
      masteryRank: 2,
      isSpell: false,
    });
    expect(miss.damageDice).toBe(3);
    expect(miss.specials.find((s) => s.key === 'sundered')?.rank).toBe(2);
  });

  it('players may split Raises between Damage and Specials; Specials stack', () => {
    const opts = buildAvailableRaiseOptions(power(), false);
    const plan: DeclaredRaise[] = [
      declaredRaiseFromOptionId('damage', opts)!,
      declaredRaiseFromOptionId('special:sundered', opts)!,
      declaredRaiseFromOptionId('special:sundered', opts)!,
    ];
    expect(isRaiseAllocationComplete(plan, 3, opts)).toBe(true);
    const snap = resolvePowerSnapshot({
      base: power(),
      declaredRaises: plan,
      outcome: 'full',
      masteryRank: 2,
      isSpell: false,
    });
    expect(snap.damageDice).toBe(5); // 3 + 2
    expect(snap.specials.find((s) => s.key === 'sundered')?.rank).toBe(6); // 2 + 2 + 2
  });

  it('never auto-allocates unassigned Raises to Damage', () => {
    const snap = resolvePowerSnapshot({
      base: power(),
      declaredRaises: [],
      outcome: 'full',
      masteryRank: 2,
      isSpell: false,
      stoneBonusRaises: 3,
    });
    expect(snap.damageDice).toBe(3);
  });

  it('Special-only Power: no Damage option, no silent Damage Raise', () => {
    const specialOnly: PowerSnapshot = {
      ...power(),
      damageDice: 0,
      specials: [{ key: 'hex', rank: 3 }],
    };
    const opts = buildAvailableRaiseOptions(specialOnly, false);
    expect(opts.every((o) => o.effect === 'specialPlus')).toBe(true);
    const plan: DeclaredRaise[] = [
      { effect: 'specialPlus', targetSpecialKey: 'hex', slots: 1 },
      { effect: 'specialPlus', targetSpecialKey: 'hex', slots: 1 },
    ];
    expect(isRaiseAllocationComplete(plan, 2, opts)).toBe(true);
    const snap = resolvePowerSnapshot({
      base: specialOnly,
      declaredRaises: plan,
      outcome: 'full',
      masteryRank: 3,
      isSpell: false,
    });
    expect(snap.damageDice).toBe(0);
    expect(snap.specials[0].rank).toBe(9);
  });

  it('incomplete allocation blocks rolling damage', () => {
    const opts = buildAvailableRaiseOptions(power(), false);
    expect(isRaiseAllocationComplete([], 3, opts)).toBe(false);
    expect(
      isRaiseAllocationComplete([{ effect: 'damage', slots: 1 }], 3, opts),
    ).toBe(false);
  });

  it('shared AoE/Split/Autofire plan applies only on Final TN hits', () => {
    const plan: DeclaredRaise[] = [
      { effect: 'damage', slots: 1 },
      { effect: 'specialPlus', targetSpecialKey: 'slow', slots: 1 },
    ];
    const base = power();
    const hit = resolvePowerSnapshot({
      base,
      declaredRaises: plan,
      outcome: 'full',
      masteryRank: 2,
      isSpell: false,
    });
    const miss = resolvePowerSnapshot({
      base,
      declaredRaises: plan,
      outcome: 'fail',
      masteryRank: 2,
      isSpell: false,
    });
    expect(hit.damageDice).toBe(5);
    expect(hit.specials.find((s) => s.key === 'slow')?.rank).toBe(3);
    expect(miss.damageDice).toBe(3);
    expect(miss.specials.find((s) => s.key === 'slow')?.rank).toBe(1);
  });
});
