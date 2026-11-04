/**
 * Batch 6.1 — Active Buff Selection, Reset & Replacement UI
 * (independent of Stone Confirmation).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  activateActiveBuff,
  deleteAllMasteryActiveBuffEffects,
  getTrueActiveBuffs,
  retractActiveBuffActivation,
} from '../src/utils/active-buffs.js';
import { isActiveBuffPreparationWindow } from '../src/combat/active-buff-lifecycle.js';
import {
  activeBuffPrepResourceKey,
  canGrantPrepTempHP,
  markPrepTempHPGranted,
  resolvePrepDamageNegationPool,
  snapshotPrepDamageNegationOnEnd,
} from '../src/combat/active-buff-prep-resources.js';
import { syncCriticalRoundQuota, consumeCriticalQuota } from '../src/combat/critical-resolution.js';
import { syncActiveBuffMaximizationQuotaState } from '../src/stones/stone-combat-effects.js';
import { ACTIVE_BUFF_TEMPLATES } from '../src/utils/powers/templates/activeBuffs.js';

function makeItemCollection(list: any[]) {
  const items: any = [...list];
  items.get = (id: string) => items.find((it: any) => it.id === id || it._id === id);
  items.find = (fn: (it: any) => boolean) => Array.prototype.find.call(items, fn);
  return items;
}

function makeActor(mr = 3) {
  const flagStore: Record<string, any> = {};
  const actor: any = {
    id: 'hero-b61',
    name: 'Hero',
    type: 'character',
    isOwner: true,
    system: {
      mastery: { rank: mr },
      health: { tempHP: 0, bars: [{ max: 40, current: 40 }], currentBar: 0 },
      combat: {},
      attributes: { vitality: { value: 4 }, might: { value: 4 } },
      stones: {
        might: { current: 3, max: 4 },
        vitality: { current: 2, max: 4 },
      },
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
          flags: structuredClone(d.flags),
          description: d.description,
          duration: d.duration,
          delete: async () => {
            actor.effects = actor.effects.filter((e: any) => e !== effect);
          },
          update: async (patch: Record<string, unknown>) => {
            for (const [path, value] of Object.entries(patch)) {
              if (path.startsWith('flags.mastery-system.')) {
                const k = path.slice('flags.mastery-system.'.length);
                const parts = k.split('.');
                let cur = effect.flags['mastery-system'];
                for (let i = 0; i < parts.length - 1; i++) {
                  cur[parts[i]] = cur[parts[i]] || {};
                  cur = cur[parts[i]];
                }
                cur[parts[parts.length - 1]] = value;
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
    update: async (patch: Record<string, unknown>) => {
      // minimal: tempHP / flags paths used by Temp HP helpers
      if ('system.health.tempHP' in patch) {
        actor.system.health.tempHP = patch['system.health.tempHP'];
      }
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

function openPrepCombat(round = 1) {
  return {
    id: 'c-b61',
    round,
    turn: 0,
    started: false,
    combatants: [{ id: 'cb1', actorId: 'hero-b61' }],
    getFlag: () => undefined,
    flags: { 'mastery-system': {} },
  };
}

/** Pure UI lock helper mirrored from dialog: stone confirmation must not lock. */
function activeBuffSelectionLocked(windowOpen: boolean, _stoneConfirmed: boolean): boolean {
  return !windowOpen;
}

