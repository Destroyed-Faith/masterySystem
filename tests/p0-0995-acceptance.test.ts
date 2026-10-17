import { describe, expect, it } from 'vitest';
import {
  applyDefensiveStoneExpiry,
  snapshotDefensiveStones,
} from '../src/combat/action-economy';
import { resolveCriticalAttackModifier } from '../src/combat/critical-resolution';
import { compareInitiativeCombatants } from '../src/combat/initiative-roll';
import { finalizeRolledPool } from '../src/dice/pool-finalize';
import { applyHealHpAcrossOpenBars } from '../src/combat/heal-resolution';
import { resolvePowerSnapshot, type PowerSnapshot } from '../src/combat/raise-resolution';
import { divideSplitAttackPool } from '../src/combat/attack-executor';
import { surprisePriorityShouldGrant } from '../src/combat/surprise';
import { isInvisibilitySuppressedByHealth } from '../src/combat/perception-state';

describe('P0.1 defensive stones last until the next own turn', () => {
  it('keeps the snapshot through later attacks and drops only that snapshot', () => {
    const bought = { tempArmor: 8, evadeBonus: 4, damageBonus: 2 };
    const snap = snapshotDefensiveStones(bought);
    expect(snap).toEqual({ tempArmor: 8, evadeBonus: 4 });
    const stillUp = { ...bought };
    expect(stillUp.tempArmor).toBe(8);
    const nextTurn = applyDefensiveStoneExpiry({ ...bought, tempArmor: 11 }, snap);
    expect(nextTurn.tempArmor).toBe(3);
    expect(nextTurn.evadeBonus).toBe(0);
  });
});

describe('P0.2 Crit is chosen before the roll', () => {
  it('spends nothing unless this roll declared Crit', () => {
    const bank = { stoneCritCharges: 1, buffQuotaRemaining: 0 };
    const first = resolveCriticalAttackModifier(bank);
    expect(first.applyCritical).toBe(false);
    expect(first.consumeFrom).toBeNull();
    const second = resolveCriticalAttackModifier({ ...bank, declared: true });
    expect(second.applyCritical).toBe(true);
    expect(second.explodeOn78).toBe(true);
  });
});

describe('P0.3 initiative ties', () => {
  function c(over: Record<string, unknown>) {
    return {
      id: 'a',
      initiative: 10,
      actor: { type: 'npc', system: { mastery: { rank: 2 }, attributes: { agility: { value: 3 } } } },
      getFlag: () => 0,
      ...over,
    };
  }

  it('orders Mastery Rank, then Agility, then the stored d8', () => {
    const lowRank = c({ id: 'low', actor: { type: 'character', system: { mastery: { rank: 1 }, attributes: { agility: { value: 9 } } } } });
    const highRank = c({ id: 'high', actor: { type: 'npc', system: { mastery: { rank: 4 }, attributes: { agility: { value: 1 } } } } });
    expect(compareInitiativeCombatants(lowRank, highRank)).toBeGreaterThan(0);

    const slow = c({ id: 'slow' });
    const quick = c({
      id: 'quick',
      actor: { type: 'npc', system: { mastery: { rank: 2 }, attributes: { agility: { value: 8 } } } },
    });
    expect(compareInitiativeCombatants(slow, quick)).toBeGreaterThan(0);

    const dieLow = c({ id: 'd1', getFlag: (_s: string, k: string) => (k === 'initiativeTieD8' ? 2 : 0) });
    const dieHigh = c({ id: 'd8', getFlag: (_s: string, k: string) => (k === 'initiativeTieD8' ? 7 : 0) });
    expect(compareInitiativeCombatants(dieLow, dieHigh)).toBeGreaterThan(0);
    expect(compareInitiativeCombatants(dieLow, dieHigh)).toBe(compareInitiativeCombatants(dieLow, dieHigh));
  });
});

