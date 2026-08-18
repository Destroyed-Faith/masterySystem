import { describe, expect, it } from 'vitest';
import {
  combatReflexesInitiativeState,
  combatReflexesRoundSpends,
  spendCombatReflexesUse,
  undoCombatReflexesUse,
} from '../src/combat/combat-reflexes';

const makeActor = (rating: number, spent: number) => {
  const actor: any = {
    type: 'character',
    system: { skills: { combatReflexes: rating }, skillsSpent: { combatReflexes: spent } },
    update: async (data: Record<string, unknown>) => {
      actor.system.skillsSpent.combatReflexes = Number(data['system.skillsSpent.combatReflexes']);
    },
  };
  return actor;
};

const makeCombatant = (initiative: number, roundSpends: number[] = []) => {
  const flags: Record<string, unknown> = { msCrInitiativeSpends: roundSpends };
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

describe('combat reflexes use boxes', () => {
  it('splits a full rating into four boxes of one Mastery Rank each', () => {
    const state = combatReflexesInitiativeState(makeActor(8, 0), makeCombatant(12), 2);
    expect(state.pointsPerUse).toBe(2);
    expect(state.boxes.map((box) => box.size)).toEqual([2, 2, 2, 2]);
    expect(state.nextUse).toBe(2);
    expect(state.boxes[0]!.canSpend).toBe(true);
    expect(state.boxes[1]!.canSpend).toBe(false);
  });

  it('leaves the last boxes short or empty on a partial rating', () => {
    const state = combatReflexesInitiativeState(makeActor(5, 0), makeCombatant(12), 2);
    expect(state.boxes.map((box) => box.size)).toEqual([2, 2, 1, 0]);
    expect(state.boxes[3]!.unavailable).toBe(true);
  });

  it('caps the rating at four uses', () => {
    const state = combatReflexesInitiativeState(makeActor(99, 0), makeCombatant(12), 3);
    expect(state.rating).toBe(12);
    expect(state.boxes.map((box) => box.size)).toEqual([3, 3, 3, 3]);
  });

  it('crosses off spent boxes from the left', () => {
    const state = combatReflexesInitiativeState(makeActor(8, 4), makeCombatant(12), 2);
    expect(state.boxes.map((box) => box.spent)).toEqual([true, true, false, false]);
    expect(state.boxes[2]!.canSpend).toBe(true);
    expect(state.remainingPool).toBe(4);
  });

  it('has nothing left to tick once all four uses are gone', () => {
    const state = combatReflexesInitiativeState(makeActor(8, 8), makeCombatant(20), 2);
    expect(state.canSpend).toBe(false);
    expect(state.nextUse).toBe(0);
  });
});

describe('taking a use back', () => {
  it('offers the undo only for a use taken this round', () => {
    const fromThisRound = combatReflexesInitiativeState(makeActor(8, 2), makeCombatant(14, [2]), 2);
    expect(fromThisRound.canUndo).toBe(true);
    expect(fromThisRound.boxes[0]!.canUndo).toBe(true);

    const fromEarlier = combatReflexesInitiativeState(makeActor(8, 2), makeCombatant(14, []), 2);
    expect(fromEarlier.canUndo).toBe(false);
  });

  it('offers no undo once the initiative went into stones', () => {
    const state = combatReflexesInitiativeState(makeActor(8, 2), makeCombatant(1, [2]), 2);
    expect(state.canUndo).toBe(false);
  });
});

describe('spending a use', () => {
  it('applies the Mastery Rank as initiative and records the use', async () => {
    const actor = makeActor(8, 0);
    const combatant = makeCombatant(11);
    expect(await spendCombatReflexesUse(actor, combatant, 2)).toBe(13);
    expect(actor.system.skillsSpent.combatReflexes).toBe(2);
    expect(combatReflexesRoundSpends(combatant)).toEqual([2]);
    expect(combatant.getFlag('mastery-system', 'msInitiativeValue')).toBe(13);
  });

  it('spends only what a short box holds', async () => {
    const actor = makeActor(5, 4);
    const combatant = makeCombatant(11);
    expect(await spendCombatReflexesUse(actor, combatant, 2)).toBe(12);
    expect(actor.system.skillsSpent.combatReflexes).toBe(5);
  });

  it('refuses a fifth use', async () => {
    const actor = makeActor(8, 8);
    const combatant = makeCombatant(11);
    expect(await spendCombatReflexesUse(actor, combatant, 2)).toBeNull();
    expect(combatant.initiative).toBe(11);
  });

  it('gives back exactly the last use', async () => {
    const actor = makeActor(8, 4);
    const combatant = makeCombatant(15, [2, 2]);
    expect(await undoCombatReflexesUse(actor, combatant, 2)).toBe(13);
    expect(actor.system.skillsSpent.combatReflexes).toBe(2);
    expect(combatReflexesRoundSpends(combatant)).toEqual([2]);
  });

  it('refuses to undo a use from an earlier round', async () => {
    const actor = makeActor(8, 2);
    const combatant = makeCombatant(13, []);
    expect(await undoCombatReflexesUse(actor, combatant, 2)).toBeNull();
    expect(actor.system.skillsSpent.combatReflexes).toBe(2);
  });

  it('survives a full spend and undo cycle', async () => {
    const actor = makeActor(8, 0);
    const combatant = makeCombatant(10);
    for (let i = 0; i < 4; i += 1) await spendCombatReflexesUse(actor, combatant, 2);
    expect(combatant.initiative).toBe(18);
    expect(await spendCombatReflexesUse(actor, combatant, 2)).toBeNull();
    for (let i = 0; i < 4; i += 1) await undoCombatReflexesUse(actor, combatant, 2);
    expect(combatant.initiative).toBe(10);
    expect(actor.system.skillsSpent.combatReflexes).toBe(0);
    expect(combatReflexesRoundSpends(combatant)).toEqual([]);
  });
});
