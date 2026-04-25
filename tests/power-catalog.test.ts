import { describe, it, expect, beforeEach } from 'vitest';
import {
    getAllCatalogEntries,
    filterCatalog,
    getSubfamiliesByCategory,
    CATEGORY_ORDER,
    _resetCatalogCache,
} from '../src/utils/power-catalog';

describe('Power Catalog (Templates refactor)', () => {
    beforeEach(() => _resetCatalogCache());

    it('includes entries for every core category', () => {
        const entries = getAllCatalogEntries();
        expect(entries.length).toBeGreaterThan(0);
        for (const cat of CATEGORY_ORDER) {
            expect(entries.some((e) => e.category === cat)).toBe(true);
        }
    });

    it('expands Active damage templates once per eligible Special', () => {
        const entries = getAllCatalogEntries();
        const activeDamage = entries.filter(
            (e) => e.category === 'active' && e.tier != null,
        );
        expect(activeDamage.length).toBeGreaterThan(0);
        for (const entry of activeDamage) {
            expect(entry.chosenSpecial).toBeDefined();
            expect(entry.chosenSpecial?.tier).toBe(entry.tier);
            expect(entry.specialKeys).toContain(entry.chosenSpecial?.key);
        }
    });

    it('filters by category', () => {
        const movement = filterCatalog({ category: 'movement' });
        expect(movement.length).toBeGreaterThan(0);
        expect(movement.every((e) => e.category === 'movement')).toBe(true);
    });

    it('filters by subfamily within a category', () => {
        const subs = getSubfamiliesByCategory('movement');
        expect(subs.length).toBeGreaterThan(0);
        for (const sub of subs) {
            const results = filterCatalog({ category: 'movement', subfamily: sub });
            expect(results.every((e) => e.subfamily === sub)).toBe(true);
        }
    });

    it('filters by tier for actives', () => {
        const tier3 = filterCatalog({ category: 'active', tier: 3 });
        expect(tier3.every((e) => e.tier === 3)).toBe(true);
    });

    it('filters by special key for actives', () => {
        const entries = getAllCatalogEntries();
        const someSpecial = entries.find((e) => e.chosenSpecial?.key)?.chosenSpecial?.key;
        if (!someSpecial) return; // no actives in registry → test is vacuous
        const hits = filterCatalog({ category: 'active', special: someSpecial });
        expect(hits.length).toBeGreaterThan(0);
        expect(hits.every((e) => e.specialKeys.includes(someSpecial))).toBe(true);
    });

    it('applies a free-text search over name / templateName', () => {
        const entries = getAllCatalogEntries();
        if (entries.length === 0) return;
        const needle = entries[0].templateName.split(' ')[0].toLowerCase();
        const hits = filterCatalog({ search: needle });
        expect(hits.length).toBeGreaterThan(0);
    });
});
