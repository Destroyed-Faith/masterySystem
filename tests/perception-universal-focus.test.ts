import { describe, expect, it } from 'vitest';
import {
  CHARACTER_PERCEPTION_FIELD,
  CHARACTER_PERCEPTION_SPEC_ID,
  PERCEPTION_FOCUS_ATTRIBUTES,
  ensureCharacterHasPerceptionSpec,
  isCharacterPerceptionSpec,
  isPerceptionFocusAttribute,
  paidSpecializations,
  planSkillCheckDraft,
  specializationIdentityKey,
  type SkillCheckDraft,
  type SpecializationRecord,
} from '../src/rules/index.js';
import { buildDf2026ReviewPlan, buildDf2026ReviewUpdate } from '../src/migrations/df-2026-migration-review-plan.js';

const paidSpecs = (): SpecializationRecord[] =>
  ['Lockpicking', 'Athletics', 'Stealth', 'Persuasion', 'Alchemy'].map((name, i) => {
    const field = (['finesse', 'physical', 'finesse', 'social', 'science-craft'] as const)[i]!;
    return {
      id: specializationIdentityKey(name, field),
      name,
      field,
      scope: `${name} scope.`,
      rank: 2,
    };
  });

function actorSystem(over: Record<string, unknown> = {}) {
  return {
    mastery: { rank: 2 },
    attributes: {
      might: { value: 2 },
      agility: { value: 2 },
      vitality: { value: 2 },
      intellect: { value: 6 },
      resolve: { value: 5 },
      influence: { value: 2 },
      wits: { value: 8 },
    },
    specializations: ensureCharacterHasPerceptionSpec({
      specializations: paidSpecs(),
    }).specializations,
    progression: { rulesSchemaVersion: '2026.10.23' },
    ...over,
  };
}

function perceptionDraft(attributeKey: string): SkillCheckDraft {
  return {
    actorId: 'a1',
    paidRaises: 0,
    skill: { kind: 'perception' },
    attributeKey,
    baseTn: 8,
    taskDescription: 'Notice the ambush',
    source: {
      kind: 'sheet-verbal',
      gmVerified: false,
      taskDescription: 'Notice the ambush',
      attributeKey,
      baseTn: 8,
      skill: { kind: 'perception' },
    },
  };
}

describe('Perception universal Skill + Focus', () => {
  it('seeds Perception under the universal field, not Investigation', () => {
    const out = ensureCharacterHasPerceptionSpec({ specializations: paidSpecs() });
    const perc = out.specializations.find((s) => isCharacterPerceptionSpec(s));
    expect(perc).toMatchObject({
      id: CHARACTER_PERCEPTION_SPEC_ID,
      field: CHARACTER_PERCEPTION_FIELD,
      name: 'Perception',
      rank: 2,
    });
    expect(CHARACTER_PERCEPTION_FIELD).toBe('perception');
    expect(CHARACTER_PERCEPTION_SPEC_ID).toBe('perception:perception');
    expect(paidSpecializations(out.specializations)).toHaveLength(5);
  });

  it('migrates legacy investigation:perception to universal field', () => {
    const specs = [
      ...paidSpecs(),
      {
        id: 'investigation:perception',
        name: 'Perception',
        field: 'investigation' as const,
        scope: 'old',
        rank: 3,
      },
    ];
    const out = ensureCharacterHasPerceptionSpec({ specializations: specs });
    expect(out.changed).toBe(true);
    const perc = out.specializations.find((s) => isCharacterPerceptionSpec(s));
    expect(perc).toMatchObject({
      id: CHARACTER_PERCEPTION_SPEC_ID,
      field: 'perception',
      rank: 3,
    });
    expect(out.specializations.some((s) => s.field === 'investigation' && s.name === 'Perception')).toBe(
      false,
    );
  });

  it('allows Wits, Intellect, and Resolve Focus with pool = Attribute keep MR', () => {
    expect([...PERCEPTION_FOCUS_ATTRIBUTES]).toEqual(['wits', 'intellect', 'resolve']);
    const system = actorSystem();
    for (const focus of PERCEPTION_FOCUS_ATTRIBUTES) {
      expect(isPerceptionFocusAttribute(focus)).toBe(true);
      const plan = planSkillCheckDraft({ draft: perceptionDraft(focus), system });
      expect(plan.ok).toBe(true);
      expect(plan.attributeKey).toBe(focus);
      expect(plan.numDice).toBe(system.attributes[focus].value);
      expect(plan.keepDice).toBe(2);
      expect(plan.skillName).toBe('Perception');
      expect(plan.rank).toBe(2);
    }
  });

  it('rejects non-Focus Attributes for Perception', () => {
    const system = actorSystem();
    const plan = planSkillCheckDraft({ draft: perceptionDraft('might'), system });
    expect(plan.ok).toBe(false);
    expect(plan.error).toMatch(/Wits, Intellect, or Resolve/i);
  });

  it('works without any Investigation Spec on the character', () => {
    const system = actorSystem({
      specializations: ensureCharacterHasPerceptionSpec({
        specializations: [
          {
            id: specializationIdentityKey('Athletics', 'physical'),
            name: 'Athletics',
            field: 'physical',
            scope: 'Climbing',
            rank: 2,
          },
          {
            id: specializationIdentityKey('Stealth', 'finesse'),
            name: 'Stealth',
            field: 'finesse',
            scope: 'Hiding',
            rank: 2,
          },
          {
            id: specializationIdentityKey('Persuasion', 'social'),
            name: 'Persuasion',
            field: 'social',
            scope: 'Talking',
            rank: 2,
          },
          {
            id: specializationIdentityKey('Alchemy', 'science-craft'),
            name: 'Alchemy',
            field: 'science-craft',
            scope: 'Brewing',
            rank: 2,
          },
          {
            id: specializationIdentityKey('Tracking', 'survival'),
            name: 'Tracking',
            field: 'survival',
            scope: 'Trails',
            rank: 2,
          },
        ],
      }).specializations,
    });
    expect(system.specializations.some((s: any) => s.field === 'investigation')).toBe(false);
    const plan = planSkillCheckDraft({ draft: perceptionDraft('wits'), system });
    expect(plan.ok).toBe(true);
    expect(plan.skillName).toBe('Perception');
  });
});

describe('DF 2026 migration review: Perception does not consume a Spec slot', () => {
  it('exposes five paid Specs even when Perception is already on the actor', () => {
    const actor = {
      id: 'hero',
      name: 'Hero',
      type: 'character',
      system: actorSystem(),
      getFlag: () => undefined,
    };
    const plan = buildDf2026ReviewPlan(actor);
    expect(plan.currentSpecializations).toHaveLength(5);
    expect(plan.currentSpecializations.every((s) => !isCharacterPerceptionSpec(s))).toBe(true);
  });

  it('saves five paid Specs and re-attaches free Perception', () => {
    const actor = {
      id: 'hero',
      name: 'Hero',
      type: 'character',
      system: {
        ...actorSystem({ specializations: [] }),
        attributes: actorSystem().attributes,
        mastery: { rank: 2 },
      },
      getFlag: () => undefined,
    };
    const five = paidSpecs();
    const result = buildDf2026ReviewUpdate(actor, {
      specializations: five,
      echoImprints: [],
    });
    expect(result.ok).toBe(true);
    expect(result.specializations).toHaveLength(6);
    expect(paidSpecializations(result.specializations!)).toHaveLength(5);
    expect(result.specializations!.find((s) => isCharacterPerceptionSpec(s))?.field).toBe(
      'perception',
    );
  });
});
