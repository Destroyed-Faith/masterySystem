import { describe, expect, it } from 'vitest';
import { getAllCatalogEntries } from '../src/utils/power-catalog.js';
import {
  artifactPowerRowLabel,
  listMartialDamageSpecialOptions,
  parseLegacyPick,
  resolvePickFromUi,
  tierFromSpecialKey,
  templateIdForDeliveryAndTier,
} from '../src/utils/artifact-power-pick.js';

describe('artifact-power-pick', () => {
  it('derives tier 4 for Mark', () => {
    expect(tierFromSpecialKey('mark')).toBe(4);
  });

  it('maps delivery + tier to existing martial damage template ids', () => {
    expect(templateIdForDeliveryAndTier('melee-aoe', 4)).toBe('active-melee-aoe-damage-t4');
    expect(templateIdForDeliveryAndTier('ranged-single', 3)).toBe('active-ranged-damage-t3');
  });

  it('resolvePickFromUi binds delivery, template id, and chosenSpecial', () => {
    const pick = resolvePickFromUi('melee-aoe', 'mark');
    expect(pick.delivery).toBe('melee-aoe');
    expect(pick.powerTemplateId).toBe('active-melee-aoe-damage-t4');
    expect(pick.chosenSpecial).toEqual({ key: 'mark', tier: 4 });
  });

  it('lists each martial damage Special once', () => {
    const keys = listMartialDamageSpecialOptions().map((o) => o.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain('mark');
    expect(keys).toContain('poisoned');
  });

  it('formats artifact row labels with delivery + Special', () => {
    expect(artifactPowerRowLabel('melee-aoe', 'mark')).toBe('Melee AoE Special Damage (Mark)');
  });

  it('parseLegacyPick infers delivery from martial template id without chosenSpecial', () => {
    const parsed = parseLegacyPick({
      level: 1,
      kind: 'power',
      powerTemplateId: 'active-melee-damage-t4',
    });
    expect(parsed.delivery).toBe('melee-single');
    expect(parsed.needsSpecial).toBe(true);
    expect(parsed.isLegacyNonMartial).toBe(false);
  });

  it('parseLegacyPick flags non-martial legacy template ids', () => {
    const parsed = parseLegacyPick({
      level: 1,
      kind: 'power',
      powerTemplateId: 'ab-damage',
    });
    expect(parsed.isLegacyNonMartial).toBe(true);
    expect(parsed.delivery).toBe('');
  });
});

describe('Power Catalog — Mark tier fix', () => {
  it('does not expose Tier 3 Mark catalog entries', () => {
    const entries = getAllCatalogEntries();
    const tier3Mark = entries.filter(
      (e) => e.tier === 3 && e.chosenSpecial?.key === 'mark',
    );
    expect(tier3Mark).toHaveLength(0);
  });

  it('still exposes Tier 4 Mark entries', () => {
    const entries = getAllCatalogEntries();
    expect(
      entries.some((e) => e.tier === 4 && e.chosenSpecial?.key === 'mark'),
    ).toBe(true);
  });
});