describe('P0.4 no minimum dice pool', () => {
  it('leaves MR 4 with two dice as 2, and fails a pool of 0', () => {
    const actor = { system: { health: { bars: [{ current: 10, max: 10 }] } } };
    const two = finalizeRolledPool(actor, 2, 4, { rollKind: 'attack', applyPoolPenalties: false });
    expect(two.numDice).toBe(2);
    const zero = finalizeRolledPool(actor, 0, 4, { rollKind: 'skill', applyPoolPenalties: false });
    expect(zero.numDice).toBe(0);
    expect(zero.autoFailReason).toBeTruthy();
  });
});

describe('P0.5 healing stays on the active bar', () => {
  it('does not overflow and reopens Broken when Incapacitated', () => {
    const open = applyHealHpAcrossOpenBars(
      {
        currentBar: 1,
        bars: [
          { name: 'Healthy', current: 5, max: 10 },
          { name: 'Bruised', current: 2, max: 10 },
        ],
      },
      20,
    );
    expect(open.bars[1].current).toBe(10);
    expect(open.bars[0].current).toBe(5);
    expect(open.restored).toBe(8);

    const down = applyHealHpAcrossOpenBars(
      {
        currentBar: 5,
        bars: [
          { name: 'Healthy', current: 0, max: 10 },
          { name: 'Bruised', current: 0, max: 10 },
          { name: 'Injured', current: 0, max: 10 },
          { name: 'Wounded', current: 0, max: 10 },
          { name: 'Broken', current: 0, max: 10 },
          { name: 'Incapacitated', current: 0, max: 10 },
        ],
      },
      3,
    );
    expect(down.currentBar).toBe(4);
    expect(down.bars[4].current).toBe(3);
    expect(down.bars[0].current).toBe(0);
  });
});

describe('P0.6 universal raises', () => {
  const base = (aoe: boolean): PowerSnapshot => ({
    damageDice: 2,
    specials: [{ key: 'ignite', rank: 1 }],
    rangeM: null,
    aoeRadiusM: aoe ? 4 : null,
    durationSteps: 0,
    hasRange: false,
    hasAoe: aoe,
    hasDuration: false,
  });

  it('adds MR damage dice, half rounded up for AoE, and MR on an existing special', () => {
    const single = resolvePowerSnapshot({
      base: base(false),
      declaredRaises: [{ effect: 'damage', slots: 1 }],
      outcome: 'full',
      masteryRank: 4,
      isSpell: true,
    });
    expect(single.damageDice).toBe(6);

    const aoe = resolvePowerSnapshot({
      base: base(true),
      declaredRaises: [
        { effect: 'damage', slots: 1 },
        { effect: 'damage', slots: 1 },
      ],
      outcome: 'full',
      masteryRank: 3,
      isSpell: true,
    });
    expect(aoe.damageDice).toBe(2 + 4);

    const special = resolvePowerSnapshot({
      base: base(false),
      declaredRaises: [{ effect: 'specialPlus', targetSpecialKey: 'ignite', slots: 1 }],
      outcome: 'full',
      masteryRank: 3,
      isSpell: false,
    });
    expect(special.specials[0].rank).toBe(4);
  });
});

describe('P0.7 split attack pool', () => {
  it('divides five dice into 3 and 2', () => {
    expect(divideSplitAttackPool(5)).toEqual({ first: 3, second: 2 });
    expect(divideSplitAttackPool(0)).toEqual({ first: 0, second: 0 });
  });
});

describe('P0.8 surprise priority', () => {
  it('grants only when the target is unaware and the fight is still in round 1', () => {
    expect(surprisePriorityShouldGrant({ combatStarted: false, round: 1, targetUnaware: true })).toBe(true);
    expect(surprisePriorityShouldGrant({ combatStarted: true, round: 1, targetUnaware: true })).toBe(true);
    expect(surprisePriorityShouldGrant({ combatStarted: true, round: 2, targetUnaware: true })).toBe(false);
    expect(surprisePriorityShouldGrant({ combatStarted: false, round: 1, targetUnaware: false })).toBe(false);
  });
});

describe('Q1 invisibility', () => {
  it('is not removed by Incapacitated', () => {
    expect(
      isInvisibilitySuppressedByHealth({
        system: { health: { currentBar: 5, bars: [{ name: 'Incapacitated' }] } },
      }),
    ).toBe(false);
  });
});
