import { describe, expect, it } from 'vitest';
import {
  catalogSpecialKeysForTemplate,
  catalogTemplateRequiresSpecial,
  listCatalogSpecialOptions,
} from '../src/utils/artifact-catalog-pick.js';

describe('artifact-catalog-pick', () => {
  it('requires a Special for persistent zone templates', () => {
    expect(catalogTemplateRequiresSpecial('active-ranged-zone-t3')).toBe(true);
    const keys = catalogSpecialKeysForTemplate('active-ranged-zone-t3');
    expect(keys).toContain('poisoned');
    expect(listCatalogSpecialOptions('active-ranged-zone-t3').length).toBeGreaterThan(0);
  });

  it('requires a Special for special aura buffs', () => {
    expect(catalogTemplateRequiresSpecial('ab-special-aura-start-4')).toBe(true);
    expect(catalogSpecialKeysForTemplate('ab-special-aura-start-4')).toEqual(
      expect.arrayContaining(['ignite', 'bleeding']),
    );
  });

  it('does not require a Special for pure weapon attacks or damage aura', () => {
    expect(catalogTemplateRequiresSpecial('active-ranged-weapon-aoe')).toBe(false);
    expect(catalogTemplateRequiresSpecial('ab-damage-aura')).toBe(false);
  });
});
