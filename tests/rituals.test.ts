import { describe, expect, it } from 'vitest';
import {
  RITUALS,
  appliedRitualEffects,
  calculateRitualRaiseTN,
  calculateRitualTN,
  eligibleSkillsForRitual,
  getRitualById,
  resolveRitualDeclaredOutcome,
  listUniversalCoreRituals,
  ritualStoneCost,
} from '../src/utils/rituals';
import { getCoreRitualById } from '../src/rules/core-rituals';
import { STONE_RITUALS_CATALOG } from '../src/stones/rituals-catalog';

describe('Ritual TN', () => {
  it('Base Ritual TN = 4 × max(3, Task Level)', () => {
    expect(calculateRitualTN(1)).toBe(12);
    expect(calculateRitualTN(2)).toBe(12);
    expect(calculateRitualTN(3)).toBe(12);
    expect(calculateRitualTN(4)).toBe(16);
    expect(calculateRitualTN(6)).toBe(24);
  });

  it('situational modifier shifts Base TN', () => {
    expect(calculateRitualTN(3, 4)).toBe(16);
    expect(calculateRitualTN(3, -4)).toBe(8);
  });

  it('Raise TN = Base + declared Raises × 4', () => {
    expect(calculateRitualRaiseTN(16, 0)).toBe(16);
    expect(calculateRitualRaiseTN(16, 2)).toBe(24);
    expect(calculateRitualRaiseTN(16, 4)).toBe(32);
  });
});

describe('resolveRitualDeclaredOutcome', () => {
  it('fails the entire attempt below Final Ritual TN', () => {
    expect(resolveRitualDeclaredOutcome({ rollTotal: 15, baseTn: 16, declaredRaises: 2 })).toEqual({
      success: false,
      appliedRaise: 0,
      kind: 'fail',
    });
    // Meeting Base but missing Final TN also fails (no partial Raise 0).
    expect(resolveRitualDeclaredOutcome({ rollTotal: 20, baseTn: 16, declaredRaises: 2 })).toEqual({
      success: false,
      appliedRaise: 0,
      kind: 'fail',
    });
  });

  it('applies the declared level when Final TN is met', () => {
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

  it('Stone Powers catalog mirrors the 16 Core Rituals with Tier 0-4 raises', () => {
    expect(STONE_RITUALS_CATALOG.map((r) => r.id)).toEqual(listUniversalCoreRituals().map((r) => r.id));
    expect(STONE_RITUALS_CATALOG).toHaveLength(16);
    for (const entry of STONE_RITUALS_CATALOG) {
      expect(entry.raises.map((r) => r.label)).toEqual(['Tier 0', 'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4']);
      expect(entry.raises.every((r) => r.text.length > 0)).toBe(true);
      expect(entry.raises.some((r) => r.text.includes('**'))).toBe(false);
    }
  });

  it('Seal Passage Tier 4 is the alternate opening mode', () => {
    const entry = STONE_RITUALS_CATALOG.find((r) => r.id === 'seal-passage')!;
    expect(entry.raises[4].text).toMatch(/open an existing/i);
  });

  it('resolves legacy ritual-* ids to Core Rituals', () => {
    expect(getCoreRitualById('ritual-seal-passage')?.id).toBe('seal-passage');
    expect(getCoreRitualById('ritual-detect-magic')?.id).toBe('read-resonance');
  });

  it('maps the old Detect Magic id to Read Resonance', () => {
    expect(getRitualById('ritual-detect-magic')?.id).toBe('ritual-read-resonance');
  });
});
