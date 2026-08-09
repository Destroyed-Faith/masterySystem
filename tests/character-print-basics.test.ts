import { describe, expect, it } from 'vitest';
import { buildCharacterPrintContext } from '../src/sheets/character-print';

function mockCharacter(mr = 2) {
  return {
    type: 'character',
    name: 'Tester',
    system: {
      mastery: { rank: mr },
      attributes: {
        might: { value: 8 },
        agility: { value: 8 },
        vitality: { value: 8 },
        intellect: { value: 8 },
        resolve: { value: 8 },
        influence: { value: 8 },
        wits: { value: 8 },
      },
      combat: { speed: 8, armor: 0, evade: 10 },
      health: { bars: [] },
      stress: { bars: [] },
      skills: {},
      disadvantages: [],
      stonePools: {},
    },
    items: [],
  };
}

describe('character print standard maneuvers', () => {
  it('omits Basic Attack / Guard / Evade / Counterattack by default', () => {
    const ctx = buildCharacterPrintContext(mockCharacter(2)) as any;
    const activeNames = (ctx.battle?.active ?? []).map((p: any) => p.name);
    const reactionNames = (ctx.battle?.reactions ?? []).map((p: any) => p.name);
    expect(activeNames).not.toContain('Basic Attack');
    expect(reactionNames).not.toContain('Guard');
    expect(reactionNames).not.toContain('Evade');
    expect(reactionNames).not.toContain('Counterattack');
    expect(ctx.battle?.includeStandardManeuvers).toBe(false);
  });

  it('seeds Basic Attack + three Basic Reactions when requested', () => {
    const ctx = buildCharacterPrintContext(mockCharacter(3), {
      includeStandardManeuvers: true,
    }) as any;
    expect(ctx.battle?.includeStandardManeuvers).toBe(true);

    const active = ctx.battle?.active ?? [];
    expect(active[0]?.name).toBe('Basic Attack');
    expect(active[0]?.baseline).toBe(true);
    expect(active[0]?.damageRoll).toBe('Weapon + 6d8');

    const reactions = ctx.battle?.reactions ?? [];
    expect(reactions.map((r: any) => r.name)).toEqual(['Guard', 'Evade', 'Counterattack']);
    expect(reactions.every((r: any) => r.baseline === true)).toBe(true);
    expect(reactions[0]?.damageRoll).toBe('+6 Armor');
    expect(reactions[1]?.damageRoll).toBe('+6 Evade');
    expect(reactions[2]?.damageRoll).toBe('Weapon + 6d8');
  });
});
