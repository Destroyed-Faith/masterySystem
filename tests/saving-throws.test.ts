import { describe, it, expect } from 'vitest';
import { getSaveAttributes, calculateSaveDC, buildSaveRollInfo } from '../src/utils/saving-throws';

describe('Saving Throw System (Player\'s Guide)', () => {
  describe('Save Categories', () => {
    it('Body save uses Might and Agility', () => {
      expect(getSaveAttributes('body')).toEqual(['might', 'agility']);
    });

    it('Mind save uses Intellect and Wits', () => {
      expect(getSaveAttributes('mind')).toEqual(['intellect', 'wits']);
    });

    it('Spirit save uses Resolve and Influence', () => {
      expect(getSaveAttributes('spirit')).toEqual(['resolve', 'influence']);
    });
  });

  describe('Save DC Calculation', () => {
    it('DC = MR * 8', () => {
      expect(calculateSaveDC(1)).toBe(8);
      expect(calculateSaveDC(2)).toBe(16);
      expect(calculateSaveDC(3)).toBe(24);
      expect(calculateSaveDC(4)).toBe(32);
      expect(calculateSaveDC(5)).toBe(40);
      expect(calculateSaveDC(6)).toBe(48);
    });
  });

  describe('Build Save Roll Info', () => {
    const attributes = {
      might: { value: 8 },
      agility: { value: 6 },
      vitality: { value: 4 },
      intellect: { value: 10 },
      resolve: { value: 4 },
      influence: { value: 12 },
      wits: { value: 6 },
    };

    it('Body save picks higher of Might/Agility', () => {
      const info = buildSaveRollInfo('body', attributes, 2);
      expect(info.chosenAttribute).toBe('might');
      expect(info.dicePool).toBe(8);
      expect(info.dc).toBe(16);
    });

    it('Mind save picks higher of Intellect/Wits', () => {
      const info = buildSaveRollInfo('mind', attributes, 3);
      expect(info.chosenAttribute).toBe('intellect');
      expect(info.dicePool).toBe(10);
      expect(info.dc).toBe(24);
    });

    it('Spirit save picks higher of Resolve/Influence', () => {
      const info = buildSaveRollInfo('spirit', attributes, 2);
      expect(info.chosenAttribute).toBe('influence');
      expect(info.dicePool).toBe(12);
      expect(info.dc).toBe(16);
    });
  });
});
