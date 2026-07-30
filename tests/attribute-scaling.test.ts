import { describe, it, expect } from 'vitest';
import {
  calculateMightDamageBonus,
  calculateAgilityEvadeBonus,
  calculateAgilityRangeBonus,
  calculateIntellectSaveTNBonus,
  calculateResolveStressArmor,
  calculateInfluenceSkillBonus,
  calculateWitsInitiativeBonus,
  calculateArmorBreaker,
  calculateBaseEvade,
} from '../src/utils/calculations';

describe('Attribute Scaling Passives (Player\'s Guide)', () => {
  describe('Might - Melee Damage Scaling', () => {
    it('bonus = 2 * floor(Might/8)', () => {
      expect(calculateMightDamageBonus(0)).toBe(0);
      expect(calculateMightDamageBonus(7)).toBe(0);
      expect(calculateMightDamageBonus(8)).toBe(2);
      expect(calculateMightDamageBonus(15)).toBe(2);
      expect(calculateMightDamageBonus(16)).toBe(4);
      expect(calculateMightDamageBonus(24)).toBe(6);
      expect(calculateMightDamageBonus(32)).toBe(8);
    });
  });

  describe('Agility - Evade Scaling', () => {
    it('no longer grants Evade (always 0)', () => {
      expect(calculateAgilityEvadeBonus(0)).toBe(0);
      expect(calculateAgilityEvadeBonus(8)).toBe(0);
      expect(calculateAgilityEvadeBonus(80)).toBe(0);
    });
  });

  describe('Agility - Range Band Scaling', () => {
    it('at Agility 8: short +1, medium +2, long +1', () => {
      const bonus = calculateAgilityRangeBonus(8);
      expect(bonus.short).toBe(1);
      expect(bonus.medium).toBe(2);
      expect(bonus.long).toBe(1);
    });

    it('at Agility 16: short +2, medium +4, long +2', () => {
      const bonus = calculateAgilityRangeBonus(16);
      expect(bonus.short).toBe(2);
      expect(bonus.medium).toBe(4);
      expect(bonus.long).toBe(2);
    });

    it('at Agility 7: all zero', () => {
      const bonus = calculateAgilityRangeBonus(7);
      expect(bonus.short).toBe(0);
      expect(bonus.medium).toBe(0);
      expect(bonus.long).toBe(0);
    });
  });

  describe('Intellect - legacy Save TN helper (deprecated)', () => {
    it('bonus = floor(Intellect/8)', () => {
      expect(calculateIntellectSaveTNBonus(0)).toBe(0);
      expect(calculateIntellectSaveTNBonus(8)).toBe(1);
      expect(calculateIntellectSaveTNBonus(16)).toBe(2);
    });
  });

  describe('Resolve - Stress Armor', () => {
    it('stress armor = floor(Resolve/8)', () => {
      expect(calculateResolveStressArmor(0)).toBe(0);
      expect(calculateResolveStressArmor(7)).toBe(0);
      expect(calculateResolveStressArmor(8)).toBe(1);
      expect(calculateResolveStressArmor(16)).toBe(2);
    });
  });

  describe('Influence - Skill Bonus', () => {
    it('bonus = floor(Influence/8)', () => {
      expect(calculateInfluenceSkillBonus(0)).toBe(0);
      expect(calculateInfluenceSkillBonus(8)).toBe(1);
      expect(calculateInfluenceSkillBonus(16)).toBe(2);
    });
  });

  describe('Wits - Initiative Bonus', () => {
    it('bonus = floor(Wits/8)', () => {
      expect(calculateWitsInitiativeBonus(0)).toBe(0);
      expect(calculateWitsInitiativeBonus(7)).toBe(0);
      expect(calculateWitsInitiativeBonus(8)).toBe(1);
      expect(calculateWitsInitiativeBonus(16)).toBe(2);
      expect(calculateWitsInitiativeBonus(24)).toBe(3);
    });
  });

  describe('Armor Breaker (Might)', () => {
    it('penetration = floor(Might/8)', () => {
      expect(calculateArmorBreaker(0)).toBe(0);
      expect(calculateArmorBreaker(8)).toBe(1);
      expect(calculateArmorBreaker(16)).toBe(2);
      expect(calculateArmorBreaker(24)).toBe(3);
    });
  });

  describe('Base Evade', () => {
    it('base evade = MR * 4', () => {
      expect(calculateBaseEvade(1)).toBe(4);
      expect(calculateBaseEvade(2)).toBe(8);
      expect(calculateBaseEvade(3)).toBe(12);
      expect(calculateBaseEvade(4)).toBe(16);
      expect(calculateBaseEvade(6)).toBe(24);
    });
  });
});
