import { describe, expect, it, beforeEach } from 'vitest';
import {
  mitigateArmorIgnoringTickDamage,
  ruinTickDamage,
} from '../src/combat/status-tick.js';
import { clampSpecialApplication } from '../src/combat/special-application.js';

describe('Batch 1 C05 — Ruin tick math', () => {
  it('multiplies only Tick damage, not the stack value', () => {
    expect(ruinTickDamage(3)).toBe(12);
    expect(ruinTickDamage(8)).toBe(32);
    expect(ruinTickDamage(0)).toBe(0);
  });

  it('applies DR without Armor on ongoing Special Tick damage', () => {
    expect(mitigateArmorIgnoringTickDamage(20, 0)).toEqual({ damage: 20, drPercent: 0 });
    expect(mitigateArmorIgnoringTickDamage(20, 20)).toEqual({ damage: 16, drPercent: 20 });
  });
});

describe('Batch 1 C06 — no global 4×MR Round Special cap', () => {
  it('lets MR2 receive more than 8 new points of one Special in a Round', () => {
    const combat = { id: 'c1', round: 1 };
    const actor = { system: { mastery: { rank: 2 } } };
    const a = clampSpecialApplication(actor, 'ruin', 5, combat);
    const b = clampSpecialApplication(actor, 'ruin', 6, combat);
    expect(a.applied + b.applied).toBe(11);
    expect(a.ignored + b.ignored).toBe(0);
  });
});

describe('Batch 1 C05 — status-tick integration', () => {
  beforeEach(() => {
    (globalThis as any).game = { user: { isGM: true } };
    (globalThis as any).foundry = {
      utils: { duplicate: (o: any) => JSON.parse(JSON.stringify(o)) },
    };
  });

  it('does not multiply the stored Ruin stack when dealing 4×X tick damage', async () => {
    const { processTurnStartStatusTick } = await import('../src/combat/status-tick.js');
    const actor: any = {
      name: 'Target',
      system: {
        mastery: { rank: 2 },
        combat: { armorTotal: 100, damageReductionPct: 0 },
        statusEffects: [{ id: 'ruin', value: 3 }],
        health: {
          currentBar: 0,
          bars: [{ name: 'H1', max: 20, current: 20, penalty: 0 }],
        },
      },
      update: async (u: any) => {
        for (const [k, v] of Object.entries(u)) {
          const parts = k.split('.');
          let obj: any = actor;
          for (let i = 0; i < parts.length - 1; i++) {
            const key = parts[i]!;
            if (obj[key] == null || typeof obj[key] !== 'object') obj[key] = {};
            obj = obj[key];
          }
          obj[parts[parts.length - 1]!] = v;
        }
      },
    };
    const summary = await processTurnStartStatusTick(actor);
    expect(summary).toMatch(/12 damage \(4 × 3\)/);
    expect(actor.system.health.bars[0].current).toBe(8);
    expect(actor.system.statusEffects).toEqual([
      expect.objectContaining({ id: 'ruin', value: 2 }),
    ]);
  });
});
