/**
 * R-05 Healing & Restoration — integration scenarios A–M (core runtime).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  R05_MELEE_AOE_POOL,
  R05_MELEE_ST_POOL,
  R05_PASSIVE_REGEN_POOL,
  R05_RANGED_AOE_POOL,
  R05_RANGED_ST_POOL,
  meleeAoePoolFromBudget,
  rangedAoePoolFromBudget,
  passiveRegenPoolFromBudget,
  restoreScarredHealthBars,
  isScarredRestorationTemplateId,
} from '../src/combat/r05-restoration';
import {
  aoeRestorationMaxForTarget,
  aoeRestorationPoolLeft,
  formatAoeRestorationPromptChat,
  validateAoeRestorationAllocation,
  type AoeRestorationPending,
} from '../src/combat/aoe-restoration';
import {
  activatePassiveRegeneration,
  getRegenerationState,
  REGEN_DAILY_FLAG,
} from '../src/combat/passive-regeneration';
import { countScarredHealthBars } from '../src/stones/remove-scar';
import { getTemplate } from '../src/utils/powers/templates/index';
import {
  armResolveHealingPending,
  isResolveHealingPendingExpired,
  isResolveHealingPendingLive,
  markResolveHealingSpent,
  readResolveHealingPending,
  RESOLVE_HEALING_PENDING_FLAG,
} from '../src/stones/resolve-healing-pending';
import { isDamageTransferPower } from '../src/combat/damage-transfer';

function makeBars(specs: Array<{ name: string; current: number; max: number }>) {
  return specs.map((s) => ({ ...s }));
}

function makeActor(bars: any[], extras: Record<string, unknown> = {}) {
  const actor: any = {
    id: 'a1',
    name: 'Hero',
    type: 'character',
    system: {
      health: { bars, currentBar: bars.findIndex((b) => (b.current || 0) > 0) },
      attributes: { vitality: { value: 4 }, resolve: { value: 4 } },
      mastery: { rank: 2 },
    },
    flags: { 'mastery-system': {} },
    items: [],
    async update(updates: Record<string, unknown>) {
      if (updates['system.health.bars']) actor.system.health.bars = updates['system.health.bars'];
      if (updates['system.health.currentBar'] != null) {
        actor.system.health.currentBar = updates['system.health.currentBar'];
      }
      if (updates['system.health.scarred'] != null) {
        actor.system.health.scarred = updates['system.health.scarred'];
      }
    },
    getFlag(scope: string, key: string) {
      return actor.flags?.[scope]?.[key];
    },
    async setFlag(scope: string, key: string, value: unknown) {
      actor.flags[scope] = actor.flags[scope] || {};
      actor.flags[scope][key] = value;
    },
    async unsetFlag(scope: string, key: string) {
      if (actor.flags?.[scope]) delete actor.flags[scope][key];
    },
    ...extras,
  };
  return actor;
}

describe('R-05 PL tables (Test M)', () => {
  it('matches Section 6 ST / AoE / Regen pools', () => {
    expect([...R05_MELEE_ST_POOL]).toEqual([0, 1, 2, 3, 3, 4, 5, 6, 6, 7, 8, 9, 9, 10, 11, 12]);
    expect([...R05_RANGED_ST_POOL]).toEqual([0, 1, 2, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8, 8, 9, 10]);
    expect([...R05_MELEE_AOE_POOL]).toEqual([0, 1, 1, 2, 3, 3, 4, 4, 4, 5, 6, 6, 7, 8, 9, 9]);
    expect([...R05_RANGED_AOE_POOL]).toEqual([0, 0, 1, 2, 2, 3, 4, 4, 4, 5, 5, 6, 7, 7, 8, 8]);
    expect([...R05_PASSIVE_REGEN_POOL]).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8]);
  });

  it('validates PP budgets independently for AoE and Regen', () => {
    for (let pl = 1; pl <= 16; pl += 1) {
      expect(meleeAoePoolFromBudget(pl)).toBe(R05_MELEE_AOE_POOL[pl - 1]);
      expect(rangedAoePoolFromBudget(pl)).toBe(R05_RANGED_AOE_POOL[pl - 1]);
      expect(passiveRegenPoolFromBudget(pl)).toBe(R05_PASSIVE_REGEN_POOL[pl - 1]);
    }
  });
});

describe('R-05 Test A/B — Restoration full bars', () => {
  it('restores one Scarred Bar at full HP and sets Active Bar', async () => {
    const actor = makeActor(
      makeBars([
        { name: 'Injured', current: 0, max: 16 },
        { name: 'Wounded', current: 0, max: 16 },
        { name: 'Broken', current: 5, max: 16 },
      ]),
    );
    expect(countScarredHealthBars(actor)).toBe(2);
    const { restored } = await restoreScarredHealthBars(actor, 1);
    expect(restored).toBe(1);
    // Restores from the severe end first → Wounded (index 1) before Injured.
    expect(actor.system.health.bars[1].current).toBe(16);
    expect(actor.system.health.bars[0].current).toBe(0);
    expect(actor.system.health.bars[2].current).toBe(5);
    expect(countScarredHealthBars(actor)).toBe(1);
  });

  it('restores two Bars without transferring Broken damage (example)', async () => {
    const actor = makeActor(
      makeBars([
        { name: 'Injured', current: 0, max: 16 },
        { name: 'Wounded', current: 0, max: 16 },
        { name: 'Broken', current: 5, max: 16 },
      ]),
    );
    const { restored } = await restoreScarredHealthBars(actor, 2);
    expect(restored).toBe(2);
    expect(actor.system.health.bars[0].current).toBe(16);
    expect(actor.system.health.bars[1].current).toBe(16);
    expect(actor.system.health.bars[2].current).toBe(5); // Broken unchanged
    // Highest available Active = Injured (first with HP)
    expect(actor.system.health.currentBar).toBe(0);
  });
});

describe('R-05 Test C — AoE allocation validation', () => {
  const pending: AoeRestorationPending = {
    casterActorId: 'c1',
    powerKey: 'p1',
    powerName: 'Melee AoE Restoration',
    poolRemaining: 5,
    poolMax: 5,
    targets: [
      { tokenId: 't1', actorId: 'a', name: 'A', scarred: 3 },
      { tokenId: 't2', actorId: 'b', name: 'B', scarred: 2 },
      { tokenId: 't3', actorId: 'c', name: 'C', scarred: 1 },
    ],
  };

  it('accepts 2+2+1 = 5 and rejects over-pool / over-scarred', () => {
    expect(validateAoeRestorationAllocation(pending, { a: 2, b: 2, c: 1 })).toMatchObject({
      ok: true,
      total: 5,
    });
    expect(validateAoeRestorationAllocation(pending, { a: 3, b: 2, c: 1 }).ok).toBe(false);
    expect(validateAoeRestorationAllocation(pending, { a: 4 }).ok).toBe(false);
  });

  it('stepper caps: pool left and per-target max block over-allocation', () => {
    expect(aoeRestorationPoolLeft(pending, { a: 2, b: 2 })).toBe(1);
    expect(aoeRestorationMaxForTarget(pending, { a: 2, b: 2 }, 'c')).toBe(1);
    expect(aoeRestorationMaxForTarget(pending, { a: 2, b: 2 }, 'a')).toBe(3); // scarred 3, pool left for a = 3
    expect(aoeRestorationMaxForTarget(pending, { a: 3, b: 2 }, 'c')).toBe(0);
    const html = formatAoeRestorationPromptChat(pending);
    expect(html).toContain('ms-aoe-rest-stepper');
    expect(html).toContain('ms-aoe-rest-inc');
    expect(html).not.toContain('<select');
  });
});

describe('R-05 Test D/E — Passive Regeneration daily pool', () => {
  beforeEach(() => {
    (globalThis as any).game = {
      settings: { get: () => 100 },
    };
    (globalThis as any).canvas = { tokens: { placeables: [] } };
  });

  it('splits daily pool across activations and blocks overspend', async () => {
    // Keep Broken partially open so the character is not Incapacitated.
    const actor = makeActor(
      makeBars([
        { name: 'Healthy', current: 0, max: 16 },
        { name: 'Bruised', current: 0, max: 16 },
        { name: 'Injured', current: 0, max: 16 },
        { name: 'Wounded', current: 0, max: 16 },
        { name: 'Broken', current: 4, max: 16 },
      ]),
    );
    actor.items = [
      { type: 'passive', name: 'Regeneration', system: { templateId: 'passive-regeneration', rank: 10 } },
    ];
    // PL10 → 5 bars/day
    expect(getRegenerationState(actor).poolMax).toBe(5);

    let r = await activatePassiveRegeneration(actor, 2);
    expect(r.ok).toBe(true);
    expect(r.restored).toBe(2);
    expect(r.remaining).toBe(3);

    r = await activatePassiveRegeneration(actor, 1);
    expect(r.restored).toBe(1);
    expect(r.remaining).toBe(2);

    // Only one Scarred Bar left (Broken still has HP).
    r = await activatePassiveRegeneration(actor, 2);
    expect(r.restored).toBe(1);
    expect(r.remaining).toBe(1);

    r = await activatePassiveRegeneration(actor, 1);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('no-scarred');
  });

  it('resets once when Tyhran day advances, not twice on same day', async () => {
    const actor = makeActor(
      makeBars([
        { name: 'Wounded', current: 0, max: 16 },
        { name: 'Broken', current: 4, max: 16 },
      ]),
    );
    actor.items = [
      { type: 'passive', system: { templateId: 'passive-regeneration', rank: 4 } },
    ];
    const first = await activatePassiveRegeneration(actor, 1);
    expect(first.ok).toBe(true);
    expect(first.remaining).toBe(1); // PL4 pool 2

    (globalThis as any).game.settings.get = () => 101; // new day
    const state = getRegenerationState(actor);
    expect(state.spent).toBe(0);
    expect(state.remaining).toBe(2);
    // Same day again — no double reset of spent if we write
    actor.flags['mastery-system'][REGEN_DAILY_FLAG] = { dayIndex: 101, spent: 1, poolMax: 2 };
    expect(getRegenerationState(actor).remaining).toBe(1);
  });

  it('blocks activation while Incapacitated', async () => {
    const actor = makeActor(
      makeBars([
        { name: 'Broken', current: 0, max: 16 },
        { name: 'Incapacitated', current: 0, max: 16 },
      ]),
    );
    actor.items = [
      { type: 'passive', system: { templateId: 'passive-regeneration', rank: 6 } },
    ];
    const r = await activatePassiveRegeneration(actor, 1);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('incapacitated');
  });
});

describe('R-05 Test F — Resolve Healing pending', () => {
  it('arms, spends once, and expires on round change', () => {
    const combat = { id: 'c1', round: 2 };
    let pending = armResolveHealingPending(null, combat.id, combat.round, 2);
    expect(isResolveHealingPendingLive(pending, combat)).toBe(true);
    expect(pending.rank).toBe(2);

    pending = markResolveHealingSpent(pending);
    expect(isResolveHealingPendingLive(pending, combat)).toBe(false);

    pending = armResolveHealingPending(null, combat.id, combat.round, 1);
    expect(isResolveHealingPendingExpired(pending, { id: 'c1', round: 3 })).toBe(true);
    expect(readResolveHealingPending(pending)).toMatchObject({ rank: 1, spent: false });
    void RESOLVE_HEALING_PENDING_FLAG;
  });
});

describe('R-05 Test I — Damage Transfer unchanged', () => {
  it('still detects Damage Transfer powers', () => {
    expect(
      isDamageTransferPower({
        system: { templateId: 'active-melee-single-target-damage-transfer' },
      }),
    ).toBe(true);
  });
});

describe('R-05 Test L — retired heal actives not in catalog', () => {
  it('removes ordinary heal templates and keeps Restoration', () => {
    expect(getTemplate('active-melee-single-heal')).toBeFalsy();
    expect(getTemplate('active-ranged-aoe-heal')).toBeFalsy();
    expect(getTemplate('active-melee-health-level-heal')).toBeTruthy();
    expect(getTemplate('active-melee-aoe-restoration')).toBeTruthy();
    expect(getTemplate('active-ranged-aoe-restoration')).toBeTruthy();
    expect(isScarredRestorationTemplateId('active-ranged-aoe-restoration')).toBe(true);
    const regen = getTemplate('passive-regeneration');
    expect(regen?.name || regen?.templateName).toMatch(/Restoration/i);
  });
});
