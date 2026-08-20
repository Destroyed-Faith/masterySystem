import { describe, expect, it } from 'vitest';
import {
    getNormalizedPassiveCategories,
    getPassiveCategoryConflictMessage,
    isAllowedSecondPassive,
    passivesAreCategoryCompatible,
    secondPassiveBucketFor,
} from '../src/creation/tower-wizard/tower-wizard-passive-categories.js';

describe('tower-wizard-passive-categories', () => {
    it('combined passives occupy every listed category', () => {
        expect(getNormalizedPassiveCategories('passive-armor-healing')).toEqual(['armor', 'healing']);
        expect(getNormalizedPassiveCategories('passive-armor-temp-hp')).toEqual(['armor', 'temporary-hp']);
        expect(getNormalizedPassiveCategories('passive-damage-healing')).toEqual(['damage', 'healing']);
    });

    it('passivesAreCategoryCompatible rejects any shared category', () => {
        expect(passivesAreCategoryCompatible('passive-fortified-frame', 'passive-stone-stance')).toBe(false);
        expect(passivesAreCategoryCompatible('passive-fortified-frame', 'passive-armor-healing')).toBe(false);
        expect(passivesAreCategoryCompatible('passive-fortified-frame', 'passive-damage-healing')).toBe(true);
    });

    it('isAllowedSecondPassive hides awareness and ward passives from guided step', () => {
        expect(isAllowedSecondPassive('passive-heightened-senses', 'passive-fortified-frame')).toBe(false);
        expect(isAllowedSecondPassive('passive-spell-resistance', 'passive-fortified-frame')).toBe(false);
        expect(isAllowedSecondPassive('passive-awareness-evade', 'passive-fortified-frame')).toBe(false);
    });

    it('isAllowedSecondPassive rejects same id and same-category passives', () => {
        expect(isAllowedSecondPassive('passive-fortified-frame', 'passive-fortified-frame')).toBe(false);
        expect(isAllowedSecondPassive('passive-stone-stance', 'passive-fortified-frame')).toBe(false);
        expect(isAllowedSecondPassive('conditional-passive-armor-temp-hp', 'passive-fortified-frame')).toBe(false);
        expect(isAllowedSecondPassive('passive-evade', 'passive-fortified-frame')).toBe(true);
        expect(isAllowedSecondPassive('passive-temp-hp', 'passive-fortified-frame')).toBe(true);
    });

    it('getPassiveCategoryConflictMessage names overlapping categories', () => {
        const msg = getPassiveCategoryConflictMessage('passive-fortified-frame', 'passive-armor-healing');
        expect(msg).toMatch(/both Passives use Armor/i);
    });

    it('secondPassiveBucketFor assigns named mechanic buckets', () => {
        expect(secondPassiveBucketFor('passive-damage-reduction')).toBe('damage-reduction');
        expect(secondPassiveBucketFor('passive-ghostform')).toBe('phasing');
        expect(secondPassiveBucketFor('passive-parry')).toBe('parry');
        expect(secondPassiveBucketFor('passive-damage-negation')).toBe('damage-negation');
        expect(secondPassiveBucketFor('passive-invisibility')).toBe('invisibility');
        expect(secondPassiveBucketFor('passive-evade')).toBe('evade');
        expect(secondPassiveBucketFor('passive-deep-vitality')).toBe('health');
        expect(secondPassiveBucketFor('passive-temp-hp')).toBe('temporary-hp');
        expect(secondPassiveBucketFor('passive-regeneration')).toBe('sustain');
        expect(secondPassiveBucketFor('passive-killing-intent')).toBe('offense');
        expect(secondPassiveBucketFor('passive-special-aura')).toBe('offense');
    });
});
