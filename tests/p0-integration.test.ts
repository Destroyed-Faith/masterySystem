import { describe, expect, it, vi } from 'vitest';
import {
  armDefensiveStoneExpiry,
  clearCombatStoneTurnBonusesForActor,
  releaseDefensiveStoneExpiry,
  resetRoundState,
  setRoundState,
} from '../src/combat/action-economy';
import {
  applyDeclaredCritSpend,
  critAppliesToAttackRoll,
  resolveCriticalAttackModifier,
} from '../src/combat/critical-resolution';
import {
  listSplitSecondTargetIds,
  openSplitPair,
  peekPendingSplit,
  rememberSplitSharedRaises,
  setSplitSecondTargetResolver,
} from '../src/combat/attack-executor';
import { compareInitiativeCombatants } from '../src/combat/initiative-roll';
import { applySurprisePriorityForAttack } from '../src/combat/surprise';
import { effectiveInvisibilityBonusForActor } from '../src/combat/invisibility-profile';
import { computePerceptionTn } from '../src/combat/perception-gate';
import { applyHealHpAcrossOpenBars } from '../src/combat/heal-resolution';
import { computeRaiseTns, resolvePowerSnapshot, type PowerSnapshot } from '../src/combat/raise-resolution';
import { finalizeRolledPool } from '../src/dice/pool-finalize';

function flagActor(id: string) {
  const flags: Record<string, unknown> = {};
  return {
    id,
    type: 'character',
    name: id,
    system: { attributes: { might: { value: 2 } }, mastery: { rank: 4 } },
    getFlag: (_s: string, key: string) => flags[key],
    setFlag: async (_s: string, key: string, value: unknown) => {
      flags[key] = value;
    },
    unsetFlag: async (_s: string, key: string) => {
      delete flags[key];
    },
  };
}

describe('P0 defensive stones across a spotlight change', () => {
  it('keeps armor until the defender’s next turn, including a later actor in the new round', async () => {
    vi.stubGlobal('game', { combat: null });
    vi.stubGlobal('canvas', { tokens: { placeables: [] } });
    vi.stubGlobal('Hooks', { callAll: () => undefined });
    const defender = flagActor('def');
    const combat = { id: 'combat-1', round: 1, turn: 0 } as any;
    await setRoundState(defender as any, {
      combatId: 'combat-1',
      round: 1,
      turn: 0,
      isPC: true,
      movementActions: { total: 1, used: 0 },
      attackActions: { total: 1, used: 0 },
      reactionActions: { total: 1, used: 0 },
      moveBonusMeters: 0,
      usedPowerIdsThisRound: [],
      npcAttackUsesThisRound: {},
      stoneBonuses: { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0, tempArmor: 8, evadeBonus: 3 },
    });
    await clearCombatStoneTurnBonusesForActor(defender as any, combat);
    await armDefensiveStoneExpiry(defender as any, combat);
    const duringEnemy = defender.getFlag('mastery-system', 'roundState') as any;
    expect(duringEnemy.stoneBonuses.tempArmor).toBe(8);
    expect(duringEnemy.stoneBonuses.evadeBonus).toBe(3);

    await resetRoundState(defender as any, { getFlag: () => undefined } as any, { ...combat, round: 2 } as any);
    const beforeOwnTurn = defender.getFlag('mastery-system', 'roundState') as any;
    expect(beforeOwnTurn.stoneBonuses.tempArmor).toBe(8);

    beforeOwnTurn.stoneBonuses.tempArmor = 11;
    await setRoundState(defender as any, beforeOwnTurn);
    await releaseDefensiveStoneExpiry(defender as any, { ...combat, round: 2 });
    const nextOwn = defender.getFlag('mastery-system', 'roundState') as any;
    expect(nextOwn.stoneBonuses.tempArmor).toBe(3);
    expect(nextOwn.stoneBonuses.evadeBonus).toBe(0);
  });
});

