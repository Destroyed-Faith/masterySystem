import { describe, expect, it } from 'vitest';
import { buildSkillUseBoxes } from '../src/utils/skill-use-boxes';

describe('skill use boxes', () => {
  it('fills four boxes of 2 at MR 2 with 8 points', () => {
    expect(buildSkillUseBoxes(8, 0, 2).map((box) => box.size)).toEqual([2, 2, 2, 2]);
  });

  it('recomputes to MR 3 chunks so 8 points no longer fill every box', () => {
    const boxes = buildSkillUseBoxes(8, 0, 3);
    expect(boxes.map((box) => box.size)).toEqual([3, 3, 2, 0]);
    expect(boxes[3]!.unavailable).toBe(true);
  });

  it('fills all four boxes with 3 only at MR 3 when 12 points are invested', () => {
    const boxes = buildSkillUseBoxes(12, 0, 3);
    expect(boxes.map((box) => box.size)).toEqual([3, 3, 3, 3]);
    expect(boxes.every((box) => box.state === 'available')).toBe(true);
  });

  it('caps a huge rating at four uses of the current Mastery Rank', () => {
    expect(buildSkillUseBoxes(99, 0, 3).map((box) => box.size)).toEqual([3, 3, 3, 3]);
  });

  it('crosses spent points off from the left after an MR change', () => {
    const boxes = buildSkillUseBoxes(12, 6, 3);
    expect(boxes.map((box) => box.spent)).toEqual([true, true, false, false]);
    expect(boxes[2]!.remaining).toBe(3);
  });
});
