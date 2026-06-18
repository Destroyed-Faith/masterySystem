import { describe, it, expect } from 'vitest';
import {
  resolveArtifactBodyArmor,
  getEquippedArtifactBodyArmorClassPenalty,
} from '../src/utils/artifact-armor-weight';
import { buildArtifactBaseValueBreakdown } from '../src/utils/artifact-base-values';

describe('resolveArtifactBodyArmor', () => {
  it('adds medium base 8 to artifact bonus (new format)', () => {
    const resolved = resolveArtifactBodyArmor({
      slot: 'a',
      type: 'bodyArmor',
      label: 'Medium Echo Armor',
      value: 5,
      armorWeightClass: 'medium',
    });
    expect(resolved).toMatchObject({
      weightClass: 'medium',
      baseArmor: 8,
      bonusArmor: 5,
      totalArmor: 13,
      evadeModifier: -2,
      initiativeModifier: -4,
      skillPenaltyDice: 1,
    });
  });

  it('infers heavy from legacy full total', () => {
    const resolved = resolveArtifactBodyArmor({
      slot: 'a',
      type: 'bodyArmor',
      label: 'Heavy Echo Armor',
      value: 17,
    });
    expect(resolved?.totalArmor).toBe(17);
    expect(resolved?.bonusArmor).toBe(5);
    expect(resolved?.evadeModifier).toBe(-4);
  });
});

describe('buildArtifactBaseValueBreakdown — armor class', () => {
  it('applies medium drawbacks for Titan-style body artifact', () => {
    const actor = {
      items: [
        {
          type: 'artifact',
          name: 'Titan Scars - Level 1-1',
          system: {
            slot: 'body',
            equipped: true,
            currentLevel: 2,
            baseValues: [
              {
                slot: 'a',
                type: 'bodyArmor',
                label: 'Medium Echo Armor',
                value: 5,
                armorWeightClass: 'medium',
              },
            ],
          },
          getFlag: () => ({ slot: 'body' }),
        },
      ],
    };
    const bd = buildArtifactBaseValueBreakdown(actor);
    expect(bd.armorBonus).toBe(13);
    expect(bd.bodyArmorClassPenalty).toMatchObject({
      weightClass: 'medium',
      evade: -2,
      initiative: -4,
      skillPenaltyDice: 1,
    });
    expect(getEquippedArtifactBodyArmorClassPenalty(actor)?.skillPenaltyDice).toBe(1);
  });
});
