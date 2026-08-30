import { describe, it, expect } from 'vitest';
import {
    castingBaseTnForMasteryRank,
    canCastSpellAtLevel,
    inferResolutionFromItem,
} from '../src/combat/spell-roll-handler';

describe('Spell maths (Active-as-Spell)', () => {
    it('computes the Spell Base TN as 8 × caster Mastery Rank', () => {
        expect(castingBaseTnForMasteryRank(1)).toBe(8);
        expect(castingBaseTnForMasteryRank(2)).toBe(16);
        expect(castingBaseTnForMasteryRank(3)).toBe(24);
        expect(castingBaseTnForMasteryRank(4)).toBe(32);
        expect(castingBaseTnForMasteryRank(5)).toBe(40);
        expect(castingBaseTnForMasteryRank(6)).toBe(48);
        expect(castingBaseTnForMasteryRank(7)).toBe(56);
        expect(castingBaseTnForMasteryRank(8)).toBe(64);
    });

    it('clamps out-of-range Mastery Ranks', () => {
        expect(castingBaseTnForMasteryRank(0)).toBe(8);
        expect(castingBaseTnForMasteryRank(-3)).toBe(8);
        expect(castingBaseTnForMasteryRank(99)).toBe(64);
    });

    it('adds +4 for Mental Powers (Mental Power Base TN)', () => {
        expect(castingBaseTnForMasteryRank(2, { mental: true })).toBe(20);
        expect(castingBaseTnForMasteryRank(5, { mental: true })).toBe(44);
        expect(castingBaseTnForMasteryRank(5, { mental: false })).toBe(40);
    });

    it('enforces the Power Level cap by Mastery Rank (MR1-2→4, MR3→8, MR4→12, MR5+→16)', () => {
        expect(canCastSpellAtLevel(1, 4)).toBe(true);
        expect(canCastSpellAtLevel(2, 4)).toBe(true);
        expect(canCastSpellAtLevel(2, 5)).toBe(false);
        expect(canCastSpellAtLevel(3, 8)).toBe(true);
        expect(canCastSpellAtLevel(3, 9)).toBe(false);
        expect(canCastSpellAtLevel(4, 12)).toBe(true);
        expect(canCastSpellAtLevel(4, 13)).toBe(false);
        expect(canCastSpellAtLevel(5, 16)).toBe(true);
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
