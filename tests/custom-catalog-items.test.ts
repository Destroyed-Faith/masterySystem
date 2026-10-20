import { describe, expect, it } from 'vitest';
import { listMundaneItemIconChoices } from '../src/utils/item-icons';
import { isCustomCatalogItem } from '../src/utils/custom-catalog-items';

describe('listMundaneItemIconChoices', () => {
  it('returns unique icon paths including gear and weapon art', () => {
    const icons = listMundaneItemIconChoices();
    expect(icons.length).toBeGreaterThan(10);
    const paths = new Set(icons.map((i) => i.path));
    expect(paths.size).toBe(icons.length);
    expect(icons.some((i) => i.path.includes('/gear/'))).toBe(true);
    expect(icons.some((i) => i.path.includes('/weapons/'))).toBe(true);
    expect(icons.every((i) => !i.path.includes('echo-artifacts'))).toBe(true);
  });
});

describe('isCustomCatalogItem', () => {
  it('reads the custom catalog flag', () => {
    expect(
      isCustomCatalogItem({
        getFlag: (scope: string, key: string) =>
          scope === 'mastery-system' && key === 'customCatalogItem' ? true : undefined,
      }),
    ).toBe(true);
    expect(isCustomCatalogItem({ flags: { 'mastery-system': { customCatalogItem: true } } })).toBe(
      true,
    );
    expect(isCustomCatalogItem({})).toBe(false);
  });
});
