import { describe, it, expect } from 'vitest';
import {
    castingBaseTnForMasteryRank,
    canCastSpellAtLevel,
    inferResolutionFromItem,
} from '../src/combat/spell-roll-handler';

describe('Spell maths (Active-as-Spell)', () => {
    it('computes the Spell Base TN as (8 × caster Mastery Rank) − 2', () => {
        expect(castingBaseTnForMasteryRank(1)).toBe(6);
        expect(castingBaseTnForMasteryRank(2)).toBe(14);
        expect(castingBaseTnForMasteryRank(3)).toBe(22);
        expect(castingBaseTnForMasteryRank(4)).toBe(30);
        expect(castingBaseTnForMasteryRank(5)).toBe(38);
        expect(castingBaseTnForMasteryRank(6)).toBe(46);
        expect(castingBaseTnForMasteryRank(7)).toBe(54);
        expect(castingBaseTnForMasteryRank(8)).toBe(62);
    });

    it('clamps out-of-range Mastery Ranks', () => {
        expect(castingBaseTnForMasteryRank(0)).toBe(6);
        expect(castingBaseTnForMasteryRank(-3)).toBe(6);
        expect(castingBaseTnForMasteryRank(99)).toBe(62);
    });

    it('adds +4 for Mental Powers (Mental Power Base TN)', () => {
        expect(castingBaseTnForMasteryRank(2, { mental: true })).toBe(18);
        expect(castingBaseTnForMasteryRank(5, { mental: true })).toBe(42);
        expect(castingBaseTnForMasteryRank(5, { mental: false })).toBe(38);
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
