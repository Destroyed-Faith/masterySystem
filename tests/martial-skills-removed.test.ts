/**
 * Martial Skills (Hand-to-Hand, Melee Weapons, Ranged Weapons, Defensive
 * Combat, Combat Reflexes) no longer exist. Combat rolls stand as rolled;
 * only Skill Checks and Rituals still spend Skill Points.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SKILLS, SKILL_CATEGORIES, getSkillsByCategory } from '../src/utils/skills';
import {
  RITUALS,
  RITUAL_CATEGORY_LABELS,
  RITUAL_SKILLS_BY_CATEGORY,
  eligibleSkillsForRitual,
} from '../src/utils/rituals';
import { getTargetEvade } from '../src/combat/target-defenses';
import {
  applySkillSpendToActor,
  getSkillSpendOptions,
} from '../src/epic-roll/epic-mastery-roll-skill-spend';
import { COMBAT_MANEUVERS } from '../src/system/combat-maneuvers';

const LEGACY_KEYS = ['handToHand', 'meleeWeapons', 'rangedWeapons', 'defensiveCombat', 'combatReflexes'];
const LEGACY_NAMES = ['Hand-to-Hand', 'Melee Weapons', 'Ranged Weapons', 'Defensive Combat', 'Combat Reflexes'];
const LEGACY_PATTERN = new RegExp(
  [...LEGACY_KEYS, ...LEGACY_NAMES, 'Martial Skill'].map((s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|'),
  'i',
);

function walk(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) out.push(...walk(abs, exts));
    else if (exts.some((e) => abs.endsWith(e))) out.push(abs);
  }
  return out;
}

function read(rel: string): string {
  return readFileSync(resolve(rel), 'utf8');
}

describe('Martial Skills are gone from the active Skill system', () => {
  it('Skill selection / allocation lists none of the removed Skills or a Martial category', () => {
    for (const key of LEGACY_KEYS) expect(SKILLS[key]).toBeUndefined();
    const names = Object.values(SKILLS).map((s) => s.name);
    for (const name of LEGACY_NAMES) expect(names).not.toContain(name);
    expect(Object.values(SKILL_CATEGORIES)).not.toContain('Martial');
    expect(Object.keys(getSkillsByCategory())).not.toContain('Martial');
    expect(Object.keys(SKILLS)).toHaveLength(31);
  });

  it('Ritual Skill categories have no Martial category and still resolve eligible Skills', () => {
    expect((RITUAL_CATEGORY_LABELS as Record<string, string>).martial).toBeUndefined();
    expect((RITUAL_SKILLS_BY_CATEGORY as Record<string, readonly string[]>).martial).toBeUndefined();
    const catalogNames = new Set(Object.values(SKILLS).map((s) => s.name));
    for (const skillList of Object.values(RITUAL_SKILLS_BY_CATEGORY)) {
      for (const name of skillList) {
        expect(catalogNames.has(name)).toBe(true);
        expect(LEGACY_NAMES).not.toContain(name);
      }
    }
    for (const ritual of RITUALS) {
      const eligible = eligibleSkillsForRitual(ritual);
      expect(eligible.length).toBeGreaterThan(0);
      for (const name of eligible) expect(LEGACY_NAMES).not.toContain(name);
    }
  });

  it('normal non-combat Skill Point spending still works', async () => {
    const updates: Record<string, unknown>[] = [];
    const actor: any = {
      system: { skills: { perception: 8 }, skillsSpent: { perception: 2 }, mastery: { rank: 2 } },
      update: async (data: Record<string, unknown>) => {
        updates.push(data);
      },
    };
    const roll: any = { kept: [5, 6], tn: 14, success: false, raises: 0 };
    const { remainingPool, options } = getSkillSpendOptions(actor, 'perception', roll);
    expect(remainingPool).toBe(6);
    expect(options.map((o) => o.amount)).toEqual([2, 4, 6]);
    expect(options.find((o) => o.amount === 4)?.success).toBe(true);
    await applySkillSpendToActor(actor, 'perception', 4);
    expect(updates[0]).toEqual({ 'system.skillsSpent.perception': 6 });
  });
});

describe('combat resolves without Skill Points', () => {
  const attackHandler = read('src/chat/attack-roll-handler.ts');
  const tokenSelector = read('src/token-action-selector.ts');
  const rollHandler = read('src/dice/roll-handler.ts');
  const initiativeRoll = read('src/combat/initiative-roll.ts');
  const actorDoc = read('src/documents/actor.ts');
  const targetDefenses = read('src/combat/target-defenses.ts');

  it('attack rolls carry no Skill spend path', () => {
    for (const src of [attackHandler, tokenSelector]) {
      expect(src).not.toMatch(LEGACY_PATTERN);
      expect(src).not.toMatch(/isSkillRoll\s*:\s*true/);
      expect(src).not.toMatch(/skillKey\s*:/);
    }
    // The chat card only renders the "Spend Skill Points" panel for Skill rolls.
    expect(rollHandler).toMatch(/isSkillRoll && skillKey && actorId && skillSpendOptions\.length > 0/);
    expect(rollHandler).not.toMatch(LEGACY_PATTERN);
  });

  it('Initiative has no Combat Reflexes spend path', () => {
    expect(initiativeRoll).not.toMatch(LEGACY_PATTERN);
    expect(initiativeRoll).not.toMatch(/skillsSpent|skills\?\./);
    expect(initiativeRoll).toMatch(/const totalInitiative =\s*diceTotal \+\s*equipmentInitiativeModifier/);
  });

  it('Evade cannot be raised with Defensive Combat', () => {
    expect(actorDoc).not.toMatch(LEGACY_PATTERN);
    expect(targetDefenses).not.toMatch(LEGACY_PATTERN);
    expect(targetDefenses).not.toMatch(/skills/);
    const target = {
      system: { combat: { evadeTotal: 12, evadeFromActiveBuffs: 2 }, skills: { defensiveCombat: 8 } },
      getFlag: () => undefined,
    };
    expect(getTargetEvade(target)).toBe(14);
  });

  it('Grapple no longer asks for Hand-to-Hand', () => {
    const grapple = COMBAT_MANEUVERS.find((m: any) => m.id === 'grapple') as any;
    expect(grapple).toBeTruthy();
    expect(grapple.effect).not.toMatch(LEGACY_PATTERN);
    expect(grapple.effect).toMatch(/Opposed Physical Check/);
  });
});

describe('no player-facing surface mentions the removed Skills', () => {
  const allowed = new Set([
    resolve('src/migrations/martial-skills-refund-migration.ts'),
    resolve('src/progression/xp-consistency.ts'),
  ]);

  it('runtime sources', () => {
    const offenders: string[] = [];
    for (const file of walk(resolve('src'), ['.ts'])) {
      if (allowed.has(file)) continue;
      if (LEGACY_PATTERN.test(readFileSync(file, 'utf8'))) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it('templates, chat cards, dialogs, and localization', () => {
    const offenders: string[] = [];
    for (const file of [...walk(resolve('templates'), ['.hbs']), ...walk(resolve('lang'), ['.json'])]) {
      if (LEGACY_PATTERN.test(readFileSync(file, 'utf8'))) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it('template.json ships the unspent Skill Point pool', () => {
    const template = JSON.parse(read('template.json'));
    expect(template.Actor.character.skillPoints).toEqual({ unspent: 0, placed: {} });
  });
});
