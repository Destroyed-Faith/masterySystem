import { describe, it, expect } from 'vitest';
import {
  calculateRitualTN,
  countRitualRaises,
  RITUALS,
  eligibleSkillsForRitual,
} from '../src/utils/rituals';

describe('Ritual System (Player\'s Guide)', () => {
  it('Standard Ritual TN = 8 × Ritual MR', () => {
    expect(calculateRitualTN(1)).toBe(8);
    expect(calculateRitualTN(2)).toBe(16);
    expect(calculateRitualTN(3)).toBe(24);
  });

  it('GM modifier shifts TN in ±4 steps', () => {
    expect(calculateRitualTN(2, 4)).toBe(20);
    expect(calculateRitualTN(2, -4)).toBe(12);
  });

  it('counts margin raises after roll (+4 over TN each)', () => {
    expect(countRitualRaises(15, 16)).toBe(0);
    expect(countRitualRaises(20, 16)).toBe(1);
    expect(countRitualRaises(24, 16)).toBe(2);
  });

  it('defines canonical ritual catalog', () => {
    expect(RITUALS.length).toBeGreaterThanOrEqual(11);
  });

  it('all rituals have required fields', () => {
    for (const ritual of RITUALS) {
      expect(ritual.name).toBeTruthy();
      expect(ritual.description).toBeTruthy();
      expect(ritual.stoneCost).toBeGreaterThanOrEqual(1);
      expect(ritual.allowedSkillCategories.length).toBeGreaterThan(0);
      expect(ritual.raises.length).toBeGreaterThanOrEqual(1);
      expect(eligibleSkillsForRitual(ritual).length).toBeGreaterThan(0);
    }
  });
});