describe('P0 crit spend on martial and casting', () => {
  it('spends a stone charge only when the roll declared Crit', () => {
    const bank = { stoneCritCharges: 1 };
    const quiet = resolveCriticalAttackModifier(bank);
    const state = { stoneBonuses: { critRaises: 1 } };
    expect(applyDeclaredCritSpend(state, quiet)).toBe(false);
    expect(state.stoneBonuses.critRaises).toBe(1);

    const martial = resolveCriticalAttackModifier({
      ...bank,
      declared: true,
    });
    expect(critAppliesToAttackRoll({ spell: false, damageDice: 0 })).toBe(true);
    expect(martial.explodeOn78).toBe(true);
    expect(applyDeclaredCritSpend(state, martial)).toBe(true);
    expect(state.stoneBonuses.critRaises).toBe(0);

    const casting = resolveCriticalAttackModifier({
      stoneCritCharges: 1,
      declared: critAppliesToAttackRoll({ spell: true, damageDice: 4 }),
    });
    const castState = { stoneBonuses: { critRaises: 1 } };
    expect(applyDeclaredCritSpend(castState, casting)).toBe(true);
    expect(castState.stoneBonuses.critRaises).toBe(0);

    const harmless = resolveCriticalAttackModifier({
      stoneCritCharges: 1,
      declared: critAppliesToAttackRoll({ spell: true, damageDice: 0 }),
    });
    const untouched = { stoneBonuses: { critRaises: 1 } };
    expect(harmless.applyCritical).toBe(false);
    expect(applyDeclaredCritSpend(untouched, harmless)).toBe(false);
  });
});

describe('P0 split attack two targets', () => {
  it('accepts the only alternative token and shares one raise plan', async () => {
    expect(listSplitSecondTargetIds(['attacker', 'primary', 'other'], 'attacker')).toEqual(['primary', 'other']);
    setSplitSecondTargetResolver(async () => 'other');
    const opened = await openSplitPair({ id: 'attacker' }, { id: 'primary' }, { id: 'split' } as any, 'melee');
    expect(opened.secondTargetId).toBe('other');
    const { divideSplitAttackPool } = await import('../src/combat/attack-executor');
    const pools = divideSplitAttackPool(5);
    const pending = peekPendingSplit(opened.pairId);
    expect(pending?.targetTokenId).toBe('other');
    rememberSplitSharedRaises(opened.pairId, { plan: '[{"effect":"damage"}]', slots: '1', tn: '14' });
    expect(peekPendingSplit(opened.pairId)?.sharedRaisePlan).toBe('[{"effect":"damage"}]');
    expect(pools).toEqual({ first: 3, second: 2 });
    setSplitSecondTargetResolver(null);
  });
});

describe('P0 surprise priority from an attack', () => {
  it('marks the target surprised and sorts them last without changing initiative', async () => {
    const flags: Record<string, unknown> = {};
    const combatFlags: Record<string, unknown> = {};
    const attacker = {
      id: 'ambusher',
      setFlag: async (_s: string, key: string, value: unknown) => {
        flags[key] = value;
      },
      getFlag: (_s: string, key: string) => flags[key],
    };
    const target = { id: 'victim', statuses: { has: (id: string) => id === 'surprise' } };
    const combatantA = { id: 'ambusher', actorId: 'ambusher', actor: attacker, initiative: 4 };
    const combatantV = { id: 'victim', actorId: 'victim', actor: target, initiative: 12 };
    const combat = {
      started: false,
      round: 1,
      setupTurns: async () => undefined,
      combatants: {
        contents: [combatantA, combatantV],
        values: () => [combatantA, combatantV][Symbol.iterator](),
      },
      setFlag: async (_s: string, key: string, value: unknown) => {
        combatFlags[key] = value;
      },
      getFlag: (_s: string, key: string) => combatFlags[key],
      unsetFlag: async (_s: string, key: string) => {
        delete combatFlags[key];
      },
    };
    vi.stubGlobal('game', { combat });
    const granted = await applySurprisePriorityForAttack(attacker, target, combat);
    expect(granted).toBe(true);
    expect(flags.surprisePriority).toBe(true);
    expect(combatFlags.surprisedCombatantIds).toEqual(['victim']);
    expect(combatFlags.surpriseOrderIds).toEqual(['ambusher', 'victim']);
    const surprising = {
      id: 'ambusher',
      initiative: 4,
      actor: attacker,
      combat,
      getFlag: () => 0,
    };
    const surprised = {
      id: 'victim',
      initiative: 12,
      actor: target,
      combat,
      getFlag: () => 0,
    };
    expect(compareInitiativeCombatants(surprising, surprised)).toBeLessThan(0);
    expect(surprising.initiative).toBe(4);
    expect(surprised.initiative).toBe(12);
  });
});

