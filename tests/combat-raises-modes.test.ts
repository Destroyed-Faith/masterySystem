import { describe, it, expect } from 'vitest';
import { RAISE_INCREMENT } from '../src/utils/constants.js';
import { aoeCreatureHitCheck } from '../src/combat/aoe-melee-resolution.js';
import {
  computeFinalTn,
  paidRaiseSlots,
  resolvePowerSnapshot,
  resolveRaiseOutcome,
  type DeclaredRaise,
  type PowerSnapshot,
} from '../src/combat/raise-resolution.js';

describe('AoE Final TN per target', () => {
  it('9. each target uses its own Final TN; miss grants no hit', () => {
    const low = aoeCreatureHitCheck({
      attackTotal: 21,
      normalTn: 14,
      declaredRaiseSlots: 2,
    });
    expect(low.finalTn).toBe(22);
    expect(low.hit).toBe(false);

    const highDefense = aoeCreatureHitCheck({
      attackTotal: 22,
      normalTn: 18,
      declaredRaiseSlots: 2,
    });
    expect(highDefense.finalTn).toBe(26);
    expect(highDefense.hit).toBe(false);

    const hit = aoeCreatureHitCheck({
      attackTotal: 22,
      normalTn: 14,
      declaredRaiseSlots: 2,
    });
    expect(hit.hit).toBe(true);
  });

  it('meeting Base TN but not Final TN is not a hit', () => {
    const check = aoeCreatureHitCheck({
      attackTotal: 16,
      normalTn: 14,
      declaredRaiseSlots: 2,
    });
    expect(check.hit).toBe(false);
    expect(check.finalTn).toBe(22);
  });
});

describe('Autofire Final TN chain math', () => {
  it('11. one roll checked in order; first Final TN miss ends the chain', () => {
    const attackTotal = 20;
    const raiseSlots = 1;
    const midFail: boolean[] = [];
    for (const base of [12, 18, 10]) {
      // Final TNs 16, 22, 14 — chain stops on the second target.
      const hit = attackTotal >= computeFinalTn(base, raiseSlots);
      midFail.push(hit);
      if (!hit) break;
    }
    expect(midFail).toEqual([true, false]);
  });
});

describe('Split Attack shared Raise allocation', () => {
  it('10. one Raise plan applies to every successful split; failed split gets nothing', () => {
    const plan: DeclaredRaise[] = [
      { effect: 'damage', slots: 1 },
      { effect: 'specialPlus', targetSpecialKey: 'slow', slots: 1, free: true },
    ];
    expect(paidRaiseSlots(plan)).toBe(1);
    const base: PowerSnapshot = {
      damageDice: 4,
      specials: [{ key: 'slow', rank: 2 }],
      rangeM: null,
      aoeRadiusM: null,
      durationSteps: 0,
      hasRange: false,
      hasAoe: false,
      hasDuration: false,
    };
    const successA = resolveRaiseOutcome(18, 14, paidRaiseSlots(plan));
    const successB = resolveRaiseOutcome(13, 14, paidRaiseSlots(plan));
    expect(successA).toBe('full');
    expect(successB).toBe('fail');

    const snapA = resolvePowerSnapshot({
      base,
      declaredRaises: plan,
      outcome: successA,
      masteryRank: 2,
      isSpell: false,
    });
    const snapB = resolvePowerSnapshot({
      base,
      declaredRaises: plan,
      outcome: successB,
      masteryRank: 2,
      isSpell: false,
    });
    expect(snapA.damageDice).toBe(6);
    expect(snapA.specials[0].rank).toBe(4);
    expect(snapB.damageDice).toBe(4);
    expect(snapB.specials[0].rank).toBe(2);
    // Free Raise committed once for the Power use (not per split) — caller responsibility.
    expect(countFree(plan)).toBe(1);
  });
});

function countFree(raises: DeclaredRaise[]): number {
  return raises.reduce((n, r) => n + (r.free ? (r.slots === 2 ? 2 : 1) : 0), 0);
}

describe('Spell resistance vs Final Spell TN', () => {
  it('16. reaching Spell Base but missing raised Final TN grants no payload', () => {
    const spellBase = 14;
    const spellResistance = 4;
    const applicableBase = spellBase + spellResistance; // 18
    const paid = 2;
    const finalTn = computeFinalTn(applicableBase, paid); // 26
    const roll = 20; // >= spellBase, < finalTn
    expect(roll >= spellBase).toBe(true);
    expect(resolveRaiseOutcome(roll, applicableBase, paid)).toBe('fail');
    expect(finalTn).toBe(26);
    expect(RAISE_INCREMENT).toBe(4);
  });
});
