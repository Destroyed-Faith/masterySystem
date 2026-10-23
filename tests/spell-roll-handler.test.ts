import { describe, it, expect } from 'vitest';
import {
    castingBaseTnForPowerLevel,
    castingBaseTnForMasteryRank,
    canCastSpellAtLevel,
    inferResolutionFromItem,
    mentalFinalTnSurchargeForTemplate,
} from '../src/combat/spell-roll-handler';

describe('Spell maths (Active-as-Spell)', () => {
    it('computes Spell Base TN as used Power Level × 4', () => {
        expect(castingBaseTnForPowerLevel(1)).toBe(4);
        expect(castingBaseTnForPowerLevel(2)).toBe(8);
        expect(castingBaseTnForPowerLevel(3)).toBe(12);
        expect(castingBaseTnForPowerLevel(4)).toBe(16);
        expect(castingBaseTnForPowerLevel(6)).toBe(24);
        expect(castingBaseTnForPowerLevel(10)).toBe(40);
        expect(castingBaseTnForPowerLevel(16)).toBe(64);
    });

    it('legacy mastery-rank helper maps MR as temporary PL stand-in', () => {
        expect(castingBaseTnForMasteryRank(2)).toBe(8);
        expect(castingBaseTnForMasteryRank(8)).toBe(32);
    });

    it('applies Final Mental TN +4 only for Mind Probe / Mental Control', () => {
        expect(mentalFinalTnSurchargeForTemplate('active-mind-probe')).toBe(4);
        expect(mentalFinalTnSurchargeForTemplate('active-mental-control')).toBe(4);
        expect(mentalFinalTnSurchargeForTemplate('active-mental-attack')).toBe(0);
        expect(mentalFinalTnSurchargeForTemplate('active-fireball')).toBe(0);
        expect(castingBaseTnForPowerLevel(5) + mentalFinalTnSurchargeForTemplate('active-mind-probe')).toBe(24);
        expect(castingBaseTnForPowerLevel(5)).toBe(20);
    });

    it('enforces the Power Level cap by Mastery Rank (MR × 2)', () => {
        expect(canCastSpellAtLevel(1, 2)).toBe(true);
        expect(canCastSpellAtLevel(1, 3)).toBe(false);
        expect(canCastSpellAtLevel(2, 4)).toBe(true);
        expect(canCastSpellAtLevel(2, 5)).toBe(false);
        expect(canCastSpellAtLevel(3, 6)).toBe(true);
        expect(canCastSpellAtLevel(3, 7)).toBe(false);
        expect(canCastSpellAtLevel(4, 8)).toBe(true);
        expect(canCastSpellAtLevel(4, 9)).toBe(false);
        expect(canCastSpellAtLevel(8, 16)).toBe(true);
        expect(canCastSpellAtLevel(8, 17)).toBe(false);
        expect(canCastSpellAtLevel(4, 0)).toBe(false);
    });

    it('infers resolution from the power item, always spellAttack', () => {
        expect(inferResolutionFromItem({ system: { spellResolution: 'spellAttack' } })).toBe('spellAttack');
        expect(inferResolutionFromItem({ system: {} })).toBe('spellAttack');
        expect(inferResolutionFromItem(null)).toBe('spellAttack');
    });
});