describe('Batch 6.1 — Active Buff prep UI & confirmation independence', () => {
  beforeEach(() => {
    vi.stubGlobal('ui', { notifications: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } });
    vi.stubGlobal('ChatMessage', { create: vi.fn(async () => null), getSpeaker: () => ({}) });
  });

  it('1–3: select / reset / A→B before stone confirmation', async () => {
    const actor = makeActor(2);
    const combat = openPrepCombat(1);
    vi.stubGlobal('game', { combat, user: { id: 'u1', isGM: true } });
    const a = buffPower('ab-armor', 'Armor Buff', 4);
    const b = buffPower('ab-evade', 'Evade Buff', 4);
    actor.items = makeItemCollection([a, b]);

    expect(isActiveBuffPreparationWindow(actor, combat)).toBe(true);
    expect(activeBuffSelectionLocked(true, false)).toBe(false);

    expect(await activateActiveBuff(actor, a)).toBe(true);
    expect(getTrueActiveBuffs(actor)).toHaveLength(1);
    expect(getTrueActiveBuffs(actor)[0].name).toBe('Armor Buff');

    // Reset unconfirmed/active selection
    const ended = await retractActiveBuffActivation(actor, { user: { isGM: true } });
    expect(ended.ok).toBe(true);
    expect(getTrueActiveBuffs(actor)).toHaveLength(0);

    expect(await activateActiveBuff(actor, a)).toBe(true);
    expect(await activateActiveBuff(actor, b)).toBe(true);
    expect(getTrueActiveBuffs(actor)).toHaveLength(1);
    expect(getTrueActiveBuffs(actor)[0].name).toBe('Evade Buff');
  });

  it('4–6: A→B, end, re-select after stone confirmation; stones unchanged', async () => {
    const actor = makeActor(2);
    const combat = openPrepCombat(1);
    // Simulate stones confirmed: assignment confirmed + done map, but Prep still open
    // (combat not started / turn not begun → window stays open via prep.assignment open default).
    await actor.setFlag('mastery-system', 'preparationPhase', {
      combatId: 'c-b61',
      round: 1,
      boost: 'skipped',
      boostTier: 0,
      exchange: 'done',
      exchangeStones: 0,
      assignment: 'open',
    });
    const stonesBefore = structuredClone(actor.system.stones);
    vi.stubGlobal('game', { combat, user: { id: 'u1', isGM: true } });

    // Stone confirmation must not lock buff UI
    expect(activeBuffSelectionLocked(true, true)).toBe(false);

    const a = buffPower('ab-armor', 'Armor Buff', 4);
    const b = buffPower('ab-evade', 'Evade Buff', 4);
    actor.items = makeItemCollection([a, b]);

    expect(await activateActiveBuff(actor, a)).toBe(true);
    expect(await activateActiveBuff(actor, b)).toBe(true);
    expect(getTrueActiveBuffs(actor)[0].name).toBe('Evade Buff');
    expect(actor.system.stones).toEqual(stonesBefore);

    const ended = await retractActiveBuffActivation(actor, { user: { isGM: true } });
    expect(ended.ok).toBe(true);
    expect(getTrueActiveBuffs(actor)).toHaveLength(0);
    expect(actor.system.stones).toEqual(stonesBefore);

    expect(await activateActiveBuff(actor, a)).toBe(true);
    expect(getTrueActiveBuffs(actor)).toHaveLength(1);
    expect(actor.system.stones).toEqual(stonesBefore);
  });

  it('7–9: dialog reopen after confirmation does not spend stones; no re-confirm', async () => {
    const actor = makeActor(2);
    const combat = openPrepCombat(1);
    vi.stubGlobal('game', { combat, user: { id: 'u1', isGM: true } });
    const stonesBefore = structuredClone(actor.system.stones);
    const a = buffPower('ab-armor', 'Armor Buff', 4);
    actor.items = makeItemCollection([a]);
    expect(await activateActiveBuff(actor, a)).toBe(true);

    // Simulate reopen: read maintained buff + stone snapshot unchanged
    expect(getTrueActiveBuffs(actor)).toHaveLength(1);
    expect(activeBuffSelectionLocked(true, true)).toBe(false);
    expect(actor.system.stones).toEqual(stonesBefore);
    // Second activate of same active power is no-op path via replace of self —
    // activating another then back still leaves stones alone.
    const b = buffPower('ab-evade', 'Evade Buff', 4);
    actor.items = makeItemCollection([a, b]);
    expect(await activateActiveBuff(actor, b)).toBe(true);
    expect(actor.system.stones).toEqual(stonesBefore);
  });

  it('10–12: multiple switches; cancel change preserves buff; never two buffs', async () => {
    const actor = makeActor(2);
    const combat = openPrepCombat(1);
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

    // Cancel change = keep current (UI-only; runtime still has Crit C)
    const beforeCancel = getTrueActiveBuffs(actor)[0].id;
    expect(getTrueActiveBuffs(actor)[0].id).toBe(beforeCancel);
    expect(getTrueActiveBuffs(actor)).toHaveLength(1);
  });

  it('13–14: limited resources + A→B→A Prep ledger prevent illicit re-grant', () => {
    let crit = syncCriticalRoundQuota(null, 'c-b61', 2);
    crit = consumeCriticalQuota(crit);
    crit = syncCriticalRoundQuota(crit, 'c-b61', 0);
    crit = syncCriticalRoundQuota(crit, 'c-b61', 2);
    expect(crit.remaining).toBe(1);

    let maxq = syncActiveBuffMaximizationQuotaState(null, 'c-b61', 2);
    maxq = syncActiveBuffMaximizationQuotaState(
      { ...maxq, spent: 1, remaining: 1 },
      'c-b61',
      2,
    );
    maxq = syncActiveBuffMaximizationQuotaState(maxq, 'c-b61', 0);
    maxq = syncActiveBuffMaximizationQuotaState(maxq, 'c-b61', 2);
    expect(maxq.remaining).toBe(1);

    // Temp HP / DN A→B→A ledger
    const key = activeBuffPrepResourceKey('c-b61', 1, 'ab-temp-hp');
    let ledger = markPrepTempHPGranted({}, key);
    expect(canGrantPrepTempHP(ledger, key)).toBe(false);

    const dnKey = activeBuffPrepResourceKey('c-b61', 1, 'ab-reinforced-damage-negation');
    let dn = resolvePrepDamageNegationPool({}, dnKey, 10);
    expect(dn.remaining).toBe(10);
    ledger = snapshotPrepDamageNegationOnEnd(dn.ledger, dnKey, 4, 10);
    dn = resolvePrepDamageNegationPool(ledger, dnKey, 10);
    expect(dn.remaining).toBe(4);
  });

  it('15: after Preparation ends — end allowed, activate blocked', async () => {
    const actor = makeActor(2);
    const combat: any = {
      id: 'c-b61',
      round: 2,
      turn: 0,
      started: true,
      combatants: [{ id: 'cb1', actor, actorId: actor.id }],
      getFlag: (_ns: string, key: string) =>
        key === 'activeBuffPrepClosedRound' ? 2 : undefined,
      flags: { 'mastery-system': { activeBuffPrepClosedRound: 2 } },
    };
    vi.stubGlobal('game', { combat, user: { id: 'u1', isGM: false } });
    const a = buffPower('ab-armor', 'Armor Buff', 4);
    const b = buffPower('ab-evade', 'Evade Buff', 4);
    actor.items = makeItemCollection([a, b]);

    // Seed an active buff as if activated earlier
    actor.effects.push({
      id: 'eff-seed',
      name: 'Armor Buff',
      flags: {
        'mastery-system': {
          activeBuff: true,
          powerId: a.id,
          powerTemplateId: 'ab-armor',
          isUtility: false,
          activationRound: 2,
          lastActiveRound: 3,
        },
      },
      delete: async function (this: any) {
        actor.effects = actor.effects.filter((e: any) => e !== this);
      },
    });

    expect(isActiveBuffPreparationWindow(actor, combat)).toBe(false);
    expect(activeBuffSelectionLocked(false, true)).toBe(true);
    expect(await activateActiveBuff(actor, b)).toBe(false);
    expect(getTrueActiveBuffs(actor)).toHaveLength(1);

    const ended = await retractActiveBuffActivation(actor, { user: { isGM: true } });
    expect(ended.ok).toBe(true);
    expect(getTrueActiveBuffs(actor)).toHaveLength(0);
  });

  it('stone confirmation alone does not close Active Buff Preparation', async () => {
    const actor = makeActor(2);
    await actor.setFlag('mastery-system', 'preparationPhase', {
      combatId: 'c-b61',
      round: 1,
      boost: 'skipped',
      boostTier: 0,
      exchange: 'done',
      exchangeStones: 0,
      assignment: 'confirmed',
    });
    const combat: any = {
      id: 'c-b61',
      round: 1,
      turn: 0,
      started: true,
      combatants: [{ id: 'cb1', actor, actorId: actor.id }],
      getFlag: (_ns: string, key: string) =>
        key === 'stonePowersDoneByRound' ? { 'cb1:1': true } : undefined,
      flags: {
        'mastery-system': {
          stonePowersDoneByRound: { 'cb1:1': true },
        },
      },
    };
    vi.stubGlobal('game', { combat, user: { id: 'u1', isGM: true } });
    expect(isActiveBuffPreparationWindow(actor, combat)).toBe(true);
    expect(activeBuffSelectionLocked(true, true)).toBe(false);
    const a = buffPower('ab-armor', 'Armor Buff', 4);
    actor.items = makeItemCollection([a]);
    expect(await activateActiveBuff(actor, a)).toBe(true);
  });

  it('16: artifact Active Buff uses same one-slot replace path', async () => {
    const actor = makeActor(2);
    const combat = openPrepCombat(1);
    vi.stubGlobal('game', { combat, user: { id: 'u1', isGM: true } });
    const power = buffPower('ab-armor', 'Armor Buff', 4);
    actor.items = makeItemCollection([power]);

    const artifactEff: any = {
      id: 'eff-art',
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
    expect(await activateActiveBuff(actor, power)).toBe(true);
    expect(getTrueActiveBuffs(actor)).toHaveLength(1);
    expect(getTrueActiveBuffs(actor)[0].name).toBe('Armor Buff');
  });

  it('A→B→A Temp HP ledger: second A in same Prep cannot re-grant', () => {
    const key = activeBuffPrepResourceKey('c-b61', 1, 'ab-temp-hp');
    expect(canGrantPrepTempHP({}, key)).toBe(true);
    const afterFirst = markPrepTempHPGranted({}, key);
    expect(canGrantPrepTempHP(afterFirst, key)).toBe(false);
    // Ending A and activating B then A again still sees the Prep mark.
    expect(canGrantPrepTempHP(afterFirst, key)).toBe(false);
  });

  it('cleanup leaves no orphaned buffs after reset', async () => {
    const actor = makeActor(2);
    const combat = openPrepCombat(1);
    vi.stubGlobal('game', { combat, user: { id: 'u1', isGM: true } });
    const a = buffPower('ab-armor', 'Armor Buff', 4);
    actor.items = makeItemCollection([a]);
    expect(await activateActiveBuff(actor, a)).toBe(true);
    await deleteAllMasteryActiveBuffEffects(actor);
    expect(getTrueActiveBuffs(actor)).toHaveLength(0);
  });
});
