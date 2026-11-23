import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LAST_BREATH_FLAG,
  applyLastBreathBars,
  maybeApplyLastBreath,
  wouldDropToIncapacitated,
} from '../src/stones/last-breath';

describe('Last Breath bars', () => {
  it('detects an emptied Incapacitated bar', () => {
    const bars = [
      { name: 'Healthy', current: 0, max: 8 },
      { name: 'Wounded', current: 0, max: 8 },
      { name: 'Incapacitated', current: 0, max: 1 },
    ];
    expect(wouldDropToIncapacitated(bars)).toBe(true);
  });

  it('leaves 1 HP in the Broken bar and restores Incapacitated (Core v0.9.9.6)', () => {
    const bars = [
      { name: 'Healthy', current: 0, max: 8 },
      { name: 'Wounded', current: 0, max: 8 },
      { name: 'Broken', current: 0, max: 8 },
      { name: 'Incapacitated', current: 0, max: 1 },
    ];
    const idx = applyLastBreathBars(bars);
    expect(idx).toBe(2);
    expect(bars[1].current).toBe(0);
    expect(bars[2].current).toBe(1);
    expect(bars[3].current).toBe(1);
  });
});

describe('Last Breath Seals 1 Attribute Stone', () => {
  beforeEach(() => {
    (globalThis as any).foundry = {
      applications: { api: { DialogV2: { confirm: vi.fn(async () => true) } } },
    };
    (globalThis as any).ui = { notifications: { info: vi.fn() } };
  });
  afterEach(() => {
    delete (globalThis as any).foundry;
    delete (globalThis as any).ui;
  });

  it('seals (not burns) one ready Attribute Stone and marks Last Breath used', async () => {
    const flags: Record<string, unknown> = {};
    const updates: Record<string, unknown>[] = [];
    const actor: any = {
      name: 'Hero',
      system: {
        stonePools: {
          might: { current: 0, max: 2, sealed: 0 },
          agility: { current: 3, max: 3, sealed: 1 },
        },
      },
      getFlag: (_s: string, k: string) => flags[k],
      setFlag: async (_s: string, k: string, v: unknown) => {
        flags[k] = v;
      },
      update: async (u: Record<string, unknown>) => {
        updates.push(u);
      },
    };
    const bars = [
      { name: 'Wounded', current: 0, max: 8 },
      { name: 'Broken', current: 0, max: 8 },
      { name: 'Incapacitated', current: 0, max: 1 },
    ];
    const idx = await maybeApplyLastBreath(actor, bars);
    expect(idx).toBe(1);
    expect(flags[LAST_BREATH_FLAG]).toBe(true);
    expect(updates).toHaveLength(1);
    expect(updates[0]['system.stonePools.agility.sealed']).toBe(2);
    expect(Object.keys(updates[0]).some((k) => k.endsWith('.burned'))).toBe(false);
  });
});
