import { describe, it, expect } from 'vitest';
import {
  bindChosenSpecialIntoLevelData,
  buildAvailableRaiseOptions,
  buildPowerSnapshotFromLevelData,
  computeFinalTn,
  computeRaiseTns,
  countRaiseSlots,
  damageRaiseDicePerRaise,
  declaredRaiseFromOptionId,
  dedupeDeclaredRaises,
  formatDeclaredRaiseList,
  formatHitBreakdown,
  formatRaiseResultLine,
  loadPowerSnapshotForArtifactOption,
  normalizeRaiseOutcome,
  paidRaiseSlots,
  previewAfterRaiseCost,
  resolvePowerSnapshot,
  resolveRaiseOutcome,
  snapshotToDamageFormula,
  snapshotToSpecialStrings,
  sumCombatDamagePoolDice,
  successfulRaiseSlotCount,
  isRaiseAllocationComplete,
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

describe('one Final TN', () => {
  it('Final TN = Base + Paid Raises × 4', () => {
    expect(computeFinalTn(14, 2)).toBe(22);
    expect(computeRaiseTns(14, 2)).toEqual({ normalTn: 14, raiseTn: 22, finalTn: 22 });
    expect(computeRaiseTns(24, 0)).toEqual({ normalTn: 24, raiseTn: 24, finalTn: 24 });
  });

  it('1. miss Final TN is a miss even when Base TN is met', () => {
    expect(resolveRaiseOutcome(21, 14, 2)).toBe('fail');
    expect(resolveRaiseOutcome(14, 14, 2)).toBe('fail');
    expect(resolveRaiseOutcome(21, 14, 2)).not.toBe('full');
  });

  it('2. meeting Final TN is a hit with all Raises', () => {
    expect(resolveRaiseOutcome(22, 14, 2)).toBe('full');
    expect(resolveRaiseOutcome(28, 22, 1)).toBe('full');
  });

  it('14. never produces a partial / Raises Failed outcome', () => {
    expect(resolveRaiseOutcome(24, 24, 1)).toBe('fail');
    expect(resolveRaiseOutcome(27, 24, 1)).toBe('fail');
    expect(normalizeRaiseOutcome('partial')).toBe('fail');
    expect(normalizeRaiseOutcome('full')).toBe('full');
  });

  it('12. a high roll does not invent undeclared Raises', () => {
    const snap = resolvePowerSnapshot({
      base: examplePower(),
      declaredRaises: [{ effect: 'damage', slots: 1 }],
      outcome: 'full',
      masteryRank: 2,
      isSpell: false,
    });
    // Only one declared Damage Raise → +2d8 at MR2, not margin Raises.
    expect(snap.damageDice - 8).toBe(2);
  });
});

describe('Damage and Special Raise math', () => {
  it('3. MR 2, two Damage Raises → +4d8', () => {
    expect(damageRaiseDicePerRaise(2, false)).toBe(2);
    const base = examplePower();
    base.damageDice = 3;
    const twoDamage: DeclaredRaise[] = [
      { effect: 'damage', slots: 1 },
      { effect: 'damage', slots: 1 },
    ];
    expect(dedupeDeclaredRaises(twoDamage)).toHaveLength(2);
    const snap = resolvePowerSnapshot({
      base,
      declaredRaises: twoDamage,
      outcome: 'full',
      masteryRank: 2,
      isSpell: false,
    });
    expect(snap.damageDice - base.damageDice).toBe(4);
  });

  it('4. complete Damage Pool: 5+3+2+4 = 14d8', () => {
    expect(
      sumCombatDamagePoolDice({
        weaponDice: 5,
        powerDice: 3,
        passiveDice: 2,
        raiseDice: 4,
      }),
    ).toBe(14);
    expect(formatHitBreakdown(5, 3, { raiseDice: 4 })).toBe(
      '12d8 (5d8 Waffe + 3d8 Power + 4d8 Raise)',
    );
  });

  it('5. MR 3, two Special Raises → +6 to existing Special', () => {
    const raises: DeclaredRaise[] = [
      { effect: 'specialPlus', targetSpecialKey: 'ignite', slots: 1 },
      { effect: 'specialPlus', targetSpecialKey: 'ignite', slots: 1 },
    ];
    const snap = resolvePowerSnapshot({
      base: examplePower(),
      declaredRaises: raises,
      outcome: 'full',
      masteryRank: 3,
      isSpell: false,
    });
    expect(snap.specials[0].rank).toBe(9); // 3 + 3 + 3
  });

  it('6. mixed allocation: +2d8 Damage and +2 Special at MR 2', () => {
    const raises: DeclaredRaise[] = [
      { effect: 'damage', slots: 1 },
      { effect: 'specialPlus', targetSpecialKey: 'ignite', slots: 1 },
    ];
    const snap = resolvePowerSnapshot({
      base: examplePower(),
      declaredRaises: raises,
      outcome: 'full',
      masteryRank: 2,
      isSpell: false,
    });
    expect(snap.damageDice).toBe(10);
    expect(snap.specials[0].rank).toBe(5);
  });

  it('9. AoE Damage Raise uses ceil(MR/2)', () => {
    expect(damageRaiseDicePerRaise(3, true)).toBe(2);
    expect(damageRaiseDicePerRaise(4, true)).toBe(2);
    const aoe: PowerSnapshot = { ...examplePower(), hasAoe: true, damageDice: 4 };
    const snap = resolvePowerSnapshot({
      base: aoe,
      declaredRaises: [
        { effect: 'damage', slots: 1 },
        { effect: 'damage', slots: 1 },
      ],
      outcome: 'full',
      masteryRank: 3,
      isSpell: false,
    });
    expect(snap.damageDice - 4).toBe(4);
  });
});

describe('Free Raises', () => {
  it('7. Paid + Free: TN rises only from Paid; all effects on success', () => {
    const raises: DeclaredRaise[] = [
      { effect: 'damage', slots: 1 },
      { effect: 'damage', slots: 1 },
      { effect: 'damage', slots: 1, free: true },
      { effect: 'damage', slots: 1, free: true },
    ];
    expect(paidRaiseSlots(raises)).toBe(2);
    expect(countRaiseSlots(raises)).toBe(4);
    expect(computeFinalTn(14, paidRaiseSlots(raises))).toBe(22);
    expect(resolveRaiseOutcome(22, 14, paidRaiseSlots(raises))).toBe('full');
    const snap = resolvePowerSnapshot({
      base: { ...examplePower(), damageDice: 3 },
      declaredRaises: raises,
      outcome: 'full',
      masteryRank: 2,
      isSpell: false,
    });
    expect(snap.damageDice - 3).toBe(8); // 4 × +2d8
  });

  it('8. miss Final TN applies no Raise effects (Free Raises consumed by caller)', () => {
    const raises: DeclaredRaise[] = [
      { effect: 'damage', slots: 1 },
      { effect: 'damage', slots: 1 },
      { effect: 'damage', slots: 1, free: true },
      { effect: 'damage', slots: 1, free: true },
    ];
    // Final TN 22 from 2 Paid; roll 21 misses. Free Raises still grant nothing.
    expect(paidRaiseSlots(raises)).toBe(2);
    expect(resolveRaiseOutcome(21, 14, paidRaiseSlots(raises))).toBe('fail');
    const snap = resolvePowerSnapshot({
      base: examplePower(),
      declaredRaises: raises,
      outcome: 'fail',
      masteryRank: 2,
      isSpell: false,
    });
    expect(snap.damageDice).toBe(8);
    expect(snap.specials[0].rank).toBe(3);
  });
});

describe('no Raise Cost / no partial payload', () => {
  it('Combat Raises do not strip the pre-roll pool', () => {
    const base = examplePower();
    const raises: DeclaredRaise[] = [{ effect: 'damage', slots: 1 }];
    expect(snapshotToDamageFormula(previewAfterRaiseCost(base, raises, 3, false))).toBe('8d8');
  });

  it('legacy partial outcome resolves as fail (no payload change)', () => {
    const snap = resolvePowerSnapshot({
      base: examplePower(),
      declaredRaises: [{ effect: 'damage', slots: 1 }],
      outcome: 'partial',
      masteryRank: 3,
      isSpell: false,
    });
    expect(snap.damageDice).toBe(8);
  });

  it('formatRaiseResultLine never says Raises Failed / Raise verfehlt', () => {
    const base = examplePower();
    const declared: DeclaredRaise[] = [{ effect: 'damage', slots: 1, label: '+MR Damage' }];
    const line = formatRaiseResultLine({
      outcome: 'fail',
      base,
      resolved: base,
      declared,
    });
    expect(line.toLowerCase()).not.toContain('verfehlt');
    expect(line.toLowerCase()).not.toContain('raises failed');
    expect(line).toContain('Miss against Final TN');
  });
});

describe('raise menu eligibility', () => {
  it('13. only Damage and existing numeric Specials; Damage needs a Damage Roll', () => {
    const withDamage = buildAvailableRaiseOptions(examplePower(), false);
    expect(withDamage.map((o) => o.effect)).toContain('damage');
    expect(withDamage.map((o) => o.effect)).toContain('specialPlus');
    expect(withDamage.map((o) => o.effect)).not.toContain('rangePlus');

    const noDamage = buildAvailableRaiseOptions(
      { ...examplePower(), damageDice: 0, specials: [{ key: 'slow', rank: 2 }] },
      false,
    );
    expect(noDamage.map((o) => o.effect)).not.toContain('damage');
    expect(noDamage.map((o) => o.id)).toContain('special:slow');

    const weaponOnly = buildAvailableRaiseOptions(
      { ...examplePower(), damageDice: 0, specials: [] },
      false,
      { hasWeaponDamage: true },
    );
    expect(weaponOnly.map((o) => o.effect)).toContain('damage');
  });

  it('Special Raise cannot invent a missing Special', () => {
    const declared = declaredRaiseFromOptionId(
      'special:precision',
      buildAvailableRaiseOptions(
        { ...examplePower(), specials: [{ key: 'precision', rank: 2 }] },
        false,
      ),
    );
    const none = resolvePowerSnapshot({
      base: { ...examplePower(), specials: [] },
      declaredRaises: declared ? [declared] : [],
      outcome: 'full',
      masteryRank: 2,
      isSpell: false,
    });
    expect(none.specials).toEqual([]);
  });
});

describe('stacking Special Raises', () => {
  it('multiple Raises may target the same Special', () => {
    const raises: DeclaredRaise[] = [
      { effect: 'specialPlus', targetSpecialKey: 'penetration', slots: 1 },
      { effect: 'specialPlus', targetSpecialKey: 'penetration', slots: 1 },
      { effect: 'damage', slots: 1 },
      { effect: 'damage', slots: 1 },
    ];
    expect(dedupeDeclaredRaises(raises)).toHaveLength(4);
    const base = examplePower();
    base.specials = [{ key: 'penetration', rank: 3 }];
    const snap = resolvePowerSnapshot({
      base,
      declaredRaises: raises,
      outcome: 'full',
      masteryRank: 2,
      isSpell: false,
    });
    expect(snap.specials.find((s) => s.key === 'penetration')?.rank).toBe(7);
    expect(snap.damageDice).toBe(8 + 4);
  });
});

describe('labels and free-raise list', () => {
  it('lists Free Raises without implying Raise Cost', () => {
    const raises: DeclaredRaise[] = [
      { effect: 'damage', slots: 1, free: true, label: '+MR Damage Dice' },
      { effect: 'specialPlus', targetSpecialKey: 'ignite', slots: 1, label: 'Ignite' },
    ];
    expect(formatDeclaredRaiseList(raises)).toContain('Free');
    expect(paidRaiseSlots(raises)).toBe(1);
  });

  it('writes the hit as weapon plus power plus raise', () => {
    expect(formatHitBreakdown(5, 4, { raiseDice: 2 })).toBe('11d8 (5d8 Waffe + 4d8 Power + 2d8 Raise)');
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
    expect(martialLevelRow.specials[0].key).toBe('SPECIAL');
  });

  it('bound level data yields the real Special string for the damage pipeline', () => {
    const bound = bindChosenSpecialIntoLevelData(martialLevelRow, 'sundered');
    const snap = buildPowerSnapshotFromLevelData(bound, '0', []);
    expect(snapshotToSpecialStrings(snap)).toEqual(['Sundered(4)']);
  });

  it('an unbound SPECIAL placeholder never reaches the snapshot as "Special(X)"', () => {
    const snap = buildPowerSnapshotFromLevelData(martialLevelRow, '0', []);
    expect(snap.specials).toHaveLength(0);
  });
});

describe('no automatic Damage allocation', () => {
  it('does not invent Damage Raises from stoneBonusRaises', () => {
    const snap = resolvePowerSnapshot({
      base: examplePower(),
      declaredRaises: [],
      outcome: 'full',
      masteryRank: 3,
      isSpell: false,
      stoneBonusRaises: 4,
    });
    expect(snapshotToDamageFormula(snap)).toBe('8d8');
  });

  it('Special-only Powers do not offer Damage Raises', () => {
    const opts = buildAvailableRaiseOptions(
      { ...examplePower(), damageDice: 0, specials: [{ key: 'slow', rank: 2 }] },
      false,
    );
    expect(opts.map((o) => o.effect)).toEqual(['specialPlus']);
  });
});

describe('post-roll allocation helpers', () => {
  it('counts Paid + Free as successful slots; Free do not raise TN', () => {
    expect(successfulRaiseSlotCount(2, 2)).toBe(4);
    expect(computeFinalTn(14, 2)).toBe(22);
    const opts = buildAvailableRaiseOptions(examplePower(), false);
    const plan: DeclaredRaise[] = [
      { effect: 'damage', slots: 1 },
      { effect: 'specialPlus', targetSpecialKey: 'ignite', slots: 1 },
    ];
    expect(isRaiseAllocationComplete(plan, 2, opts)).toBe(true);
    expect(isRaiseAllocationComplete([{ effect: 'damage', slots: 1 }], 2, opts)).toBe(false);
    expect(isRaiseAllocationComplete([], 2, [])).toBe(true);
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
    expect(loaded?.snapshot.specials).toEqual([{ key: 'slow', rank: 6 }]);
  });

  it('Rending Spiral I is weapon damage plus Lacerate(5)', async () => {
    for (const templateId of ['active-melee-aoe-damage-t4', 'active-melee-weapon-aoe']) {
      const loaded = await loadPowerSnapshotForArtifactOption({
        artifactPowerTemplateId: templateId,
        artifactChosenSpecialKey: 'lacerate',
        artifactRowLevel: 2,
        artifactIsSpell: false,
      } as any);
      expect(loaded?.snapshot.specials).toEqual([{ key: 'lacerate', rank: 5 }]);
    }
  });

  it('Tail Sweep injects Push into empty weapon-AoE specials', async () => {
    const stageI = await loadPowerSnapshotForArtifactOption({
      artifactPowerTemplateId: 'active-melee-weapon-aoe',
      artifactChosenSpecialKey: 'push',
      artifactRowLevel: 3,
      artifactIsSpell: false,
    } as any);
    expect(stageI?.snapshot.specials).toEqual([{ key: 'push', rank: 2 }]);
  });
});
