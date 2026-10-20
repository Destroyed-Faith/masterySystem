import { describe, expect, it } from 'vitest';

import { defaultPowerItemDisplayName } from '../src/utils/power-item-builder.js';
import { findCatalogEntry } from '../src/utils/power-catalog.js';
import type { CatalogEntry } from '../src/utils/power-catalog.js';

function entry(partial: Partial<CatalogEntry> & Pick<CatalogEntry, 'name' | 'templateId' | 'category'>): CatalogEntry {
  return {
    templateName: partial.templateName ?? partial.name,
    subfamily: partial.subfamily ?? '',
    tags: [],
    specialKeys: [],
    effectTypes: [],
    description: '',
    raw: {} as CatalogEntry['raw'],
    sourceKind: 'template',
    sourceName: '',
    ...partial,
  };
}

describe('defaultPowerItemDisplayName', () => {
  it('keeps full catalogue headings for Passives and Active Buffs', () => {
    expect(
      defaultPowerItemDisplayName(
        entry({
          name: 'Passive: Regeneration',
          templateName: 'Regeneration',
          templateId: 'passive-regeneration',
          category: 'passive',
        }),
      ),
    ).toBe('Passive: Regeneration');
    expect(
      defaultPowerItemDisplayName(
        entry({
          name: 'Reaction: Armor',
          templateName: 'Armor',
          templateId: 'reaction-armor',
          category: 'reaction',
        }),
      ),
    ).toBe('Armor');
    expect(
      defaultPowerItemDisplayName(
        entry({
          name: 'Active Buff: Temporary HP',
          templateName: 'Temporary HP',
          templateId: 'ab-temp-hp',
          category: 'activeBuff',
        }),
      ),
    ).toBe('Active Buff: Temporary HP');
  });

  it('shortens special actives to Delivery [AoE|Zone] Special', () => {
    const rangedHex = findCatalogEntry('active-ranged-damage-t5', 'hex');
    expect(rangedHex).toBeTruthy();
    expect(defaultPowerItemDisplayName(rangedHex!)).toBe('Ranged Hex');

    const meleeAoeSlow = findCatalogEntry('active-melee-aoe-damage-t4', 'slow');
    expect(meleeAoeSlow).toBeTruthy();
    expect(defaultPowerItemDisplayName(meleeAoeSlow!)).toBe('Melee AoE Slow');

    const zone = findCatalogEntry('active-ranged-zone-t5', 'hex');
    expect(zone).toBeTruthy();
    expect(defaultPowerItemDisplayName(zone!)).toBe('Ranged Zone Hex');
  });

  it('shortens weapon singles to Melee/Ranged Attack', () => {
    const melee = findCatalogEntry('active-melee-weapon-single');
    expect(melee).toBeTruthy();
    expect(defaultPowerItemDisplayName(melee!)).toBe('Melee Attack');

    const ranged = findCatalogEntry('active-ranged-weapon-single');
    expect(ranged).toBeTruthy();
    expect(defaultPowerItemDisplayName(ranged!)).toBe('Ranged Attack');
  });
});
