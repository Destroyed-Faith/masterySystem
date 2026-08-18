import { describe, expect, it } from 'vitest';
import {
  combatReflexesInitiativeState,
  getCombatReflexesInitiativeLimits,
  stepCombatReflexesInitiative,
} from '../src/combat/combat-reflexes';

const makeActor = (rating: number, spent: number) => {
  const actor: any = {
    type: 'character',
    system: { skills: { combatReflexes: rating }, skillsSpent: { combatReflexes: spent } },
    update: async (data: Record<string, unknown>) => {
      const next = Number(data['system.skillsSpent.combatReflexes']);
      actor.system.skillsSpent.combatReflexes = next;
    },
  };
  return actor;
};

const makeCombatant = (initiative: number, used = 0) => {
  const flags: Record<string, unknown> = { msCrInitiativeThisRound: used };
  const combatant: any = {
    initiative,
    getFlag: (_scope: string, key: string) => flags[key],
    setFlag: async (_scope: string, key: string, value: unknown) => {
      flags[key] = value;
    },
    update: async (data: Record<string, unknown>) => {
      combatant.initiative = Number(data.initiative);
    },
  };
  return combatant;
};

describe('combat reflexes limits', () => {
  it('caps at the pool that is left', () => {
    const limits = getCombatReflexesInitiativeLimits(makeActor(5, 3), 4);
    expect(limits.remainingPool).toBe(2);
    expect(limits.maxThisRoll).toBe(2);
  });

  it('caps at the mastery rank per roll', () => {
    const limits = getCombatReflexesInitiativeLimits(makeActor(20, 0), 2);
    expect(limits.maxThisRoll).toBe(limits.capPerRoll);
  });
});

describe('combat reflexes exchange state', () => {
  it('subtracts what was already added this round from the per-roll cap', () => {
    const state = combatReflexesInitiativeState(makeActor(10, 2), makeCombatant(14, 2), 2);
    expect(state.usedThisRound).toBe(2);
    expect(state.addable).toBe(state.capPerRoll - 2);
    expect(state.canRemove).toBe(true);
  });

  it('offers no undo when nothing was added this round', () => {
    const state = combatReflexesInitiativeState(makeActor(10, 0), makeCombatant(14, 0), 2);
    expect(state.canRemove).toBe(false);
    expect(state.canAdd).toBe(true);
  });

  it('offers no undo once the initiative was spent away', () => {
    const state = combatReflexesInitiativeState(makeActor(10, 3), makeCombatant(0, 3), 2);
    expect(state.canRemove).toBe(false);
  });

  it('has nothing to add with an empty pool', () => {
    const state = combatReflexesInitiativeState(makeActor(3, 3), makeCombatant(9, 0), 2);
    expect(state.addable).toBe(0);
    expect(state.canAdd).toBe(false);
  });
});

describe('stepping combat reflexes into initiative', () => {
  it('spends one skill point for one initiative', async () => {
    const actor = makeActor(4, 0);
    const combatant = makeCombatant(11);
    const next = await stepCombatReflexesInitiative(actor, combatant, 1, 2);
    expect(next).toBe(12);
    expect(actor.system.skillsSpent.combatReflexes).toBe(1);
    expect(combatant.getFlag('mastery-system', 'msCrInitiativeThisRound')).toBe(1);
    expect(combatant.getFlag('mastery-system', 'msInitiativeValue')).toBe(12);
  });

  it('gives the point back', async () => {
    const actor = makeActor(4, 2);
    const combatant = makeCombatant(13, 2);
    const next = await stepCombatReflexesInitiative(actor, combatant, -1, 2);
    expect(next).toBe(12);
    expect(actor.system.skillsSpent.combatReflexes).toBe(1);
    expect(combatant.getFlag('mastery-system', 'msCrInitiativeThisRound')).toBe(1);
  });

  it('refuses to add without pool', async () => {
    const actor = makeActor(2, 2);
    const combatant = makeCombatant(11);
    expect(await stepCombatReflexesInitiative(actor, combatant, 1, 2)).toBeNull();
    expect(combatant.initiative).toBe(11);
  });

  it('refuses to undo points that were never added this round', async () => {
    const actor = makeActor(4, 1);
    const combatant = makeCombatant(11, 0);
    expect(await stepCombatReflexesInitiative(actor, combatant, -1, 2)).toBeNull();
    expect(actor.system.skillsSpent.combatReflexes).toBe(1);
  });
});
