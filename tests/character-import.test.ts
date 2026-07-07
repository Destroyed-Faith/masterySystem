import { describe, expect, it } from 'vitest';
import {
  buildActorCreateDataFromPayload,
  buildPowerItemsFromGrantSpecs,
  isKnownArtifactImportKey,
  normalizeImportAttributes,
  resolvePowerGrantSpecs,
} from '../src/import/character-import-build.js';
import {
  validateCharacterImportDocument,
  validateCharacterImportJson,
} from '../src/import/character-import-validation.js';

const alarisPayload = {
  name: 'Alaris',
  attributes: {
    might: 16,
    agility: 16,
    vitality: 14,
    intellect: 10,
    resolve: 12,
    influence: 8,
    wits: 10,
  },
  masteryRank: 4,
  skills: { meleeWeapons: 2, athletics: 1 },
  disadvantages: [{ id: 'hunted', points: 2, details: { hunter: 'The Pale Court' } }],
  minorExpressions: ['might-set-your-feet', 'agility-soft-step'],
  powers: [
    { templateId: 'passive-evade', rank: 4 },
    { templateId: 'passive-temp-hp', rank: 4 },
    { templateId: 'ab-evade', rank: 4 },
    { templateId: 'reaction-evade', rank: 4 },
    { templateId: 'active-melee-weapon-single', rank: 2 },
    { templateId: 'active-melee-damage-t4', special: 'ruin', rank: 2 },
  ],
  artifacts: [{ key: 'moonlightGreatsword', level: 4, activated: true }],
};

describe('character-import validation', () => {
  it('accepts a valid mastery-character-import document', () => {
    const result = validateCharacterImportDocument({
      schemaVersion: 1,
      exportKind: 'mastery-character-import',
      systemId: 'mastery-system',
      character: alarisPayload,
    });
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects wrong exportKind', () => {
    const result = validateCharacterImportJson(
      JSON.stringify({ schemaVersion: 1, exportKind: 'other', systemId: 'mastery-system' }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/exportKind/i);
  });

  it('rejects missing name', () => {
    const result = validateCharacterImportDocument({
      schemaVersion: 1,
      exportKind: 'mastery-character-import',
      systemId: 'mastery-system',
      character: { ...alarisPayload, name: '' },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /name/i.test(e))).toBe(true);
  });

  it('rejects wrong power count', () => {
    const result = validateCharacterImportDocument({
      schemaVersion: 1,
      exportKind: 'mastery-character-import',
      systemId: 'mastery-system',
      character: {
        ...alarisPayload,
        powers: [{ templateId: 'passive-evade', rank: 4 }],
      },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /6 powers/i.test(e))).toBe(true);
  });
});

describe('character-import build', () => {
  it('normalizes attributes into actor.system shape', () => {
    const attrs = normalizeImportAttributes({ might: 16, agility: 8 });
    expect(attrs.might).toBe(16);
    expect(attrs.agility).toBe(8);
    expect(attrs.vitality).toBe(2);
  });

  it('builds actor create data with stone pools', () => {
    const data = buildActorCreateDataFromPayload(alarisPayload);
    expect(data.name).toBe('Alaris');
    expect(data.type).toBe('character');
    const system = data.system as any;
    expect(system.attributes.might.value).toBe(16);
    expect(system.stonePools.might.max).toBe(2);
    expect(system.mastery.rank).toBe(4);
    expect(system.skills.meleeWeapons).toBe(2);
    expect(system.disadvantages).toHaveLength(1);
    expect(system.faithFractures.maximum).toBe(2);
    expect(system.minorExpressions).toEqual(['might-set-your-feet', 'agility-soft-step']);
  });

  it('resolves six power grant specs', () => {
    const specs = resolvePowerGrantSpecs(alarisPayload);
    expect(specs).toHaveLength(6);
  });

  it('expands power items from catalog', () => {
    const specs = resolvePowerGrantSpecs(alarisPayload)!;
    const items = buildPowerItemsFromGrantSpecs(specs);
    expect(items).toHaveLength(6);
    expect(items.every((i) => i.type === 'power')).toBe(true);
    const ignite = items.find((i) => (i.system as any).templateId === 'active-melee-damage-t4');
    expect(ignite).toBeTruthy();
  });

  it('knows moonlight greatsword artifact key', () => {
    expect(isKnownArtifactImportKey('moonlightGreatsword')).toBe(true);
    expect(isKnownArtifactImportKey('notReal')).toBe(false);
  });
});
