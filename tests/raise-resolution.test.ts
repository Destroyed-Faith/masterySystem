import { describe, it, expect } from 'vitest';
import {
  applyRaiseCost,
  buildPowerSnapshotFromLevelData,
  computeRaiseTns,
  computeTotalRaiseCost,
  countRaiseSlots,
  defaultSpellCostAllocation,
  previewAfterRaiseCost,
  resolvePowerSnapshot,
  resolveRaiseOutcome,
  snapshotToDamageFormula,
  type DeclaredRaise,
  type PowerSnapshot,
} from '../src/combat/raise-resolution';

function examplePower(): PowerSnapshot {
  return {
    damageDice: 8,
    specials: [{ key: 'ignite', rank: 3 }],
    rangeM: null,
    aoeRadiusM: null,
    durationSteps: 0,
    hasRange: false,
    hasAoe: false,
    hasDuration: false,
  };
}

describe('computeRaiseTns', () => {
  it('keeps normal TN and adds +4 per declared raise slot', () => {
    expect(computeRaiseTns(24, 1)).toEqual({ normalTn: 24, raiseTn: 28 });
    expect(computeRaiseTns(24, 2)).toEqual({ normalTn: 24, raiseTn: 32 });
  });

  it('returns same TN when no raises declared', () => {
    expect(computeRaiseTns(24, 0)).toEqual({ normalTn: 24, raiseTn: 24 });
  });
});

describe('resolveRaiseOutcome', () => {
  it('classifies fail / partial / full per rulebook example', () => {
    expect(resolveRaiseOutcome(23, 24, 1)).toBe('fail');
    expect(resolveRaiseOutcome(24, 24, 1)).toBe('partial');
    expect(resolveRaiseOutcome(27, 24, 1)).toBe('partial');
    expect(resolveRaiseOutcome(28, 24, 1)).toBe('full');
  });

  it('treats any success as full when no raises declared', () => {
    expect(resolveRaiseOutcome(24, 24, 0)).toBe('full');
    expect(resolveRaiseOutcome(20, 24, 0)).toBe('fail');
  });
  it('applies Raise-TN roll bonus only for full check (Intellect stone)', () => {
    expect(resolveRaiseOutcome(27, 24, 1, 4)).toBe('full');
    expect(resolveRaiseOutcome(27, 24, 1, 0)).toBe('partial');
  });
});

describe('raise cost — MR3 martial example (8d8 Ignite(3), 1 Raise)', () => {
  const base = examplePower();
  const raises: DeclaredRaise[] = [{ effect: 'damage', slots: 1 }];

  it('costs 3d8 for MR3', () => {
    expect(computeTotalRaiseCost(1, 3)).toBe(3);
  });

  it('partial success applies cost-deducted snapshot (5d8 Ignite(3))', () => {
    const snap = resolvePowerSnapshot({
      base,
      declaredRaises: raises,
      outcome: 'partial',
      masteryRank: 3,
      isSpell: false,
    });
    expect(snapshotToDamageFormula(snap)).toBe('5d8');
    expect(snap.specials[0].rank).toBe(3);
  });

  it('full success with damage raise restores cost and adds +MR d8 → 11d8', () => {
    const snap = resolvePowerSnapshot({
      base,
      declaredRaises: raises,
      outcome: 'full',
      masteryRank: 3,
      isSpell: false,
    });
    expect(snapshotToDamageFormula(snap)).toBe('11d8');
    expect(snap.specials[0].rank).toBe(3);
  });

  it('full success with special raise → 8d8 Ignite(6)', () => {
    const specialRaises: DeclaredRaise[] = [
      { effect: 'specialPlus', targetSpecialKey: 'ignite', slots: 1 },
    ];
    const snap = resolvePowerSnapshot({
      base,
      declaredRaises: specialRaises,
      outcome: 'full',
      masteryRank: 3,
      isSpell: false,
    });
    expect(snapshotToDamageFormula(snap)).toBe('8d8');
    expect(snap.specials[0].rank).toBe(6);
  });
});

describe('spell raise cost allocation', () => {
  it('pays damage dice before special value', () => {
    const base = examplePower();
    const alloc = defaultSpellCostAllocation(base, 3);
    expect(alloc.damageDice).toBe(3);
    expect(alloc.specialByKey.ignite ?? 0).toBe(0);
  });

  it('spills into special when damage insufficient', () => {
    const base: PowerSnapshot = {
      ...examplePower(),
      damageDice: 1,
      specials: [{ key: 'ignite', rank: 5 }],
    };
    const alloc = defaultSpellCostAllocation(base, 3);
    expect(alloc.damageDice).toBe(1);
    expect(alloc.specialByKey.ignite).toBe(2);
  });
});

describe('previewAfterRaiseCost', () => {
  it('matches rulebook pre-roll state', () => {
    const base = examplePower();
    const raises: DeclaredRaise[] = [{ effect: 'damage', slots: 1 }];
    const preview = previewAfterRaiseCost(base, raises, 3, false);
    expect(snapshotToDamageFormula(preview)).toBe('5d8');
  });
});

describe('buildPowerSnapshotFromLevelData', () => {
  it('reads effect.dice and structured specials', () => {
    const snap = buildPowerSnapshotFromLevelData(
      {
        effect: { dice: '8d8' },
        specials: [{ key: 'ignite', rank: 3 }],
        range: null,
        aoe: { shape: 'none' },
        duration: { kind: 'instant' },
      },
      '0',
      [],
    );
    expect(snap.damageDice).toBe(8);
    expect(snap.specials[0]).toEqual({ key: 'ignite', rank: 3 });
  });
});

describe('countRaiseSlots', () => {
  it('sums 1- and 2-slot raises', () => {
    const raises: DeclaredRaise[] = [
      { effect: 'damage', slots: 1 },
      { effect: 'aoeRadiusPlus', slots: 2 },
    ];
    expect(countRaiseSlots(raises)).toBe(3);
  });
});

describe('applyRaiseCost removes special at 0', () => {
  it('drops special when rank reaches 0', () => {
    const base: PowerSnapshot = {
      damageDice: 0,
      specials: [{ key: 'ignite', rank: 2 }],
      rangeM: null,
      aoeRadiusM: null,
      durationSteps: 0,
      hasRange: false,
      hasAoe: false,
      hasDuration: false,
    };
    const next = applyRaiseCost(base, { damageDice: 0, specialByKey: { ignite: 2 } });
    expect(next.specials).toHaveLength(0);
  });
});

describe('stone bonus raises on full success', () => {
  it('adds +MR martial damage per bonus raise', () => {
    const snap = resolvePowerSnapshot({
      base: examplePower(),
      declaredRaises: [],
      outcome: 'full',
      masteryRank: 3,
      isSpell: false,
      stoneBonusRaises: 1,
    });
    expect(snapshotToDamageFormula(snap)).toBe('11d8');
  });

  it('adds +1d8 spell damage per bonus raise', () => {
    const snap = resolvePowerSnapshot({
      base: examplePower(),
      declaredRaises: [],
      outcome: 'full',
      masteryRank: 3,
      isSpell: true,
      stoneBonusRaises: 2,
    });
    expect(snapshotToDamageFormula(snap)).toBe('10d8');
  });
});
