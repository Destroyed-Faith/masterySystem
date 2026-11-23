import { beforeEach, describe, expect, it, vi } from 'vitest';

const masteryRollSpy = vi.fn(async (opts: any) => ({ total: opts.numDice * 4, dice: [], kept: [] }));
vi.mock('../src/dice/roll-handler.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/dice/roll-handler.js')>();
  return { ...actual, masteryRoll: (opts: any) => masteryRollSpy(opts) };
});

import { controlledInitiativeBase, rollInitiativeForCombatant } from '../src/combat/initiative-roll.js';

/** Wounded actor: two of three bars lost (Health Penalty applies to other rolls). */
function woundedActor(opts: { agi: number; wits: number; mr: number }) {
  const flags: Record<string, unknown> = {};
  return {
    id: 'w1',
    name: 'Wounded',
    type: 'character',
    items: [],
    system: {
      mastery: { rank: opts.mr },
      attributes: { agility: { value: opts.agi }, wits: { value: opts.wits } },
      scaling: { witsInitiativeBonus: 0 },
      combat: { initiativeFromMechanics: 0 },
      health: {
        currentBar: 2,
        bars: [
          { current: 0, max: 30, penalty: 0 },
          { current: 0, max: 30, penalty: -1 },
          { current: 12, max: 30, penalty: -2 },
        ],
      },
    },
    getFlag(_ns: string, key: string) {
      return flags[key];
    },
    async setFlag(_ns: string, key: string, value: unknown) {
      flags[key] = value;
    },
    async unsetFlag(_ns: string, key: string) {
      delete flags[key];
    },
  };
}

function combatantFor(actor: any): any {
  const c: any = {
    id: 'c1',
    actor,
    initiative: null,
    getFlag: () => undefined,
    setFlag: async () => undefined,
    update: async (data: any) => {
      c.initiative = data.initiative;
    },
  };
  return c;
}

describe('Core v0.9.9.6: Health Penalty does not affect Initiative', () => {
  beforeEach(() => {
    masteryRollSpy.mockClear();
    (globalThis as any).game = {
      combat: { id: 'cmb1', round: 1 },
      user: { isGM: true },
      settings: { get: () => false },
      actors: { get: () => null },
    };
    (globalThis as any).ChatMessage = { create: vi.fn(async () => ({})), getSpeaker: () => ({}) };
  });

  it('Controlled Initiative uses the raw Attribute value', async () => {
    const actor = woundedActor({ agi: 13, wits: 9, mr: 4 });
    expect(controlledInitiativeBase(actor)).toBe(13);
    const res = await rollInitiativeForCombatant(combatantFor(actor), { method: 'controlled' });
    expect(res.diceTotal).toBe(13);
  });

  it('Risky Initiative rolls MR d8 with no pool penalties', async () => {
    const actor = woundedActor({ agi: 13, wits: 9, mr: 4 });
    await rollInitiativeForCombatant(combatantFor(actor), { method: 'risky' });
    expect(masteryRollSpy).toHaveBeenCalledOnce();
    const opts = masteryRollSpy.mock.calls[0][0];
    expect(opts.numDice).toBe(4);
    expect(opts.keepDice).toBe(4);
    expect(opts.applyPoolPenalties).toBeFalsy();
  });
});
