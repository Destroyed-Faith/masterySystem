import { describe, it, expect } from 'vitest';
import {
  buildFamiliarResult,
  FAMILIAR_EVADE_BY_TIER,
  FAMILIAR_HP_BY_TIER,
  FAMILIAR_ATTACK_DICE_BY_TIER,
  FAMILIAR_DAMAGE_DICE_BY_TIER,
  FAMILIAR_GROUND_MOVEMENT_BY_TIER,
  FAMILIAR_FLYING_MOVEMENT_BY_TIER,
  FAMILIAR_ARMOR_BY_TIER
} from '../src/stones/familiar-rules';

describe('Familiar canonical tables', () => {
  it('HP progression matches sheet (9 tiers)', () => {
    expect(FAMILIAR_HP_BY_TIER).toEqual([10, 22, 34, 46, 58, 70, 82, 94, 106]);
    for (let i = 0; i <= 8; i++) {
      expect(FAMILIAR_HP_BY_TIER[i]).toBe(10 + 12 * i);
    }
  });

  it('Evade progression includes 20 then 24 then 28 (no duplicate 24)', () => {
    expect(FAMILIAR_EVADE_BY_TIER).toEqual([4, 8, 12, 16, 20, 24, 28, 32, 36]);
    expect(FAMILIAR_EVADE_BY_TIER[4]).toBe(20);
    expect(FAMILIAR_EVADE_BY_TIER[5]).toBe(24);
    expect(FAMILIAR_EVADE_BY_TIER[6]).toBe(28);
  });

  it('Armor matches 3 per tier', () => {
    for (let i = 0; i <= 8; i++) {
      expect(FAMILIAR_ARMOR_BY_TIER[i]).toBe(3 * i);
    }
  });

  it('Attack dice tier = 2 + 2 * tierIndex', () => {
    for (let i = 0; i <= 8; i++) {
      expect(FAMILIAR_ATTACK_DICE_BY_TIER[i]).toBe(2 + 2 * i);
    }
  });

  it('Damage dice tier = 1 + tierIndex', () => {
    for (let i = 0; i <= 8; i++) {
      expect(FAMILIAR_DAMAGE_DICE_BY_TIER[i]).toBe(1 + i);
    }
  });

  it('Ground movement: 8 + 4 per tier', () => {
    for (let i = 0; i <= 8; i++) {
      expect(FAMILIAR_GROUND_MOVEMENT_BY_TIER[i]).toBe(8 + 4 * i);
    }
  });

  it('Flying movement: 4 + 2 per tier', () => {
    for (let i = 0; i <= 8; i++) {
      expect(FAMILIAR_FLYING_MOVEMENT_BY_TIER[i]).toBe(4 + 2 * i);
    }
  });
});

describe('buildFamiliarResult', () => {
  it('base familiar: 1 stone, no upgrades', () => {
    const r = buildFamiliarResult({
      familiarName: 'Test',
      movementType: 'ground',
      upgradeStones: [],
      sharedSenses: [],
      masteryRank: 2
    });
    expect(r.totalBoundStones).toBe(1);
    expect(r.upgradeStones).toBe(0);
    expect(r.finalStats.hp).toBe(10);
    expect(r.finalStats.armor).toBe(0);
    expect(r.finalStats.evade).toBe(4);
    expect(r.finalStats.attack).toBe('2d8');
    expect(r.finalStats.damage).toBe('1d8');
    expect(r.finalStats.movementM).toBe(8);
    expect(r.size).toBe('Tiny');
    expect(r.validationWarnings.length).toBe(0);
  });

  it('2 upgrade stones: Evade + Movement on first stone, HP + Damage on second (example shape)', () => {
    const r = buildFamiliarResult({
      familiarName: 'Raven',
      movementType: 'ground',
      upgradeStones: [
        { id: 'u1', picks: ['evade', 'movement'] },
        { id: 'u2', picks: ['hp', 'damage'] }
      ],
      sharedSenses: [],
      masteryRank: 4
    });
    expect(r.evadeUpgrades).toBe(1);
    expect(r.movementUpgrades).toBe(1);
    expect(r.hpUpgrades).toBe(1);
    expect(r.damageUpgrades).toBe(1);
    expect(r.finalStats.evade).toBe(8);
    expect(r.finalStats.movementM).toBe(12);
    expect(r.finalStats.hp).toBe(22);
    expect(r.finalStats.damage).toBe('2d8');
    expect(r.size).toBe('Small');
  });

  it('duplicate category on same stone: warns and counts one pick', () => {
    const r = buildFamiliarResult({
      familiarName: 'X',
      movementType: 'flying',
      upgradeStones: [{ id: 'bad', picks: ['hp', 'hp'] }],
      sharedSenses: [],
      masteryRank: 8
    });
    expect(r.hpUpgrades).toBe(1);
    expect(r.validationWarnings.some((w) => w.includes('duplicate'))).toBe(true);
  });

  it('shared senses add bound stones without upgrade picks', () => {
    const r = buildFamiliarResult({
      familiarName: 'S',
      movementType: 'ground',
      upgradeStones: [],
      sharedSenses: ['sight', 'hearing'],
      masteryRank: 4
    });
    expect(r.totalBoundStones).toBe(3);
    expect(r.sharedSenseStones).toBe(2);
    expect(r.sharedSenses).toEqual(['sight', 'hearing']);
  });

  it('warns when bound stones exceed Mastery Rank × 4', () => {
    const r = buildFamiliarResult({
      familiarName: 'Over',
      movementType: 'ground',
      upgradeStones: Array.from({ length: 10 }, (_, i) => ({
        id: `s${i}`,
        picks: ['armor', 'evade'] as const
      })),
      sharedSenses: [],
      masteryRank: 2
    });
    expect(r.totalBoundStones).toBe(11);
    expect(r.validationWarnings.some((w) => w.includes('exceed'))).toBe(true);
  });
});
