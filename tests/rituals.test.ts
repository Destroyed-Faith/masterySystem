import { describe, it, expect } from 'vitest';
import { calculateRitualTN, RITUAL_BASE_TN, RITUALS } from '../src/utils/rituals';

describe('Ritual System (Player\'s Guide)', () => {
  it('base TN is 20', () => {
    expect(RITUAL_BASE_TN).toBe(20);
  });

  it('each declared raise adds +4 to TN', () => {
    expect(calculateRitualTN(0)).toBe(20);
    expect(calculateRitualTN(1)).toBe(24);
    expect(calculateRitualTN(2)).toBe(28);
    expect(calculateRitualTN(3)).toBe(32);
  });

  it('defines 12 core rituals', () => {
    expect(RITUALS.length).toBe(12);
  });

  it('all rituals have required fields', () => {
    for (const ritual of RITUALS) {
      expect(ritual.name).toBeTruthy();
      expect(ritual.description).toBeTruthy();
      expect(ritual.stoneCost).toBeGreaterThanOrEqual(1);
      expect(ritual.tn).toBe(RITUAL_BASE_TN);
      expect(ritual.attribute).toBeTruthy();
      expect(ritual.raises.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('rituals reference valid attributes', () => {
    const validAttrs = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
    for (const ritual of RITUALS) {
      expect(validAttrs).toContain(ritual.attribute);
    }
  });
});
