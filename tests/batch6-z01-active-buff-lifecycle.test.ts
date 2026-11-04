/**
 * Batch 6 Z01 — Active Buff Lifecycle (2026-11-04):
 * one maintained Buff; free voluntary end; Prep activate/replace without
 * Attack Action / Stones; no general per-Combat activation limit; limited
 * Buff resources (Critical) are not restored by switching.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  activateActiveBuff,
  canRetractActiveBuffFromFlags,
  deleteAllMasteryActiveBuffEffects,
  getTrueActiveBuffs,
  isTrueActiveBuff,
  retractActiveBuffActivation,
} from '../src/utils/active-buffs.js';
import {
  computeLastActiveRound,
  isActiveBuffPreparationWindow,
  expireActiveBuffsAtRoundEnd,
} from '../src/combat/active-buff-lifecycle.js';
import {
  consumeCriticalQuota,
  syncCriticalRoundQuota,
} from '../src/combat/critical-resolution.js';
import { remainingActiveBuffActions } from '../src/combat/action-economy.js';
import { syncActiveBuffMaximizationQuotaState } from '../src/stones/stone-combat-effects.js';
import { ACTIVE_BUFF_TEMPLATES } from '../src/utils/powers/templates/activeBuffs.js';
import { getArtifactActiveBuffs } from '../src/utils/artifact-active-buffs.js';

function makeItemCollection(list: any[]) {
  const items: any = [...list];
  items.get = (id: string) => items.find((it: any) => it.id === id || it._id === id);
  items.find = (fn: (it: any) => boolean) => Array.prototype.find.call(items, fn);
  return items;
}

function makeActor(mr = 3) {
  const flagStore: Record<string, any> = {};
  const actor: any = {
    id: 'hero-z01',
    name: 'Hero',
    type: 'character',
    isOwner: true,
    system: {
      mastery: { rank: mr },
      health: { tempHP: 0, bars: [{ max: 40, current: 40 }], currentBar: 0 },
      combat: {},
      attributes: { vitality: { value: 4 } },
    },
    flags: { 'mastery-system': {} },
    effects: [] as any[],
    items: makeItemCollection([]),
    getFlag(_s: string, key: string) {
      return flagStore[key] ?? actor.flags?.['mastery-system']?.[key];
    },
    setFlag: async (_s: string, key: string, value: unknown) => {
      flagStore[key] = value;
      actor.flags['mastery-system'] = actor.flags['mastery-system'] || {};
      actor.flags['mastery-system'][key] = value;
    },
    unsetFlag: async (_s: string, key: string) => {
      delete flagStore[key];
      if (actor.flags?.['mastery-system']) delete actor.flags['mastery-system'][key];
    },
    createEmbeddedDocuments: async (_type: string, data: any[]) => {
      const created: any[] = [];
      for (const d of data) {
        const effect: any = {
          id: `eff-${actor.effects.length + 1}`,
          name: d.name,
          flags: d.flags,
          description: d.description,
          duration: d.duration,
          delete: async () => {
            actor.effects = actor.effects.filter((e: any) => e !== effect);
          },
          update: async (patch: Record<string, unknown>) => {
            for (const [path, value] of Object.entries(patch)) {
              if (path.startsWith('flags.mastery-system.')) {
                const k = path.slice('flags.mastery-system.'.length);
                effect.flags['mastery-system'][k] = value;
              }
            }
          },
        };
        actor.effects.push(effect);
        created.push(effect);
      }
      return created;
    },
    deleteEmbeddedDocuments: async (_type: string, ids: string[]) => {
      actor.effects = actor.effects.filter((e: any) => !ids.includes(e.id));
    },
  };
  return actor;
}

function buffPower(templateId: string, name: string, rank = 4) {
  const tpl = ACTIVE_BUFF_TEMPLATES.find((t) => t.templateId === templateId);
  expect(tpl, templateId).toBeTruthy();
  return {
    id: `pwr-${templateId}`,
    name,
    type: 'power',
    system: {
      powerType: 'active-buff',
      templateId,
      rank,
      level: rank,
      cost: { action: 'attack' },
      levels: tpl!.levels,
      tags: ['active-buff'],
    },
  };
}

function prepCombat(round = 1) {
  return { id: 'c-z01', round, turn: 0, started: false, combatants: [] };
}

describe('Z01 — Active Buff lifecycle', () => {
  beforeEach(() => {
    vi.stubGlobal('ui', { notifications: { warn: () => undefined, info: () => undefined, error: () => undefined } });
    vi.stubGlobal('Hooks', { callAll: () => undefined });
    vi.stubGlobal('canvas', { tokens: { placeables: [] } });
  });

  it('activates in Preparation without Attack Action / Stone cost and lasts MR rounds', async () => {
    const actor = makeActor(3);
    const combat = prepCombat(1);
    vi.stubGlobal('game', { combat, user: { id: 'u1', isGM: true } });
    const power = buffPower('ab-armor', 'Armor Buff', 4);
    actor.items = makeItemCollection([power]);
    expect(isTrueActiveBuff(power)).toBe(true);
    expect(isActiveBuffPreparationWindow(actor, combat)).toBe(true);

    const ok = await activateActiveBuff(actor, power);
    expect(ok).toBe(true);
    const buffs = getTrueActiveBuffs(actor);
    expect(buffs).toHaveLength(1);
    const flags = buffs[0].flags['mastery-system'];
    expect(flags.activationRound).toBe(1);
    expect(flags.effectiveDuration).toBe(3);
    expect(flags.lastActiveRound).toBe(computeLastActiveRound(1, 3));
    expect(flags.lastActiveRound).toBe(3);
  });

  it('blocks activation outside Preparation', async () => {
    const actor = makeActor(2);
    const combat: any = {
      id: 'c-z01',
      round: 2,
      turn: 0,
      started: true,
      combatants: [{ id: 'cb1', actor, actorId: actor.id }],
      getFlag: (_ns: string, key: string) =>
        key === 'activeBuffPrepClosedRound' ? 2 : undefined,
      flags: { 'mastery-system': { activeBuffPrepClosedRound: 2 } },
    };
    vi.stubGlobal('game', { combat, user: { id: 'u1', isGM: false } });
    const power = buffPower('ab-armor', 'Armor Buff', 4);
    expect(isActiveBuffPreparationWindow(actor, combat)).toBe(false);
    const ok = await activateActiveBuff(actor, power);
    expect(ok).toBe(false);
    expect(getTrueActiveBuffs(actor)).toHaveLength(0);
  });

  it('voluntary end anytime; next Prep can activate another Buff', async () => {
    const actor = makeActor(2);
    const combat = prepCombat(1);
    vi.stubGlobal('game', { combat, user: { id: 'u1', isGM: false } });
    const a = buffPower('ab-armor', 'Armor Buff', 4);
    const b = buffPower('ab-critical', 'Critical Buff', 4);
    actor.items = makeItemCollection([a, b]);

    expect(await activateActiveBuff(actor, a)).toBe(true);
    expect(
      canRetractActiveBuffFromFlags({
        maintaining: true,
        isGM: false,
        isOwner: true,
        windowOpen: false,
      }),
    ).toBe(true);
    const ended = await retractActiveBuffActivation(actor, { user: { isGM: false } });
    expect(ended.ok).toBe(true);
    expect(getTrueActiveBuffs(actor)).toHaveLength(0);

    expect(await activateActiveBuff(actor, b)).toBe(true);
    expect(getTrueActiveBuffs(actor)[0].name).toBe('Critical Buff');
  });

  it('direct Prep swap A→B removes A fully before B; never two true Buffs', async () => {
    const actor = makeActor(2);
    const combat = prepCombat(1);
    vi.stubGlobal('game', { combat, user: { id: 'u1', isGM: true } });
    const a = buffPower('ab-armor', 'Armor Buff', 4);
    const b = buffPower('ab-evade', 'Evade Buff', 4);
    actor.items = makeItemCollection([a, b]);

    expect(await activateActiveBuff(actor, a)).toBe(true);
    expect(getTrueActiveBuffs(actor)).toHaveLength(1);

    expect(await activateActiveBuff(actor, b)).toBe(true);
    const buffs = getTrueActiveBuffs(actor);
    expect(buffs).toHaveLength(1);
    expect(buffs[0].name).toBe('Evade Buff');
    expect(buffs.every((e: any) => e.name !== 'Armor Buff')).toBe(true);

    // Sequential re-activate of B must not duplicate.
    expect(await activateActiveBuff(actor, b)).toBe(true);
    expect(getTrueActiveBuffs(actor)).toHaveLength(1);
  });

  it('replacement Buff receives a fresh full MR duration', async () => {
    const actor = makeActor(4);
    const combat = prepCombat(2);
    vi.stubGlobal('game', { combat, user: { id: 'u1', isGM: true } });
    const a = buffPower('ab-armor', 'Armor Buff', 4);
    const b = buffPower('ab-critical', 'Critical Buff', 4);
    actor.items = makeItemCollection([a, b]);
    expect(await activateActiveBuff(actor, a)).toBe(true);
    expect(await activateActiveBuff(actor, b)).toBe(true);
    const flags = getTrueActiveBuffs(actor)[0].flags['mastery-system'];
    expect(flags.activationRound).toBe(2);
    expect(flags.effectiveDuration).toBe(4);
    expect(flags.lastActiveRound).toBe(5);
  });

  it('allows a second and third switch in the same combat / Preparation', async () => {
    const actor = makeActor(2);
    const combat = prepCombat(1);
    vi.stubGlobal('game', { combat, user: { id: 'u1', isGM: true } });
    const a = buffPower('ab-armor', 'Armor A', 4);
    const b = buffPower('ab-evade', 'Evade B', 4);
    const c = buffPower('ab-critical', 'Crit C', 4);
    actor.items = makeItemCollection([a, b, c]);
    expect(await activateActiveBuff(actor, a)).toBe(true);
    expect(await activateActiveBuff(actor, b)).toBe(true);
    expect(await activateActiveBuff(actor, c)).toBe(true);
    expect(getTrueActiveBuffs(actor)).toHaveLength(1);
    expect(getTrueActiveBuffs(actor)[0].name).toBe('Crit C');
  });

  it('Combat End / deleteAll clears remaining Active Buff effects', async () => {
    const actor = makeActor(2);
    const combat = prepCombat(1);
    vi.stubGlobal('game', { combat, user: { id: 'u1', isGM: true } });
    const a = buffPower('ab-armor', 'Armor Buff', 4);
    actor.items = makeItemCollection([a]);
    expect(await activateActiveBuff(actor, a)).toBe(true);
    await deleteAllMasteryActiveBuffEffects(actor);
    expect(getTrueActiveBuffs(actor)).toHaveLength(0);
  });

  it('Round-End expiry removes the Buff after its last Round', async () => {
    const actor = makeActor(1);
    const combat = prepCombat(1);
    vi.stubGlobal('game', { combat, user: { id: 'u1', isGM: true } });
    const a = buffPower('ab-armor', 'Armor Buff', 4);
    actor.items = makeItemCollection([a]);
    expect(await activateActiveBuff(actor, a)).toBe(true);
    const expired = await expireActiveBuffsAtRoundEnd(actor, combat, 1);
    expect(expired.length).toBeGreaterThan(0);
    expect(getTrueActiveBuffs(actor)).toHaveLength(0);
  });

  it('Critical Uses are not restored by Buff swap / reactivation', () => {
    let quota = syncCriticalRoundQuota(null, 'c-z01', 2);
    quota = consumeCriticalQuota(quota);
    expect(quota.remaining).toBe(1);
    expect(quota.spent).toBe(1);

    // Buff off (non-Critical) then Critical back on — spent persists.
    quota = syncCriticalRoundQuota(quota, 'c-z01', 0);
    expect(quota.spent).toBe(1);
    quota = syncCriticalRoundQuota(quota, 'c-z01', 2);
    expect(quota.remaining).toBe(1);
    expect(quota.spent).toBe(1);

    // Same combat third switch still does not refill.
    quota = syncCriticalRoundQuota(quota, 'c-z01', 2);
    expect(quota.remaining).toBe(1);
  });

  it('Maximization uses are not restored by Buff swap / reactivation', () => {
    let quota = syncActiveBuffMaximizationQuotaState(null, 'c-z01', 2);
    expect(quota.remaining).toBe(2);
    quota = syncActiveBuffMaximizationQuotaState(
      { ...quota, spent: 1, remaining: 1 },
      'c-z01',
      2,
    );
    expect(quota.spent).toBe(1);
    expect(quota.remaining).toBe(1);

    // Buff off then Maximization back on — spent persists (no farm).
    quota = syncActiveBuffMaximizationQuotaState(quota, 'c-z01', 0);
    expect(quota.spent).toBe(1);
    quota = syncActiveBuffMaximizationQuotaState(quota, 'c-z01', 2);
    expect(quota.remaining).toBe(1);
    expect(quota.spent).toBe(1);
  });

  it('artifact Active Buff and power Active Buff share the one-slot limit', async () => {
    const actor = makeActor(2);
    const combat = prepCombat(1);
    vi.stubGlobal('game', { combat, user: { id: 'u1', isGM: true } });
    const power = buffPower('ab-armor', 'Armor Buff', 4);
    actor.items = makeItemCollection([power]);

    // Simulate an already-running artifact Active Buff (same maintained slot).
    const artifactEff: any = {
      id: 'eff-art-1',
      name: 'Artifact Stance',
      flags: {
        'mastery-system': {
          activeBuff: true,
          artifactActiveBuff: true,
          artifactBuffKey: 'artifact:stance',
          isUtility: false,
        },
      },
      delete: async () => {
        actor.effects = actor.effects.filter((e: any) => e !== artifactEff);
      },
    };
    actor.effects.push(artifactEff);
    expect(getArtifactActiveBuffs(actor)).toHaveLength(1);

    expect(await activateActiveBuff(actor, power)).toBe(true);
    expect(getTrueActiveBuffs(actor)).toHaveLength(1);
    expect(getTrueActiveBuffs(actor)[0].name).toBe('Armor Buff');
    expect(getArtifactActiveBuffs(actor)).toHaveLength(0);
  });

  it('radial remaining no longer locks after one Prep activation', () => {
    expect(remainingActiveBuffActions(true, 10)).toBe(1);
    expect(remainingActiveBuffActions(false, 0)).toBe(1);
  });

  it('reload / re-open keeps a single maintained Buff (no duplication from flags)', async () => {
    const actor = makeActor(2);
    const combat = prepCombat(1);
    vi.stubGlobal('game', { combat, user: { id: 'u1', isGM: true } });
    const a = buffPower('ab-armor', 'Armor Buff', 4);
    actor.items = makeItemCollection([a]);
    expect(await activateActiveBuff(actor, a)).toBe(true);
    // Simulate sheet re-open: same effects array, no second create.
    const snapshot = getTrueActiveBuffs(actor);
    expect(snapshot).toHaveLength(1);
    expect(getTrueActiveBuffs(actor)).toHaveLength(1);
    expect(getTrueActiveBuffs(actor)[0].id).toBe(snapshot[0].id);
  });
});
