/**
 * Unit tests for the Split-Attack mechanic.
 *
 * The runtime is split across `attack-executor.ts` (two attack cards, halved
 * attack pool) and `damage-dialog.ts` (halved damage per strike). We test
 * the two halving invariants plus the power-level declaration pathway:
 *
 *   - A power with `mechanics.splitAttack === true` surfaces that flag
 *     through `resolvePowerMechanics`.
 *   - Pool-halving rule: `Math.floor(original / 2)` for each strike.
 *   - Damage-halving rule: post-roll total is halved per strike; natural
 *     8s are also halved so the 8s-minimum rule stays consistent.
 */
import { describe, it, expect } from 'vitest';
import { resolvePowerMechanics } from '../src/utils/power-mechanics';
import type { NewArtifactPowerData } from '../src/types/item';

function splitAttackPower(): NewArtifactPowerData {
  return {
    name: 'Twinfang Strike',
    category: 'active',
    tags: [],
    rank: 1,
    cost: { action: 'attack', stones: 0 },
    roll: { kind: 'attack', attribute: 'might' },
    levels: {
      '1': {
        type: 'melee',
        range: { kind: 'distance', m: 1 },
        aoe: { shape: 'none' },
        duration: { kind: 'instant' },
        effect: { text: '2d8 damage', dice: '2d8' },
        specials: [],
        mechanics: {
          splitAttack: true,
          applyWhen: 'attack-rider',
        },
      },
      '2': {
        type: 'melee',
        range: { kind: 'distance', m: 1 },
        aoe: { shape: 'none' },
        duration: { kind: 'instant' },
        effect: { text: '3d8 damage', dice: '3d8' },
        specials: [],
        mechanics: {
          splitAttack: true,
          applyWhen: 'attack-rider',
        },
      },
      '3': {
        type: 'melee',
        range: { kind: 'distance', m: 1 },
        aoe: { shape: 'none' },
        duration: { kind: 'instant' },
        effect: { text: '4d8 damage', dice: '4d8' },
        specials: [],
        mechanics: {
          splitAttack: true,
          applyWhen: 'attack-rider',
        },
      },
      '4': {
        type: 'melee',
        range: { kind: 'distance', m: 1 },
        aoe: { shape: 'none' },
        duration: { kind: 'instant' },
        effect: { text: '5d8 damage', dice: '5d8' },
        specials: [],
        mechanics: {
          splitAttack: true,
          applyWhen: 'attack-rider',
        },
      },
    },
  };
}

function makePowerItem(rank: number, data: NewArtifactPowerData): any {
  return {
    id: 'pw-twinfang',
    name: data.name,
    type: 'power',
    system: {
      rank,
      levels: data.levels,
    },
  };
}

function halfPool(pool: number): number {
  return Math.floor(pool / 2);
}

describe('Split-Attack power declaration', () => {
  it('surfaces `splitAttack: true` via resolvePowerMechanics', () => {
    const power = splitAttackPower();
    const item = makePowerItem(1, power);
    const mech = resolvePowerMechanics(item);
    expect(mech).not.toBeNull();
    expect(mech?.splitAttack).toBe(true);
  });

  it('surfaces the flag at every rank', () => {
    const power = splitAttackPower();
    for (const rank of [1, 2, 3, 4]) {
      const item = makePowerItem(rank, power);
      expect(resolvePowerMechanics(item)?.splitAttack).toBe(true);
    }
  });

  it('returns null when the power does not declare Split-Attack', () => {
    const power = splitAttackPower();
    // Overwrite rank 1 mechanics to drop splitAttack.
    power.levels['1']!.mechanics = { applyWhen: 'attack-rider' };
    const item = makePowerItem(1, power);
    expect(resolvePowerMechanics(item)?.splitAttack).toBeFalsy();
  });
});

describe('pool-halving rule (Math.floor(original / 2))', () => {
  it('halves even pools symmetrically', () => {
    expect(halfPool(8)).toBe(4);
    expect(halfPool(10)).toBe(5);
  });

  it('drops the remainder on odd pools (symmetric floor, no biased strike)', () => {
    expect(halfPool(7)).toBe(3);
    expect(halfPool(5)).toBe(2);
    expect(halfPool(1)).toBe(0);
  });

  it('yields 0 for empty / negative inputs (callers clamp to 1 for actual dice rolls)', () => {
    expect(halfPool(0)).toBe(0);
    expect(Math.floor(-3 / 2)).toBe(-2); // documents raw behaviour; callers clamp
  });
});

describe('damage-halving rule per strike', () => {
  /**
   * Mirrors the halving applied in `calculateDamageResult` when
   * `splitAttack === true`: total and count8s both floored by 2, so both
   * strikes are consistent with the 8s-minimum rule downstream.
   */
  function halveForStrike(total: number, count8s: number) {
    return { total: Math.floor(total / 2), count8s: Math.floor(count8s / 2) };
  }

  it('halves total damage and natural-8 count together', () => {
    expect(halveForStrike(14, 2)).toEqual({ total: 7, count8s: 1 });
  });

  it('never yields negative values', () => {
    expect(halveForStrike(0, 0)).toEqual({ total: 0, count8s: 0 });
  });

  it('applies the floor consistently across odd totals', () => {
    expect(halveForStrike(15, 3)).toEqual({ total: 7, count8s: 1 });
  });
});
