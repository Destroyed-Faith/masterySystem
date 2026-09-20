import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyRemoveScarEffect,
  clearRemoveScarResolvedTiers,
  computeRemoveScarPayment,
  getRemoveScarResolvedMaxTier,
  inferRemoveScarTargetTier,
  payAndApplyRemoveScar,
  titanScarsAllowsTouchRemoveScar,
  titanScarsArtifactLevel,
} from '../src/stones/remove-scar';
import { applySafeHavenRest } from '../src/utils/safe-haven-rest';

function installFoundryGlobals() {
  (globalThis as any).game = {
    combat: { id: 'combat-1', round: 1, turn: 0 },
    user: { isGM: true },
  };
  (globalThis as any).canvas = { tokens: { placeables: [] }, grid: { distance: 2 } };
  (globalThis as any).ui = {
    notifications: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  };
}

function makeActor(opts: { bars?: Array<{ max: number; current: number }>; current?: number; sealed?: number } = {}) {
  const bars = opts.bars ?? [
    { max: 20, current: 0 },
    { max: 20, current: 0 },
    { max: 20, current: 0 },
    { max: 20, current: 0 },
    { max: 20, current: 10 },
  ];
  const actor: any = {
    id: 'hero-1',
    name: 'Test Hero',
    type: 'character',
    token: { document: { actorLink: true } },
    items: [],
    system: {
      health: {
        bars,
        currentBar: bars.findIndex((b) => b.current > 0),
        scarred: bars.filter((b) => b.current === 0).length,
        tempHP: 0,
      },
      stonePools: {
        vitality: {
          current: opts.current ?? 20,
          max: 20,
          sustained: 0,
          sealed: opts.sealed ?? 0,
          burned: 0,
        },
      },
    },
    _flags: {} as Record<string, any>,
    getFlag(ns: string, k: string) {
      if (ns !== 'mastery-system') return undefined;
      return this._flags[k];
    },
    async setFlag(ns: string, k: string, v: any) {
      if (ns !== 'mastery-system') return;
      this._flags[k] = v;
    },
    async unsetFlag(ns: string, k: string) {
      if (ns !== 'mastery-system') return;
      delete this._flags[k];
    },
    async update(data: Record<string, any>) {
      for (const [path, value] of Object.entries(data)) {
        const segments = path.split('.');
        let target: any = this;
        for (let i = 0; i < segments.length - 1; i++) {
          const seg = segments[i];
          if (target[seg] == null) target[seg] = {};
          target = target[seg];
        }
        target[segments[segments.length - 1]] = value;
      }
    },
  };
  return actor;
}

beforeEach(() => {
  installFoundryGlobals();
});

describe('computeRemoveScarPayment', () => {
  it('charges the cumulative Seal table from scratch', () => {
    expect(computeRemoveScarPayment(0, 1, 0)).toEqual({
      unpaidTiers: [1],
      sealCost: 1,
      barsRecovered: 1,
      newResolvedMax: 1,
    });
    expect(computeRemoveScarPayment(0, 2, 0)).toMatchObject({ sealCost: 3, barsRecovered: 2, unpaidTiers: [1, 2] });
    expect(computeRemoveScarPayment(0, 3, 0)).toMatchObject({ sealCost: 7, barsRecovered: 3, unpaidTiers: [1, 2, 3] });
    expect(computeRemoveScarPayment(0, 4, 0)).toMatchObject({ sealCost: 15, barsRecovered: 4, unpaidTiers: [1, 2, 3, 4] });
  });

  it('skips Tiers already resolved since Daily Reset', () => {
    expect(computeRemoveScarPayment(1, 3, 0)).toMatchObject({
      sealCost: 6,
      barsRecovered: 2,
      unpaidTiers: [2, 3],
      newResolvedMax: 3,
    });
    expect(computeRemoveScarPayment(4, 4, 0)).toMatchObject({
      sealCost: 0,
      barsRecovered: 0,
      unpaidTiers: [],
    });
  });

  it('T4 Support prefills Tier 4 and still charges 7 for the lower Tiers', () => {
    expect(computeRemoveScarPayment(0, 4, 4)).toMatchObject({
      sealCost: 7,
      barsRecovered: 4,
      unpaidTiers: [1, 2, 3],
    });
    expect(computeRemoveScarPayment(1, 4, 4)).toMatchObject({
      sealCost: 6,
      barsRecovered: 3,
      unpaidTiers: [2, 3],
    });
  });
});

