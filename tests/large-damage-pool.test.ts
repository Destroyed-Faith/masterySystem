import { describe, expect, it } from 'vitest';
import {
  LARGE_DAMAGE_POOL_DIE_VALUE,
  LARGE_DAMAGE_POOL_MIN_DICE,
  countLargeDamagePoolFormula,
  countedPoolFloorSource,
  isLargeDamagePool,
  largeDamagePoolDieValue,
} from '../src/combat/large-damage-pool';
import { computeMarkFloorBonus } from '../src/dice/mark-floor';
import { damageFromSharedDice } from '../src/combat/autofire-shared-damage';

describe('Large Damage Pools (Core v0.9.9.6)', () => {
  it('is offered only at 40+ dice remaining after Damage Negation', () => {
    expect(LARGE_DAMAGE_POOL_MIN_DICE).toBe(40);
    expect(isLargeDamagePool(39)).toBe(false);
    expect(isLargeDamagePool(40)).toBe(true);
    expect(isLargeDamagePool(52)).toBe(true);
  });

  it('is not offered when the roll is Maximized (each die stays 8)', () => {
    expect(isLargeDamagePool(60, { maximized: true })).toBe(false);
    expect(largeDamagePoolDieValue({ maximized: true, floor: 6 })).toBe(8);
  });

  it('counts each d8 as 5 and keeps flat parts', () => {
    expect(LARGE_DAMAGE_POOL_DIE_VALUE).toBe(5);
    expect(countLargeDamagePoolFormula('40d8')).toBe('200');
    expect(countLargeDamagePoolFormula('30d8 + 12d8 + 4')).toBe('150 + 60 + 4');
    expect(countLargeDamagePoolFormula('d8')).toBe('5');
  });

  it('a floor above 5 (Mark / Brutal Impact) counts each die at the floor', () => {
    const counted = [countedPoolFloorSource(40)];
    expect(computeMarkFloorBonus(counted, 7)).toBe(40 * 2);
    expect(computeMarkFloorBonus(counted, 5)).toBe(0);
    expect(computeMarkFloorBonus(counted, 3)).toBe(0);
    // Mark above an existing Brutal Impact floor only adds the remaining gap.
    expect(computeMarkFloorBonus(counted, 8, 6)).toBe(40 * 2);
    expect(largeDamagePoolDieValue({ floor: 7 })).toBe(7);
    expect(largeDamagePoolDieValue({ floor: 3 })).toBe(5);
  });

  it('Autofire per-hit omission drops counted dice at their floored value', () => {
    const faces = new Array(40).fill(LARGE_DAMAGE_POOL_DIE_VALUE);
    expect(damageFromSharedDice(faces, 4).total).toBe(36 * 5);
    expect(damageFromSharedDice(faces, 4, { dieFloor: 7 }).total).toBe(36 * 7);
  });
});
