/**
 * Final Active Buff playtest catalogue + Parry / action-economy integration.
 * Authoritative: Destroyed_Faith_Active_Buffs_Final_Playtest_2026-10-20.md
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ACTIVE_BUFF_TEMPLATES } from '../src/utils/powers/templates/activeBuffs';
import {
  getAvailableAttackActions,
  getRoundState,
  setRoundState,
  applyBasicMovementManeuverFlags,
  canForfeitBaseAttackForManeuver,
  resetRoundState,
} from '../src/combat/action-economy';
import { enterParry } from '../src/combat/parry';
import {
  computeLastActiveRound,
  isBuffActiveInRound,
  expireActiveBuffsAtRoundEnd,
} from '../src/combat/active-buff-lifecycle';
import { damageNegationReserveForLevel } from '../src/combat/damage-negation';
import { STONE_POWERS } from '../src/stones/stone-powers';
import { syncCriticalRoundQuota, combatRoundKey } from '../src/combat/critical-resolution';
import { MS_INNER_SEGMENTS } from '../src/radial-menu/types';
import { getSegmentIdForOption } from '../src/radial-menu/options';

const FINAL_18: Array<{ id: string; name: string }> = [
  { id: 'ab-armor', name: 'Active Buff: Armor' },
  { id: 'ab-evade', name: 'Active Buff: Evade' },
  { id: 'ab-armor-aura', name: 'Active Buff: Armor Aura' },
  { id: 'ab-temp-hp', name: 'Active Buff: Temporary HP' },
  { id: 'ab-damage-reduction', name: 'Active Buff: Damage Reduction' },
  { id: 'ab-phasing', name: 'Active Buff: Phasing' },
  { id: 'ab-spell-resistance', name: 'Active Buff: Spell Resistance' },
  { id: 'ab-cleanse-maintenance', name: 'Active Buff: Self Cleanse' },
  { id: 'ab-invisibility', name: 'Active Buff: Invisibility' },
  { id: 'ab-reinforced-parry', name: 'Active Buff: Parry Recovery' },
  { id: 'ab-reinforced-damage-negation', name: 'Active Buff: Damage Negation Pool' },
  { id: 'ab-damage', name: 'Active Buff: Damage' },
  { id: 'ab-critical', name: 'Active Buff: Critical' },
  { id: 'ab-damage-aura', name: 'Active Buff: Damage Aura' },
  { id: 'ab-summon-damage-aura', name: 'Active Buff: Summon Damage Aura' },
  { id: 'ab-thorns', name: 'Active Buff: Thorns' },
  { id: 'ab-summon-armor-aura', name: 'Active Buff: Summon Armor Aura' },
  { id: 'ab-intensified-absorption', name: 'Active Buff: Absorption Stone Increase' },
];

function ab(id: string) {
  return ACTIVE_BUFF_TEMPLATES.find((t) => t.templateId === id);
}

function makeActor(opts?: { parry?: boolean }) {
  const flagStore: Record<string, any> = {};
  const items: any[] = [];
  if (opts?.parry) {
    items.push({
      type: 'power',
      name: 'Passive: Parry',
      system: {
        templateId: 'passive-parry',
        level: 4,
        rank: 4,
        parryAttribute: 'might',
        parryDelivery: 'martial',
      },
    });
  }
  const actor: any = {
    id: 'hero',
    name: 'Hero',
    type: 'character',
    system: {
      health: { tempHP: 0, bars: [{ max: 40, current: 40 }], currentBar: 0 },
      combat: {},
      mastery: { rank: 1 },
      attributes: {
        vitality: { value: 4 },
        might: { value: 6 },
        agility: { value: 4 },
      },
    },
    flags: { 'mastery-system': {} },
    effects: [] as any[],
    items,
    getFlag(_s: string, key: string) {
      return flagStore[key] ?? actor.flags?.['mastery-system']?.[key];
    },
    setFlag: async (_s: string, key: string, value: unknown) => {
      flagStore[key] = value;
      if (!actor.flags['mastery-system']) actor.flags['mastery-system'] = {};
      actor.flags['mastery-system'][key] = value;
    },
    unsetFlag: async (_s: string, key: string) => {
      delete flagStore[key];
      if (actor.flags?.['mastery-system']) delete actor.flags['mastery-system'][key];
    },
    update: async () => undefined,
  };
  return actor;
}

async function baseRound(actor: any, combat: any, totalAttacks = 1, prep = false) {
  await setRoundState(actor, {
    combatId: String(combat.id),
    round: Math.max(1, Math.floor(Number(combat.round) || 1)),
    isPC: true,
    movementActions: { total: 1, used: 0 },
    attackActions: { total: totalAttacks, used: 0 },
    reactionActions: { total: 1, used: 0 },
    moveBonusMeters: 0,
    usedPowerIdsThisRound: [],
    npcAttackUsesThisRound: {},
    stoneBonuses: { extraAttacks: Math.max(0, totalAttacks - 1), extraReactions: 0, extraMoveMeters: 0 },
    prepBaseAttackCommitted: prep,
  });
}

describe('1. Final catalogue — 18 technical identities + PL tables', () => {
  it('preserves all 18 Final Playtest Active Buffs by technical name', () => {
    expect(FINAL_18).toHaveLength(18);
    for (const row of FINAL_18) {
      const tpl = ab(row.id);
      expect(tpl, row.id).toBeTruthy();
      expect(tpl!.name).toBe(row.name);
      expect(Object.keys(tpl!.levels ?? {})).toHaveLength(16);
    }
  });

  it('matches printed PL1/PL4/PL8/PL16 values for core axes', () => {
    expect(ab('ab-armor')?.levels?.['1']?.mechanics?.armor).toBe(5);
    expect(ab('ab-armor')?.levels?.['16']?.mechanics?.armor).toBe(65);
    expect(ab('ab-evade')?.levels?.['1']?.mechanics?.evade).toBe(2);
    expect(ab('ab-evade')?.levels?.['16']?.mechanics?.evade).toBe(32);
    expect(ab('ab-temp-hp')?.levels?.['1']?.mechanics?.tempHP).toBe('10');
    expect(ab('ab-temp-hp')?.levels?.['16']?.mechanics?.tempHP).toBe('122');
    expect(ab('ab-temp-hp')?.levels?.['4']?.mechanics?.preparationTempHP).toBe(true);
    expect(ab('ab-reinforced-damage-negation')?.levels?.['4']?.mechanics?.damageNegation).toBe(4);
    expect(ab('ab-reinforced-damage-negation')?.levels?.['16']?.mechanics?.damageNegation).toBe(16);
    expect(ab('ab-critical')?.levels?.['4']?.mechanics?.critical).toBe(1);
    expect(ab('ab-critical')?.levels?.['8']?.mechanics?.critical).toBe(2);
    expect(ab('ab-critical')?.levels?.['12']?.mechanics?.critical).toBe(3);
    expect(ab('ab-critical')?.levels?.['15']?.mechanics?.critical).toBe(4);
    expect(ab('ab-intensified-absorption')?.levels?.['1']?.mechanics?.absorptionStoneIncrease).toBe(1);
    expect(ab('ab-intensified-absorption')?.levels?.['13']?.mechanics?.absorptionStoneIncrease).toBe(4);
    expect(ab('ab-cleanse-maintenance')?.levels?.['3']?.effect?.text).toMatch(/start of your turn/i);
    expect(ab('ab-damage-aura')?.levels?.['1']?.effect?.text).toMatch(/end of each of your turns/i);
  });

  it('Passive DN = 2×PL; Vitality Stone DN = 2/4/8/12', () => {
    expect(damageNegationReserveForLevel(4)).toBe(8);
    expect(STONE_POWERS['vitality.damageNegation'].tiers.map((t) => t.value)).toEqual([2, 4, 8, 12]);
  });
});

describe('2–6. Parry Recovery action economy', () => {
  beforeEach(() => {
    vi.stubGlobal('game', { combat: { id: 'c1', round: 1, turn: 0, started: true } });
    vi.stubGlobal('canvas', { tokens: { placeables: [] } });
    vi.stubGlobal('Hooks', { callAll: () => undefined });
    vi.stubGlobal('ui', { notifications: { warn: () => undefined, info: () => undefined } });
  });

  it('Scenario A — Prep Buff commit blocks Parry without Extra Attack', async () => {
    const actor = makeActor({ parry: true });
    const combat = { id: 'c1', round: 1, turn: 0 } as any;
    await baseRound(actor, combat, 1, true);
    expect(getAvailableAttackActions(actor, combat)).toBe(0);
    const result = await enterParry(actor, combat, { delivery: 'martial' });
    expect(result.ok).toBe(false);
    expect(getRoundState(actor, combat).parry?.entered).toBeFalsy();
  });

  it('Scenario B — Extra Attack pays for Parry once when Prep committed base', async () => {
    const actor = makeActor({ parry: true });
    const combat = { id: 'c1', round: 1, turn: 0 } as any;
    await baseRound(actor, combat, 2, true);
    expect(getAvailableAttackActions(actor, combat)).toBe(1);
    const result = await enterParry(actor, combat, { delivery: 'martial' });
    expect(result.ok).toBe(true);
    const rs = getRoundState(actor, combat);
    expect(rs.parry?.entered).toBe(true);
    expect(rs.attackActions.used).toBe(1);
    expect(getAvailableAttackActions(actor, combat)).toBe(0);

    // No free second entry / no duplicate spend
    const again = await enterParry(actor, combat, { delivery: 'martial' });
    expect(again.ok).toBe(false);
    expect(getRoundState(actor, combat).attackActions.used).toBe(1);
  });

  it('Scenario C — maintained Round uses normal base Attack Action for Parry', async () => {
    const actor = makeActor({ parry: true });
    const combat = { id: 'c1', round: 2, turn: 0 } as any;
    await baseRound(actor, combat, 1, false);
    const result = await enterParry(actor, combat, { delivery: 'martial' });
    expect(result.ok).toBe(true);
    const rs = getRoundState(actor, combat);
    expect(rs.baseAttackLocked).toBe(true);
    expect(rs.attackActions.used).toBe(0);
    expect(getAvailableAttackActions(actor, combat)).toBe(0);
  });

  it('Buff activation alone never enters Parry', async () => {
    const actor = makeActor({ parry: true });
    const combat = { id: 'c1', round: 1 } as any;
    await baseRound(actor, combat, 2, true);
    expect(getRoundState(actor, combat).parry?.entered).toBeFalsy();
  });
});

describe('7. No double-forfeit through Dash / Disengage', () => {
  beforeEach(() => {
    vi.stubGlobal('game', { combat: { id: 'c1', round: 1, turn: 0, started: true } });
    vi.stubGlobal('canvas', { tokens: { placeables: [] } });
    vi.stubGlobal('Hooks', { callAll: () => undefined });
  });

  it('rejects Dash and Disengage when Prep committed the base Attack Action', async () => {
    const actor = makeActor();
    const combat = { id: 'c1', round: 1 } as any;
    await baseRound(actor, combat, 2, true);
    expect(canForfeitBaseAttackForManeuver(actor, combat, 'dash').ok).toBe(false);
    expect(canForfeitBaseAttackForManeuver(actor, combat, 'disengage').ok).toBe(false);
    expect((await applyBasicMovementManeuverFlags(actor, combat, 'dash')).ok).toBe(false);
    expect((await applyBasicMovementManeuverFlags(actor, combat, 'disengage')).ok).toBe(false);
    expect(getAvailableAttackActions(actor, combat)).toBe(1);
  });

  it('allows Dash when base Attack Action is still free', async () => {
    const actor = makeActor();
    const combat = { id: 'c1', round: 1 } as any;
    await baseRound(actor, combat, 1, false);
    expect((await applyBasicMovementManeuverFlags(actor, combat, 'dash')).ok).toBe(true);
    expect(getRoundState(actor, combat).baseAttackLocked).toBe(true);
  });
});

describe('8–10. Duration, Prep refresh identity, Critical persistence', () => {
  it('MR1 is one complete Round ending at Round End', () => {
    expect(computeLastActiveRound(1, 1)).toBe(1);
    expect(isBuffActiveInRound(1, 1, 1)).toBe(true);
    expect(isBuffActiveInRound(1, 1, 2)).toBe(false);
  });

  it('Temp HP / DN Prep refresh flags remain on final catalogue rows', () => {
    expect(ab('ab-temp-hp')?.levels?.['8']?.mechanics?.preparationTempHP).toBe(true);
    expect(ab('ab-reinforced-damage-negation')?.levels?.['8']?.mechanics?.damageNegationPoolMax).toBe(8);
  });

  it('Active Buff Critical is combat-wide and survives Round advance', () => {
    expect(combatRoundKey({ id: 'c9', round: 1 })).toBe('c9');
    let quota = syncCriticalRoundQuota(null, 'c9', 2);
    quota = { ...quota, remaining: 1 };
    quota = syncCriticalRoundQuota(quota, 'c9', 2);
    expect(quota.remaining).toBe(1);
  });
});

describe('11–12. Radial rejection + Combat End cleanup', () => {
  it('Active Buff segment is absent from radial inner segments', () => {
    expect(MS_INNER_SEGMENTS.some((s) => s.id === 'active-buff')).toBe(false);
  });

  it('getSegmentIdForOption still classifies buffs for filter rejection', () => {
    const opt: any = {
      source: 'power',
      powerType: 'active-buff',
      costsAction: true,
      item: { system: { powerType: 'active-buff', cost: { action: 'attack' } } },
    };
    expect(getSegmentIdForOption(opt)).toBe('active-buff');
  });

  it('Combat End / Round End expiry still removes maintained Buffs', async () => {
    const actor = makeActor();
    const effect: any = {
      name: 'Active Buff: Armor',
      flags: {
        'mastery-system': {
          activeBuff: true,
          activationRound: 1,
          effectiveDuration: 1,
          lastActiveRound: 1,
          durationMode: 'round-end',
          combatId: 'c1',
        },
      },
      delete: async () => {
        actor.effects = actor.effects.filter((e: any) => e !== effect);
      },
    };
    actor.effects.push(effect);
    const expired = await expireActiveBuffsAtRoundEnd(actor, { id: 'c1' }, 1);
    expect(expired).toContain('Active Buff: Armor');
    expect(actor.effects).toHaveLength(0);
  });

  it('resetRoundState clears Prep commitment for the next Round (maintain free)', async () => {
    vi.stubGlobal('game', { combat: { id: 'c1', round: 1, turn: 0, started: true } });
    vi.stubGlobal('canvas', { tokens: { placeables: [] } });
    vi.stubGlobal('Hooks', { callAll: () => undefined });
    const actor = makeActor();
    const combat = { id: 'c1', round: 1 } as any;
    await baseRound(actor, combat, 1, true);
    await resetRoundState(actor, { getFlag: () => undefined } as any, { ...combat, round: 2 } as any);
    expect(getRoundState(actor, { ...combat, round: 2 }).prepBaseAttackCommitted).toBe(false);
  });
});
