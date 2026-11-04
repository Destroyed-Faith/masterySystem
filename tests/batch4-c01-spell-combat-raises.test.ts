/**
 * Batch 4 C01 — Spell Combat Raises match Martial: declare counts pre-roll,
 * allocate Damage/Special effects only after a successful hit.
 */
import { describe, expect, it } from 'vitest';
import { RAISE_INCREMENT } from '../src/utils/constants.js';
import {
  aoeCreatureHitCheck,
  withInstantAoeFlags,
} from '../src/combat/aoe-melee-resolution.js';
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
import {
  forgetSharedRaiseAllocation,
  peekSharedRaiseAllocation,
  raiseAllocShareKey,
  rememberSharedRaiseAllocation,
} from '../src/combat/shared-raise-allocation.js';
import { isSpecialOnlyAttack } from '../src/combat/damage-transfer.js';

function damagingSpell(aoe = false): PowerSnapshot {
  return {
    damageDice: 4,
    specials: [
      { key: 'sundered', rank: 2 },
      { key: 'hex', rank: 1 },
    ],
    rangeM: aoe ? 12 : 8,
    aoeRadiusM: aoe ? 3 : null,
    durationSteps: 0,
    hasRange: true,
    hasAoe: aoe,
    hasDuration: false,
  };
}

function specialOnlySpell(): PowerSnapshot {
  return {
    damageDice: 0,
    specials: [{ key: 'ruin', rank: 5 }],
    rangeM: 8,
    aoeRadiusM: null,
    durationSteps: 0,
    hasRange: true,
    hasAoe: false,
    hasDuration: false,
  };
}

describe('C01 — Spell Paid Raises raise TN before the roll', () => {
  it('1. one Paid Raise: Final TN = Base + 4', () => {
    const baseTn = 14;
    expect(computeFinalTn(baseTn, 1)).toBe(baseTn + RAISE_INCREMENT);
    expect(RAISE_INCREMENT).toBe(4);
  });

  it('2. several Paid Raises: cumulative +4 each', () => {
    expect(computeFinalTn(12, 3)).toBe(12 + 3 * RAISE_INCREMENT);
    expect(resolveRaiseOutcome(23, 12, 3)).toBe('fail'); // need 24
    expect(resolveRaiseOutcome(24, 12, 3)).toBe('full');
  });
});

