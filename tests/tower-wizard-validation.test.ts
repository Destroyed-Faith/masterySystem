import { describe, expect, it } from 'vitest';
import {
    isValidSecondPassiveForDefense,
    validateTowerWizardCreation,
    validateTowerWizardSelection,
} from '../src/creation/tower-wizard/tower-wizard-validation.js';
import type { TowerWizardSelection } from '../src/creation/tower-wizard/tower-wizard-types.js';

const baseSelection: TowerWizardSelection = {
    defenseId: 'armor',
    secondPassiveTemplateId: 'passive-temp-hp',
    activeBuffMode: 'defensive',
    offenseId: 'direct-damage',
    delivery: 'melee',
    weakenSave: null,
};

function mockPowerItem(category: string, level: number, templateId: string, special?: string) {
    return {
        type: 'power',
        name: templateId,
        system: {
            category,
            level,
            rank: level,
            templateId,
            chosenSpecial: special ? { key: special } : undefined,
        },
    };
}

describe('tower-wizard-validation', () => {
    it('rejects duplicate first passive and same-category second passive', () => {
        expect(isValidSecondPassiveForDefense('armor', 'passive-fortified-frame', 'passive-fortified-frame')).toBe(false);
        expect(isValidSecondPassiveForDefense('armor', 'passive-stone-stance', 'passive-fortified-frame')).toBe(false);
        expect(isValidSecondPassiveForDefense('armor', 'passive-armor-healing', 'passive-fortified-frame')).toBe(false);
        expect(isValidSecondPassiveForDefense('armor', 'passive-evade', 'passive-fortified-frame')).toBe(true);
        expect(isValidSecondPassiveForDefense('armor', 'passive-temp-hp', 'passive-fortified-frame')).toBe(true);
        expect(isValidSecondPassiveForDefense('armor', 'passive-deep-vitality', 'passive-fortified-frame')).toBe(true);
    });

    it('blocks apply when Passive 2 shares a category with Passive 1', () => {
        const err = validateTowerWizardSelection({
            ...baseSelection,
            passive1TemplateId: 'passive-fortified-frame',
            secondPassiveTemplateId: 'passive-armor-healing',
        });
        expect(err).toMatch(/Passive category conflict: both Passives use Armor/i);
    });

    it('accepts a complete valid selection', () => {
        expect(validateTowerWizardSelection(baseSelection)).toBeNull();
    });

    it('accepts expose offense package', () => {
        expect(
            validateTowerWizardSelection({ ...baseSelection, offenseId: 'expose' }),
        ).toBeNull();
    });

    it('rejects power override with wrong category for slot', () => {
        const err = validateTowerWizardSelection({
            ...baseSelection,
            powerOverrides: [
                { grantKey: 'offense-0', templateId: 'passive-temp-hp' },
            ],
        });
        expect(err).toMatch(/Active slot cannot use that power type/i);
    });

    it('manual build mode requires all six power overrides', () => {
        expect(validateTowerWizardSelection({ manualBuildMode: true })).toMatch(/all six Powers/i);
    });

    it('validateTowerWizardCreation checks mixed ranks and counts', () => {
        const actor = {
            system: {
                creation: { towerWizardPackageId: 'armor__direct-damage' },
                mastery: { rank: 4 },
            },
            items: {
                filter: (fn: (i: unknown) => boolean) =>
                    [
                        mockPowerItem('passive', 4, 'passive-fortified-frame'),
                        mockPowerItem('passive', 4, 'passive-temp-hp'),
                        mockPowerItem('activeBuff', 4, 'ab-armor'),
                        mockPowerItem('reaction', 4, 'reaction-reaction'),
                        mockPowerItem('movement', 2, 'movement-ground-dash'),
                        mockPowerItem('active', 2, 'active-melee-weapon-single'),
                    ].filter(fn),
            },
        };
        expect(validateTowerWizardCreation(actor as any)).toMatch(/exactly 2 Active/i);
    });
});
