import { describe, it, expect } from 'vitest';
import {
    calculateBaseTN,
    calculateSaveDC,
    canCastSpellAtLevel,
    getMaxSpellLevel,
    inferResolutionFromItem,
} from '../src/combat/spell-roll-handler';

describe('Spell maths (Active-as-Spell)', () => {
    it('computes Base TN per Spell Level (8 × ceil(lvl / 2))', () => {
        expect(calculateBaseTN(1)).toBe(8);
        expect(calculateBaseTN(2)).toBe(8);
        expect(calculateBaseTN(3)).toBe(16);
        expect(calculateBaseTN(4)).toBe(16);
        expect(calculateBaseTN(5)).toBe(24);
        expect(calculateBaseTN(6)).toBe(24);
        expect(calculateBaseTN(7)).toBe(32);
        expect(calculateBaseTN(8)).toBe(32);
        expect(calculateBaseTN(9)).toBe(40);
        expect(calculateBaseTN(10)).toBe(40);
        expect(calculateBaseTN(11)).toBe(48);
        expect(calculateBaseTN(12)).toBe(48);
        expect(calculateBaseTN(13)).toBe(56);
        expect(calculateBaseTN(14)).toBe(56);
        expect(calculateBaseTN(15)).toBe(64);
        expect(calculateBaseTN(16)).toBe(64);
    });

    it('clamps out-of-range Spell Levels when computing Base TN', () => {
        expect(calculateBaseTN(0)).toBe(8);
        expect(calculateBaseTN(17)).toBe(64);
        expect(calculateBaseTN(100)).toBe(64);
    });

    it('computes Save DC as 8 × Mastery Rank', () => {
        expect(calculateSaveDC(1)).toBe(8);
        expect(calculateSaveDC(4)).toBe(32);
        expect(calculateSaveDC(8)).toBe(64);
    });

    it('enforces the MR × 2 Max Spell Level cap', () => {
        expect(getMaxSpellLevel(1)).toBe(2);
        expect(getMaxSpellLevel(2)).toBe(4);
        expect(getMaxSpellLevel(8)).toBe(16);
        expect(canCastSpellAtLevel(2, 4)).toBe(true);
        expect(canCastSpellAtLevel(2, 5)).toBe(false);
        expect(canCastSpellAtLevel(8, 16)).toBe(true);
        expect(canCastSpellAtLevel(8, 17)).toBe(false);
        expect(canCastSpellAtLevel(4, 0)).toBe(false);
    });

    it('infers resolution from the power item, defaulting to saveSpell', () => {
        expect(inferResolutionFromItem({ system: { spellResolution: 'spellAttack' } })).toBe(
            'spellAttack',
        );
        expect(inferResolutionFromItem({ system: { spellResolution: 'saveSpell' } })).toBe(
            'saveSpell',
        );
        expect(inferResolutionFromItem({ system: {} })).toBe('saveSpell');
        expect(inferResolutionFromItem(null)).toBe('saveSpell');
    });
});
