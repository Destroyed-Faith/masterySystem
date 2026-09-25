import { describe, it, expect } from 'vitest';
import {
  applyRaiseCost,
  bindChosenSpecialIntoLevelData,
  buildAvailableRaiseOptions,
  buildPowerSnapshotFromLevelData,
  computeRaiseTns,
  computeTotalRaiseCost,
  countRaiseSlots,
  defaultSpellCostAllocation,
  formatDeclaredRaiseList,
  formatHitBreakdown,
  formatRaiseResultLine,
  loadPowerSnapshotForArtifactOption,
  paidRaiseSlots,
  previewAfterRaiseCost,
  declaredRaiseFromOptionId,
  dedupeDeclaredRaises,
  resolvePowerSnapshot,
  resolveRaiseOutcome,
  snapshotToDamageFormula,
  snapshotToSpecialStrings,
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

  it('waived raise cost keeps the full pool on a partial', () => {
    const snap = resolvePowerSnapshot({
      base,
      declaredRaises: raises,
      outcome: 'partial',
      masteryRank: 3,
      isSpell: false,
      waiveRaiseCost: true,
    });
    expect(snapshotToDamageFormula(snap)).toBe('8d8');
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

  it('a free Raise does not pay; the next one still does', () => {
    const base = examplePower();
    const raises: DeclaredRaise[] = [
      { effect: 'damage', slots: 1, free: true, label: '+MR Damage Dice' },
      { effect: 'specialPlus', targetSpecialKey: 'ignite', slots: 1, label: 'Ignite' },
    ];
    expect(countRaiseSlots(raises)).toBe(2);
    expect(paidRaiseSlots(raises)).toBe(1);
    expect(formatDeclaredRaiseList(raises)).toBe('1. +MR Damage Dice — kostenlos · 2. Ignite');
    expect(snapshotToDamageFormula(previewAfterRaiseCost(base, raises, 3, false))).toBe('5d8');
    const partial = resolvePowerSnapshot({
      base,
      declaredRaises: raises,
      outcome: 'partial',
      masteryRank: 3,
      isSpell: false,
    });
    expect(snapshotToDamageFormula(partial)).toBe('5d8');
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

  it('a Special Raise turns the printed rank on; it does not add MR on top', () => {
    const latent = buildAvailableRaiseOptions(
      {
        ...examplePower(),
        damageDice: 4,
        specials: [{ key: 'precision', rank: 2 }],
      },
      false,
    );
    const precision = latent.find((o) => o.id === 'special:precision');
    expect(precision?.label).toBe('Precision an (Rang 2)');
    expect(precision?.printedRank).toBe(2);
    const base = examplePower();
    base.damageDice = 4;
    base.specials = [];
    const declared = declaredRaiseFromOptionId('special:precision', latent);
    expect(declared?.printedRank).toBe(2);
    const snap = resolvePowerSnapshot({
      base,
      declaredRaises: declared ? [declared] : [],
      outcome: 'full',
      masteryRank: 2,
      isSpell: false,
    });
    expect(snap.specials).toEqual([{ key: 'precision', rank: 2 }]);
    expect(snap.damageDice).toBe(4);
  });

  it('a damage Raise and a Special Raise are each once per attack', () => {
    const raises: DeclaredRaise[] = [
      { effect: 'specialPlus', targetSpecialKey: 'penetration', slots: 1, label: 'Increase Penetration(3) by +MR' },
      { effect: 'specialPlus', targetSpecialKey: 'penetration', slots: 1, label: 'Increase Penetration(3) by +MR' },
      { effect: 'specialPlus', targetSpecialKey: 'precision', slots: 1 },
      { effect: 'damage', slots: 1 },
      { effect: 'damage', slots: 1 },
    ];
    expect(dedupeDeclaredRaises(raises).map((r) => r.targetSpecialKey ?? r.effect)).toEqual([
      'penetration',
      'precision',
      'damage',
    ]);
    const base = examplePower();
    base.specials = [
      { key: 'penetration', rank: 3 },
      { key: 'precision', rank: 4 },
    ];
    const snap = resolvePowerSnapshot({
      base,
      declaredRaises: raises,
      outcome: 'full',
      masteryRank: 2,
      isSpell: false,
    });
    expect(snap.specials.find((s) => s.key === 'penetration')?.rank).toBe(5);
    expect(snap.specials.find((s) => s.key === 'precision')?.rank).toBe(6);
    expect(snap.damageDice).toBe(8 + 2);
    expect(paidRaiseSlots(dedupeDeclaredRaises(raises))).toBe(3);
  });

  it('writes the hit as weapon plus power plus raise', () => {
    expect(formatHitBreakdown(5, 4, { raiseDice: 2 })).toBe('11d8 (5d8 Waffe + 4d8 Power + 2d8 Raise)');
    expect(formatHitBreakdown(5, 4)).toBe('9d8 (5d8 Waffe + 4d8 Power)');
  });

  it('does not offer a +4 m range Raise', () => {
    const options = buildAvailableRaiseOptions(
      { ...examplePower(), hasRange: true, rangeM: 12 },
      false,
    );
    expect(options.map((o) => o.id)).not.toContain('range');
    expect(options.map((o) => o.effect)).not.toContain('rangePlus');
  });

  it('a damage Raise does not invent the weapon specials', () => {
    const base = examplePower();
    base.specials = [
      { key: 'penetration', rank: 4 },
      { key: 'precision', rank: 4 },
    ];
    const declared: DeclaredRaise[] = [{ effect: 'damage', slots: 1, label: '+MR Schaden' }];
    const resolved = resolvePowerSnapshot({
      base,
      declaredRaises: declared,
      outcome: 'full',
      masteryRank: 2,
      isSpell: false,
    });
    const line = formatRaiseResultLine({
      outcome: 'full',
      base,
      resolved,
      declared,
      weaponDice: 4,
    });
    expect(line).toContain('Raise gelungen');
    expect(line).toContain('4d8 Waffe + 8d8 Power');
    expect(line).toContain('4d8 Waffe + 10d8 Power');
    expect(line).toContain('schon vorher drauf, kein Raise: Penetration(4), Precision(4)');
    expect(line).not.toContain('Penetration 4 →');
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

describe('SPECIAL picker placeholder binding', () => {
  const martialLevelRow = {
    effect: { dice: '2d8' },
    specials: [{ key: 'SPECIAL', rank: 4, note: 'bound at item-create via chosenSpecial' }],
  };

  it('bindChosenSpecialIntoLevelData replaces SPECIAL with the chosen key', () => {
    const bound = bindChosenSpecialIntoLevelData(martialLevelRow, 'sundered');
    expect(bound.specials).toEqual([
      { key: 'sundered', rank: 4, note: 'bound at item-create via chosenSpecial' },
    ]);
    // Original row stays untouched (copy-on-write).
    expect(martialLevelRow.specials[0].key).toBe('SPECIAL');
  });

  it('bound level data yields the real Special string for the damage pipeline', () => {
    const bound = bindChosenSpecialIntoLevelData(martialLevelRow, 'sundered');
    const snap = buildPowerSnapshotFromLevelData(bound, '0', []);
    expect(snapshotToSpecialStrings(snap)).toEqual(['Sundered(4)']);
  });

  it('passes through when there is nothing to bind', () => {
    expect(bindChosenSpecialIntoLevelData(null, 'sundered')).toBeNull();
    expect(bindChosenSpecialIntoLevelData(martialLevelRow, null)).toBe(martialLevelRow);
    const noPlaceholder = { specials: [{ key: 'ruin', rank: 2 }] };
    expect(bindChosenSpecialIntoLevelData(noPlaceholder, 'sundered')).toBe(noPlaceholder);
  });

  it('an unbound SPECIAL placeholder never reaches the snapshot as "Special(X)"', () => {
    const snap = buildPowerSnapshotFromLevelData(martialLevelRow, '0', []);
    expect(snap.specials).toHaveLength(0);
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

describe('artifact catalog snapshot', () => {
  it('Frost Throw I puts Slow on the hit without a Raise', async () => {
    const loaded = await loadPowerSnapshotForArtifactOption({
      artifactPowerTemplateId: 'active-ranged-damage-t4',
      artifactChosenSpecialKey: 'slow',
      artifactRowLevel: 2,
      artifactIsSpell: false,
    } as any);
    expect(loaded?.isSpell).toBe(false);
    expect(loaded?.snapshot.specials).toEqual([{ key: 'slow', rank: 6 }]);
    expect(snapshotToSpecialStrings(loaded!.snapshot)).toEqual(['Slow(6)']);
    expect(snapshotToDamageFormula(loaded!.snapshot)).toBe('1d8');
    const resolved = resolvePowerSnapshot({
      base: loaded!.snapshot,
      declaredRaises: [],
      outcome: 'full',
      masteryRank: 2,
      isSpell: false,
    });
    expect(snapshotToSpecialStrings(resolved)).toEqual(['Slow(6)']);
  });
});
