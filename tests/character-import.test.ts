import { describe, expect, it } from 'vitest';
import {
  buildActorCreateDataFromPayload,
  buildPowerItemsFromGrantSpecs,
  IMPORT_STARTING_ATTRIBUTE_STONES,
  isKnownArtifactImportKey,
  normalizeImportAttributes,
  normalizeImportStoneAssignments,
  resolveEchoArtifactImportKeys,
  resolvePowerGrantSpecs,
  sumImportStoneAssignments,
} from '../src/import/character-import-build.js';
import {
  validateCharacterImportDocument,
  validateCharacterImportJson,
} from '../src/import/character-import-validation.js';

const startingSpecializations = [
  { name: 'Acrobatics', field: 'finesse', scope: 'Balance and tumbling', rank: 2 },
  { name: 'Athletics', field: 'physical', scope: 'Climbing and swimming', rank: 2 },
  { name: 'Stealth', field: 'finesse', scope: 'Moving unseen', rank: 2 },
  { name: 'Investigation', field: 'investigation', scope: 'Searching scenes', rank: 2 },
  { name: 'Persuasion', field: 'social', scope: 'Convincing others', rank: 2 },
];

const startingStones = { might: 1, agility: 1 };

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
  stones: startingStones,
  permanentColorless: 0,
  masteryRank: 4,
  specializations: startingSpecializations,
  skills: { acrobatics: 2, athletics: 1 },
  disadvantages: [{ id: 'hunted', points: 2, details: { hunter: 'The Pale Court' } }],
  minorExpressions: ['might-set-your-feet', 'agility-soft-step'],
  echoImprints: ['mage-hand', 'catfall', 'message', 'arcane-spark'],
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

  it('accepts zero disadvantages (they are optional at creation)', () => {
    for (const disadvantages of [[], undefined]) {
      const result = validateCharacterImportDocument({
        schemaVersion: 1,
        exportKind: 'mastery-character-import',
        systemId: 'mastery-system',
        character: { ...alarisPayload, disadvantages },
      });
      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    }
  });

  it('still rejects more than 8 disadvantage points', () => {
    const result = validateCharacterImportDocument({
      schemaVersion: 1,
      exportKind: 'mastery-character-import',
      systemId: 'mastery-system',
      character: {
        ...alarisPayload,
        disadvantages: [
          { id: 'hunted', points: 5, details: {} },
          { id: 'addiction', points: 5, details: {} },
        ],
      },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /maximum is 8/i.test(e))).toBe(true);
  });

  it('requires exactly two starting Attribute Stones when creation is complete', () => {
    expect(IMPORT_STARTING_ATTRIBUTE_STONES).toBe(2);
    const missing = validateCharacterImportDocument({
      schemaVersion: 1,
      exportKind: 'mastery-character-import',
      systemId: 'mastery-system',
      character: { ...alarisPayload, stones: undefined },
    });
    expect(missing.ok).toBe(false);
    expect(missing.errors.some((e) => /Attribute Stones/i.test(e))).toBe(true);

    const wrongSum = validateCharacterImportDocument({
      schemaVersion: 1,
      exportKind: 'mastery-character-import',
      systemId: 'mastery-system',
      character: { ...alarisPayload, stones: { might: 2, agility: 1 } },
    });
    expect(wrongSum.ok).toBe(false);
    expect(wrongSum.errors.some((e) => /exactly 2/i.test(e))).toBe(true);

    const incomplete = validateCharacterImportDocument({
      schemaVersion: 1,
      exportKind: 'mastery-character-import',
      systemId: 'mastery-system',
      character: { ...alarisPayload, creationComplete: false, stones: undefined },
    });
    expect(incomplete.ok).toBe(true);
  });

  it('rejects unknown stone attribute keys', () => {
    const result = validateCharacterImportDocument({
      schemaVersion: 1,
      exportKind: 'mastery-character-import',
      systemId: 'mastery-system',
      character: { ...alarisPayload, stones: { might: 1, agility: 1, luck: 0 } as any },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /Unknown stone attribute/i.test(e))).toBe(true);
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
    expect(system.attributes.might.stones).toBe(1);
    expect(system.attributes.agility.stones).toBe(1);
    expect(system.progression.stoneAssignments.might).toBe(1);
    expect(system.progression.stoneAssignments.agility).toBe(1);
    expect(sumImportStoneAssignments(system.progression.stoneAssignments)).toBe(2);
    expect(system.progression.permanentColorless).toBe(0);
    expect(system.stonePools.might.max).toBe(0);
    expect(system.progression.v099Stones).toBe(true);
    expect(system.progression.lifetimeXp).toBeUndefined();
    expect((data.flags as any)['mastery-system'].needsV099LifetimeXp).toBe(true);
    expect(system.mastery.rank).toBe(4);
    expect(system.skills.acrobatics).toBe(2);
    expect(system.disadvantages).toHaveLength(1);
    expect(system.faithFractures.maximum).toBe(2);
    expect(system.minorExpressions).toEqual(['might-set-your-feet', 'agility-soft-step']);
  });

  it('normalizes stone assignments and permanent colorless', () => {
    const stones = normalizeImportStoneAssignments({ might: 2, agility: -1, luck: 9 } as any);
    expect(stones.might).toBe(2);
    expect(stones.agility).toBe(0);
    expect(stones.vitality).toBe(0);
    expect(sumImportStoneAssignments(stones)).toBe(2);
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

  it('applies echo details like the in-game dialog', () => {
    const data = buildActorCreateDataFromPayload({
      ...alarisPayload,
      echo: {
        key: 'dwarfs',
        selectedCardIds: ['dwarf-start-1'],
        artifactKeys: ['stoneboundSoles'],
      },
      languages: { known: ['common'] },
    } as any);
    const system = data.system as any;
    expect(system.echo.key).toBe('dwarfs');
    expect(system.echo.selectedCardIds).toEqual(['dwarf-start-1']);
    expect(system.bio.echo.length).toBeGreaterThan(0);
    expect(typeof system.echo.traitUses).toBe('object');
    // Echo-locked language is enforced even when the payload omits it.
    expect(system.languages.known).toContain('common');
  });

  it('resolves explicit echo artifact keys', () => {
    const keys = resolveEchoArtifactImportKeys({
      ...alarisPayload,
      echo: { key: 'dwarfs', artifactKeys: ['stoneboundSoles', 'stoneboundSoles'] },
    } as any);
    expect(keys).toEqual(['stoneboundSoles']);
  });

  it('resolves the Unbound artifact from identity + predator stone', () => {
    const witchKeys = resolveEchoArtifactImportKeys({
      ...alarisPayload,
      echo: { key: 'unbound', subChoiceKey: 'bane-greenwarden' },
    } as any);
    expect(witchKeys).toEqual(['greenWardenMantle']);
  });

  it('sets unboundShape and towerWizardPackageId bookkeeping', () => {
    const data = buildActorCreateDataFromPayload({
      ...alarisPayload,
      powers: undefined,
      echo: { key: 'unbound', subChoiceKey: 'bane-greenwarden', unboundShape: 'Wolf' },
      combatPackage: {
        defenseId: 'evade',
        secondPassiveTemplateId: 'passive-temp-hp',
        activeBuffMode: 'defensive',
        offenseActivePicks: [
          { pickId: 'active-melee-weapon-single', templateId: 'active-melee-weapon-single' },
          {
            pickId: 'active-melee-damage-t4::ruin',
            templateId: 'active-melee-damage-t4',
            special: 'ruin',
          },
        ],
        delivery: 'melee',
        weakenSave: null,
      },
    } as any);
    const system = data.system as any;
    expect(system.echo.unboundShape).toBe('Wolf');
    expect(system.creation.towerWizardPackageId).toBe(
      'evade__active-melee-weapon-single__active-melee-damage-t4::ruin',
    );
  });
});
