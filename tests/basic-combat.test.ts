import { describe, it, expect } from 'vitest';
import {
  getMasteryRank,
  basicCombatMrTimesTwo,
  basicAttackMrDamageFormula,
  buildBasicReactionItems,
  isBasicReactionItem,
  BASIC_REACTION_IDS,
} from '../src/combat/basic-combat.js';
import { COMBAT_MANEUVERS } from '../src/system/combat-maneuvers.js';
import { RADIAL_STANDARD_MANEUVER_IDS } from '../src/utils/radial-maneuver-prefs.js';

describe('basic-combat helpers', () => {
  it('clamps Mastery Rank and derives MR×2 / MR×2d8', () => {
    expect(getMasteryRank({ system: { mastery: { rank: 4 } } })).toBe(4);
    expect(basicCombatMrTimesTwo({ system: { mastery: { rank: 4 } } })).toBe(8);
    expect(basicAttackMrDamageFormula({ system: { mastery: { rank: 4 } } })).toBe('8d8');
    expect(getMasteryRank({ system: { mastery: { rank: 0 } } })).toBe(2);
    expect(getMasteryRank({ system: {} })).toBe(2);
  });

  it('builds Guard / Evade / Counterattack with MR×2 bonuses', () => {
    const items = buildBasicReactionItems({ system: { mastery: { rank: 3 } } });
    expect(items.map((i) => i.id)).toEqual([
      BASIC_REACTION_IDS.guard,
      BASIC_REACTION_IDS.evade,
      BASIC_REACTION_IDS.counterattack,
    ]);
    expect(items[0].mechanics.armor).toBe(6);
    expect(items[1].mechanics.evade).toBe(6);
    expect(items.every(isBasicReactionItem)).toBe(true);
  });
});

describe('basic combat maneuvers catalog', () => {
  it('includes Guard/Evade/Counterattack/Quick Load/Flee and radial prefs cover core basics', () => {
    const ids = new Set(COMBAT_MANEUVERS.map((m) => m.id));
    for (const id of [
      'guard',
      'evade',
      'counterattack',
      'quick-load',
      'flee',
      'dive-for-cover',
    ]) {
      expect(ids.has(id)).toBe(true);
    }
    expect(ids.has('initiative-delay')).toBe(false);
    expect(RADIAL_STANDARD_MANEUVER_IDS).toContain('quick-load');
    expect(RADIAL_STANDARD_MANEUVER_IDS).toContain('flee');
    expect(RADIAL_STANDARD_MANEUVER_IDS).not.toContain('initiative-delay');
    expect(RADIAL_STANDARD_MANEUVER_IDS).toContain('weapon-attack');
  });

  it('Flee / Dash / Dive texts match current Basic Maneuver rules', () => {
    expect(COMBAT_MANEUVERS.find((m) => m.id === 'flee')?.effect).toMatch(/4×/);
    expect(COMBAT_MANEUVERS.find((m) => m.id === 'dash')?.effect).toMatch(/double/);
    expect(COMBAT_MANEUVERS.find((m) => m.id === 'dive-for-cover')?.effect).toMatch(/2 × Mastery Rank/);
    expect(COMBAT_MANEUVERS.find((m) => m.id === 'stand-up')?.slot).toBe('movement');
  });
});
