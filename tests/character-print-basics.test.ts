import { describe, expect, it } from 'vitest';
import { buildCharacterPrintContext } from '../src/sheets/character-print';

function mockCharacter(mr = 2, overrides: Record<string, unknown> = {}) {
  return {
    type: 'character',
    name: 'Tester',
    system: {
      mastery: { rank: mr },
      attributes: {
        might: { value: 16 },
        agility: { value: 8 },
        vitality: { value: 8 },
        intellect: { value: 8 },
        resolve: { value: 8 },
        influence: { value: 8 },
        wits: { value: 8 },
      },
      combat: {
        speed: 8,
        armor: 0,
        evade: 10,
        evadeTotal: 12,
        armorTotal: 4,
        initiativeMasteryRank: mr,
        initiativeD8FromMechanics: 0,
      },
      health: {
        bars: [
          { name: 'Healthy', max: 8, current: 8, penalty: 0 },
          { name: 'Bruised', max: 8, current: 8, penalty: -1 },
        ],
      },
      stress: { bars: [{ name: 'Healthy', max: 4, current: 4 }] },
      skills: { meleeWeapons: 2, athletics: 1, lore: 0 },
      skillsSpent: {},
      disadvantages: [],
      stonePools: {
        might: { max: 2, current: 2 },
        agility: { max: 1, current: 1 },
      },
      faithFractures: { current: 0, maximum: 8 },
      ...overrides,
    },
    items: [],
  };
}

