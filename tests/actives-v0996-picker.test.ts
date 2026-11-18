import { describe, expect, it } from 'vitest';
import { filterCatalog, findCatalogEntry, getAllCatalogEntries } from '../src/utils/power-catalog.js';
import { CANONICAL_ACTIVES } from '../src/utils/powers/canonical-actives.generated.js';
import {
  ALL_TIER_ELIGIBLE_SPECIALS,
} from '../src/utils/powers/templates/_specials.js';
import { catalogEntryBoundLevels } from '../src/utils/power-item-builder.js';
import { canonicalSpecialRank, canonicalRadiusM } from '../src/utils/powers/canonical-active-lookup.js';

const DELIVERIES = [
  { flavour: 'melee', kind: 'single', re: /^active-melee-instant-special-t[3-6]$/, canon: (k: string) => `melee-single-target-special-${k}` },
  { flavour: 'ranged', kind: 'single', re: /^active-ranged-instant-special-t[3-6]$/, canon: (k: string) => `ranged-single-target-special-${k}` },
  { flavour: 'melee', kind: 'aoe', re: /^active-melee-aoe-damage-t[3-6]$/, canon: (k: string) => `melee-aoe-special-${k}` },
  { flavour: 'ranged', kind: 'aoe', re: /^active-ranged-aoe-damage-t[3-6]$/, canon: (k: string) => `ranged-aoe-special-${k}` },
] as const;

describe('Actives v0.9.9.6 picker', () => {
  it('offers every Special / Delivery combination exactly once (4 × 14 = 56)', () => {
    expect(ALL_TIER_ELIGIBLE_SPECIALS).toHaveLength(14);
    const visible = filterCatalog({ category: 'active' });
    let total = 0;
    const problems: string[] = [];
    for (const d of DELIVERIES) {
      for (const key of ALL_TIER_ELIGIBLE_SPECIALS) {
        const hits = visible.filter((e) => d.re.test(e.templateId) && e.chosenSpecial?.key === key);
        if (hits.length !== 1) problems.push(`${d.flavour}-${d.kind} ${key}: ${hits.length}`);
        total += hits.length;
      }
    }
    expect(problems.join('\n')).toBe('');
    expect(total).toBe(56);
  });

  it('names Single Target / AoE Special entries exactly like the Actives headings', () => {
    const visible = filterCatalog({ category: 'active' });
    const problems: string[] = [];
    for (const d of DELIVERIES) {
      for (const key of ALL_TIER_ELIGIBLE_SPECIALS) {
        const e = visible.find((x) => d.re.test(x.templateId) && x.chosenSpecial?.key === key);
        const title = CANONICAL_ACTIVES[d.canon(key)]?.title;
        if (!e || !title || e.name !== title) problems.push(`${d.canon(key)}: ${e?.name} ≠ ${title}`);
      }
    }
    expect(problems.join('\n')).toBe('');
  });

  it('names Persistent Special Zones by the printed zone heading', () => {
    for (const e of getAllCatalogEntries().filter((x) => /^active-ranged-zone-t[3-6]$/.test(x.templateId))) {
      expect(e.name.startsWith('Ranged Persistent Special Zone: ')).toBe(true);
    }
  });

  it('has no Damage + Special, Mental Attack or HP single-heal; keeps Single/AoE/Split/Autofire/Limited', () => {
    const visible = filterCatalog({ category: 'active' });
    const ids = new Set(visible.map((e) => e.templateId));
    for (const t of [3, 4, 5, 6]) {
      expect(ids.has(`active-melee-damage-t${t}`)).toBe(false);
      expect(ids.has(`active-ranged-damage-t${t}`)).toBe(false);
    }
    expect(ids.has('active-mental-attack')).toBe(false);
    expect(ids.has('active-melee-single-heal')).toBe(false);
    expect(ids.has('active-ranged-single-heal')).toBe(false);
    for (const id of [
      'active-melee-weapon-single', 'active-ranged-weapon-single',
      'active-melee-weapon-aoe', 'active-ranged-weapon-aoe',
      'active-melee-weapon-split', 'active-ranged-weapon-split',
      'active-ranged-weapon-autofire',
      'active-melee-limited-single', 'active-ranged-limited-aoe',
    ]) {
      expect(ids.has(id), id).toBe(true);
    }
    // Removed templates do not resolve; owned items are handled by the migrations.
    expect(findCatalogEntry('active-melee-damage-t4', 'ruin')).toBeNull();
    expect(findCatalogEntry('active-mental-attack')).toBeNull();
    expect(findCatalogEntry('active-ranged-single-heal')).toBeNull();
  });

  it('binds the picker preview to the chosen Special (rank and radius per Special)', () => {
    const e = findCatalogEntry('active-melee-aoe-damage-t5', 'sundered')!;
    const levels = catalogEntryBoundLevels(e) as Record<string, any>;
    for (let pl = 1; pl <= 16; pl++) {
      const row = levels[String(pl)];
      const rank = row.specials.find((s: any) => s.key === 'sundered')?.rank;
      expect(rank, `PL${pl}`).toBe(canonicalSpecialRank('melee-aoe-special-sundered', 'sundered', pl));
      expect(row.aoe?.radius ?? row.aoe?.radiusM, `PL${pl} radius`)
        .toBe(canonicalRadiusM('melee-aoe-special-sundered', pl));
    }
  });
});