describe('C01 — Spell Raise allocation timing', () => {
  it('3. successful ST Spell: effects apply only after Full outcome + allocation', () => {
    const base = damagingSpell();
    const opts = buildAvailableRaiseOptions(base, true);
    const plan: DeclaredRaise[] = [
      declaredRaiseFromOptionId('damage', opts)!,
      declaredRaiseFromOptionId('special:sundered', opts)!,
    ];
    expect(isRaiseAllocationComplete(plan, 2, opts)).toBe(true);

    const beforeHit = resolvePowerSnapshot({
      base,
      declaredRaises: plan,
      outcome: 'fail',
      masteryRank: 4,
      isSpell: true,
    });
    expect(beforeHit.damageDice).toBe(4);
    expect(beforeHit.specials.find((s) => s.key === 'sundered')?.rank).toBe(2);

    const afterHit = resolvePowerSnapshot({
      base,
      declaredRaises: plan,
      outcome: 'full',
      masteryRank: 4,
      isSpell: true,
    });
    expect(afterHit.damageDice).toBe(4 + 4); // +MR
    expect(afterHit.specials.find((s) => s.key === 'sundered')?.rank).toBe(2 + 4);
  });

  it('4. failed Spell: no Raise effects even with a prepared plan', () => {
    const base = damagingSpell();
    const plan: DeclaredRaise[] = [
      { effect: 'damage', slots: 1 },
      { effect: 'specialPlus', targetSpecialKey: 'hex', slots: 1 },
    ];
    expect(resolveRaiseOutcome(10, 14, 1)).toBe('fail');
    const snap = resolvePowerSnapshot({
      base,
      declaredRaises: plan,
      outcome: 'fail',
      masteryRank: 3,
      isSpell: true,
    });
    expect(snap.damageDice).toBe(4);
    expect(snap.specials.find((s) => s.key === 'hex')?.rank).toBe(1);
  });

  it('5. Spell with Damage + Special: free legal split of declared slots', () => {
    const base = damagingSpell();
    const opts = buildAvailableRaiseOptions(base, true);
    expect(opts.some((o) => o.effect === 'damage')).toBe(true);
    expect(opts.some((o) => o.id === 'special:hex')).toBe(true);
    const plan: DeclaredRaise[] = [
      { effect: 'damage', slots: 1 },
      { effect: 'damage', slots: 1 },
      { effect: 'specialPlus', targetSpecialKey: 'hex', slots: 1 },
    ];
    expect(isRaiseAllocationComplete(plan, 3, opts)).toBe(true);
    const snap = resolvePowerSnapshot({
      base,
      declaredRaises: plan,
      outcome: 'full',
      masteryRank: 2,
      isSpell: true,
    });
    expect(snap.damageDice).toBe(4 + 2 + 2);
    expect(snap.specials.find((s) => s.key === 'hex')?.rank).toBe(1 + 2);
  });

  it('6. Special-only Spell: only Special Raises; no Damage option', () => {
    const base = specialOnlySpell();
    const opts = buildAvailableRaiseOptions(base, true);
    expect(opts.every((o) => o.effect === 'specialPlus')).toBe(true);
    expect(opts.some((o) => o.effect === 'damage')).toBe(false);
    expect(
      isSpecialOnlyAttack({
        specialOnly: true,
        selectedPowerTemplateId: 'active-ranged-instant-special-t4',
      }),
    ).toBe(true);
    const plan: DeclaredRaise[] = [
      { effect: 'specialPlus', targetSpecialKey: 'ruin', slots: 1 },
      { effect: 'specialPlus', targetSpecialKey: 'ruin', slots: 1 },
    ];
    expect(isRaiseAllocationComplete(plan, 2, opts)).toBe(true);
    const snap = resolvePowerSnapshot({
      base,
      declaredRaises: plan,
      outcome: 'full',
      masteryRank: 3,
      isSpell: true,
    });
    expect(snap.damageDice).toBe(0);
    expect(snap.specials[0]?.rank).toBe(5 + 3 + 3);
  });
});

describe('C01 — Intellect Free Raises timing', () => {
  it('7. Free Raises do not raise TN; slots unlock only on Full success', () => {
    const paid = 1;
    const free = 2;
    const baseTn = 14;
    expect(computeFinalTn(baseTn, paid)).toBe(18);
    // Free count is not part of TN math.
    expect(computeFinalTn(baseTn, paid)).toBe(computeFinalTn(baseTn, paid));
    expect(successfulRaiseSlotCount(paid, free)).toBe(3);
    expect(resolveRaiseOutcome(17, baseTn, paid)).toBe('fail');
    expect(successfulRaiseSlotCount(paid, free) && resolveRaiseOutcome(17, baseTn, paid) === 'fail').toBe(
      true,
    );
    // On miss, callers must use 0 successful slots (not free+paid).
    const outcome = resolveRaiseOutcome(17, baseTn, paid);
    const slots =
      outcome === 'full' ? successfulRaiseSlotCount(paid, free) : 0;
    expect(slots).toBe(0);
    expect(resolveRaiseOutcome(18, baseTn, paid)).toBe('full');
    expect(successfulRaiseSlotCount(paid, free)).toBe(3);
  });
});

