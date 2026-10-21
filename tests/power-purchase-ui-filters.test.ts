/**
 * Power Purchase Dialog — UI Effect/Delivery filters & Active Buff browse model.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FINAL_ACTIVE_BUFF_TEMPLATE_IDS,
  filterCatalog,
  getSubfamiliesByCategory,
} from '../src/utils/power-catalog.js';
import {
  ACTIVE_BUFF_UI_FOCUS_BY_TEMPLATE_ID,
  ACTIVE_UI_DELIVERIES,
  ACTIVE_UI_EFFECTS,
  ACTIVE_UI_FILTER_BY_TEMPLATE_ID,
  activeBuffMatchesUiFocus,
  activeMatchesUiDelivery,
  activeMatchesUiEffect,
  getActiveBuffUiFoci,
  getActiveUiFilterMeta,
} from '../src/utils/power-purchase-ui-filters.js';

const ROOT = join(__dirname, '..');

describe('Power Purchase UI filters — Active Buffs', () => {
  it('final catalogue has exactly 18 Active Buffs including Armor', () => {
    expect(FINAL_ACTIVE_BUFF_TEMPLATE_IDS).toHaveLength(18);
    expect(FINAL_ACTIVE_BUFF_TEMPLATE_IDS).toContain('ab-armor');
    const listed = filterCatalog({ category: 'activeBuff' });
    expect(listed).toHaveLength(18);
    expect(new Set(listed.map((e) => e.templateId)).size).toBe(18);
    expect(listed.some((e) => e.templateId === 'ab-armor')).toBe(true);
    expect(listed.some((e) => e.name === 'Active Buff: Armor')).toBe(true);
  });

  it('Focus All/Defensive/Offensive classifies all 18 without duplicates or retired Powers', () => {
    for (const id of FINAL_ACTIVE_BUFF_TEMPLATE_IDS) {
      const foci = getActiveBuffUiFoci(id);
      expect(foci.length, id).toBeGreaterThan(0);
    }
    expect(Object.keys(ACTIVE_BUFF_UI_FOCUS_BY_TEMPLATE_ID).sort()).toEqual(
      [...FINAL_ACTIVE_BUFF_TEMPLATE_IDS].sort(),
    );

    const all = filterCatalog({ category: 'activeBuff', uiActiveBuffFocus: null });
    expect(all).toHaveLength(18);
    expect(all.filter((e) => e.templateId === 'ab-armor')).toHaveLength(1);
    expect(all.filter((e) => e.templateId === 'ab-thorns')).toHaveLength(1);

    const defensive = filterCatalog({ category: 'activeBuff', uiActiveBuffFocus: 'defensive' });
    const offensive = filterCatalog({ category: 'activeBuff', uiActiveBuffFocus: 'offensive' });
    expect(defensive.some((e) => e.templateId === 'ab-armor')).toBe(true);
    expect(defensive.some((e) => e.templateId === 'ab-cleanse-maintenance')).toBe(true);
    expect(defensive.some((e) => e.templateId === 'ab-intensified-absorption')).toBe(true);
    expect(offensive.some((e) => e.templateId === 'ab-damage')).toBe(true);
    expect(offensive.some((e) => e.templateId === 'ab-critical')).toBe(true);
    expect(offensive.some((e) => e.templateId === 'ab-damage-aura')).toBe(true);
    expect(offensive.some((e) => e.templateId === 'ab-summon-damage-aura')).toBe(true);
    expect(activeBuffMatchesUiFocus('ab-thorns', 'defensive')).toBe(true);
    expect(activeBuffMatchesUiFocus('ab-thorns', 'offensive')).toBe(true);
    expect(defensive.filter((e) => e.templateId === 'ab-thorns')).toHaveLength(1);
    expect(offensive.filter((e) => e.templateId === 'ab-thorns')).toHaveLength(1);

    // Every approved buff reachable via All; union of foci covers all 18.
    const covered = new Set([
      ...defensive.map((e) => e.templateId),
      ...offensive.map((e) => e.templateId),
    ]);
    expect(covered.size).toBe(18);

    expect(all.some((e) => e.templateId === 'ab-penetration')).toBe(false);
    expect(all.some((e) => /combined/i.test(e.templateId))).toBe(false);
    expect(all.some((e) => e.templateId === 'passive-armor-reduction')).toBe(false);
  });

  it('purchase dialog shows Focus for Active Buffs (not Kind) and keeps Active Effect/Delivery', () => {
    const src = readFileSync(join(ROOT, 'src/sheets/character-sheet-power-dialog.ts'), 'utf8');
    expect(src).toMatch(/pc-buff-focus/);
    expect(src).toMatch(/pc-effect-field/);
    expect(src).toMatch(/pc-delivery-field/);
    expect(src).toMatch(/\$buffFocusField\.prop\('hidden', !isActiveBuff\)/);
    expect(src).toMatch(/\$kindField\.prop\('hidden', !useKind\)/);
    expect(src).not.toMatch(/ACTIVE_BUFF_UI_GROUPS/);
    expect(src).not.toMatch(/document\.createElement\('optgroup'\)/);
  });
});

describe('Power Purchase UI filters — Actives Effect/Delivery', () => {
  const activeEntries = filterCatalog({ category: 'active' });
  const activeTemplateIds = [...new Set(activeEntries.map((e) => e.templateId))];

  it('exposes Effect and Delivery option sets', () => {
    expect(ACTIVE_UI_EFFECTS).toEqual([
      'damage',
      'special',
      'control',
      'healing',
      'cleanse',
      'protection',
      'illusion',
      'utility',
    ]);
    expect(ACTIVE_UI_DELIVERIES).toEqual([
      'single-target',
      'area',
      'zone-persistent',
      'self',
    ]);
  });

  it('maps every selectable Active template and keeps all discoverable with default filters', () => {
    expect(activeTemplateIds.length).toBeGreaterThan(40);
    for (const id of activeTemplateIds) {
      const meta = getActiveUiFilterMeta(id);
      expect(meta, `missing UI meta for ${id}`).toBeTruthy();
      expect(meta!.effects.length).toBeGreaterThan(0);
      expect(meta!.deliveries.length).toBeGreaterThan(0);
      for (const e of meta!.effects) expect(ACTIVE_UI_EFFECTS).toContain(e);
      for (const d of meta!.deliveries) expect(ACTIVE_UI_DELIVERIES).toContain(d);
    }
    // Mapping must not leave orphan keys that hide from Any filters
    expect(activeEntries.length).toBe(
      filterCatalog({ category: 'active', uiEffect: null, uiDelivery: null }).length,
    );
  });

  it('mapping table only references known Active template ids from the selectable set (plus optional retired)', () => {
    const mapped = Object.keys(ACTIVE_UI_FILTER_BY_TEMPLATE_ID);
    for (const id of activeTemplateIds) {
      expect(mapped).toContain(id);
    }
  });

  it('multi-label effects work (damage+special; damage+healing transfer)', () => {
    expect(activeMatchesUiEffect('active-melee-damage-t4', 'damage')).toBe(true);
    expect(activeMatchesUiEffect('active-melee-damage-t4', 'special')).toBe(true);
    expect(activeMatchesUiEffect('active-melee-damage-t4', 'healing')).toBe(false);

    expect(activeMatchesUiEffect('active-melee-single-target-damage-transfer', 'damage')).toBe(true);
    expect(activeMatchesUiEffect('active-melee-single-target-damage-transfer', 'healing')).toBe(true);

    const dmg = filterCatalog({ category: 'active', uiEffect: 'damage' });
    const special = filterCatalog({ category: 'active', uiEffect: 'special' });
    expect(dmg.some((e) => e.templateId === 'active-melee-damage-t4')).toBe(true);
    expect(special.some((e) => e.templateId === 'active-melee-damage-t4')).toBe(true);
    expect(dmg.some((e) => e.templateId === 'active-melee-single-target-damage-transfer')).toBe(true);
  });

  it('mechanics-accurate tags: zones special-only, absorption protection, split/autofire single-target', () => {
    expect(activeMatchesUiEffect('active-ranged-zone-t4', 'special')).toBe(true);
    expect(activeMatchesUiEffect('active-ranged-zone-t4', 'damage')).toBe(false);
    expect(activeMatchesUiDelivery('active-ranged-zone-t4', 'zone-persistent')).toBe(true);

    expect(activeMatchesUiEffect('active-cleanse-absorption', 'cleanse')).toBe(true);
    expect(activeMatchesUiEffect('active-cleanse-absorption', 'protection')).toBe(true);
    expect(activeMatchesUiEffect('active-cleanse-absorption', 'utility')).toBe(false);

    expect(activeMatchesUiDelivery('active-melee-weapon-split', 'single-target')).toBe(true);
    expect(activeMatchesUiDelivery('active-ranged-weapon-autofire', 'single-target')).toBe(true);
    expect(activeMatchesUiDelivery('active-melee-weapon-split', 'area')).toBe(false);
  });

  it('combined Effect + Delivery + Special AND-filters correctly', () => {
    const hits = filterCatalog({
      category: 'active',
      uiEffect: 'special',
      uiDelivery: 'single-target',
      special: 'sundered',
    });
    expect(hits.length).toBeGreaterThan(0);
    for (const e of hits) {
      expect(activeMatchesUiEffect(e.templateId, 'special')).toBe(true);
      expect(activeMatchesUiDelivery(e.templateId, 'single-target')).toBe(true);
      expect(e.specialKeys).toContain('sundered');
    }

    const none = filterCatalog({
      category: 'active',
      uiEffect: 'illusion',
      uiDelivery: 'zone-persistent',
      special: 'sundered',
    });
    expect(none).toHaveLength(0);
  });

  it('Self delivery includes self-centered melee AoE without hiding ranged AoE under Area', () => {
    const selfHits = filterCatalog({ category: 'active', uiDelivery: 'self' });
    expect(selfHits.some((e) => e.templateId === 'active-melee-aoe-damage-t4')).toBe(true);
    expect(selfHits.every((e) => activeMatchesUiDelivery(e.templateId, 'self'))).toBe(true);

    const areaHits = filterCatalog({ category: 'active', uiDelivery: 'area' });
    expect(areaHits.some((e) => e.templateId === 'active-ranged-aoe-damage-t4')).toBe(true);
    expect(areaHits.some((e) => e.templateId === 'active-melee-aoe-damage-t4')).toBe(true);
  });

  it('Mental, Weapon, Barrier, Control remain discoverable', () => {
    const any = filterCatalog({ category: 'active' });
    for (const id of [
      'active-mental-attack',
      'active-mental-control',
      'active-mind-illusion',
      'active-mind-probe',
      'active-melee-weapon-single',
      'active-ranged-barrier',
      'active-melee-control-push-pull',
    ]) {
      expect(any.some((e) => e.templateId === id), id).toBe(true);
    }
    expect(filterCatalog({ category: 'active', uiEffect: 'control' })
      .some((e) => e.templateId === 'active-mental-control')).toBe(true);
    expect(filterCatalog({ category: 'active', uiEffect: 'protection' })
      .some((e) => e.templateId === 'active-ranged-barrier')).toBe(true);
    expect(filterCatalog({ category: 'active', uiEffect: 'damage' })
      .some((e) => e.templateId === 'active-melee-weapon-single')).toBe(true);
  });
});

describe('Power Purchase UI filters — other categories unchanged', () => {
  it('Passive / Reaction / Movement still expose Kind subfamilies', () => {
    expect(getSubfamiliesByCategory('passive').length).toBeGreaterThan(0);
    expect(getSubfamiliesByCategory('reaction').length).toBeGreaterThan(0);
    expect(getSubfamiliesByCategory('movement').length).toBeGreaterThan(0);
    expect(filterCatalog({ category: 'passive', subfamily: getSubfamiliesByCategory('passive')[0]! }).length)
      .toBeGreaterThan(0);
  });

  it('shared filter CSS uses aligned filter-field grid', () => {
    const css = readFileSync(join(ROOT, 'styles/character-sheet.css'), 'utf8');
    expect(css).toMatch(/\.power-catalog-filters\s*\{[^}]*display:\s*grid/s);
    expect(css).toMatch(/power-filter-field/);
    expect(css).toMatch(/align-items:\s*end/);
    expect(css).toMatch(/min-height:\s*2\.65rem/);
  });
});