describe('character print table sheet', () => {
  it('defaults Basic Reactions on and Basic Attack off', () => {
    const ctx = buildCharacterPrintContext(mockCharacter(2)) as any;
    const activeNames = (ctx.battle?.active ?? []).map((p: any) => p.name);
    const reactionNames = (ctx.battle?.reactions ?? []).map((p: any) => p.name);
    expect(activeNames).not.toContain('Basic Attack');
    expect(reactionNames).toEqual(expect.arrayContaining(['Guard', 'Evade', 'Counterattack']));
    expect(ctx.battle?.includeStandardManeuvers).toBe(true);
    expect(ctx.battle?.showBasicAttack).toBe(false);
    expect(ctx.specialRecovery).toBe(2);
    expect(ctx.specialCap).toBe(8);
    expect(ctx.pageTotal).toBe(3);
    expect(ctx.includeModules).toBe(false);
  });

  it('can omit standard maneuvers when explicitly disabled', () => {
    const ctx = buildCharacterPrintContext(mockCharacter(2), {
      includeStandardManeuvers: false,
    }) as any;
    const activeNames = (ctx.battle?.active ?? []).map((p: any) => p.name);
    const reactionNames = (ctx.battle?.reactions ?? []).map((p: any) => p.name);
    expect(activeNames).not.toContain('Basic Attack');
    expect(reactionNames).not.toContain('Guard');
    expect(ctx.battle?.includeStandardManeuvers).toBe(false);
  });

  it('seeds Basic Attack when showBasicAttack is enabled', () => {
    const ctx = buildCharacterPrintContext(mockCharacter(3), { showBasicAttack: true }) as any;
    const active = ctx.battle?.active ?? [];
    expect(active[0]?.name).toBe('Basic Attack');
    expect(active[0]?.damageRoll).toBe('Weapon + 6d8');
    const reactions = ctx.battle?.reactions ?? [];
    expect(reactions.map((r: any) => r.name)).toEqual(['Guard', 'Evade', 'Counterattack']);
    expect(reactions[0]?.damageRoll).toBe('+6 Armor');
    expect(reactions[1]?.damageRoll).toBe('+6 Evade');
    expect(reactions[2]?.damageRoll).toBe('Weapon + 6d8');
    expect(ctx.battle?.showBasicAttack).toBe(true);
  });

  it('prints only learned skills and core combat finished values', () => {
    const ctx = buildCharacterPrintContext(mockCharacter(2)) as any;
    expect(ctx.hasLearnedSkills).toBe(true);
    expect(ctx.learnedSkills.map((s: any) => s.name)).toEqual(
      expect.arrayContaining(['Melee Weapons', 'Athletics']),
    );
    expect(ctx.learnedSkills.every((s: any) => s.rating > 0)).toBe(true);
    expect(ctx.learnedSkills.some((s: any) => /lore/i.test(s.name))).toBe(false);

    expect(ctx.coreCombat.evade).toBe(12);
    expect(ctx.coreCombat.armor).toBe(4);
    expect(ctx.coreCombat.movement).toBe('8 m');
    expect(ctx.coreCombat.attack).toMatch(/16k2/);
    // No equipped weapon on the mock — Weapon Damage is empty, not MR bonus dice.
    expect(String(ctx.coreCombat.damage)).toBe('—');
  });

  it('builds a stone dashboard with cube-zone copy and pools', () => {
    const ctx = buildCharacterPrintContext(mockCharacter(3)) as any;
    expect(ctx.stoneDashboard.regeneration).toBe(3);
    expect(ctx.stoneDashboard.iniStoneCost).toBe(12);
    expect(ctx.stoneDashboard.initiative).toBe('3d8');
    expect(ctx.stoneDashboard.exhaustedSlots.length).toBeGreaterThanOrEqual(6);
    const might = ctx.stoneDashboard.pools.find((p: any) => p.key === 'might');
    expect(might.max).toBe(2);
    expect(might.slots.length).toBe(2);
    expect(might.generation).toBe(2);
    expect(ctx.stoneDashboard.hasStonePowers).toBe(true);
    expect(ctx.stoneDashboard.powerGroups.length).toBeGreaterThan(0);
    const mightGroup = ctx.stoneDashboard.powerGroups.find((g: any) => g.key === 'might');
    expect(mightGroup).toBeTruthy();
    const melee = mightGroup.powers.find((p: any) => /melee damage/i.test(p.name));
    expect(melee.summary).toMatch(/2\/4\/8\/16/);
    expect(melee.paymentTiers.map((t: any) => t.label)).toEqual(['T1', 'T2', 'T3']);
    expect(melee.paymentTiers.map((t: any) => t.layout)).toEqual(['t1', 't2', 't3']);
    expect(melee.paymentTiers.map((t: any) => t.boxes.length)).toEqual([1, 2, 4]);
    const parry = mightGroup.powers.find((p: any) => /parry/i.test(p.name));
    expect(parry.summary).toMatch(/\+4 per Tier/i);
    expect(parry.paymentTiers[0].label).toBe('T2');
    expect(parry.paymentTiers.every((t: any) => t.label !== 'T1')).toBe(true);
    expect(parry.oncePerCombat).toBe(false);

    const witsGroup = ctx.stoneDashboard.powerGroups.find((g: any) => g.key === 'wits');
    const initiativeBoost = witsGroup.powers.find((p: any) => /initiative boost/i.test(p.name));
    expect(initiativeBoost.oncePerCombat).toBe(true);
    const phasing = witsGroup.powers.find((p: any) => /^phasing$/i.test(p.name));
    expect(phasing.oncePerCombat).toBe(true);
    expect(phasing.paymentTiers[0].label).toBe('T2');
    expect(phasing.summary).toMatch(/\+1 per Tier/i);
    const onceCount = ctx.stoneDashboard.powerGroups
      .flatMap((g: any) => g.powers)
      .filter((p: any) => p.oncePerCombat).length;
    expect(onceCount).toBe(2);
    expect(ctx.stoneDashboard.combatReflexes).toBeNull();
  });

  it('puts Combat Reflexes usage boxes on Page 2 Initiative only', () => {
    const ctx = buildCharacterPrintContext(
      mockCharacter(2, { skills: { meleeWeapons: 2, combatReflexes: 4 } }),
    ) as any;
    const crSkill = ctx.learnedSkills.find((s: any) => s.key === 'combatReflexes');
    expect(crSkill).toBeTruthy();
    expect(crSkill.omitUseBoxes).toBe(true);
    expect(crSkill.boxes).toEqual([]);
    expect(ctx.stoneDashboard.combatReflexes).toBeTruthy();
    expect(ctx.stoneDashboard.combatReflexes.rating).toBe(4);
    expect(ctx.stoneDashboard.combatReflexes.boxes.length).toBe(4);
  });

  it('summarizes stone powers like Quick Play (short + per Tier / list)', async () => {
    const { summarizeStonePowerPrint } = await import('../src/sheets/character-print');
    expect(
      summarizeStonePowerPrint({
        id: 'generic.extraAttack',
        name: 'Extra Attack',
        description: 'Gain additional Attack Actions this round (T2: +1, T3: +2, T4: +3).',
        tiers: [
          { value: 1, description: 'Gain 1 additional Attack Action this round.' },
          { value: 2 },
          { value: 3 },
        ],
      }),
    ).toMatch(/\+1 per Tier/i);
    expect(
      summarizeStonePowerPrint({
        id: 'agility.crit',
        name: 'Crit',
        description: 'A number of your attacks…',
        tiers: [{ value: 1 }, { value: 2 }, { value: 3 }],
      }),
    ).toMatch(/One attack per Tier/i);
  });

  it('uses empty pencil Health / Stress boxes', () => {
    const ctx = buildCharacterPrintContext(mockCharacter(2)) as any;
    expect(ctx.healthBars[0].boxes.length).toBe(8);
    expect(ctx.healthBars[0].boxes.every((b: any) => b.filled === false)).toBe(true);
    expect(ctx.stressBars[0].boxes.every((b: any) => b.filled === false)).toBe(true);
  });

  it('opts into equipment modules when requested', () => {
    const ctx = buildCharacterPrintContext(mockCharacter(2), { includeModules: true }) as any;
    expect(ctx.includeModules).toBe(true);
    expect(ctx.pageTotal).toBe(3);
  });
});
