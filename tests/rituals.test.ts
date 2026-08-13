import { describe, expect, it } from 'vitest';
import {
  RITUALS,
  appliedRitualEffects,
  calculateRitualRaiseTN,
  calculateRitualTN,
  eligibleSkillsForRitual,
  getRitualById,
  resolveRitualDeclaredOutcome,
  ritualStoneCost,
} from '../src/utils/rituals';
import { STONE_RITUALS_CATALOG } from '../src/stones/rituals-catalog';

describe('Ritual TN', () => {
  it('Base Ritual TN = 8 × Ritual MR', () => {
    expect(calculateRitualTN(1)).toBe(8);
    expect(calculateRitualTN(2)).toBe(16);
    expect(calculateRitualTN(3)).toBe(24);
  });

  it('situational modifier shifts Base TN in ±4 steps', () => {
    expect(calculateRitualTN(2, 4)).toBe(20);
    expect(calculateRitualTN(2, -4)).toBe(12);
  });

  it('Raise TN = Base + declared Raises × 4', () => {
    expect(calculateRitualRaiseTN(16, 0)).toBe(16);
    expect(calculateRitualRaiseTN(16, 2)).toBe(24);
    expect(calculateRitualRaiseTN(16, 4)).toBe(32);
  });
});

describe('resolveRitualDeclaredOutcome', () => {
  it('fails below Base TN', () => {
    expect(resolveRitualDeclaredOutcome({ rollTotal: 15, baseTn: 16, declaredRaises: 2 })).toEqual({
      success: false,
      appliedRaise: 0,
      kind: 'fail',
    });
  });

  it('applies Raise 0 only when Base is met but Raise TN is missed', () => {
    expect(resolveRitualDeclaredOutcome({ rollTotal: 20, baseTn: 16, declaredRaises: 2 })).toEqual({
      success: true,
      appliedRaise: 0,
      kind: 'raise0',
    });
  });

  it('applies the declared level when Raise TN is met', () => {
    expect(resolveRitualDeclaredOutcome({ rollTotal: 24, baseTn: 16, declaredRaises: 2 })).toEqual({
      success: true,
      appliedRaise: 2,
      kind: 'full',
    });
  });

  it('does not unlock undeclared higher Raises', () => {
    expect(resolveRitualDeclaredOutcome({ rollTotal: 40, baseTn: 16, declaredRaises: 1 })).toEqual({
      success: true,
      appliedRaise: 1,
      kind: 'full',
    });
  });

  it('lists Raise 0 through the applied level', () => {
    const ritual = RITUALS.find((r) => r.id === 'ritual-read-resonance')!;
    expect(appliedRitualEffects(ritual, 2)).toHaveLength(3);
  });
});

describe('Ritual catalog', () => {
  it('includes the Players Guide rituals and not Raise Dead', () => {
    const names = RITUALS.map((r) => r.name);
    expect(names).toContain('Read Resonance');
    expect(names).toContain('Threshold Alarm');
    expect(names).toContain('Learn Artifact');
    expect(names).toContain('Forgotten Memory');
    expect(names).not.toContain('Detect Magic');
    expect(names).not.toContain('Augury');
    expect(names).not.toContain('Greater Restoration');
    expect(names).not.toContain('Commune');
    expect(names).not.toContain('Raise Dead');
    expect(names).not.toContain('Bind Familiar');
  });

  it('Stone cost follows declared Raise, not a per-ritual list', () => {
    const ritual = RITUALS.find((r) => r.id === 'ritual-read-resonance')!;
    expect(ritualStoneCost(ritual, 0)).toBe(1);
    expect(ritualStoneCost(ritual, 1)).toBe(1);
    expect(ritualStoneCost(ritual, 2)).toBe(2);
    expect(ritualStoneCost(ritual, 3)).toBe(2);
    expect(ritualStoneCost(ritual, 4)).toBe(3);
  });

  it('Seal Passage Raise 4 costs 3 Stones', () => {
    const ritual = RITUALS.find((r) => r.id === 'ritual-seal-passage')!;
    expect(ritualStoneCost(ritual, 3)).toBe(2);
    expect(ritualStoneCost(ritual, 4)).toBe(3);
  });

  it('every ritual has allowed skills and five raise steps', () => {
    for (const ritual of RITUALS) {
      expect(ritual.allowedSkillCategories.length).toBeGreaterThan(0);
      expect(eligibleSkillsForRitual(ritual).length).toBeGreaterThan(0);
      expect(ritual.raises.length).toBe(5);
      expect(ritual.stoneCost).toBeGreaterThanOrEqual(1);
    }
  });

  it('Stone Powers catalog mirrors the same rituals', () => {
    expect(STONE_RITUALS_CATALOG.map((r) => r.id)).toEqual(RITUALS.map((r) => r.id));
  });

  it('maps the old Detect Magic id to Read Resonance', () => {
    expect(getRitualById('ritual-detect-magic')?.id).toBe('ritual-read-resonance');
  });
});
