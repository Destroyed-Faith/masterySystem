/**
 * Moonlight Mending is Resolve Ability: Healing (Stone Power Support); the
 * single-target HP heal templates no longer exist. Old artifact-sourced
 * single-heal items are left to the legacy-cleanup migration, never
 * auto-converted to Scarred Bar Restoration by R-05.
 */
import { describe, expect, it } from 'vitest';
import { GENERAL_ARTIFACTS } from '../src/utils/general-artifacts.js';
import { buildEchoProgressionPicks } from '../src/utils/echo-artifacts.js';
import { filterCatalog, findTemplateById } from '../src/utils/power-catalog.js';
import { healPowerItemFromRadialOption } from '../src/combat/heal-resolution.js';
import {
  isArtifactSourcedPowerItem,
  planR05HealingItem,
} from '../src/migrations/r05-healing-migration.js';

function singleHealItem(flags: Record<string, unknown> = {}): any {
  return {
    type: 'power',
    name: 'Moonlight Mending',
    flags: { 'mastery-system': flags },
    system: { templateId: 'active-ranged-single-heal', rank: 4, level: 4 },
  };
}

describe('Moonlight Mending / removed single-target heals', () => {
  it('Moonlight Mending is Ranged Scarred Bar Restoration (no Healing support)', () => {
    const picks = buildEchoProgressionPicks(GENERAL_ARTIFACTS.moonlightGreatsword as any);
    const mending = picks.find((p: any) => p.level === 1) as any;
    expect(mending?.kind).toBe('power');
    expect(mending?.powerTemplateId).toBe('active-ranged-health-level-heal');
    expect(mending?.stoneFunction).toBeUndefined();
  });

  it('single-heal templates are gone from the catalog', () => {
    const visible = filterCatalog({} as any).map((e: any) => e.raw?.templateId);
    expect(visible).not.toContain('active-ranged-single-heal');
    expect(visible).not.toContain('active-melee-single-heal');
    expect(findTemplateById('active-ranged-single-heal')).toBeFalsy();
    expect(findTemplateById('active-melee-single-heal')).toBeFalsy();
  });

  it('an old single-heal artifact option resolves to no heal power', () => {
    const heal = healPowerItemFromRadialOption({
      id: 'artifact:moon:slot:1',
      name: 'Moonlight Mending I',
      slot: 'attack',
      source: 'artifact',
      artifactPowerTemplateId: 'active-ranged-single-heal',
      artifactRowLevel: 1,
      rank: 4,
    } as any);
    expect(heal).toBeNull();
  });

  it('R-05 skips artifact-sourced single-heal items and still converts learned ones', () => {
    for (const flag of ['echoBound', 'fromArtifact', 'artifactGranted']) {
      const item = singleHealItem({ [flag]: true });
      expect(isArtifactSourcedPowerItem(item)).toBe(true);
      expect(planR05HealingItem(item).kind).toBe('none');
    }
    const learned = singleHealItem();
    expect(isArtifactSourcedPowerItem(learned)).toBe(false);
    expect(planR05HealingItem(learned).kind).not.toBe('none');
  });
});
