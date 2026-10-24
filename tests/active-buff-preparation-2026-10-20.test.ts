/**
 * Active Buff Preparation Phase migration — duration, action commit, Prep refresh.
 * Decisions: DN Pool keeps PL curve; MR1 = one complete Round, Round-End expiry.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  computeLastActiveRound,
  isBuffActiveInRound,
  remainingCompleteRounds,
  commitPrepBaseAttackAction,
  expireActiveBuffsAtRoundEnd,
  preparationTargetRound,
  refreshActiveBuffTempHPAtPreparation,
  refundPrepActiveBuffActivation,
  isActiveBuffPreparationWindow,
} from '../src/combat/active-buff-lifecycle';
import {
  getAvailableAttackActions,
  getRoundState,
  resetRoundState,
  resetTurnState,
  setRoundState,
  applyBasicMovementManeuverFlags,
} from '../src/combat/action-economy';
import { ACTIVE_BUFF_TEMPLATES } from '../src/utils/powers/templates/activeBuffs';
import { STONE_POWERS, stonePowerRankCost } from '../src/stones/stone-powers';
import { damageNegationReserveForLevel } from '../src/combat/damage-negation';
import { MS_INNER_SEGMENTS } from '../src/radial-menu/types';
import { getSegmentIdForOption } from '../src/radial-menu/options';
import {
  canRetractActiveBuffFromFlags,
  retractActiveBuffActivation,
} from '../src/utils/active-buffs';

function makeActor() {
  const flagStore: Record<string, any> = {};
  const actor: any = {
    id: 'hero',
    name: 'Hero',
    type: 'character',
    system: {
      health: { tempHP: 0, bars: [{ max: 40, current: 40 }], currentBar: 0 },
      combat: {},
      mastery: { rank: 1 },
      attributes: { vitality: { value: 4 } },
    },
    flags: { 'mastery-system': {} },
    effects: [] as any[],
    items: [],
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
    update: async (data: Record<string, unknown>) => {
      for (const [path, value] of Object.entries(data)) {
        const parts = path.split('.');
        let cur: any = actor;
        for (let i = 0; i < parts.length - 1; i++) {
          const seg = parts[i]!;
          if (cur[seg] == null || typeof cur[seg] !== 'object') cur[seg] = {};
          cur = cur[seg];
        }
        const last = parts[parts.length - 1]!;
        if (last.startsWith('-=')) delete cur[last.slice(2)];
        else cur[last] = value;
      }
    },
  };
  return actor;
}

function ab(id: string) {
  return ACTIVE_BUFF_TEMPLATES.find((t) => t.templateId === id);
}

describe('Duration math — complete Rounds, Round-End expiry', () => {
  it('MR1: lastActiveRound = activationRound', () => {
    expect(computeLastActiveRound(1, 1)).toBe(1);
    expect(isBuffActiveInRound(1, 1, 1)).toBe(true);
    expect(isBuffActiveInRound(1, 1, 2)).toBe(false);
    expect(remainingCompleteRounds(1, 1)).toBe(1);
    expect(remainingCompleteRounds(1, 2)).toBe(0);
  });

  it('MR2 lasts Rounds 1–2; MR3 lasts 1–3', () => {
    expect(computeLastActiveRound(1, 2)).toBe(2);
    expect(computeLastActiveRound(1, 3)).toBe(3);
    expect(isBuffActiveInRound(1, 2, 2)).toBe(true);
    expect(isBuffActiveInRound(1, 2, 3)).toBe(false);
  });

  it('Empowerment +1 Round extends lastActiveRound', () => {
    // MR1 + 1 empowerment = 2 complete Rounds
    expect(computeLastActiveRound(1, 1 + 1)).toBe(2);
  });

  it('expires at Round End of lastActiveRound regardless of Initiative', async () => {
    const actor = makeActor();
    const effect: any = {
      name: 'Test Buff',
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
    expect(expired).toContain('Test Buff');
    expect(actor.effects).toHaveLength(0);
  });
});

describe('Base Attack Action commitment', () => {
  beforeEach(() => {
    vi.stubGlobal('game', { combat: { id: 'c1', round: 1, turn: 0, started: false } });
    vi.stubGlobal('canvas', { tokens: { placeables: [] } });
    vi.stubGlobal('Hooks', { callAll: () => undefined });
  });

  it('commit survives resetTurnState; Basic Kit does not restore base Action', async () => {
    const actor = makeActor();
    const combat = { id: 'c1', round: 1, turn: 0 } as any;
    await setRoundState(actor, {
      combatId: 'c1',
      round: 1,
      isPC: true,
      movementActions: { total: 1, used: 0 },
      attackActions: { total: 1, used: 0 },
      reactionActions: { total: 1, used: 0 },
      moveBonusMeters: 0,
      usedPowerIdsThisRound: [],
      npcAttackUsesThisRound: {},
      stoneBonuses: { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 },
    });
    expect(await commitPrepBaseAttackAction(actor, combat)).toBe(true);
    expect(getAvailableAttackActions(actor, combat)).toBe(0);

    await resetTurnState(actor, combat);
    expect(getRoundState(actor, combat).prepBaseAttackCommitted).toBe(true);
    expect(getAvailableAttackActions(actor, combat)).toBe(0);
  });

  it('extra Attack Actions remain when base is committed', async () => {
    const actor = makeActor();
    const combat = { id: 'c1', round: 1, turn: 0 } as any;
    await setRoundState(actor, {
      combatId: 'c1',
      round: 1,
      isPC: true,
      movementActions: { total: 1, used: 0 },
      attackActions: { total: 2, used: 0 },
      reactionActions: { total: 1, used: 0 },
      moveBonusMeters: 0,
      usedPowerIdsThisRound: [],
      npcAttackUsesThisRound: {},
      stoneBonuses: { extraAttacks: 1, extraReactions: 0, extraMoveMeters: 0 },
      prepBaseAttackCommitted: true,
    });
    expect(getAvailableAttackActions(actor, combat)).toBe(1);
  });

  it('Dash cannot forfeit a base Attack Action already committed in Preparation', async () => {
    const actor = makeActor();
    const combat = { id: 'c1', round: 1, turn: 0 } as any;
    await setRoundState(actor, {
      combatId: 'c1',
      round: 1,
      isPC: true,
      movementActions: { total: 1, used: 0 },
      attackActions: { total: 2, used: 0 },
      reactionActions: { total: 1, used: 0 },
      moveBonusMeters: 0,
      usedPowerIdsThisRound: [],
      npcAttackUsesThisRound: {},
      stoneBonuses: { extraAttacks: 1, extraReactions: 0, extraMoveMeters: 0 },
      prepBaseAttackCommitted: true,
    });
    const result = await applyBasicMovementManeuverFlags(actor, combat, 'dash');
    expect(result.ok).toBe(false);
    expect(getRoundState(actor, combat).baseAttackLocked).toBeFalsy();
    // Extra Attack remains available for legal uses (e.g. Parry)
    expect(getAvailableAttackActions(actor, combat)).toBe(1);
  });

  it('resetRoundState clears Prep commitment for the next Round', async () => {
    const actor = makeActor();
    const combat = { id: 'c1', round: 1, turn: 0 } as any;
    await setRoundState(actor, {
      combatId: 'c1',
      round: 1,
      isPC: true,
      movementActions: { total: 1, used: 0 },
      attackActions: { total: 1, used: 0 },
      reactionActions: { total: 1, used: 0 },
      moveBonusMeters: 0,
      usedPowerIdsThisRound: [],
      npcAttackUsesThisRound: {},
      stoneBonuses: { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 },
      prepBaseAttackCommitted: true,
      activeBuffUsedThisRound: true,
    });
    await resetRoundState(actor, { getFlag: () => undefined } as any, {
      ...combat,
      round: 2,
    } as any);
    const next = getRoundState(actor, { ...combat, round: 2 });
    expect(next.prepBaseAttackCommitted).toBe(false);
    expect(next.activeBuffUsedThisRound).toBe(false);
  });
});

describe('Buff mechanics — DN PL curve + Temp HP Prep refresh', () => {
  it('DN Pool uses PL not ceil(PL/2); PL4=4, PL8=8', () => {
    expect(ab('ab-reinforced-damage-negation')?.levels?.['4']?.mechanics?.damageNegation).toBe(4);
    expect(ab('ab-reinforced-damage-negation')?.levels?.['8']?.mechanics?.damageNegation).toBe(8);
    expect(ab('ab-reinforced-damage-negation')?.levels?.['16']?.mechanics?.damageNegation).toBe(16);
  });

  it('Passive DN remains 2×PL; Stone DN remains 2/4/8/12', () => {
    expect(damageNegationReserveForLevel(4)).toBe(8);
    expect(STONE_POWERS['vitality.damageNegation'].tiers.map((t) => t.value)).toEqual([2, 4, 8, 12]);
    expect([1, 2, 3, 4].map((r) => {
      let s = 0;
      for (let i = 1; i <= r; i++) s += stonePowerRankCost('vitality.damageNegation', i);
      return s;
    })).toEqual([2, 6, 12, 20]);
  });

  it('Temp HP uses Preparation refresh, not turnStartSelf', () => {
    const row = ab('ab-temp-hp')?.levels?.['4'];
    expect(row?.mechanics?.tempHP).toBe('32');
    expect(row?.mechanics?.preparationTempHP).toBe(true);
    expect(row?.mechanics?.triggers?.turnStartSelf).toBeUndefined();
  });

  it('Prep Temp HP refresh is idempotent within the same Round', async () => {
    vi.stubGlobal('game', { combat: { id: 'c1', round: 1 } });
    const actor = makeActor();
    const combat = { id: 'c1', round: 1 } as any;
    const effect: any = {
      id: 'eff1',
      name: 'Active Buff: Temporary HP',
      flags: {
        'mastery-system': {
          activeBuff: true,
          powerTemplateId: 'ab-temp-hp',
          preparationTempHP: true,
          mechanics: { tempHP: '32', preparationTempHP: true, applyWhen: 'activeBuff-active' },
        },
      },
      update: async (data: Record<string, unknown>) => {
        for (const [k, v] of Object.entries(data)) {
          if (k.startsWith('flags.mastery-system.')) {
            const key = k.slice('flags.mastery-system.'.length);
            effect.flags['mastery-system'][key] = v;
          }
        }
      },
    };
    actor.effects.push(effect);
    await refreshActiveBuffTempHPAtPreparation(actor, combat);
    expect(actor.system.health.tempHP).toBe(32);
    actor.system.health.tempHP = 10;
    // Mark already refreshed — second call in same Round must not re-raise via new grant
    // (idempotence flag set on first call)
    await refreshActiveBuffTempHPAtPreparation(actor, combat);
    // Still 10 because same-round idempotence skipped the second refresh
    expect(actor.system.health.tempHP).toBe(10);
  });
});

describe('UI — radial menu', () => {
  it('Active Buff segment is absent from inner segments', () => {
    expect(MS_INNER_SEGMENTS.some((s) => s.id === 'active-buff')).toBe(false);
  });

  it('preparationTargetRound normalizes prep round 0 → 1', () => {
    expect(preparationTargetRound({ round: 0 })).toBe(1);
    expect(preparationTargetRound({ round: 1 })).toBe(1);
    expect(preparationTargetRound({ round: 3 })).toBe(3);
  });
});

describe('getSegmentIdForOption still classifies buffs (for filter)', () => {
  it('identifies active-buff powers', () => {
    const opt: any = {
      source: 'power',
      powerType: 'active-buff',
      costsAction: true,
      item: { system: { powerType: 'active-buff', cost: { action: 'attack' } } },
    };
    expect(getSegmentIdForOption(opt)).toBe('active-buff');
  });
});

describe('Active Buff retract', () => {
  beforeEach(() => {
    vi.stubGlobal('game', {
      combat: { id: 'c1', round: 1, turn: 0, started: false },
      user: { id: 'u1', isGM: false },
    });
    vi.stubGlobal('canvas', { tokens: { placeables: [] } });
    vi.stubGlobal('Hooks', { callAll: () => undefined });
    vi.stubGlobal('ui', {
      notifications: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });
  });

  function pushBuff(actor: any, name = 'Armor') {
    const effect: any = {
      id: 'eff1',
      name,
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
    return effect;
  }

  it('refundPrepActiveBuffActivation clears commit and used flags', async () => {
    const actor = makeActor();
    const combat = { id: 'c1', round: 1, turn: 0 } as any;
    await setRoundState(actor, {
      combatId: 'c1',
      round: 1,
      isPC: true,
      movementActions: { total: 1, used: 0 },
      attackActions: { total: 1, used: 0 },
      reactionActions: { total: 1, used: 0 },
      moveBonusMeters: 0,
      usedPowerIdsThisRound: [],
      npcAttackUsesThisRound: {},
      stoneBonuses: { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 },
      prepBaseAttackCommitted: true,
      activeBuffUsedThisRound: true,
    });
    expect(await refundPrepActiveBuffActivation(actor, combat)).toBe(true);
    const rs = getRoundState(actor, combat);
    expect(rs.prepBaseAttackCommitted).toBe(false);
    expect(rs.activeBuffUsedThisRound).toBe(false);
    expect(getAvailableAttackActions(actor, combat)).toBe(1);
  });

  it('Prep activate commit → retract restores Attack and removes effect', async () => {
    const actor = makeActor();
    actor.isOwner = true;
    const combat = (globalThis as any).game.combat;
    await setRoundState(actor, {
      combatId: 'c1',
      round: 1,
      isPC: true,
      movementActions: { total: 1, used: 0 },
      attackActions: { total: 1, used: 0 },
      reactionActions: { total: 1, used: 0 },
      moveBonusMeters: 0,
      usedPowerIdsThisRound: [],
      npcAttackUsesThisRound: {},
      stoneBonuses: { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 },
    });
    expect(await commitPrepBaseAttackAction(actor, combat)).toBe(true);
    pushBuff(actor);
    expect(isActiveBuffPreparationWindow(actor, combat)).toBe(true);

    const result = await retractActiveBuffActivation(actor, { user: { isGM: false } });
    expect(result.ok).toBe(true);
    expect(result.refunded).toBe(true);
    expect(actor.effects).toHaveLength(0);
    expect(getRoundState(actor, combat).prepBaseAttackCommitted).toBe(false);
    expect(getRoundState(actor, combat).activeBuffUsedThisRound).toBe(false);
    expect(getAvailableAttackActions(actor, combat)).toBe(1);
  });

  it('maintain-only retract deletes effect without inventing a refund', async () => {
    const actor = makeActor();
    actor.isOwner = true;
    const combat = (globalThis as any).game.combat;
    await setRoundState(actor, {
      combatId: 'c1',
      round: 1,
      isPC: true,
      movementActions: { total: 1, used: 0 },
      attackActions: { total: 1, used: 0 },
      reactionActions: { total: 1, used: 0 },
      moveBonusMeters: 0,
      usedPowerIdsThisRound: [],
      npcAttackUsesThisRound: {},
      stoneBonuses: { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 },
      prepBaseAttackCommitted: false,
      activeBuffUsedThisRound: false,
    });
    pushBuff(actor);
    const result = await retractActiveBuffActivation(actor, { user: { isGM: false } });
    expect(result.ok).toBe(true);
    expect(result.refunded).toBe(false);
    expect(actor.effects).toHaveLength(0);
    expect(getRoundState(actor, combat).prepBaseAttackCommitted).toBe(false);
  });

  /** Round ≥2 with confirmed assignment + stones done → Preparation closed. */
  async function closePreparation(actor: any, combat: any, round = 2) {
    combat.round = round;
    combat.started = true;
    await actor.setFlag('mastery-system', 'preparationPhase', {
      combatId: String(combat.id),
      round,
      boost: 'skipped',
      boostTier: 0,
      exchange: 'done',
      exchangeStones: 0,
      assignment: 'confirmed',
    });
    const doneKey = `cb1:${round}`;
    combat.combatants = [{ id: 'cb1', actorId: actor.id, actor }];
    combat.getFlag = (_ns: string, key: string) =>
      key === 'stonePowersDoneByRound' ? { [doneKey]: true } : undefined;
    combat.flags = {
      'mastery-system': { stonePowersDoneByRound: { [doneKey]: true } },
    };
  }

  it('non-GM outside Preparation is denied', async () => {
    const actor = makeActor();
    actor.isOwner = true;
    const combat = { id: 'c1', round: 2, turn: 0, started: true } as any;
    (globalThis as any).game.combat = combat;
    await closePreparation(actor, combat, 2);
    pushBuff(actor);
    expect(isActiveBuffPreparationWindow(actor, combat)).toBe(false);

    const result = await retractActiveBuffActivation(actor, { user: { isGM: false } });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('denied');
    expect(actor.effects).toHaveLength(1);
  });

  it('GM outside Preparation may retract', async () => {
    const actor = makeActor();
    actor.isOwner = false;
    const combat = { id: 'c1', round: 2, turn: 0, started: true } as any;
    (globalThis as any).game.combat = combat;
    await closePreparation(actor, combat, 2);
    await setRoundState(actor, {
      combatId: 'c1',
      round: 2,
      isPC: true,
      movementActions: { total: 1, used: 0 },
      attackActions: { total: 1, used: 0 },
      reactionActions: { total: 1, used: 0 },
      moveBonusMeters: 0,
      usedPowerIdsThisRound: [],
      npcAttackUsesThisRound: {},
      stoneBonuses: { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 },
      prepBaseAttackCommitted: true,
      activeBuffUsedThisRound: true,
    });
    pushBuff(actor);
    expect(isActiveBuffPreparationWindow(actor, combat)).toBe(false);

    const result = await retractActiveBuffActivation(actor, { user: { isGM: true } });
    expect(result.ok).toBe(true);
    expect(result.refunded).toBe(true);
    expect(actor.effects).toHaveLength(0);
  });

  it('canRetractActiveBuffFromFlags: player Prep vs GM anytime', () => {
    expect(
      canRetractActiveBuffFromFlags({
        maintaining: true,
        isGM: false,
        isOwner: true,
        windowOpen: true,
      }),
    ).toBe(true);
    expect(
      canRetractActiveBuffFromFlags({
        maintaining: true,
        isGM: false,
        isOwner: true,
        windowOpen: false,
      }),
    ).toBe(false);
    expect(
      canRetractActiveBuffFromFlags({
        maintaining: true,
        isGM: true,
        isOwner: false,
        windowOpen: false,
      }),
    ).toBe(true);
    expect(
      canRetractActiveBuffFromFlags({
        maintaining: false,
        isGM: true,
        isOwner: true,
        windowOpen: true,
      }),
    ).toBe(false);
  });
});