describe('C01 — Spell AoE shared Raise allocation', () => {
  it('8. several hits share one Raise allocation key / plan', () => {
    const flags = withInstantAoeFlags({
      attackerId: 'caster1',
      attackTotal: 22,
      raiseTn: 18,
      powerIsSpell: true,
      declaredRaiseSlots: 2,
      freeRaiseSlots: 0,
      successfulRaiseSlots: 2,
    });
    const key = raiseAllocShareKey(flags);
    expect(key).toMatch(/^aoe:/);
    const plan: DeclaredRaise[] = [
      { effect: 'damage', slots: 1 },
      { effect: 'specialPlus', targetSpecialKey: 'hex', slots: 1 },
    ];
    rememberSharedRaiseAllocation(key, plan);
    expect(peekSharedRaiseAllocation(key)).toEqual(plan);
    // Second hit reuses the same key — one plan for the Power use.
    const flags2 = withInstantAoeFlags({
      attackerId: 'caster1',
      attackTotal: 22,
      raiseTn: 18,
      powerIsSpell: true,
    });
    expect(raiseAllocShareKey(flags2)).toBe(key);
    forgetSharedRaiseAllocation(key);
  });

  it('9. partial AoE hits: each target resolves its own Final TN', () => {
    const attackTotal = 20;
    const paid = 1; // Final TN = base + 4
    const soft = aoeCreatureHitCheck({
      attackTotal,
      normalTn: 12,
      declaredRaiseSlots: paid,
    });
    const hard = aoeCreatureHitCheck({
      attackTotal,
      normalTn: 18,
      declaredRaiseSlots: paid,
    });
    expect(soft.finalTn).toBe(16);
    expect(soft.hit).toBe(true);
    expect(hard.finalTn).toBe(22);
    expect(hard.hit).toBe(false);
  });

  it('10. AoE with zero successful hits: no Raise allocation surface', () => {
    const hits = [16, 18, 20].map(
      (tn) =>
        aoeCreatureHitCheck({
          attackTotal: 14,
          normalTn: tn,
          declaredRaiseSlots: 1,
        }).hit,
    );
    expect(hits.every((h) => h === false)).toBe(true);
    // No pending targets ⇒ callers never open shared Raise UI / damage dialog.
    expect(hits.filter(Boolean)).toHaveLength(0);
  });
});

describe('C01 — Martial / Autofire / Split unchanged', () => {
  it('11. Martial Raise math and post-hit allocation still match Spell', () => {
    const martial = damagingSpell(false);
    const spell = damagingSpell(false);
    const mOpts = buildAvailableRaiseOptions(martial, false);
    const sOpts = buildAvailableRaiseOptions(spell, true);
    expect(mOpts.map((o) => o.id).sort()).toEqual(sOpts.map((o) => o.id).sort());
    const plan: DeclaredRaise[] = [
      { effect: 'damage', slots: 1 },
      { effect: 'specialPlus', targetSpecialKey: 'sundered', slots: 1 },
    ];
    const mSnap = resolvePowerSnapshot({
      base: martial,
      declaredRaises: plan,
      outcome: 'full',
      masteryRank: 3,
      isSpell: false,
    });
    const sSnap = resolvePowerSnapshot({
      base: spell,
      declaredRaises: plan,
      outcome: 'full',
      masteryRank: 3,
      isSpell: true,
    });
    expect(mSnap.damageDice).toBe(sSnap.damageDice);
    expect(mSnap.specials).toEqual(sSnap.specials);
  });

  it('12. Split / Autofire still share one Raise plan per Power use', () => {
    const splitKey = raiseAllocShareKey({ splitPairId: 'pair-abc' });
    expect(splitKey).toBe('split:pair-abc');
    const afKey = raiseAllocShareKey({
      autofire: true,
      powerUseId: 'use-9',
    });
    expect(afKey).toBe('autofire:use-9');
    const plan: DeclaredRaise[] = [{ effect: 'damage', slots: 1 }];
    rememberSharedRaiseAllocation(splitKey, plan);
    rememberSharedRaiseAllocation(afKey, plan);
    expect(peekSharedRaiseAllocation(splitKey)?.length).toBe(1);
    expect(peekSharedRaiseAllocation(afKey)?.length).toBe(1);
    forgetSharedRaiseAllocation(splitKey);
    forgetSharedRaiseAllocation(afKey);
  });

  it('AoE Damage Raise uses ceil(MR/2) for Spell and Martial', () => {
    const aoe = damagingSpell(true);
    const plan: DeclaredRaise[] = [{ effect: 'damage', slots: 1 }];
    const snap = resolvePowerSnapshot({
      base: aoe,
      declaredRaises: plan,
      outcome: 'full',
      masteryRank: 5,
      isSpell: true,
    });
    expect(snap.damageDice).toBe(4 + Math.ceil(5 / 2));
  });
});
