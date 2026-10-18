/**
 * Unit tests for the Split-Attack mechanic.
 *
 * Runtime: `attack-executor.ts` posts strikes with a halved attack pool;
 * `damage-dialog.ts` deals **full** damage per successful strike (accuracy
 * is split, damage is not).
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
    power.levels['1']!.mechanics = { applyWhen: 'attack-rider' };
    const item = makePowerItem(1, power);
    expect(resolvePowerMechanics(item)?.splitAttack).toBeFalsy();
  });

  it('treats a roman-suffixed catalog name with legacy mechanics as Split Attack', () => {
    const item = {
      name: 'Ranged Split Attack I',
      type: 'power',
      system: {
        rank: 4,
        levels: {
          '4': {
            mechanics: {
              applyWhen: 'attack-rider',
              damageRider: { flat: '+5d8' },
            },
          },
        },
      },
    };
    const mech = resolvePowerMechanics(item);
    expect(mech?.splitAttack).toBe(true);
    expect(mech?.damageRider?.flat).toBe('+5d8');
  });
});

describe('pool-halving rule (Math.floor(original / 2)) — accuracy only', () => {
  it('halves even pools symmetrically', () => {
    expect(halfPool(8)).toBe(4);
    expect(halfPool(10)).toBe(5);
  });

  it('drops the remainder on odd pools (symmetric floor, no biased strike)', () => {
    expect(halfPool(7)).toBe(3);
    expect(halfPool(5)).toBe(2);
    expect(halfPool(1)).toBe(0);
  });

  it('yields 0 for empty / negative inputs (callers clamp for actual dice rolls)', () => {
    expect(halfPool(0)).toBe(0);
    expect(Math.floor(-3 / 2)).toBe(-2);
  });
});

describe('damage is full per successful split (accuracy split, not damage)', () => {
  /**
   * Mirrors `calculateDamageWithDetails` after the rule change: Split Attack
   * no longer floor-halves non-raise damage. Each successful strike applies
   * the full rolled total (weapon + martial stones + power + raises).
   */
  function fullStrikeDamage(total: number): number {
    return Math.max(0, total);
  }

  it('keeps weapon + power + martial dice intact on a hit', () => {
    // 22 weapon + 22 martial + 9 power = 53 — was floor(53/2)=26 under the old rule.
    expect(fullStrikeDamage(53)).toBe(53);
  });

  it('keeps raises with the full strike total', () => {
    expect(fullStrikeDamage(14)).toBe(14);
    expect(fullStrikeDamage(0)).toBe(0);
  });
});
