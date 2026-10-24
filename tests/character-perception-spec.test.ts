import { describe, expect, it } from 'vitest';
import {
  CHARACTER_PERCEPTION_MIN_RANK,
  CHARACTER_PERCEPTION_SPEC_ID,
  ensureCharacterHasPerceptionSpec,
  isCharacterPerceptionSpec,
  specializationIdentityKey,
  validateSpecializationList,
  type SpecializationRecord,
} from '../src/rules/index.js';

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

describe('Character free Perception Spec', () => {
  it('seeds Perception Rank 2 when missing', () => {
    const first = ensureCharacterHasPerceptionSpec({ specializations: paidSpecs() });
    expect(first.changed).toBe(true);
    expect(first.specializations).toHaveLength(6);
    const perc = first.specializations.find((s) => isCharacterPerceptionSpec(s));
    expect(perc).toMatchObject({
      id: CHARACTER_PERCEPTION_SPEC_ID,
      name: 'Perception',
      field: 'investigation',
      rank: CHARACTER_PERCEPTION_MIN_RANK,
    });
    const again = ensureCharacterHasPerceptionSpec({
      specializations: first.specializations,
    });
    expect(again.changed).toBe(false);
  });

  it('raises Perception below Rank 2 up to the floor', () => {
    const specs = [
      ...paidSpecs(),
      {
        id: CHARACTER_PERCEPTION_SPEC_ID,
        name: 'Perception',
        field: 'investigation' as const,
        scope: 'Notice, search, and read the scene',
        rank: 1,
      },
    ];
    const out = ensureCharacterHasPerceptionSpec({ specializations: specs });
    expect(out.changed).toBe(true);
    expect(out.specializations.find((s) => s.name === 'Perception')?.rank).toBe(2);
  });

  it('does not lower Perception above Rank 2', () => {
    const specs = [
      ...paidSpecs(),
      {
        id: CHARACTER_PERCEPTION_SPEC_ID,
        name: 'Perception',
        field: 'investigation' as const,
        scope: 'Notice, search, and read the scene',
        rank: 4,
      },
    ];
    const out = ensureCharacterHasPerceptionSpec({ specializations: specs });
    expect(out.changed).toBe(false);
    expect(out.specializations.find((s) => s.name === 'Perception')?.rank).toBe(4);
  });

  it('starting budget ignores free Perception (5 paid + Perception ok)', () => {
    const five = paidSpecs();
    expect(validateSpecializationList(five, { requireStartingBudget: true }).ok).toBe(true);

    const withPerception = ensureCharacterHasPerceptionSpec({
      specializations: five,
    }).specializations;
    expect(withPerception).toHaveLength(6);
    expect(validateSpecializationList(withPerception, { requireStartingBudget: true }).ok).toBe(
      true,
    );
  });

  it('starting budget still requires five paid Specs', () => {
    const four = paidSpecs().slice(0, 4);
    const withPerception = ensureCharacterHasPerceptionSpec({
      specializations: four,
    }).specializations;
    const check = validateSpecializationList(withPerception, { requireStartingBudget: true });
    expect(check.ok).toBe(false);
    expect(check.errors[0]).toMatch(/exactly five/i);
  });
});
