import { describe, expect, it } from 'vitest';
import { clearSkillBucketsInUpdateBatch } from '../src/utils/reset-character.js';

describe('reset-character skill bucket clear', () => {
  it('emits Foundry -= deletions for every skill and skillsSpent key', () => {
    const updates: Record<string, unknown> = {};
    clearSkillBucketsInUpdateBatch(updates, {
      skills: { athletics: 2, stealth: 1 },
      skillsSpent: { athletics: 1 },
    });
    expect(updates['system.skills.-=athletics']).toBeNull();
    expect(updates['system.skills.-=stealth']).toBeNull();
    expect(updates['system.skillsSpent.-=athletics']).toBeNull();
    expect(Object.keys(updates)).toHaveLength(3);
  });

  it('is a no-op when buckets are empty or missing', () => {
    const updates: Record<string, unknown> = {};
    clearSkillBucketsInUpdateBatch(updates, {});
    clearSkillBucketsInUpdateBatch(updates, { skills: {}, skillsSpent: {} });
    expect(Object.keys(updates)).toHaveLength(0);
  });
});
