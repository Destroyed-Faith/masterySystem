import { describe, expect, it } from 'vitest';
import { clearSkillBucketsInUpdateBatch } from '../src/utils/reset-character.js';
import { SKILLS } from '../src/utils/skills.js';

describe('reset-character skill bucket clear', () => {
  it('zeros every catalog skill and skillsSpent key', () => {
    const updates: Record<string, unknown> = {};
    clearSkillBucketsInUpdateBatch(updates, {
      skills: { athletics: 2, stealth: 1 },
      skillsSpent: { athletics: 1 },
    });
    for (const key of Object.keys(SKILLS)) {
      expect(updates[`system.skills.${key}`]).toBe(0);
      expect(updates[`system.skillsSpent.${key}`]).toBe(0);
    }
  });

  it('emits Foundry -= deletions for legacy keys outside the catalog', () => {
    const updates: Record<string, unknown> = {};
    clearSkillBucketsInUpdateBatch(updates, {
      skills: { athletics: 2, legacySkillKey: 3 },
      skillsSpent: { athletics: 1, legacySkillKey: 1 },
    });
    expect(updates['system.skills.-=legacySkillKey']).toBeNull();
    expect(updates['system.skillsSpent.-=legacySkillKey']).toBeNull();
    expect(updates['system.skills.-=athletics']).toBeUndefined();
  });

  it('is a no-op for orphan deletion when buckets are empty or missing', () => {
    const updates: Record<string, unknown> = {};
    clearSkillBucketsInUpdateBatch(updates, {});
    clearSkillBucketsInUpdateBatch(updates, { skills: {}, skillsSpent: {} });
    expect(Object.keys(updates).length).toBe(Object.keys(SKILLS).length * 2);
  });
});
