import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  isR05RetiredHealingPower,
  planR05HealingItem,
  restorationPoolAtRank,
  runR05HealingMigration,
} from '../src/migrations/r05-healing-migration';

function item(name: string, templateId: string, rank = 4, type = 'power', flags: Record<string, unknown> = {}) {
  const data: any = {
    name,
    type,
    system: { templateId, rank, levels: {} },
    flags: { 'mastery-system': flags },
  };
  data.getFlag = (_scope: string, key: string) => data.flags['mastery-system'][key];
  data.update = async (patch: Record<string, unknown>) => {
    for (const [path, value] of Object.entries(patch)) {
      const parts = path.split('.');
      let cur: any = data;
      while (parts.length > 1) {
        const k = parts.shift()!;
        cur[k] ??= {};
        cur = cur[k];
      }
      cur[parts[0]] = value;
    }
  };
  return data;
}

describe('R-05 healing migration — planning', () => {
  it('maps single-target heals to Restoration at the same PL', () => {
    const plan = planR05HealingItem(item('Active: Ranged Single Target Heal', 'active-ranged-single-heal', 10));
    expect(plan).toMatchObject({
      kind: 'restoration',
      templateId: 'active-ranged-health-level-heal',
      rank: 10,
    });
    expect((plan as any).rename).toBe('Ranged Scarred Bar Restoration');
    expect(planR05HealingItem(item('x', 'active-melee-single-heal', 4))).toMatchObject({
      templateId: 'active-melee-health-level-heal',
    });
  });

  it('maps AoE heals to AoE Restoration', () => {
    expect(planR05HealingItem(item('Melee AoE Heal', 'active-melee-aoe-heal', 6))).toMatchObject({
      kind: 'restoration',
      templateId: 'active-melee-aoe-restoration',
    });
    expect(planR05HealingItem(item('Ranged AoE Heal', 'active-ranged-aoe-heal', 9))).toMatchObject({
      templateId: 'active-ranged-aoe-restoration',
    });
  });

  it('keeps a custom item name', () => {
    const plan = planR05HealingItem(item('Mother’s Touch', 'active-melee-single-heal', 5));
    expect(plan).toMatchObject({ kind: 'restoration', rename: null });
  });

  it('does not force an illegal PL: it is retired with a note instead', () => {
    expect(restorationPoolAtRank('active-melee-health-level-heal', 4)).toBeGreaterThan(0);
    expect(restorationPoolAtRank('active-melee-health-level-heal', 1)).toBe(0);
    expect(restorationPoolAtRank('active-ranged-aoe-restoration', 1)).toBe(0);
    const plan = planR05HealingItem(item('Ranged AoE Heal', 'active-ranged-aoe-heal', 1));
    expect(plan.kind).toBe('retire');
    expect((plan as any).reason).toContain('Power Level 1');
  });

  it('maps Passive: Healing to Passive: Regeneration at the same PL', () => {
    const plan = planR05HealingItem(item('Passive: Healing', 'passive-healing', 7, 'passive'));
    expect(plan).toMatchObject({ kind: 'regeneration', rank: 7, rename: 'Passive: Regeneration' });
    expect(planR05HealingItem(item('Passive: Healing', '', 3, 'passive'))).toMatchObject({
      kind: 'regeneration',
    });
    expect(planR05HealingItem(item('Second Wind', 'passive-healing', 3, 'passive'))).toMatchObject({
      kind: 'regeneration',
      rename: null,
    });
  });

  it('retires healing Active Buffs and healing passives', () => {
    for (const id of ['ab-healing', 'ab-healing-aura', 'ab-temp-hp-healing']) {
      expect(planR05HealingItem(item('Buff', id)).kind).toBe('retire');
    }
    expect(planR05HealingItem(item('Blood Feast', 'passive-blood-feast', 3, 'passive')).kind).toBe('retire');
  });

  it('leaves unrelated powers and migrated items alone', () => {
    expect(planR05HealingItem(item('Fire Bolt', 'active-ranged-single-damage')).kind).toBe('none');
    expect(planR05HealingItem(item('Restoration', 'active-melee-health-level-heal')).kind).toBe('none');
    expect(planR05HealingItem(item('Passive: Regeneration', 'passive-regeneration', 4, 'passive')).kind).toBe('none');
    expect(planR05HealingItem(item('Buff', 'ab-healing', 4, 'power', { r05Retired: true })).kind).toBe('none');
  });

  it('flags retired buffs so they cannot activate', () => {
    expect(isR05RetiredHealingPower(item('Healing', 'ab-healing'))).toBe(true);
    expect(isR05RetiredHealingPower(item('x', 'active-melee-single-damage', 4, 'power', { r05Retired: true }))).toBe(true);
    expect(isR05RetiredHealingPower(item('Damage', 'ab-damage'))).toBe(false);
  });
});

describe('R-05 healing migration — run', () => {
  const g = globalThis as any;
  let prevGame: unknown;
  beforeEach(() => {
    prevGame = g.game;
    g.game = { user: { isGM: true } };
  });
  afterEach(() => {
    g.game = prevGame;
  });

  it('rewrites template ids, retires buffs, and is idempotent', async () => {
    const heal = item('Active: Melee Single Target Heal', 'active-melee-single-heal', 4);
    const regen = item('Passive: Healing', 'passive-healing', 5, 'passive');
    const buff = item('Active Buff: Healing', 'ab-healing', 4);
    const other = item('Fire Bolt', 'active-ranged-single-damage', 4);
    const actor = { name: 'Kai', items: [heal, regen, buff, other] };

    const first = await runR05HealingMigration([actor]);
    expect(first).toEqual({ restoration: 1, regeneration: 1, retired: 1 });
    expect(heal.system.templateId).toBe('active-melee-health-level-heal');
    expect(heal.name).toBe('Melee Scarred Bar Restoration');
    expect(regen.system.templateId).toBe('passive-regeneration');
    expect(regen.name).toBe('Passive: Regeneration');
    expect(buff.flags['mastery-system'].r05Retired).toBe(true);
    expect(other.system.templateId).toBe('active-ranged-single-damage');

    const second = await runR05HealingMigration([actor]);
    expect(second).toEqual({ restoration: 0, regeneration: 0, retired: 0 });
  });

  it('does nothing for non-GM clients', async () => {
    g.game = { user: { isGM: false } };
    const heal = item('Heal', 'active-melee-single-heal', 4);
    const out = await runR05HealingMigration([{ name: 'Kai', items: [heal] }]);
    expect(out).toEqual({ restoration: 0, regeneration: 0, retired: 0 });
    expect(heal.system.templateId).toBe('active-melee-single-heal');
  });
});
