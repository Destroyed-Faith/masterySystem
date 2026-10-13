import { describe, it, expect, beforeEach } from 'vitest';
import {
    filterCatalog,
    getAllCatalogEntries,
    _resetCatalogCache,
} from '../src/utils/power-catalog.js';
import {
    describePowerReplaceConstraints,
    isNonReplaceableGrantedPower,
    planPowerReplace,
    readPowerProvenanceFlags,
} from '../src/utils/power-replace.js';

describe('GM power replace', () => {
    beforeEach(() => _resetCatalogCache());

    function startingActive(level = 2) {
        return {
            id: 'old-active',
            name: 'Old Active',
            type: 'power',
            system: {
                category: 'active' as const,
                level,
                minLevel: 2,
                rank: level,
                showInRadialMenu: true,
            },
            flags: { 'mastery-system': { startingPower: true } },
        };
    }

    it('reads startingPower provenance', () => {
        expect(readPowerProvenanceFlags(startingActive())).toEqual({ startingPower: true });
    });

    it('describes same-category / same-level constraints', () => {
        const c = describePowerReplaceConstraints(startingActive(3));
        expect(c).toEqual({ category: 'active', categoryLabel: 'Active', level: 3 });
    });

    it('blocks artifact-granted powers', () => {
        expect(
            isNonReplaceableGrantedPower({
                system: { fromArtifact: true, category: 'active', level: 2 },
            }),
        ).toBe(true);
        expect(isNonReplaceableGrantedPower(startingActive())).toBe(false);
    });

    it('plans a same-level Active replacement and keeps startingPower + minLevel', () => {
        const entries = filterCatalog({ category: 'active' });
        const entry = entries.find((e) => (e.raw as any)?.levels?.['3']);
        expect(entry).toBeTruthy();

        const plan = planPowerReplace(startingActive(3), entry!);
        expect('error' in plan).toBe(false);
        if ('error' in plan) return;

        expect(plan.level).toBe(3);
        expect(plan.minLevel).toBe(2);
        expect(plan.provenance).toEqual({ startingPower: true });
        expect(plan.category).toBe('active');
        const sys = plan.itemData.system as any;
        expect(sys.level).toBe(3);
        expect(sys.rank).toBe(3);
        expect(sys.minLevel).toBe(2);
        expect(sys.category).toBe('active');
        expect((plan.itemData as any).flags?.['mastery-system']?.startingPower).toBe(true);
    });

    it('rejects a different category', () => {
        const passive = getAllCatalogEntries().find((e) => e.category === 'passive');
        expect(passive).toBeTruthy();
        const plan = planPowerReplace(startingActive(2), passive!);
        expect(plan).toEqual(
            expect.objectContaining({
                error: expect.stringContaining('same category'),
            }),
        );
    });

    it('preserves xpPurchased / gmGranted flags', () => {
        const entry = filterCatalog({ category: 'reaction' }).find((e) => (e.raw as any)?.levels?.['4']);
        expect(entry).toBeTruthy();

        const purchased = {
            system: { category: 'reaction' as const, level: 4, minLevel: 1 },
            flags: { 'mastery-system': { xpPurchased: true } },
        };
        const planPurchased = planPowerReplace(purchased, entry!);
        expect('error' in planPurchased).toBe(false);
        if (!('error' in planPurchased)) {
            expect(planPurchased.provenance.xpPurchased).toBe(true);
            expect((planPurchased.itemData as any).flags?.['mastery-system']?.xpPurchased).toBe(true);
        }

        const gm = {
            system: { category: 'reaction' as const, level: 4, minLevel: 4 },
            flags: { 'mastery-system': { gmGranted: true } },
        };
        const planGm = planPowerReplace(gm, entry!);
        expect('error' in planGm).toBe(false);
        if (!('error' in planGm)) {
            expect(planGm.provenance.gmGranted).toBe(true);
            expect((planGm.itemData as any).flags?.['mastery-system']?.gmGranted).toBe(true);
        }
    });

    it('copies showInRadialMenu false onto the replacement', () => {
        const entry = filterCatalog({ category: 'passive' }).find((e) => (e.raw as any)?.levels?.['4']);
        expect(entry).toBeTruthy();
        const plan = planPowerReplace(
            {
                system: {
                    category: 'passive',
                    level: 4,
                    minLevel: 4,
                    showInRadialMenu: false,
                },
                flags: { 'mastery-system': { startingPower: true } },
            },
            entry!,
        );
        expect('error' in plan).toBe(false);
        if (!('error' in plan)) {
            expect((plan.itemData.system as any).showInRadialMenu).toBe(false);
        }
    });
});
