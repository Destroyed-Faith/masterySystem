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
    it('rejects duplicate first passive as second passive', () => {
        expect(isValidSecondPassiveForDefense('armor', 'passive-fortified-frame')).toBe(false);
        expect(isValidSecondPassiveForDefense('armor', 'passive-evade')).toBe(true);
        expect(isValidSecondPassiveForDefense('armor', 'passive-temp-hp')).toBe(true);
        expect(isValidSecondPassiveForDefense('armor', 'passive-deep-vitality')).toBe(true);
    });

    it('accepts a complete valid selection', () => {
        expect(validateTowerWizardSelection(baseSelection)).toBeNull();
    });

    it('accepts expose offense package', () => {
        expect(
            validateTowerWizardSelection({ ...baseSelection, offenseId: 'expose' }),
        ).toBeNull();
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
