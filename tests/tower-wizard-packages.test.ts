import { describe, expect, it } from 'vitest';
import {
    buildPackageGrantSpecs,
    buildPackageReview,
    getDefensePackage,
    resolveGrant,
    TOWER_WIZARD_DEFENSE_PACKAGES,
    TOWER_WIZARD_OFFENSE_PACKAGES,
} from '../src/creation/tower-wizard/tower-wizard-packages.js';
import { TOWER_WIZARD_DEFENSIVE_RANK, TOWER_WIZARD_OFFENSIVE_RANK, TOWER_WIZARD_POWER_TOTAL } from '../src/utils/power-catalog.js';
import type { TowerWizardSelection } from '../src/creation/tower-wizard/tower-wizard-types.js';

describe('tower-wizard-packages', () => {
    it('each defense package resolves core grants at rank 4', () => {
        for (const pkg of TOWER_WIZARD_DEFENSE_PACKAGES) {
            expect(resolveGrant(pkg.grants.passive1).status).toBe('ok');
            expect(resolveGrant(pkg.grants.activeBuff).status).toBe('ok');
            expect(resolveGrant(pkg.grants.reaction).status).toBe('ok');
            expect(pkg.grants.passive1.rank).toBe(TOWER_WIZARD_DEFENSIVE_RANK);
        }
    });

    it('second passive options exclude combined passives', () => {
        for (const pkg of TOWER_WIZARD_DEFENSE_PACKAGES) {
            for (const id of pkg.secondPassiveTemplateIds) {
                expect(id.startsWith('conditional-passive-')).toBe(false);
                expect(id.includes('-armor-')).toBe(false);
                expect(id.includes('-evade-')).toBe(false);
            }
        }
    });

    it('expose package is catalog-missing and hidden from availability', () => {
        const expose = TOWER_WIZARD_OFFENSE_PACKAGES.find((p) => p.id === 'expose');
        expect(expose?.catalogAvailable).toBe(false);
        expect(expose?.catalogTodo).toMatch(/TODO/i);
    });

    it('available offense packages resolve two actives at rank 2', () => {
        const selection: TowerWizardSelection = {
            defenseId: 'armor',
            secondPassiveTemplateId: 'passive-temp-hp',
            offenseId: 'direct-damage',
            delivery: 'melee',
            weakenSave: null,
            spellcaster: false,
        };
        const specs = buildPackageGrantSpecs(selection);
        expect(specs).toHaveLength(TOWER_WIZARD_POWER_TOTAL);
        const actives = specs.filter((s) => s.templateId.startsWith('active-'));
        expect(actives).toHaveLength(2);
        actives.forEach((a) => expect(a.rank).toBe(TOWER_WIZARD_OFFENSIVE_RANK));
        const review = buildPackageReview(selection);
        expect(review.allOk).toBe(true);
    });

    it('armor defense recommends expected offense packages', () => {
        const armor = getDefensePackage('armor');
        expect(armor?.offenseRecommendations).toEqual(['bleeding-push', 'corrode-damage', 'direct-damage']);
    });
});
