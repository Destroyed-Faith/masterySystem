/**
 * Unit tests for the Passive Combat-Trigger Framework.
 *
 * Covered behaviour:
 * - combatStart one-shots are rolled exactly once per (actor, passive, combat)
 * - turnStartSelf refresh pools are raised to the declared floor but never
 *   lowered
 * - damage consumption order: one-shot first, then refresh; inside each
 *   group oldest first; manual residual absorbs the final leftover
 * - combatEnd cleanup removes sourced pools and subtracts only the sourced
 *   portion from the mirror
 * - same source re-applied does not stack
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  applyPassiveTrigger,
  applyBuffTriggersOnActivate,
  clearTempHPSourcesForBuffEffect,
  consumeTempHPFromSources,
  previewTempHPConsumption,
  clearTempHPSourcesOnCombatEnd,
  setTempHPRollerForTests,
  upsertTempHPSource,
  makeSourceKey,
  getTempHPSources,
} from '../src/combat/passive-triggers';
import type { PowerMechanics } from '../src/types/item';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

interface MockPassive {
  id: string;
  name: string;
  mechanics: PowerMechanics;
}

function makePassiveItem(p: MockPassive): any {
  return {
    id: p.id,
    _id: p.id,
    name: p.name,
    type: 'power',
    system: {
      rank: 1,
      powerType: 'passive',
      levels: { '1': { mechanics: p.mechanics } },
    },
  };
}

function mergeDotPath(target: any, path: string, value: unknown): void {
  const parts = path.split('.');
  let cur = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const seg = parts[i];
    if (cur[seg] == null || typeof cur[seg] !== 'object') cur[seg] = {};
    cur = cur[seg];
  }
  const last = parts[parts.length - 1];
  if (last.startsWith('-=')) {
    delete cur[last.substring(2)];
  } else {
    cur[last] = value;
  }
}

function makeActor(opts: {
  passives: MockPassive[];
  slots?: boolean[]; // active flags parallel to passives (defaults: all active)
  tempHP?: number;
  id?: string;
}): any {
  const { passives } = opts;
  const slotActive = opts.slots ?? passives.map(() => true);
  const items = passives.map(makePassiveItem);
  const passivesObj: Record<string, any> = {};
  passives.forEach((p, i) => {
    passivesObj[`slot${i}`] = {
      passive: { id: p.id, name: p.name },
      active: slotActive[i],
    };
  });

  const actor: any = {
    id: opts.id ?? 'actor-1',
    system: {
      passives: passivesObj,
      mastery: { rank: Math.max(1, passives.length) },
      health: { tempHP: opts.tempHP ?? 0, bars: [] },
    },
    flags: {},
    items: {
      get: (id: string) => items.find((i) => i.id === id || i._id === id) ?? null,
    },
  };

  actor.update = async (patch: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(patch)) {
      mergeDotPath(actor, k, v);
    }
  };

  // Make items iterable for the fallback loop.
  (actor.items as any)[Symbol.iterator] = function* () {
    for (const it of items) yield it;
  };

  return actor;
}

function makeCombat(id = 'combat-1'): any {
  return { id };
}

// ---------------------------------------------------------------------------
// Deterministic roller
// ---------------------------------------------------------------------------

let rollQueue: number[] = [];
let rollHistory: string[] = [];

function queueRolls(values: number[]): void {
  rollQueue = [...values];
}

beforeEach(() => {
  rollQueue = [];
  rollHistory = [];
  setTempHPRollerForTests((formula: string) => {
    rollHistory.push(formula);
    if (rollQueue.length > 0) {
      return rollQueue.shift() as number;
    }
    // Default: return max of d-size (e.g. 1d8 -> 8) for predictability.
    const m = formula.match(/^(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
    if (m) {
      const n = parseInt(m[1] || '1', 10);
      const s = parseInt(m[2], 10);
      return n * s;
    }
    return Number(formula) || 0;
  });
});

afterEach(() => {
  setTempHPRollerForTests(null);
});

// ---------------------------------------------------------------------------
// combatStart one-shot
// ---------------------------------------------------------------------------

describe('applyPassiveTrigger (combatStart)', () => {
  it('rolls the dice-string exactly once per combat and stores a one-shot source', async () => {
    const actor = makeActor({
      passives: [
        {
          id: 'lean-ward',
          name: 'Lean Ward',
          mechanics: {
            armor: 2,
            applyWhen: 'passive-slotted-active',
            triggers: { combatStart: { tempHP: '1d8' } },
          },
        },
      ],
    });
    const combat = makeCombat();
    queueRolls([5]);

    await applyPassiveTrigger(actor, 'combatStart', combat);

    expect(rollHistory).toEqual(['1d8']);
    expect(actor.system.health.tempHP).toBe(5);
    const sources = getTempHPSources(actor);
    const key = makeSourceKey('passive', 'lean-ward', 'combatStart');
    expect(sources[key]).toBeDefined();
    expect(sources[key].value).toBe(5);
    expect(sources[key].declared).toBe(5);
    expect(sources[key].kind).toBe('one-shot');
    expect(sources[key].combatId).toBe('combat-1');

    // Second invocation must not reroll.
    queueRolls([99]);
    await applyPassiveTrigger(actor, 'combatStart', combat);
    expect(rollHistory).toEqual(['1d8']);
    expect(actor.system.health.tempHP).toBe(5);
    expect(getTempHPSources(actor)[key].value).toBe(5);
  });

  it('adds to manual tempHP without overriding it (delta-based mirror update)', async () => {
    const actor = makeActor({
      tempHP: 3,
      passives: [
        {
          id: 'lean-ward',
          name: 'Lean Ward',
          mechanics: {
            armor: 2,
            applyWhen: 'passive-slotted-active',
            triggers: { combatStart: { tempHP: '1d8' } },
          },
        },
      ],
    });
    queueRolls([4]);
    await applyPassiveTrigger(actor, 'combatStart', makeCombat());
    expect(actor.system.health.tempHP).toBe(7); // 3 manual + 4 sourced
  });

  it('skips passives with non-passive applyWhen', async () => {
    const actor = makeActor({
      passives: [
        {
          id: 'reaction-ward',
          name: 'Reaction Ward',
          mechanics: {
            applyWhen: 'reaction-once-per-round',
            triggers: { combatStart: { tempHP: '1d8' } },
          },
        },
      ],
    });
    queueRolls([5]);
    await applyPassiveTrigger(actor, 'combatStart', makeCombat());
    expect(actor.system.health.tempHP).toBe(0);
    expect(Object.keys(getTempHPSources(actor))).toHaveLength(0);
  });

  it('skips inactive passive slots', async () => {
    const actor = makeActor({
      passives: [
        {
          id: 'lean-ward',
          name: 'Lean Ward',
          mechanics: {
            applyWhen: 'passive-slotted-active',
            triggers: { combatStart: { tempHP: '1d8' } },
          },
        },
      ],
      slots: [false],
    });
    queueRolls([5]);
    await applyPassiveTrigger(actor, 'combatStart', makeCombat());
    expect(actor.system.health.tempHP).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// turnStartSelf refresh
// ---------------------------------------------------------------------------

describe('applyPassiveTrigger (turnStartSelf)', () => {
  function makeDragonScalesActor(flat: string, tempHP = 0) {
    return makeActor({
      tempHP,
      passives: [
        {
          id: 'dragon-scales',
          name: 'Dragon Scales',
          mechanics: {
            armor: 4,
            applyWhen: 'passive-slotted-active',
            triggers: { turnStartSelf: { tempHP: flat } },
          },
        },
      ],
    });
  }

  it('raises the pool to the declared floor on first turn', async () => {
    const actor = makeDragonScalesActor('2');
    await applyPassiveTrigger(actor, 'turnStartSelf', makeCombat());
    expect(actor.system.health.tempHP).toBe(2);
    const key = makeSourceKey('passive', 'dragon-scales', 'turnStartSelf');
    expect(getTempHPSources(actor)[key].kind).toBe('refresh');
    expect(getTempHPSources(actor)[key].value).toBe(2);
    expect(getTempHPSources(actor)[key].declared).toBe(2);
  });

  it('refreshes the pool after damage depleted it', async () => {
    const actor = makeDragonScalesActor('2');
    const combat = makeCombat();
    await applyPassiveTrigger(actor, 'turnStartSelf', combat);
    expect(actor.system.health.tempHP).toBe(2);

    // Damage consumes the pool.
    await consumeTempHPFromSources(actor, 2);
    expect(actor.system.health.tempHP).toBe(0);

    // Next turn-start refreshes the pool back to 2.
    await applyPassiveTrigger(actor, 'turnStartSelf', combat);
    expect(actor.system.health.tempHP).toBe(2);
  });

  it('leaves the pool alone when current value already meets or exceeds the declared floor', async () => {
    const actor = makeDragonScalesActor('2');
    const combat = makeCombat();
    await applyPassiveTrigger(actor, 'turnStartSelf', combat);

    // Simulate a manual buff pushing the pool above the floor.
    const key = makeSourceKey('passive', 'dragon-scales', 'turnStartSelf');
    await upsertTempHPSource(actor, key, {
      value: 5,
      declared: 2,
      kind: 'refresh',
      origin: {
        ownerKind: 'passive',
        powerId: 'dragon-scales',
        name: 'Dragon Scales',
        triggerKind: 'turnStartSelf',
      },
      combatId: 'combat-1',
      createdAt: Date.now(),
    });
    expect(actor.system.health.tempHP).toBe(5);

    await applyPassiveTrigger(actor, 'turnStartSelf', combat);
    // Pool stays at 5 (declared floor 2 does not lower it).
    expect(actor.system.health.tempHP).toBe(5);
    expect(getTempHPSources(actor)[key].value).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Damage consumption order
// ---------------------------------------------------------------------------

describe('consumeTempHPFromSources (damage order)', () => {
  async function setupActor() {
    // Dragon Scales (refresh, 2) + Lean Ward (one-shot, 5) both active.
    const actor = makeActor({
      passives: [
        {
          id: 'dragon-scales',
          name: 'Dragon Scales',
          mechanics: {
            armor: 4,
            applyWhen: 'passive-slotted-active',
            triggers: { turnStartSelf: { tempHP: '2' } },
          },
        },
        {
          id: 'lean-ward',
          name: 'Lean Ward',
          mechanics: {
            armor: 2,
            applyWhen: 'passive-slotted-active',
            triggers: { combatStart: { tempHP: '1d8' } },
          },
        },
      ],
    });
    const combat = makeCombat();
    queueRolls([5]); // 1d8 -> 5 for Lean Ward
    await applyPassiveTrigger(actor, 'combatStart', combat);
    await applyPassiveTrigger(actor, 'turnStartSelf', combat);
    return actor;
  }

  it('consumes one-shot pools first, refresh pools last', async () => {
    const actor = await setupActor();
    expect(actor.system.health.tempHP).toBe(7); // 5 + 2

    const r1 = await consumeTempHPFromSources(actor, 3);
    expect(r1.reducedBy).toBe(3);
    expect(r1.remainingDamage).toBe(0);
    expect(actor.system.health.tempHP).toBe(4);

    const sources = getTempHPSources(actor);
    const leanKey = makeSourceKey('passive', 'lean-ward', 'combatStart');
    const dragonKey = makeSourceKey('passive', 'dragon-scales', 'turnStartSelf');
    expect(sources[leanKey].value).toBe(2); // 5 - 3
    expect(sources[dragonKey].value).toBe(2); // untouched

    const r2 = await consumeTempHPFromSources(actor, 2);
    expect(r2.reducedBy).toBe(2);
    expect(actor.system.health.tempHP).toBe(2);
    // Lean Ward fully consumed → source removed.
    expect(getTempHPSources(actor)[leanKey]).toBeUndefined();
    expect(getTempHPSources(actor)[dragonKey].value).toBe(2);
  });

  it('returns overflow damage once all pools are exhausted', async () => {
    const actor = await setupActor();
    const r = await consumeTempHPFromSources(actor, 10);
    expect(r.reducedBy).toBe(7);
    expect(r.remainingDamage).toBe(3);
    expect(actor.system.health.tempHP).toBe(0);
    expect(Object.keys(getTempHPSources(actor))).toHaveLength(0);
  });

  it('previewTempHPConsumption returns the same numbers without writing', async () => {
    const actor = await setupActor();
    const before = actor.system.health.tempHP;
    const preview = previewTempHPConsumption(actor, 4);
    expect(preview.reducedBy).toBe(4);
    expect(preview.remainingDamage).toBe(0);
    // Actor state must not have changed.
    expect(actor.system.health.tempHP).toBe(before);
    expect(Object.keys(getTempHPSources(actor))).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// combatEnd cleanup
// ---------------------------------------------------------------------------

describe('clearTempHPSourcesOnCombatEnd', () => {
  it('removes all sourced pools and subtracts only the sourced portion from the mirror', async () => {
    // Actor enters combat with a manual 3 tempHP already set.
    const actor = makeActor({
      tempHP: 3,
      passives: [
        {
          id: 'lean-ward',
          name: 'Lean Ward',
          mechanics: {
            applyWhen: 'passive-slotted-active',
            triggers: { combatStart: { tempHP: '1d8' } },
          },
        },
      ],
    });
    queueRolls([4]);
    const combat = makeCombat();
    await applyPassiveTrigger(actor, 'combatStart', combat);
    expect(actor.system.health.tempHP).toBe(7); // 3 manual + 4 sourced

    await clearTempHPSourcesOnCombatEnd(actor, combat);
    // Manual residual preserved.
    expect(actor.system.health.tempHP).toBe(3);
    expect(Object.keys(getTempHPSources(actor))).toHaveLength(0);
  });

  it('does nothing when the actor has no sources', async () => {
    const actor = makeActor({ tempHP: 5, passives: [] });
    await clearTempHPSourcesOnCombatEnd(actor, makeCombat());
    expect(actor.system.health.tempHP).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Non-stacking same source
// ---------------------------------------------------------------------------

describe('upsertTempHPSource idempotence', () => {
  it('re-applying the same source overrides, never adds', async () => {
    const actor = makeActor({ tempHP: 0, passives: [] });
    const key = makeSourceKey('power-x', 'combatStart');
    const baseSource = {
      declared: 3,
      kind: 'one-shot' as const,
      origin: { powerId: 'power-x', name: 'Power X', triggerKind: 'combatStart' as const },
      combatId: 'combat-1',
      createdAt: 1,
    };

    await upsertTempHPSource(actor, key, { ...baseSource, value: 3 });
    expect(actor.system.health.tempHP).toBe(3);

    await upsertTempHPSource(actor, key, { ...baseSource, value: 4 });
    expect(actor.system.health.tempHP).toBe(4); // 3 - 3 + 4 = 4, not 7

    await upsertTempHPSource(actor, key, { ...baseSource, value: 4 });
    expect(actor.system.health.tempHP).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// Mid-combat active-buff activation
// ---------------------------------------------------------------------------
//
// Active buffs are live ActiveEffects carrying a `mechanics` snapshot in
// flags['mastery-system']. When a player activates one mid-combat, the
// createActiveEffect hook must materialise its trigger-declared Temp HP
// pools immediately, not on the next turn/combat. Conversely, removing the
// effect must clear only the sources that belong to it, leaving passive-
// slot pools and manual Temp HP intact.

function makeBuffEffect(opts: {
  id: string;
  name: string;
  mechanics: PowerMechanics;
}): any {
  return {
    id: opts.id,
    _id: opts.id,
    name: opts.name,
    flags: {
      'mastery-system': {
        activeBuff: true,
        powerId: `power-${opts.id}`,
        powerName: opts.name,
        mechanics: opts.mechanics,
      },
    },
  };
}

function makeActorWithBuffs(opts: {
  buffs?: ReturnType<typeof makeBuffEffect>[];
  passives?: MockPassive[];
  tempHP?: number;
  id?: string;
}): any {
  const actor = makeActor({
    passives: opts.passives ?? [],
    tempHP: opts.tempHP ?? 0,
    id: opts.id,
  });
  const effects: any[] = opts.buffs ?? [];
  (actor as any).effects = effects;
  return actor;
}

describe('applyBuffTriggersOnActivate (mid-combat buff activation)', () => {
  it('rolls a combatStart one-shot the moment the buff is activated', async () => {
    const buff = makeBuffEffect({
      id: 'eff-lean-ward',
      name: 'Lean Ward (buff)',
      mechanics: {
        applyWhen: 'activeBuff-active',
        triggers: { combatStart: { tempHP: '1d8' } },
      } as PowerMechanics,
    });
    const actor = makeActorWithBuffs({ buffs: [buff] });
    const combat = makeCombat();
    queueRolls([6]);

    await applyBuffTriggersOnActivate(actor, buff, combat);

    expect(rollHistory).toEqual(['1d8']);
    expect(actor.system.health.tempHP).toBe(6);
    const key = makeSourceKey('buff', 'eff-lean-ward', 'combatStart');
    const src = getTempHPSources(actor)[key];
    expect(src).toBeDefined();
    expect(src.kind).toBe('one-shot');
    expect(src.origin.ownerKind).toBe('buff');
    expect(src.origin.powerId).toBe('eff-lean-ward');
  });

  it('also raises a turnStartSelf refresh pool on activation (not just at next turn)', async () => {
    const buff = makeBuffEffect({
      id: 'eff-dragon-stance',
      name: 'Dragon Stance',
      mechanics: {
        applyWhen: 'activeBuff-active',
        triggers: { turnStartSelf: { tempHP: '3' } },
      } as PowerMechanics,
    });
    const actor = makeActorWithBuffs({ buffs: [buff] });
    await applyBuffTriggersOnActivate(actor, buff, makeCombat());

    const key = makeSourceKey('buff', 'eff-dragon-stance', 'turnStartSelf');
    const src = getTempHPSources(actor)[key];
    expect(src).toBeDefined();
    expect(src.kind).toBe('refresh');
    expect(src.value).toBe(3);
    expect(actor.system.health.tempHP).toBe(3);
  });

  it('does not re-roll its own combatStart pool on the next applyPassiveTrigger sweep', async () => {
    const buff = makeBuffEffect({
      id: 'eff-lean-ward',
      name: 'Lean Ward (buff)',
      mechanics: {
        applyWhen: 'activeBuff-active',
        triggers: { combatStart: { tempHP: '1d8' } },
      } as PowerMechanics,
    });
    const actor = makeActorWithBuffs({ buffs: [buff] });
    const combat = makeCombat();
    queueRolls([4]);
    await applyBuffTriggersOnActivate(actor, buff, combat);
    expect(actor.system.health.tempHP).toBe(4);

    // A subsequent scheduled sweep must see the existing one-shot and skip
    // the reroll (combatId idempotence must hold across the owner-kind axis).
    queueRolls([99]);
    await applyPassiveTrigger(actor, 'combatStart', combat);
    expect(rollHistory).toEqual(['1d8']);
    expect(actor.system.health.tempHP).toBe(4);
  });

  it('skips effects whose mechanics lack activeBuff-active applyWhen', async () => {
    const buff = makeBuffEffect({
      id: 'eff-weird',
      name: 'Weird Buff',
      mechanics: {
        applyWhen: 'passive-slotted-active', // wrong marker for a buff
        triggers: { combatStart: { tempHP: '1d8' } },
      } as PowerMechanics,
    });
    const actor = makeActorWithBuffs({ buffs: [buff] });
    queueRolls([5]);
    await applyBuffTriggersOnActivate(actor, buff, makeCombat());
    expect(actor.system.health.tempHP).toBe(0);
    expect(Object.keys(getTempHPSources(actor))).toHaveLength(0);
  });

  it('ignores effects that are not flagged activeBuff', async () => {
    const notABuff = {
      id: 'eff-random',
      _id: 'eff-random',
      name: 'Random',
      flags: {},
    };
    const actor = makeActorWithBuffs({ buffs: [notABuff as any] });
    await applyBuffTriggersOnActivate(actor, notABuff, makeCombat());
    expect(Object.keys(getTempHPSources(actor))).toHaveLength(0);
  });
});

describe('clearTempHPSourcesForBuffEffect (buff removal)', () => {
  it('removes only the pools owned by the removed buff, not passive or manual pools', async () => {
    const passive: MockPassive = {
      id: 'dragon-scales',
      name: 'Dragon Scales',
      mechanics: {
        applyWhen: 'passive-slotted-active',
        triggers: { turnStartSelf: { tempHP: '2' } },
      },
    };
    const buff = makeBuffEffect({
      id: 'eff-lean-ward',
      name: 'Lean Ward',
      mechanics: {
        applyWhen: 'activeBuff-active',
        triggers: { combatStart: { tempHP: '1d8' } },
      } as PowerMechanics,
    });
    const actor = makeActorWithBuffs({
      tempHP: 2, // manual residual
      passives: [passive],
      buffs: [buff],
    });
    const combat = makeCombat();

    await applyPassiveTrigger(actor, 'turnStartSelf', combat); // passive +2
    queueRolls([5]);
    await applyBuffTriggersOnActivate(actor, buff, combat); // buff +5
    expect(actor.system.health.tempHP).toBe(9); // 2 manual + 2 passive + 5 buff

    await clearTempHPSourcesForBuffEffect(actor, 'eff-lean-ward');
    expect(actor.system.health.tempHP).toBe(4); // manual 2 + passive 2 survive
    const sources = getTempHPSources(actor);
    expect(sources[makeSourceKey('buff', 'eff-lean-ward', 'combatStart')]).toBeUndefined();
    expect(sources[makeSourceKey('passive', 'dragon-scales', 'turnStartSelf')]).toBeDefined();
  });

  it('is a no-op when the buff has no sources attached', async () => {
    const actor = makeActorWithBuffs({ tempHP: 3 });
    await clearTempHPSourcesForBuffEffect(actor, 'eff-unknown');
    expect(actor.system.health.tempHP).toBe(3);
  });
});

describe('combatEnd cleanup spans both passive and buff sources', () => {
  it('wipes all sourced pools owned by the combat, keeping only manual residuals', async () => {
    const passive: MockPassive = {
      id: 'lean-ward',
      name: 'Lean Ward',
      mechanics: {
        applyWhen: 'passive-slotted-active',
        triggers: { combatStart: { tempHP: '1d8' } },
      },
    };
    const buff = makeBuffEffect({
      id: 'eff-dragon-stance',
      name: 'Dragon Stance',
      mechanics: {
        applyWhen: 'activeBuff-active',
        triggers: { turnStartSelf: { tempHP: '3' } },
      } as PowerMechanics,
    });
    const actor = makeActorWithBuffs({
      tempHP: 1,
      passives: [passive],
      buffs: [buff],
    });
    const combat = makeCombat();
    queueRolls([4]);
    await applyPassiveTrigger(actor, 'combatStart', combat); // passive 4
    await applyBuffTriggersOnActivate(actor, buff, combat); // buff 3
    expect(actor.system.health.tempHP).toBe(8); // 1 + 4 + 3

    await clearTempHPSourcesOnCombatEnd(actor, combat);
    expect(actor.system.health.tempHP).toBe(1);
    expect(Object.keys(getTempHPSources(actor))).toHaveLength(0);
  });
});
