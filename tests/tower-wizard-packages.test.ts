import { describe, expect, it } from 'vitest';
import {
    buildPackageGrantSpecs,
    buildPackageReview,
    catalogEntryMatchesGrantKey,
    getDefaultActiveBuffPreview,
    getOffensiveActiveBuffGroups,
    getOffensiveActiveBuffOptions,
    getOffenseActiveGroups,
    getSecondPassiveGroups,
    playerFacingPowerName,
    resolveGrant,
    TOWER_WIZARD_DEFENSE_PACKAGES,
    TOWER_WIZARD_OFFENSE_PACKAGES,
    WIZARD_HIDDEN_OFFENSE_IDS,
} from '../src/creation/tower-wizard/tower-wizard-packages.js';
import { TOWER_WIZARD_DEFENSIVE_RANK, TOWER_WIZARD_OFFENSIVE_RANK, TOWER_WIZARD_POWER_TOTAL, findCatalogEntry } from '../src/utils/power-catalog.js';
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

    it('second passive groups include all catalog passives except the defense passive', () => {
        const armor = getSecondPassiveGroups('armor');
        const allIds = armor.flatMap((g) => g.passives.map((p) => p.id));
        expect(allIds).toContain('passive-temp-hp');
        expect(allIds).toContain('passive-deep-vitality');
        expect(allIds).toContain('passive-armor-temp-hp');
        expect(allIds).toContain('conditional-passive-armor-temp-hp');
        expect(allIds).not.toContain('passive-fortified-frame');
        expect(allIds.length).toBeGreaterThan(20);
    });

    it('second passive groups include combined and conditional passives for evade defense', () => {
        const evade = getSecondPassiveGroups('evade');
        const allIds = evade.flatMap((g) => g.passives.map((p) => p.id));
        expect(allIds).not.toContain('passive-evade');
        expect(allIds).toContain('passive-evade-damage');
    });

    it('ignite and weaken-save are hidden from wizard offense list', () => {
        expect(WIZARD_HIDDEN_OFFENSE_IDS).toContain('ignite');
        expect(WIZARD_HIDDEN_OFFENSE_IDS).toContain('weaken-save');
        const expose = TOWER_WIZARD_OFFENSE_PACKAGES.find((p) => p.id === 'expose');
        expect(expose?.catalogAvailable).toBe(true);
        const weaken = TOWER_WIZARD_OFFENSE_PACKAGES.find((p) => p.id === 'weaken-save');
        expect(weaken?.catalogAvailable).toBe(false);
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

    it('offensive active buff options include five catalog buffs with rank previews', () => {
        const options = getOffensiveActiveBuffOptions();
        expect(options.length).toBeGreaterThanOrEqual(5);
        expect(options.map((o) => o.id)).toContain('ab-special-overdrive');
        for (const opt of options) {
            expect(opt.rankPreview.length).toBeGreaterThan(0);
            expect(opt.groupLabel.length).toBeGreaterThan(0);
        }
        const groups = getOffensiveActiveBuffGroups();
        expect(groups.length).toBeGreaterThanOrEqual(3);
    });

    it('default active buff preview reflects defense package', () => {
        const preview = getDefaultActiveBuffPreview('armor');
        expect(preview?.id).toBe('ab-armor');
        expect(preview?.rankPreview).toMatch(/17 Armor/i);
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

    it('offense active catalog groups list rank-2 actives for wizard step 5', () => {
        const groups = getOffenseActiveGroups(null);
        expect(groups.length).toBeGreaterThan(0);
        const total = groups.reduce((n, g) => n + g.actives.length, 0);
        expect(total).toBeGreaterThan(2);
        for (const group of groups) {
            expect(group.groupLabel).toBeTruthy();
            for (const active of group.actives) {
                expect(active.pickId).toBeTruthy();
                expect(active.templateId).toMatch(/^active-/);
                expect(active.label).toBeTruthy();
            }
        }
    });

    it('catalog offense picks build two active grant specs', () => {
        const groups = getOffenseActiveGroups(null);
        const first = groups[0]?.actives[0];
        const second = groups[0]?.actives[1] ?? groups[1]?.actives[0];
        expect(first).toBeDefined();
        expect(second).toBeDefined();
        const selection: TowerWizardSelection = {
            ...baseSelection,
            offenseId: undefined,
            offenseActivePicks: [
                { pickId: first!.pickId, templateId: first!.templateId, special: first!.special ?? null },
                { pickId: second!.pickId, templateId: second!.templateId, special: second!.special ?? null },
            ],
        };
        const specs = buildPackageGrantSpecs(selection);
        const actives = specs.filter((s) => s.templateId.startsWith('active-'));
        expect(actives).toHaveLength(2);
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

    it('power override replaces catalog grant on review row', () => {
        const selection: TowerWizardSelection = {
            ...baseSelection,
            powerOverrides: [
                { grantKey: 'passive-2', templateId: 'passive-deep-vitality' },
            ],
        };
        const specs = buildPackageGrantSpecs(selection);
        expect(specs[1].templateId).toBe('passive-deep-vitality');
        const review = buildPackageReview(selection);
        expect(review.reviewPowerRows).toHaveLength(6);
        expect(review.reviewPowerRows[1]?.hasCatalogOverride).toBe(true);
    });

    it('catalog override on offense slot skips variant resolution', () => {
        const selection: TowerWizardSelection = {
            ...baseSelection,
            powerOverrides: [
                {
                    grantKey: 'offense-1',
                    templateId: 'active-ranged-damage-t4',
                    special: 'mark',
                },
            ],
        };
        const specs = buildPackageGrantSpecs(selection);
        expect(specs[5].special).toBe('mark');
        expect(specs[5].templateId).toBe('active-ranged-damage-t4');
    });

    it('catalogEntryMatchesGrantKey rejects wrong category for slot', () => {
        const passive = findCatalogEntry('passive-temp-hp');
        const active = findCatalogEntry('active-ranged-damage-t4', 'mark');
        expect(passive).toBeTruthy();
        expect(active).toBeTruthy();
        expect(catalogEntryMatchesGrantKey(passive!, 'passive-2')).toBe(true);
        expect(catalogEntryMatchesGrantKey(passive!, 'offense-0')).toBe(false);
        expect(catalogEntryMatchesGrantKey(active!, 'offense-0')).toBe(true);
        expect(catalogEntryMatchesGrantKey(active!, 'passive-1')).toBe(false);
    });

    it('playerFacingPowerName prefers special names over tier labels', () => {
        expect(playerFacingPowerName({ templateId: 'active-ranged-damage-t4', rank: 2, special: 'mark' })).toBe('Mark');
    });
});
