import { describe, expect, it } from 'vitest';
import {
    buildPackageGrantSpecs,
    buildPackageReview,
    getDefensePackage,
    getSecondPassiveGroups,
    playerFacingPowerName,
    resolveGrant,
    TOWER_WIZARD_DEFENSE_PACKAGES,
    TOWER_WIZARD_OFFENSE_PACKAGES,
    WIZARD_HIDDEN_OFFENSE_IDS,
} from '../src/creation/tower-wizard/tower-wizard-packages.js';
import { TOWER_WIZARD_DEFENSIVE_RANK, TOWER_WIZARD_OFFENSIVE_RANK, TOWER_WIZARD_POWER_TOTAL } from '../src/utils/power-catalog.js';
import type { TowerWizardSelection } from '../src/creation/tower-wizard/tower-wizard-types.js';

const baseSelection: TowerWizardSelection = {
    defenseId: 'armor',
    secondPassiveTemplateId: 'passive-temp-hp',
    activeBuffMode: 'defensive',
    offenseId: 'direct-damage',
    delivery: 'melee',
    weakenSave: null,
};

describe('tower-wizard-packages', () => {
    it('each defense package resolves core grants at rank 4', () => {
        for (const pkg of TOWER_WIZARD_DEFENSE_PACKAGES) {
            expect(resolveGrant(pkg.grants.passive1).status).toBe('ok');
            expect(resolveGrant(pkg.grants.activeBuff).status).toBe('ok');
            expect(resolveGrant(pkg.grants.reaction).status).toBe('ok');
            expect(pkg.grants.passive1.rank).toBe(TOWER_WIZARD_DEFENSIVE_RANK);
        }
    });

    it('second passive options exclude combined passives, awareness, and health', () => {
        for (const pkg of TOWER_WIZARD_DEFENSE_PACKAGES) {
            for (const id of pkg.secondPassiveTemplateIds) {
                expect(id.startsWith('conditional-passive-')).toBe(false);
                expect(id.includes('-armor-')).toBe(false);
                expect(id.includes('-evade-')).toBe(false);
                expect(id).not.toBe('passive-heightened-senses');
                expect(id).not.toBe('passive-deep-vitality');
            }
        }
    });

    it('second passive groups include defense and attack support options', () => {
        const armor = getSecondPassiveGroups('armor');
        expect(armor.defensive.map((p) => p.id)).toEqual(['passive-temp-hp', 'passive-regeneration']);
        expect(armor.offensive.map((p) => p.id)).toEqual(['passive-killing-intent']);
        expect(armor.offensive[0]?.label).toBe('Attack Support');
    });

    it('ignite is hidden from wizard offense list', () => {
        expect(WIZARD_HIDDEN_OFFENSE_IDS).toContain('ignite');
        const expose = TOWER_WIZARD_OFFENSE_PACKAGES.find((p) => p.id === 'expose');
        expect(expose?.catalogAvailable).toBe(true);
    });

    it('available offense packages resolve two actives at rank 2', () => {
        const specs = buildPackageGrantSpecs(baseSelection);
        expect(specs).toHaveLength(TOWER_WIZARD_POWER_TOTAL);
        const actives = specs.filter((s) => s.templateId.startsWith('active-'));
        expect(actives).toHaveLength(2);
        actives.forEach((a) => expect(a.rank).toBe(TOWER_WIZARD_OFFENSIVE_RANK));
        const review = buildPackageReview(baseSelection);
        expect(review.allOk).toBe(true);
    });

    it('mark package shows Mark as player-facing name', () => {
        const selection: TowerWizardSelection = {
            ...baseSelection,
            offenseId: 'mark',
            delivery: 'ranged',
        };
        const review = buildPackageReview(selection);
        expect(review.offenseRows[0]?.playerName).toBe('Mark');
        expect(review.offenseRows[0]?.playerName).not.toMatch(/tier/i);
    });

    it('offensive active buff replaces defensive buff in package', () => {
        const selection: TowerWizardSelection = {
            ...baseSelection,
            activeBuffMode: 'offensive',
            offensiveActiveBuffId: 'ab-damage',
        };
        const specs = buildPackageGrantSpecs(selection);
        expect(specs[2].templateId).toBe('ab-damage');
    });

    it('hex package second active can be configured as split weapon', () => {
        const selection: TowerWizardSelection = {
            defenseId: 'phasing',
            secondPassiveTemplateId: 'passive-temp-hp',
            activeBuffMode: 'defensive',
            offenseId: 'hex-spell',
            delivery: 'ranged',
            weakenSave: null,
            offenseActiveOverrides: [
                {
                    grantKey: 'offense-0',
                    isSpell: true,
                    castingAttribute: 'intellect',
                    spellResolution: 'saveSpell',
                },
                {
                    grantKey: 'offense-1',
                    variant: 'weapon-split',
                    isSpell: false,
                },
            ],
        };
        const specs = buildPackageGrantSpecs(selection);
        const actives = specs.filter((s) => s.templateId.startsWith('active-'));
        expect(actives[0].special).toBe('hex');
        expect(actives[1].templateId).toBe('active-ranged-weapon-split');
    });

    it('playerFacingPowerName prefers special names over tier labels', () => {
        expect(playerFacingPowerName({ templateId: 'active-ranged-damage-t4', rank: 2, special: 'mark' })).toBe('Mark');
    });

    it('armor defense recommends expected offense packages', () => {
        const armor = getDefensePackage('armor');
        expect(armor?.offenseRecommendations).toContain('mark');
        expect(armor?.offenseRecommendations).toContain('expose');
    });
});
