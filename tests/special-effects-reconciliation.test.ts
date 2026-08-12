/**
 * Special Effects Reconciliation — regression coverage for the rename,
 * the legacy-id aliasing, the normalized active-special readers, and the
 * start-of-turn Tick + Decay runtime engine.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getEffectById,
  getEffect,
  canonicalSpecialId,
  LEGACY_SPECIAL_ID_ALIASES,
} from '../src/utils/special-effects';
import {
  readActiveSpecials,
  getActiveSpecialValue,
  statusEntryId,
  reduceStatusEffectAt,
  coerceStatusEffectsArray,
} from '../src/system/active-specials';

describe('special-effects rename + aliases', () => {
  it('exposes the renamed canonical ids', () => {
    for (const id of ['lacerate', 'ruin', 'slow', 'blight']) {
      expect(getEffectById(id)?.id).toBe(id);
    }
  });

  it('adds Challenge and Disoriented as diminishing effects', () => {
    for (const id of ['disoriented', 'challenge', 'weaken', 'soulburn']) {
      const ef = getEffectById(id);
      expect(ef?.id).toBe(id);
      expect(ef?.category).toBe('diminishing');
    }
  });

  it('does not expose removed Specials as canonical effects', () => {
    for (const id of ['dread', 'frightened', 'disrupt', 'shock']) {
      // Direct lookup must not return a live effect keyed by the removed id.
      // shock/disrupt may still resolve via legacy aliases to a live Special.
      expect(getEffectById(id)?.id === id).toBe(false);
    }
  });

  it('removes the legacy effects as canonical ids', () => {
    for (const legacy of ['bleeding', 'ignite', 'freeze', 'poisoned', 'shock', 'blinded', 'disrupt']) {
      const canonical = LEGACY_SPECIAL_ID_ALIASES[legacy];
      expect(canonical).toBeTruthy();
      expect(getEffectById(legacy)?.id).toBe(canonical);
    }
  });

  it('canonicalSpecialId maps legacy → new and passes through unknown/new ids', () => {
    expect(canonicalSpecialId('bleeding')).toBe('lacerate');
    expect(canonicalSpecialId('ignite')).toBe('ruin');
    expect(canonicalSpecialId('freeze')).toBe('slow');
    expect(canonicalSpecialId('poisoned')).toBe('blight');
    expect(canonicalSpecialId('blinded')).toBe('disoriented');
    expect(canonicalSpecialId('shock')).toBe('disoriented');
    expect(canonicalSpecialId('disrupt')).toBe('challenge');
    expect(canonicalSpecialId('ruin')).toBe('ruin');
    expect(canonicalSpecialId('whatever')).toBe('whatever');
  });

  it('resolves legacy display names through getEffect', () => {
    expect(getEffect('Bleeding')?.id).toBe('lacerate');
    expect(getEffect('Ignite')?.id).toBe('ruin');
    expect(getEffect('Ignite(X)')?.id).toBe('ruin');
  });
});

describe('active-specials readers', () => {
  it('statusEntryId resolves id, legacy id, and name entries', () => {
    expect(statusEntryId({ id: 'ruin' })).toBe('ruin');
    expect(statusEntryId({ id: 'ignite' })).toBe('ruin');
    expect(statusEntryId({ name: 'Bleeding' })).toBe('lacerate');
    expect(statusEntryId({})).toBeUndefined();
  });

  it('readActiveSpecials normalizes ids + clamps values', () => {
    const actor = {
      system: {
        statusEffects: [
          { id: 'ruin', value: 3 },
          { id: 'ignite', value: 2 }, // legacy id → ruin
          { name: 'Slow' },
          { id: 'bogus' },
        ],
      },
    };
    const list = readActiveSpecials(actor);
    expect(list).toContainEqual({ id: 'ruin', value: 3 });
    expect(list).toContainEqual({ id: 'ruin', value: 2 });
    expect(list).toContainEqual({ id: 'slow', value: 0 });
    // Unknown ids pass through canonically (never crash the reader).
    expect(list).toContainEqual({ id: 'bogus', value: 0 });
  });

  it('getActiveSpecialValue sums stacks of the same canonical id', () => {
    const actor = {
      system: { statusEffects: [{ id: 'ruin', value: 3 }, { id: 'ignite', value: 2 }] },
    };
    expect(getActiveSpecialValue(actor, 'ruin')).toBe(5);
    expect(getActiveSpecialValue(actor, 'slow')).toBe(0);
  });

  it('reduceStatusEffectAt lowers stacks and removes at 0', () => {
    const list = [
      { id: 'lacerate', name: 'Lacerate', value: 5 },
      { id: 'slow', name: 'Slow', value: 2 },
    ];
    expect(reduceStatusEffectAt(list, 0, 2)[0]).toMatchObject({ id: 'lacerate', value: 3 });
    expect(reduceStatusEffectAt(list, 1, 4)).toHaveLength(1);
    expect(reduceStatusEffectAt(list, 1, 4)[0].id).toBe('lacerate');
  });

  it('coerceStatusEffectsArray accepts object-shaped lists', () => {
    expect(
      coerceStatusEffectsArray({ 0: { id: 'ruin', value: 1 }, 1: { id: 'slow', value: 2 } }),
    ).toHaveLength(2);
  });
});

describe('status-tick Tick + Decay engine', () => {
  let updates: any[];
  function makeActor(statusEffects: any[], opts: { hpBar?: number; stressBar?: number } = {}) {
    updates = [];
    const actor: any = {
      name: 'Dummy',
      system: {
        statusEffects,
        health: {
          currentBar: 0,
          bars: [
            { name: 'H1', max: 20, current: opts.hpBar ?? 20, penalty: 0 },
            { name: 'H2', max: 20, current: 20, penalty: 0 },
          ],
        },
        stress: {
          currentBar: 0,
          bars: [
            { name: 'S1', max: 10, current: opts.stressBar ?? 10, penalty: 0 },
            { name: 'S2', max: 10, current: 10, penalty: 0 },
          ],
        },
      },
      update: async (u: any) => {
        updates.push(u);
        // Apply back to the actor so successive reads see the mutation.
        for (const [k, v] of Object.entries(u)) {
          const parts = k.split('.');
          let obj: any = actor;
          for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
          obj[parts[parts.length - 1]] = v;
        }
      },
    };
    return actor;
  }

  beforeEach(() => {
    (globalThis as any).game = { user: { isGM: true } };
    (globalThis as any).foundry = {
      utils: { duplicate: (o: any) => JSON.parse(JSON.stringify(o)) },
    };
  });

  it('applies Ruin damage (ignores armor) and decays by 1', async () => {
    const { processTurnStartStatusTick } = await import('../src/combat/status-tick');
    const actor = makeActor([{ id: 'ruin', value: 3 }]);
    const summary = await processTurnStartStatusTick(actor);
    expect(summary).toMatch(/Ruin\(3\)/);
    // 20 - 3 = 17 on first bar
    expect(actor.system.health.bars[0].current).toBe(17);
    // Decayed 3 → 2
    expect(actor.system.statusEffects).toEqual([
      expect.objectContaining({ id: 'ruin', value: 2 }),
    ]);
  });

  it('applies Blight as Stress and decays', async () => {
    const { processTurnStartStatusTick } = await import('../src/combat/status-tick');
    const actor = makeActor([{ id: 'blight', value: 2 }]);
    await processTurnStartStatusTick(actor);
    expect(actor.system.stress.bars[0].current).toBe(8);
    expect(actor.system.statusEffects[0]).toEqual(
      expect.objectContaining({ id: 'blight', value: 1 }),
    );
  });

  it('heals with Regeneration', async () => {
    const { processTurnStartStatusTick } = await import('../src/combat/status-tick');
    const actor = makeActor([{ id: 'regeneration', value: 5 }], { hpBar: 10 });
    await processTurnStartStatusTick(actor);
    expect(actor.system.health.bars[0].current).toBe(15);
  });

  it('removes a diminishing effect when it decays to 0', async () => {
    const { processTurnStartStatusTick } = await import('../src/combat/status-tick');
    const actor = makeActor([{ id: 'slow', value: 1 }]);
    const summary = await processTurnStartStatusTick(actor);
    expect(actor.system.statusEffects).toEqual([]);
    expect(summary).toMatch(/ended/i);
  });

  it('resolves legacy ids via alias before ticking', async () => {
    const { processTurnStartStatusTick } = await import('../src/combat/status-tick');
    const actor = makeActor([{ id: 'ignite', value: 2 }]);
    await processTurnStartStatusTick(actor);
    // Ignite → Ruin: 20 - 2 = 18 damage applied
    expect(actor.system.health.bars[0].current).toBe(18);
    expect(actor.system.statusEffects[0]).toEqual(
      expect.objectContaining({ id: 'ruin', value: 1 }),
    );
  });

  it('is inert for a non-GM client', async () => {
    (globalThis as any).game = { user: { isGM: false } };
    const { processTurnStartStatusTick } = await import('../src/combat/status-tick');
    const actor = makeActor([{ id: 'ruin', value: 3 }]);
    const summary = await processTurnStartStatusTick(actor);
    expect(summary).toBe('');
    expect(actor.system.health.bars[0].current).toBe(20);
  });
});
