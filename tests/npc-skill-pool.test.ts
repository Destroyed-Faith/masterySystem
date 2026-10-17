import { describe, expect, it } from 'vitest';
import {
  getSkillRollDicePool,
  isSkillFullPoolReady,
  readAttributePoolValue,
  readSkillRating,
  skillFullPoolThreshold,
} from '../src/dice/roll-context-build.js';

function makeNpc(skills: Record<string, unknown>, attrs: Record<string, unknown>, mr = 2) {
  return {
    type: 'npc',
    items: [],
    system: {
      mastery: { rank: mr },
      skills,
      attributes: attrs,
      health: { currentBar: 0, bars: [{ name: 'Healthy', max: 10, current: 10, penalty: 0 }] },
    },
  };
}

describe('NPC skill / Perception pool reading', () => {
  it('readSkillRating accepts numbers and { value } shapes', () => {
    expect(readSkillRating({ skills: { perception: 6 } }, 'perception')).toBe(6);
    expect(readSkillRating({ skills: { perception: '8' } }, 'perception')).toBe(8);
    expect(readSkillRating({ skills: { perception: { value: 4 } } }, 'perception')).toBe(4);
    expect(readSkillRating({ skills: {} }, 'perception')).toBe(0);
  });

  it('readAttributePoolValue accepts { value } and bare numbers', () => {
    expect(readAttributePoolValue({ attributes: { wits: { value: 7 } } }, 'wits')).toBe(7);
    expect(readAttributePoolValue({ attributes: { wits: 5 } }, 'wits')).toBe(5);
  });

  it('unlocks full Wits pool when Perception ≥ 2×MR', () => {
    const mr = 2;
    const threshold = skillFullPoolThreshold(mr);
    expect(threshold).toBe(4);
    const actor = makeNpc({ perception: 4 }, { wits: { value: 8 } }, mr);
    expect(isSkillFullPoolReady(readSkillRating(actor.system, 'perception'), mr)).toBe(true);
    const pool = getSkillRollDicePool(actor as any, 'perception', 'wits');
    expect(pool.halfPool).toBe(false);
    expect(pool.baseDice).toBe(8);
  });

  it('uses half Wits pool when Perception is below 2×MR', () => {
    const actor = makeNpc({ perception: 2 }, { wits: { value: 8 } }, 2);
    const pool = getSkillRollDicePool(actor as any, 'perception', 'wits');
    expect(pool.halfPool).toBe(true);
    expect(pool.baseDice).toBe(4);
  });
});
