import { describe, it, expect, beforeEach } from 'vitest';
import {
    getAllCatalogEntries,
    filterCatalog,
    getSubfamiliesByCategory,
    CATEGORY_ORDER,
    _resetCatalogCache,
    activeTemplateCanBeSpell,
    actorAlreadyHasPower,
    findDuplicatePowerLabel,
    powerIdentityKeyFromEntry,
    findTemplateById,
    isDispelCatalogEntry,
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

    it('exposes the pure weapon-attack templates (no Special slot)', () => {
        const entries = getAllCatalogEntries();
        const weaponIds = [
            'active-melee-weapon-single',
            'active-ranged-weapon-single',
            'active-melee-weapon-aoe',
            'active-ranged-weapon-aoe',
            'active-melee-weapon-split',
            'active-ranged-weapon-split',
            'active-ranged-weapon-autofire',
        ];
        for (const id of weaponIds) {
            const hit = entries.find((e) => e.templateId === id);
            expect(hit, `missing weapon template: ${id}`).toBeDefined();
            expect(hit!.subfamily).toBe('weapon-attack');
            expect(hit!.tier).toBeUndefined();
            expect(hit!.chosenSpecial).toBeUndefined();
        }
    });

    it('exposes Targeted Special Attack templates (Exorcism / Requiem picker)', () => {
        const entries = getAllCatalogEntries();
        const targetedIds = [
            'active-melee-targeted-special',
            'active-ranged-targeted-special',
            'active-melee-aoe-targeted-special',
            'active-ranged-aoe-targeted-special',
        ];
        for (const id of targetedIds) {
            const hits = entries.filter((e) => e.templateId === id);
            expect(hits.length, `missing targeted template: ${id}`).toBeGreaterThanOrEqual(2);
            expect(hits.every((h) => h.subfamily === 'targeted-special-attack')).toBe(true);
            const keys = new Set(hits.map((h) => h.chosenSpecial?.key));
            expect(keys.has('exorcism')).toBe(true);
            expect(keys.has('requiem')).toBe(true);
        }
        const aoe = entries.find(
            (e) => e.templateId === 'active-ranged-aoe-targeted-special' && e.chosenSpecial?.key === 'requiem',
        )!;
        expect(aoe.chosenSpecial?.key).toBe('requiem');
        expect((aoe.raw as any).levels['1'].specials[0]).toMatchObject({ key: 'SPECIAL', rank: 2 });
        expect((aoe.raw as any).levels['4'].specials[0]).toMatchObject({ key: 'SPECIAL', rank: 6 });
        expect((aoe.raw as any).levels['16'].specials[0]).toMatchObject({ key: 'SPECIAL', rank: 10 });
        expect((aoe.raw as any).levels['7'].aoe).toMatchObject({ shape: 'radius', radiusM: 5 });
    });

    it('exposes the Ranged Images illusion template', () => {
        const entries = getAllCatalogEntries();
        const hit = entries.find((e) => e.templateId === 'active-ranged-illusion-image');
        expect(hit).toBeDefined();
        expect(hit!.subfamily).toBe('illusion');
        expect(hit!.chosenSpecial).toBeUndefined();
    });

    it('Stunning Strike uses fixed (rank-less) Stunned on unlocked levels', () => {
        const entries = getAllCatalogEntries();
        const melee = entries.find((e) => e.templateId === 'active-melee-damage-stunned');
        expect(melee).toBeDefined();
        const row4 = (melee!.raw as any).levels['4'];
        expect(row4.specials).toEqual([{ key: 'stunned' }]);
        const row1 = (melee!.raw as any).levels['1'];
        expect(row1.specials).toEqual([]);
    });

    it('detects duplicate passive powers by templateId', () => {
        const entries = getAllCatalogEntries();
        const dr = entries.find((e) => e.templateId === 'passive-damage-reduction');
        expect(dr).toBeDefined();
        const owned = [{ system: { templateId: 'passive-damage-reduction', templateName: 'Damage Reduction', category: 'passive' } }];
        expect(actorAlreadyHasPower(owned, dr!)).toBe(true);
        expect(findDuplicatePowerLabel([
            owned[0],
            { name: 'Damage Reduction (copy)', system: owned[0].system },
        ])).toBe('Damage Reduction');
    });

    it('treats active specials as distinct identities on the same template', () => {
        const entries = getAllCatalogEntries();
        const tier3 = entries.filter((e) => e.category === 'active' && e.tier === 3);
        const a = tier3[0];
        const b = tier3.find((e) => e.templateId === a.templateId && e.chosenSpecial?.key !== a.chosenSpecial?.key);
        if (!b) return;
        expect(powerIdentityKeyFromEntry(a)).not.toBe(powerIdentityKeyFromEntry(b));
        expect(actorAlreadyHasPower([{ system: { templateId: a.templateId, chosenSpecial: a.chosenSpecial } }], b)).toBe(false);
    });

    it('only ranged active templates may become spells', () => {
        expect(activeTemplateCanBeSpell('active-ranged-damage-t4')).toBe(true);
        expect(activeTemplateCanBeSpell('active-melee-damage-t4')).toBe(false);
        expect(activeTemplateCanBeSpell('active-melee-weapon-single')).toBe(false);
    });

    it('Initiative passive scales +2 per level (10 PP / +1 Initiative)', () => {
        const template = findTemplateById('passive-initiative');
        expect(template).toBeDefined();
        expect(template!.levels['1'].effect?.text).toContain('+2 Initiative');
        expect(template!.levels['16'].effect?.text).toContain('+32 Initiative');
        expect((template!.levels['4'].mechanics as any)?.initiative).toBe(8);
        expect((template!.levels['10'].mechanics as any)?.initiative).toBe(20);
    });

    it('Reaction: Initiative Gain scales +2 per level after attack resolves', () => {
        const template = findTemplateById('reaction-initiative-gain');
        expect(template).toBeDefined();
        expect(template!.trigger).toContain('targeted by an attack');
        expect(template!.levels['1'].effect?.text).toContain('+2 Initiative');
        expect(template!.levels['16'].effect?.text).toContain('+32 Initiative');
        expect((template!.levels['4'].mechanics as any)?.initiativeGain).toBe(8);
        expect((template!.levels['10'].mechanics as any)?.initiativeGain).toBe(20);
        expect(template!.levels['1'].mechanics?.applyWhen).toBe('reaction-once-per-round');
    });

    it('Reaction: Reposition unlocks at L4 with 2/4/8 m at PL 4/10/16', () => {
        const template = findTemplateById('reaction-reposition');
        expect(template).toBeDefined();
        expect(template!.levels['3'].effect?.text).toBe('—');
        expect(template!.levels['4'].effect?.text).toContain('2 m');
        expect(template!.levels['10'].effect?.text).toContain('4 m');
        expect(template!.levels['16'].effect?.text).toContain('8 m');
        expect((template!.levels['4'].mechanics as any)?.movementBonus).toBe(2);
    });

    it('Active Buff: Critical uses milestone bands with no effect at L1–3', () => {
        const template = findTemplateById('ab-critical');
        expect(template).toBeDefined();
        const levels = template!.levels;
        expect(levels['1'].effect?.text).toBe('—');
        expect(levels['3'].effect?.text).toBe('—');
        expect(levels['4'].effect?.text).toContain('Critical(1)');
        expect(levels['7'].effect?.text).toContain('Critical(1)');
        expect(levels['8'].effect?.text).toContain('Critical(2)');
        expect(levels['11'].effect?.text).toContain('Critical(2)');
        expect(levels['12'].effect?.text).toContain('Critical(3)');
        expect(levels['14'].effect?.text).toContain('Critical(3)');
        expect(levels['15'].effect?.text).toContain('Critical(4)');
        expect(levels['16'].effect?.text).toContain('Critical(4)');
        expect(levels['4'].mechanics?.critical).toBe(1);
        expect(levels['1'].mechanics?.critical).toBeUndefined();
    });

    it('excludes dispel actives from the catalog (cleanse replaces dispel at the table)', () => {
        const entries = getAllCatalogEntries();
        expect(entries.some((e) => isDispelCatalogEntry(e))).toBe(false);
        expect(entries.some((e) => e.templateId.includes('dispel'))).toBe(false);
        expect(filterCatalog({ category: 'active', search: 'dispel' }).every((e) => !isDispelCatalogEntry(e))).toBe(true);
    });
});
