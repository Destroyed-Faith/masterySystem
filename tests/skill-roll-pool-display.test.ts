import { describe, it, expect } from 'vitest';
import {
  buildSkillRollPoolPreview,
  getSkillRollDicePool,
  reducedSkillAttributePool,
  skillFullPoolThreshold,
} from '../src/dice/roll-context-build';

function mockActor(overrides: {
  masteryRank?: number;
  skills?: Record<string, number>;
  attributes?: Record<string, number>;
} = {}): Actor {
  return {
    items: [],
    system: {
      mastery: { rank: overrides.masteryRank ?? 2 },
      skills: overrides.skills ?? {},
      attributes: Object.fromEntries(
        Object.entries(overrides.attributes ?? { might: 8 }).map(([key, value]) => [
          key,
          { value },
        ]),
      ),
    },
  } as unknown as Actor;
}

describe('reducedSkillAttributePool', () => {
  it('rounds attribute/2 mathematically with a minimum of 1', () => {
    expect(reducedSkillAttributePool(8)).toBe(4);
    expect(reducedSkillAttributePool(7)).toBe(4);
    expect(reducedSkillAttributePool(5)).toBe(3);
    expect(reducedSkillAttributePool(1)).toBe(1);
  });
});

describe('skill roll pool preview', () => {
  it('uses reduced pool below 2×MR without a half-dice suffix', () => {
    const actor = mockActor({ masteryRank: 2, skills: { athletics: 3 }, attributes: { might: 8 } });
    const threshold = skillFullPoolThreshold(2);
    expect(threshold).toBe(4);

    const preview = buildSkillRollPoolPreview(actor, 'athletics', 'might', 3);
    expect(preview.halfPool).toBe(true);
    expect(preview.fullPoolReady).toBe(false);
    expect(preview.numDice).toBe(4);
    expect(preview.keepDice).toBe(2);
    expect(preview.rollLabel).toBe('4k2');
    expect(preview.diceLabel).toBe('4d8 k2');
  });

  it('rounds odd attributes up when below 2×MR', () => {
    const actor = mockActor({ masteryRank: 2, skills: { athletics: 3 }, attributes: { might: 7 } });
    const preview = buildSkillRollPoolPreview(actor, 'athletics', 'might', 3);
    expect(preview.numDice).toBe(4);
    expect(preview.rollLabel).toBe('4k2');
  });

  it('switches to full pool when skill rating override crosses threshold', () => {
    const actor = mockActor({ masteryRank: 2, skills: { athletics: 3 }, attributes: { might: 8 } });

    const reduced = getSkillRollDicePool(actor, 'athletics', 'might', 3);
    const full = getSkillRollDicePool(actor, 'athletics', 'might', 4);

    expect(reduced.halfPool).toBe(true);
    expect(reduced.numDice).toBe(4);
    expect(full.halfPool).toBe(false);
    expect(full.numDice).toBe(8);
  });

  it('respects MR floor when attribute is low', () => {
    const actor = mockActor({ masteryRank: 3, skills: { athletics: 6 }, attributes: { might: 2 } });
    const preview = buildSkillRollPoolPreview(actor, 'athletics', 'might', 6);
    expect(preview.numDice).toBe(3);
    expect(preview.keepDice).toBe(3);
  });
});
