import { describe, it, expect } from 'vitest';
import {
  buildSkillRollPoolPreview,
  getSkillRollDicePool,
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

describe('skill roll pool preview', () => {
  it('uses half pool below 2×MR threshold', () => {
    const actor = mockActor({ masteryRank: 2, skills: { athletics: 3 }, attributes: { might: 8 } });
    const threshold = skillFullPoolThreshold(2);
    expect(threshold).toBe(4);

    const preview = buildSkillRollPoolPreview(actor, 'athletics', 'might', 3);
    expect(preview.halfPool).toBe(true);
    expect(preview.fullPoolReady).toBe(false);
    expect(preview.numDice).toBe(4);
    expect(preview.keepDice).toBe(2);
    expect(preview.diceLabel).toBe('4d8 k2 ½');
  });

  it('switches to full pool when skill rating override crosses threshold', () => {
    const actor = mockActor({ masteryRank: 2, skills: { athletics: 3 }, attributes: { might: 8 } });

    const half = getSkillRollDicePool(actor, 'athletics', 'might', 3);
    const full = getSkillRollDicePool(actor, 'athletics', 'might', 4);

    expect(half.halfPool).toBe(true);
    expect(half.numDice).toBe(4);
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
