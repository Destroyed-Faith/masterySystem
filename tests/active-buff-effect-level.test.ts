import { describe, expect, it } from 'vitest';
import { resolveActiveBuffEffectLevel } from '../src/utils/active-buffs';
import { resolvePowerMechanics } from '../src/utils/power-mechanics';

describe('resolveActiveBuffEffectLevel', () => {
  it('uses purchased rank, not Mastery Rank', () => {
    expect(resolveActiveBuffEffectLevel({ rank: 1, level: 1 }, 0)).toBe(1);
    expect(resolveActiveBuffEffectLevel({ rank: 3 }, 0)).toBe(3);
  });

  it('falls back to level when rank is missing/invalid (never invents PL from MR)', () => {
    expect(resolveActiveBuffEffectLevel({ level: 1 }, 0)).toBe(1);
    expect(resolveActiveBuffEffectLevel({ rank: 0, level: 2 }, 0)).toBe(2);
    expect(resolveActiveBuffEffectLevel({ rank: '', level: 1 }, 0)).toBe(1);
    expect(resolveActiveBuffEffectLevel({}, 0)).toBe(1);
  });

  it('adds Active Buff Empowerment PL on top of purchased level', () => {
    expect(resolveActiveBuffEffectLevel({ rank: 1 }, 3)).toBe(4);
    expect(resolveActiveBuffEffectLevel({ rank: 14 }, 4)).toBe(16);
  });
});

describe('resolvePowerMechanics Armor name collision', () => {
  it('resolves Passive: Armor by templateId to the passive curve (+4 at PL3)', () => {
    const mech = resolvePowerMechanics({
      name: 'Armor',
      system: { templateId: 'passive-fortified-frame', rank: 3, category: 'passive' },
    });
    expect(mech?.armor).toBe(4);
  });

  it('resolves Active Buff: Armor by templateId to the buff curve (+2 at PL1, +8 at PL4)', () => {
    const l1 = resolvePowerMechanics({
      name: 'Active Buff: Armor',
      system: { templateId: 'ab-armor', rank: 1, category: 'activeBuff' },
    });
    const l4 = resolvePowerMechanics({
      name: 'Active Buff: Armor',
      system: { templateId: 'ab-armor', rank: 4, category: 'activeBuff' },
    });
    expect(l1?.armor).toBe(2);
    expect(l4?.armor).toBe(8);
  });

  it('does not map bare templateName Armor + activeBuff category to Passive', () => {
    const mech = resolvePowerMechanics({
      name: 'Armor',
      system: { rank: 1, category: 'activeBuff', powerType: 'buff' },
    });
    // Category-scoped templateName match → Active Buff L1 = +2
    expect(mech?.armor).toBe(2);
  });
});