describe('inferRemoveScarTargetTier', () => {
  it('walks the next unresolved Tier, or jumps to Support', () => {
    expect(inferRemoveScarTargetTier(0, 0)).toBe(1);
    expect(inferRemoveScarTargetTier(2, 0)).toBe(3);
    expect(inferRemoveScarTargetTier(0, 4)).toBe(4);
    expect(inferRemoveScarTargetTier(1, 4)).toBe(4);
    expect(inferRemoveScarTargetTier(4, 4)).toBe(4);
  });
});

describe('payAndApplyRemoveScar', () => {
  it.each([
    [1, 1, 1],
    [2, 3, 2],
    [3, 7, 3],
    [4, 15, 4],
  ] as const)('T%i Seals %i and recovers %i bars', async (tier, cost, bars) => {
    const actor = makeActor();
    const ok = await payAndApplyRemoveScar(actor, {
      targetTier: tier,
      skipTargetPrompt: true,
    });
    expect(ok).toBe(true);
    expect(actor.system.stonePools.vitality.sealed).toBe(cost);
    expect(actor.system.stonePools.vitality.current).toBe(20 - cost);
    expect(actor.system.stonePools.vitality.burned).toBe(0);
    expect(getRemoveScarResolvedMaxTier(actor)).toBe(tier);
    expect(4 - actor.system.health.scarred).toBe(bars);
  });

  it('does not charge an already resolved Tier again', async () => {
    const actor = makeActor();
    actor._flags.removeScarResolvedMaxTier = 1;
    const ok = await payAndApplyRemoveScar(actor, { supportPrefillTier: 0, skipTargetPrompt: true });
    expect(ok).toBe(true);
    expect(actor.system.stonePools.vitality.sealed).toBe(2);
    expect(getRemoveScarResolvedMaxTier(actor)).toBe(2);
    expect(actor.system.health.scarred).toBe(3);
  });

  it('T4 Support Seals 7 and recovers 4 bars', async () => {
    const actor = makeActor();
    const ok = await payAndApplyRemoveScar(actor, { supportPrefillTier: 4, skipTargetPrompt: true });
    expect(ok).toBe(true);
    expect(actor.system.stonePools.vitality.sealed).toBe(7);
    expect(actor.system.stonePools.vitality.current).toBe(13);
    expect(getRemoveScarResolvedMaxTier(actor)).toBe(4);
    expect(actor.system.health.scarred).toBe(0);
  });

  it('rejects Colorless payment', async () => {
    const actor = makeActor();
    const ok = await payAndApplyRemoveScar(actor, { colorlessSpent: 2, skipTargetPrompt: true });
    expect(ok).toBe(false);
    expect(actor.system.stonePools.vitality.current).toBe(20);
    expect(actor.system.stonePools.vitality.sealed).toBe(0);
    expect(getRemoveScarResolvedMaxTier(actor)).toBe(0);
  });

  it('Safe Haven Rest clears resolved Tiers', async () => {
    const actor = makeActor();
    await applyRemoveScarEffect(actor, 2);
    expect(getRemoveScarResolvedMaxTier(actor)).toBe(2);
    await applySafeHavenRest(actor);
    expect(getRemoveScarResolvedMaxTier(actor)).toBe(0);
  });
});

describe('Titan Scars touch targeting', () => {
  it('unlocks the AL9 touch target at Artifact Level 9+', () => {
    const actor = makeActor();
    actor.items = [
      {
        type: 'artifact',
        name: 'Titan Scars',
        system: { currentLevel: 9 },
        getFlag: (_ns: string, k: string) => (k === 'echoArtifactKey' ? 'titanScars' : undefined),
      },
    ];
    expect(titanScarsArtifactLevel(actor)).toBe(9);
    expect(titanScarsAllowsTouchRemoveScar(actor)).toBe(true);
    actor.items[0].system.currentLevel = 8;
    expect(titanScarsAllowsTouchRemoveScar(actor)).toBe(false);
  });
});

describe('clearRemoveScarResolvedTiers', () => {
  it('unsets the Daily Reset flag', async () => {
    const actor = makeActor();
    actor._flags.removeScarResolvedMaxTier = 3;
    await clearRemoveScarResolvedTiers(actor);
    expect(getRemoveScarResolvedMaxTier(actor)).toBe(0);
  });
});
