/**
 * Martial Skills (Hand-to-Hand, Melee Weapons, Ranged Weapons, Defensive
 * Combat, Combat Reflexes) no longer exist. The retired Skill keys survive only as a
 * migration lookup; combat rolls stand as rolled.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LEGACY_SKILL_CATALOG, LEGACY_SKILL_CATEGORIES } from '../src/migrations/legacy-skill-catalog';
import {
  LEGACY_SKILL_QUARANTINE_FLAG,
  quarantineLegacySkillWrites,
  stripLegacySkillWrites,
} from '../src/utils/legacy-skill-write-guard';
import { getTargetEvade } from '../src/combat/target-defenses';
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

describe('the fixed Skill catalog is retired', () => {
  it('no runtime Skill catalog module remains', () => {
    expect(existsSync(resolve('src/utils/skills.ts'))).toBe(false);
    expect(existsSync(resolve('dist/utils/skills.js'))).toBe(false);
  });

  it('the migration lookup lists none of the Martial Skills or a Martial category', () => {
    for (const key of LEGACY_KEYS) expect(LEGACY_SKILL_CATALOG[key]).toBeUndefined();
    const names = Object.values(LEGACY_SKILL_CATALOG).map((s) => s.name);
    for (const name of LEGACY_NAMES) expect(names).not.toContain(name);
    expect(Object.values(LEGACY_SKILL_CATEGORIES)).not.toContain('Martial');
    expect(Object.keys(LEGACY_SKILL_CATALOG)).toHaveLength(31);
  });

  it('only migrations import the lookup', () => {
    const offenders: string[] = [];
    for (const file of walk(resolve('src'), ['.ts'])) {
      if (file.startsWith(resolve('src/migrations') + sep)) continue;
      if (/legacy-skill-catalog/.test(readFileSync(file, 'utf8'))) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});

describe('no runtime code writes retired Skill or Echo Card data', () => {
  // Deletions (`-=`) are allowed; any set of these paths would recreate legacy state.
  const WRITE_PATTERN =
    /['"`]system\.(?:skills|skillsSpent|skillPoints|creation\.skillsRedistributing|creation\.skillsRedistributeBackup|postCreationProgress\.(?:skills|skillsSpent|skillPointsUnspent)|echo\.(?:selectedCardIds|cardUses)|echoCards)\b/;
  const allowed = new Set([resolve('src/utils/legacy-skill-write-guard.ts')]);

  it('runtime sources outside src/migrations', () => {
    const offenders: string[] = [];
    for (const file of walk(resolve('src'), ['.ts'])) {
      if (file.startsWith(resolve('src/migrations') + sep) || allowed.has(file)) continue;
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        if (WRITE_PATTERN.test(line)) offenders.push(`${relative(resolve('.'), file)}:${i + 1}`);
      });
    }
    expect(offenders).toEqual([]);
  });

  it('the scan catches a legacy write', () => {
    expect(WRITE_PATTERN.test(`await actor.update({ 'system.skills.athletics': 2 });`)).toBe(true);
    expect(WRITE_PATTERN.test(`updates['system.echo.cardUses'] = {};`)).toBe(true);
    expect(WRITE_PATTERN.test(`updates['system.echo.-=cardUses'] = null;`)).toBe(false);
  });

  it('the write guard quarantines Echo Card picks from an old export', () => {
    const create: any = { system: { echo: { key: 'humans', selectedCardIds: ['c1'], cardUses: { c1: true } } } };
    quarantineLegacySkillWrites(create);
    expect(create.system.echo).toEqual({ key: 'humans' });
    const entry = create.flags['mastery-system'][LEGACY_SKILL_QUARANTINE_FLAG].entries[0];
    expect(entry.values['system.echo.selectedCardIds']).toEqual(['c1']);
    const flat: any = { 'system.echo.cardUses': {}, 'system.echo.-=selectedCardIds': null };
    stripLegacySkillWrites(flat);
    expect(flat).toEqual({ 'system.echo.-=selectedCardIds': null });
  });

  it('template.json seeds no Echo Card fields', () => {
    const template = JSON.parse(read('template.json'));
    expect(template.Actor.character.echo.selectedCardIds).toBeUndefined();
    expect(template.Actor.character.echo.cardUses).toBeUndefined();
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
    // DF 2026: the chat card no longer renders any post-roll Skill spend panel.
    expect(rollHandler).not.toMatch(/spend-skill-success|skillSpendOptions|skill-spend-panel/);
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
    resolve('src/migrations/legacy-cleanup-2026-migration.ts'),
  ]);
  // Embedded DF 2026 catalogs may use plain English like "defensive combat effect"
  // in imprint/ritual flavor — not the retired Martial Skill keys.
  const skipDirs = [resolve('src/rules/data')];

  it('runtime sources', () => {
    const offenders: string[] = [];
    for (const file of walk(resolve('src'), ['.ts'])) {
      if (allowed.has(file)) continue;
      if (skipDirs.some((d) => {
        const rel = relative(d, file);
        return rel !== '' && !rel.startsWith('..') && !rel.startsWith(`..${sep}`);
      })) continue;
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

  it('template.json has no legacy Skill fields', () => {
    const template = JSON.parse(read('template.json'));
    for (const key of ['skills', 'skillsSpent', 'skillPoints']) {
      expect(template.Actor.character[key]).toBeUndefined();
    }
    expect(template.Actor.npc.skills).toBeUndefined();
    expect(template.Actor.character.creation.skillsRedistributing).toBeUndefined();
  });
});
