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
    expect(ctx.battle.activeBuffDuration).toBe(2);
    expect(ctx.battle.activeBuffRoundBoxes).toEqual([1, 2]);
  });

  it('scales Active Buff round boxes to Mastery Rank', () => {
    const ctx = buildCharacterPrintContext(mockCharacter(4)) as any;
    expect(ctx.battle.activeBuffDuration).toBe(4);
    expect(ctx.battle.activeBuffRoundBoxes).toEqual([1, 2, 3, 4]);
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

  it('prints the full skill catalog by category with Perception elevated', () => {
    const ctx = buildCharacterPrintContext(mockCharacter(2)) as any;
    expect(ctx.hasLearnedSkills).toBe(true);
    expect(ctx.perceptionSkill?.key).toBe('perception');
    expect(ctx.perceptionSkill?.poolChips).toHaveLength(3);
    expect(ctx.skillCategories.map((c: any) => c.label)).toEqual([
      'Physical',
      'Knowledge & Craft',
      'Social',
      'Survival',
      'Martial',
    ]);
    expect(ctx.learnedSkills.length).toBe(36);
    expect(ctx.learnedSkills.map((s: any) => s.name)).toEqual(
      expect.arrayContaining(['Melee Weapons', 'Athletics', 'Lore', 'Perception', 'Artisanry']),
    );
    expect(ctx.learnedSkills.every((s: any) => s.key !== 'perception' || s === ctx.perceptionSkill)).toBe(
      true,
    );
    const melee = ctx.learnedSkills.find((s: any) => s.key === 'meleeWeapons');
    expect(melee?.rating).toBe(2);
    expect(melee?.halfPool).toBe(true);
    expect(melee?.poolLabel).toBe('8k2');
    const lore = ctx.learnedSkills.find((s: any) => s.key === 'lore');
    expect(lore?.rating).toBe(0);
    expect(lore?.halfPool).toBe(true);
    expect(lore?.poolLabel).toBe('4k2');

    expect(ctx.coreCombat.evade).toBe(12);
    expect(ctx.coreCombat.armor).toBe(4);
    expect(ctx.coreCombat.movement).toBe('8 m');
    expect(ctx.coreCombat.attack).toMatch(/16k2/);
    // No equipped weapon on the mock — Weapon Damage is empty, not MR bonus dice.
    expect(String(ctx.coreCombat.damage)).toBe('—');
    // Defensive secondaries always print (0 / 0% when passives are absent).
    expect(ctx.coreCombat.damageNegation).toBe(0);
    expect(ctx.coreCombat.damageReduction).toBe('0%');
    expect(ctx.coreCombat.parry).toBe(0);
  });

  it('uses full skill pool when rating reaches 2× Mastery Rank', () => {
    const ctx = buildCharacterPrintContext(
      mockCharacter(2, { skills: { meleeWeapons: 4, athletics: 1, lore: 0 } }),
    ) as any;
    const melee = ctx.learnedSkills.find((s: any) => s.key === 'meleeWeapons');
    expect(melee?.halfPool).toBe(false);
    expect(melee?.poolLabel).toBe('16k2');
    const athletics = ctx.learnedSkills.find((s: any) => s.key === 'athletics');
    expect(athletics?.halfPool).toBe(true);
    expect(athletics?.poolLabel).toBe('8k2');
  });

  it('prints Damage Negation, Damage Reduction, and Parry from combat totals', () => {
    const ctx = buildCharacterPrintContext(
      mockCharacter(2, {
        combat: {
          speed: 8,
          armor: 0,
          evade: 10,
          evadeTotal: 12,
          armorTotal: 4,
          initiativeMasteryRank: 2,
          initiativeD8FromMechanics: 0,
          damageNegationReserve: 4,
          damageReductionPct: 20,
          parryPool: 3,
        },
      }),
    ) as any;
    expect(ctx.coreCombat.damageNegation).toBe(4);
    expect(ctx.coreCombat.damageReduction).toBe('20%');
    expect(ctx.coreCombat.parry).toBe(3);
  });

  it('keeps Core Combat defenses as flat totals (not nested under Attack/Evade)', () => {
    const ctx = buildCharacterPrintContext(mockCharacter(2)) as any;
    // Enumeration strip values — always present for table play pencil marks.
    expect(ctx.coreCombat).toEqual(
      expect.objectContaining({
        attack: expect.any(String),
        damage: expect.any(String),
        evade: expect.any(Number),
        armor: expect.any(Number),
        movement: expect.any(String),
        damageNegation: expect.any(Number),
        damageReduction: expect.any(String),
        parry: expect.any(Number),
      }),
    );
  });

  it('derives Reroll Points from Disadvantages (not a stale Faith Fractures max)', () => {
    const ctx = buildCharacterPrintContext(
      mockCharacter(2, {
        disadvantages: [
          { id: 'hunted', points: 1, details: { rank: '2' } },
          { id: 'unluck', points: 1, details: { rank: '1' } },
        ],
        // Stale / default pool — print must ignore this when disadvantages exist.
        faithFractures: { current: 2, maximum: 8 },
      }),
    ) as any;
    // hunted rank 2 = 2 pts, unluck rank 1 = 1 pt → 3 total
    expect(ctx.disadvantagePoints).toBe(3);
    expect(ctx.rerollPoints.maximum).toBe(3);
    expect(ctx.rerollPoints.current).toBe(2);
    expect(ctx.rerollPoints.boxes).toHaveLength(3);
    expect(ctx.rerollPoints.boxes.filter((b: any) => b.state === 'spent')).toHaveLength(1);
    expect(ctx.rerollPoints.boxes.filter((b: any) => b.state === 'available')).toHaveLength(2);
    expect(ctx.rerollBoxes).toHaveLength(3);
    expect(ctx.faithFractures).toEqual({ current: 2, maximum: 3 });
  });

  it('falls back to Faith Fractures when no disadvantages are present', () => {
    const ctx = buildCharacterPrintContext(
      mockCharacter(2, { faithFractures: { current: 5, maximum: 8 }, disadvantages: [] }),
    ) as any;
    expect(ctx.disadvantagePoints).toBe(0);
    expect(ctx.rerollPoints.current).toBe(5);
    expect(ctx.rerollPoints.maximum).toBe(8);
    expect(ctx.rerollPoints.boxes).toHaveLength(8);
    expect(ctx.rerollPoints.boxes.filter((b: any) => b.state === 'spent')).toHaveLength(3);
    expect(ctx.rerollPoints.boxes.filter((b: any) => b.state === 'available')).toHaveLength(5);
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

  it('shows Combat Reflexes use boxes on Page 1 and Page 2 Initiative', () => {
    const ctx = buildCharacterPrintContext(
      mockCharacter(2, { skills: { meleeWeapons: 2, combatReflexes: 4 } }),
    ) as any;
    const crSkill = ctx.learnedSkills.find((s: any) => s.key === 'combatReflexes');
    expect(crSkill).toBeTruthy();
    expect(crSkill.omitUseBoxes).toBeUndefined();
    expect(crSkill.boxes.length).toBe(4);
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

  it('opts into equipment modules when requested', () => {
    const ctx = buildCharacterPrintContext(mockCharacter(2), { includeModules: true }) as any;
    expect(ctx.includeModules).toBe(true);
    expect(ctx.pageTotal).toBe(3);
  });

  it('prints Health / Stress totals with write-in lost fields', () => {
    const ctx = buildCharacterPrintContext(mockCharacter(2)) as any;
    expect(ctx.healthBars[0].max).toBe(8);
    expect(ctx.healthBars[0].boxes).toBeUndefined();
    expect(ctx.stressBars[0].max).toBe(4);
    expect(ctx.stressBreakdown).toEqual({ name: 'Breakdown', max: 1 });
  });

  it('places Disadvantages under Attributes, Expressions under Health; Learned Skills full width', () => {
    const { readFileSync } = require('node:fs');
    const { join } = require('node:path');
    const hbs = readFileSync(join(process.cwd(), 'templates/actor/character-print.hbs'), 'utf8');
    const page1End = hbs.indexOf('print-page-stones');
    const page1 = hbs.slice(0, page1End);
    const body = page1.indexOf('cp-page1-body');
    const left = page1.indexOf('cp-col-left');
    const right = page1.indexOf('cp-col-right');
    const abilities = page1.indexOf('cp-abilities');
    const disadv = page1.indexOf('cp-disadvantages');
    const vitals = page1.indexOf('cp-vitals-compact');
    const exprs = page1.indexOf('cp-minor-expressions');
    const learned = page1.indexOf('cp-learned-skills-full');
    expect(body).toBeGreaterThan(-1);
    expect(left).toBeGreaterThan(body);
    expect(abilities).toBeGreaterThan(left);
    expect(disadv).toBeGreaterThan(abilities);
    expect(right).toBeGreaterThan(left);
    expect(vitals).toBeGreaterThan(right);
    expect(exprs).toBeGreaterThan(vitals);
    expect(learned).toBeGreaterThan(exprs);
    expect(page1.indexOf('cp-expertise-row')).toBe(-1);
    expect(hbs).toContain('cp-vital-total');
    expect(hbs).toContain('Lost Health Points');
    expect(hbs).toContain('Lost Stress');
    expect(hbs).toContain('Kleinere Expressionen');
    expect(hbs).toContain('Nutzungen / Rast');
  });

  it('keeps Minor Expressions as a compact shared row in table CSS', () => {
    const { readFileSync } = require('node:fs');
    const { join } = require('node:path');
    const css = readFileSync(join(process.cwd(), 'styles/character-print.css'), 'utf8');
    expect(css).toContain('.print-page-1.print-page-table .cp-minor-list');
    expect(css).toMatch(/\.print-page-1\.print-page-table \.cp-minor-list\s*\{[^}]*flex-direction:\s*row/s);
    expect(css).toMatch(/\.print-page-1\.print-page-table \.cp-minor-body\s*\{[^}]*white-space:\s*nowrap/s);
    expect(css).toMatch(/\.mastery-print\.is-dark:not\(\.is-compact\) \.cp-battle-card-roll\s*\{[^}]*color:\s*#9ec5f5/s);
    expect(css).toMatch(/\.mastery-print\.is-dark:not\(\.is-compact\) \.cp-sd-exhausted\s*\{[^}]*background:\s*#1c1916/s);
    expect(css).toMatch(/\.mastery-print\.is-dark:not\(\.is-compact\) \.cp-sd-exhausted-label\s*\{[^}]*color:\s*#e6e1d6/s);
  });
  it('exposes light and dark body classes for the table sheet', async () => {
    const { characterPrintBodyClass } = await import('../src/sheets/character-print');
    expect(characterPrintBodyClass()).toBe('mastery-print is-light');
    expect(characterPrintBodyClass({ theme: 'light' })).toBe('mastery-print is-light');
    expect(characterPrintBodyClass({ theme: 'dark' })).toBe('mastery-print is-dark');
    expect(characterPrintBodyClass({ layout: 'compact' })).toBe('mastery-print is-compact is-dark');
  });
});
