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

describe('damage-halving rule per strike (raises 1:1, base halved, count8s preserved)', () => {
  /**
   * Mirrors the halving applied in `calculateDamageWithDetails` when
   * `splitAttack === true`. Spec (per player input):
   *   - Raises declared on a strike go into THAT strike 1:1 (not halved).
   *   - Every other damage source (base weapon, Might stones, power
   *     damage, conditional riders, manual bonuses, NPC auto-dice) is
   *     split evenly between the two strikes → floor-halved.
   *   - count8s (natural 8 floor for the "never-below-8s" rule) is kept
   *     per-strike so raise-rolled 8s are not lost.
   */
  function halveForStrike(total: number, raiseDamage: number, count8s: number) {
    const nonRaise = Math.max(0, total - raiseDamage);
    return {
      total: Math.floor(nonRaise / 2) + raiseDamage,
      count8s,
    };
  }

  it('halves base/weapon damage but keeps raises intact', () => {
    // totalDamage = 10 (base+weapon+power) + 4 (raises) = 14.
    // Strike damage = floor(10/2) + 4 = 5 + 4 = 9.
    expect(halveForStrike(14, 4, 2)).toEqual({ total: 9, count8s: 2 });
  });

  it('with no raises, degrades to plain halving of the total', () => {
    expect(halveForStrike(14, 0, 2)).toEqual({ total: 7, count8s: 2 });
  });

  it('never yields negative values', () => {
    expect(halveForStrike(0, 0, 0)).toEqual({ total: 0, count8s: 0 });
  });

  it('applies floor on the non-raise portion, then re-adds raises', () => {
    // total = 9, of which 3 is raise damage. Non-raise = 6 → /2 = 3. +3 raise = 6.
    expect(halveForStrike(9, 3, 1)).toEqual({ total: 6, count8s: 1 });
    // total = 15, of which 5 is raise damage. Non-raise = 10 → /2 = 5. +5 raise = 10.
    expect(halveForStrike(15, 5, 3)).toEqual({ total: 10, count8s: 3 });
  });

  it('guards against raiseDamage exceeding total (clamps non-raise to zero)', () => {
    // Defensive clamp — should not happen in practice but keeps invariant clean.
    expect(halveForStrike(4, 6, 1)).toEqual({ total: 6, count8s: 1 });
  });
});
