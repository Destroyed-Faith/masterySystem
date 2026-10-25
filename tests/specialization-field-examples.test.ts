import { describe, expect, it } from 'vitest';
import {
  PAID_SKILL_FIELDS,
  SPECIALIZATION_FIELD_EXAMPLES,
} from '../src/rules/index.js';

describe('Specialization Field examples', () => {
  it('offers eight inspiration Specs per paid Field with non-empty scopes', () => {
    for (const field of PAID_SKILL_FIELDS) {
      const list = SPECIALIZATION_FIELD_EXAMPLES[field];
      expect(list, field).toHaveLength(8);
      const names = new Set<string>();
      for (const ex of list) {
        expect(ex.name.trim().length).toBeGreaterThan(0);
        expect(ex.scope.trim().length).toBeGreaterThan(10);
        names.add(ex.name.toLowerCase());
      }
      expect(names.size).toBe(8);
    }
  });

  it('has no paid inspiration Specs under universal Perception', () => {
    expect(SPECIALIZATION_FIELD_EXAMPLES.perception).toEqual([]);
  });
});
