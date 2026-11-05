import { describe, expect, it } from 'vitest';
import {
  PROFESSION_CATALOGUE,
  PROFESSION_CATALOGUE_CATEGORIES,
  PROFESSION_CATALOGUE_NOT_CLOSED_LIST,
  PROFESSION_CATALOGUE_VERSION,
  findProfessionCatalogueEntry,
  searchProfessionCatalogue,
} from '../src/rules/profession-catalogue.js';
import { professionIdentityKey, validateSpecializationList } from '../src/rules/specializations.js';

describe('Profession catalogue suggestions (approved 90)', () => {
  it('holds exactly 90 examples in the five approved categories, 18 each', () => {
    expect(PROFESSION_CATALOGUE_NOT_CLOSED_LIST).toBe(true);
    expect(PROFESSION_CATALOGUE_VERSION).toBe('k8-approved-2026-11-05');
    expect(PROFESSION_CATALOGUE).toHaveLength(90);
    expect([...PROFESSION_CATALOGUE_CATEGORIES]).toEqual([
      'Trades',
      'Wilderness',
      'Society',
      'Conflict',
      'Knowledge',
    ]);
    for (const category of PROFESSION_CATALOGUE_CATEGORIES) {
      expect(PROFESSION_CATALOGUE.filter((entry) => entry.category === category)).toHaveLength(18);
    }
    expect(PROFESSION_CATALOGUE.every((entry) => PROFESSION_CATALOGUE_CATEGORIES.includes(entry.category))).toBe(true);
    const names = new Set(PROFESSION_CATALOGUE.map((entry) => entry.name));
    expect(names.size).toBe(90);
    const ids = new Set(PROFESSION_CATALOGUE.map((entry) => entry.id));
    expect(ids.size).toBe(90);
    for (const entry of PROFESSION_CATALOGUE) {
      expect(entry.name.trim()).toBe(entry.name);
      expect(entry.scope_example.trim()).toBe(entry.scope_example);
      expect(entry.name.length).toBeGreaterThan(0);
      expect(entry.scope_example.length).toBeGreaterThan(0);
    }
  });

  it('keeps the author text unchanged for spot-checked entries', () => {
    expect(findProfessionCatalogueEntry('Blacksmith')).toMatchObject({
      category: 'Trades',
      scope_example:
        'You can forge and repair iron tools, judge the quality of metalwork, and recognize the marks left by faulty tools or unusual workshop methods.',
    });
    expect(findProfessionCatalogueEntry('Red Priest Scribe')).toMatchObject({
      category: 'Knowledge',
      scope_example:
        'You know the records, formulas, and terminology used by Red Priest scribes, and can recognize suspicious alterations to familiar documents.',
    });
    expect(findProfessionCatalogueEntry('Wilderness Scout')?.category).toBe('Wilderness');
    expect(findProfessionCatalogueEntry('Field Medic')?.category).toBe('Conflict');
  });

  it('does not carry the old 320-entry list or extra categories', () => {
    expect(findProfessionCatalogueEntry('Night Courier')).toBeNull();
    expect(PROFESSION_CATALOGUE_CATEGORIES).not.toContain('Tyhra');
    expect(PROFESSION_CATALOGUE.length).toBeLessThan(320);
  });

  it('searches by category and by text across names and descriptions', () => {
    expect(searchProfessionCatalogue({ category: 'Society' })).toHaveLength(18);
    const locks = searchProfessionCatalogue({ query: 'locks' }).map((entry) => entry.name);
    expect(locks).toContain('Locksmith');
    expect(locks).toContain('Prison Jailer');
    expect(searchProfessionCatalogue({ query: 'locks', category: 'Trades' }).map((entry) => entry.name)).toEqual(
      expect.arrayContaining(['Locksmith']),
    );
    expect(searchProfessionCatalogue({ query: 'locks', category: 'Trades' }).every((entry) => entry.category === 'Trades')).toBe(true);
    expect(searchProfessionCatalogue({ query: 'zzz-no-such-text' })).toEqual([]);
    expect(searchProfessionCatalogue()).toHaveLength(90);
  });

  it('remains a suggestion library: custom names validate without a catalogue match', () => {
    const custom = ['Night Courier', 'Rope Walker', 'Salt Boiler', 'Grave Digger'].map((name) => ({
      id: professionIdentityKey(name),
      name,
      origin: 'Learned on the job.',
      scope: 'Agreed with the GM.',
      rank: 2,
    }));
    expect(custom.every((row) => findProfessionCatalogueEntry(row.name) === null)).toBe(true);
    expect(validateSpecializationList(custom, { requireStartingBudget: true }).ok).toBe(true);
  });
});