describe('P0 invisibility and healing', () => {
  it('keeps the bonus after an attack and while incapacitated, and still counts lost bars', () => {
    const actor = {
      system: {
        mastery: { rank: 2 },
        health: {
          currentBar: 5,
          bars: [
            { name: 'Healthy', current: 0, max: 10 },
            { name: 'Bruised', current: 0, max: 10 },
            { name: 'Injured', current: 0, max: 10 },
            { name: 'Wounded', current: 0, max: 10 },
            { name: 'Broken', current: 0, max: 10 },
            { name: 'Incapacitated', current: 0, max: 10 },
          ],
        },
      },
      effects: [
        {
          disabled: false,
          flags: {
            'mastery-system': { activeBuff: true, powerTemplateId: 'ab-invisibility', mechanics: { invisibilityBonus: 6 } },
          },
        },
      ],
      getFlag: () => undefined,
    };
    expect(effectiveInvisibilityBonusForActor(actor)).toBe(6);
    expect(computePerceptionTn(actor)).toBe(4 * 2 + 6 - 4 * 2);
  });

  it('healing aura fill stays on the active bar and reopens Broken', () => {
    const healed = applyHealHpAcrossOpenBars(
      {
        currentBar: 1,
        bars: [
          { name: 'Healthy', current: 1, max: 10 },
          { name: 'Bruised', current: 4, max: 10 },
        ],
      },
      9,
    );
    expect(healed.bars[1].current).toBe(10);
    expect(healed.bars[0].current).toBe(1);
    const up = applyHealHpAcrossOpenBars(
      {
        currentBar: 5,
        bars: [
          { name: 'Broken', current: 0, max: 8 },
          { name: 'Incapacitated', current: 0, max: 8 },
        ],
      },
      2,
    );
    expect(up.currentBar).toBe(0);
    expect(up.bars[0].current).toBe(2);
  });
});

describe('P0 raises and pools under MR', () => {
  it('charges +4 TN per paid raise and applies single-target and AoE damage', () => {
    expect(computeRaiseTns(10, 2).raiseTn).toBe(18);
    expect(computeRaiseTns(10, 0).raiseTn).toBe(10);
    const base = (aoe: boolean): PowerSnapshot => ({
      damageDice: 1,
      specials: [{ key: 'ignite', rank: 2 }],
      rangeM: null,
      aoeRadiusM: aoe ? 3 : null,
      durationSteps: 0,
      hasRange: false,
      hasAoe: aoe,
      hasDuration: false,
    });
    const single = resolvePowerSnapshot({
      base: base(false),
      declaredRaises: [{ effect: 'damage', slots: 1 }, { effect: 'specialPlus', targetSpecialKey: 'ignite', slots: 1 }],
      outcome: 'full',
      masteryRank: 4,
      isSpell: false,
    });
    expect(single.damageDice).toBe(5);
    expect(single.specials[0].rank).toBe(6);
    const aoe = resolvePowerSnapshot({
      base: base(true),
      declaredRaises: [{ effect: 'damage', slots: 1 }, { effect: 'damage', slots: 1 }],
      outcome: 'full',
      masteryRank: 3,
      isSpell: true,
    });
    expect(aoe.damageDice).toBe(5);
  });

  it('attack, skill and casting pools may sit under MR and fail at zero', () => {
    const actor = { system: { health: { bars: [{ current: 8, max: 8 }] } } };
    for (const rollKind of ['attack', 'skill', 'generic'] as const) {
      expect(finalizeRolledPool(actor, 2, 4, { rollKind, applyPoolPenalties: false }).numDice).toBe(2);
      expect(finalizeRolledPool(actor, 0, 4, { rollKind, applyPoolPenalties: false }).numDice).toBe(0);
    }
  });
});
