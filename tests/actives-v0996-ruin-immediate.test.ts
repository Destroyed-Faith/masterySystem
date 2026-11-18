/**
 * Actives v0.9.9.6 — Ruin immediate damage: 4 HP per newly applied stack,
 * ignoring Armor, after Ward / Special Negation; DR and Temp HP apply.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const writes: Array<{ list: any[]; extra: Record<string, unknown> }> = [];

vi.mock('../src/system/assign-status.js', () => ({
  writeActorStatusList: vi.fn(async (actor: any, list: any[], extra: Record<string, unknown> = {}) => {
    writes.push({ list, extra });
    actor.system.statusEffects = list;
    if (extra['system.health.bars']) actor.system.health.bars = extra['system.health.bars'];
  }),
}));

vi.mock('../src/combat/reaction-followups.js', () => ({
  maybeOfferReactiveCleanseChat: vi.fn(async () => undefined),
}));

import { applySpecialStringsToTarget } from '../src/combat/apply-special-effects.js';
import { buildRuinImmediateDamage, ruinImmediateDamage } from '../src/combat/ruin-immediate.js';
import { ruinTickDamage } from '../src/combat/status-tick.js';

const chat: string[] = [];

function installFoundry(): void {
  const g = globalThis as any;
  g.game = { user: { id: 'gm', isGM: true }, combat: null, actors: { get: () => null } };
  g.Hooks = { callAll: () => undefined, on: () => undefined, off: () => undefined };
  g.ChatMessage = {
    create: async (data: any) => {
      chat.push(String(data?.content ?? ''));
      return { id: 'chat' };
    },
    getSpeaker: () => ({}),
  };
  g.ui = { notifications: { warn: () => undefined, info: () => undefined } };
  g.canvas = { ready: false };
  g.foundry = { utils: { duplicate: (v: unknown) => JSON.parse(JSON.stringify(v)) } };
}

function target(opts: { hp?: number; armor?: number; dr?: number; ruin?: number; ward?: number } = {}): any {
  return {
    id: 't1',
    name: 'Wolf',
    type: 'npc',
    flags: {},
    getFlag: () => undefined,
    system: {
      health: { bars: [{ current: opts.hp ?? 60, max: 60 }], currentBar: 0, tempHP: 0 },
      combat: { armorTotal: opts.armor ?? 10, damageReductionPct: opts.dr ?? 0 },
      statusEffects: opts.ruin ? [{ id: 'ruin', name: 'Ruin', value: opts.ruin }] : [],
      derived: { mechanicsBreakdown: { totals: { wardIncoming: opts.ward ?? 0 } } },
    },
  };
}

describe('Ruin immediate damage', () => {
  beforeEach(() => {
    installFoundry();
    writes.length = 0;
    chat.length = 0;
  });

  it('is 4 per newly applied stack; the printed Tick formula is unchanged', () => {
    expect(ruinImmediateDamage(3)).toBe(12);
    expect(ruinImmediateDamage(0)).toBe(0);
    expect(ruinTickDamage(6)).toBe(24);
  });

  it('applies 4 × X on application, ignoring Armor, in the same write as the stacks', async () => {
    const t = target({ hp: 60, armor: 10 });
    await applySpecialStringsToTarget(t, ['Ruin(5)'], null);
    expect(writes).toHaveLength(1);
    expect(writes[0].list.find((e: any) => e.id === 'ruin')?.value).toBe(5);
    expect((writes[0].extra['system.health.bars'] as any[])[0].current).toBe(40);
    expect(chat.some((c) => /Ruin immediate damage/.test(c) && /20 HP lost/.test(c))).toBe(true);
  });

  it('only counts newly added stacks when Ruin is already present', async () => {
    const t = target({ hp: 60, ruin: 4 });
    await applySpecialStringsToTarget(t, ['Ruin(2)'], null);
    expect(writes[0].list.find((e: any) => e.id === 'ruin')?.value).toBe(6);
    expect((writes[0].extra['system.health.bars'] as any[])[0].current).toBe(52);
  });

  it('counts only stacks left after Ward; a fully blocked Ruin deals nothing', async () => {
    const reduced = target({ hp: 60, ward: 2 });
    await applySpecialStringsToTarget(reduced, ['Ruin(5)'], null);
    expect(writes[0].list.find((e: any) => e.id === 'ruin')?.value).toBe(3);
    expect((writes[0].extra['system.health.bars'] as any[])[0].current).toBe(48);

    writes.length = 0;
    chat.length = 0;
    const blocked = target({ hp: 60, ward: 6 });
    await applySpecialStringsToTarget(blocked, ['Ruin(5)'], null);
    expect(writes[0].extra['system.health.bars']).toBeUndefined();
    expect(blocked.system.health.bars[0].current).toBe(60);
    expect(chat.some((c) => /Ruin immediate/.test(c))).toBe(false);
  });

  it('Damage Reduction and Temp HP apply', async () => {
    const t = target({ hp: 60, dr: 50 });
    t.system.health.tempHP = 3;
    const r = await buildRuinImmediateDamage(t, 5);
    expect(r.rawDamage).toBe(20);
    expect(r.drPercent).toBe(50);
    expect(r.tempHPAbsorbed).toBe(3);
    expect(r.barDamage).toBe(7);
    expect((r.patch['system.health.bars'] as any[])[0].current).toBe(53);
  });

  it('can be skipped for state corrections and does not fire for other Specials', async () => {
    const t = target({ hp: 60 });
    await applySpecialStringsToTarget(t, ['Ruin(5)'], null, { skipRuinImmediateDamage: true });
    expect(writes[0].extra['system.health.bars']).toBeUndefined();
    writes.length = 0;
    await applySpecialStringsToTarget(target({ hp: 60 }), ['Slow(3)'], null);
    expect(writes[0].extra['system.health.bars']).toBeUndefined();
  });
});
