import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  controlledInitiativeBase,
  formatInitiativeDiceRollLine,
  initiativeRollAlreadyRecorded,
  normalizeInitiativeMethod,
  rollInitiativeForCombatant,
} from '../src/combat/initiative-roll.js';

function mockActor(opts: {
  type?: string;
  agi?: number;
  wits?: number;
  mr?: number;
  passiveInit?: number;
}) {
  const flags: Record<string, unknown> = {};
  return {
    id: 'a1',
    name: 'Hero',
    type: opts.type ?? 'character',
    items: [],
    system: {
      mastery: { rank: opts.mr ?? 3 },
      attributes: {
        agility: { value: opts.agi ?? 10 },
        wits: { value: opts.wits ?? 6 },
      },
      scaling: { witsInitiativeBonus: 0 },
      combat: { initiativeFromMechanics: opts.passiveInit ?? 0 },
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

describe('K8 Controlled vs Risky Initiative', () => {
  beforeEach(() => {
    (globalThis as any).game = {
      combat: { id: 'cmb1', round: 1 },
      user: { isGM: true },
      settings: { get: () => false },
    };
    (globalThis as any).ChatMessage = {
      create: vi.fn(async () => ({})),
      getSpeaker: () => ({}),
    };
  });

  it('Controlled base is max(Agility, Wits) with no MR multiplier', () => {
    expect(controlledInitiativeBase(mockActor({ agi: 12, wits: 8, mr: 5 }))).toBe(12);
    expect(controlledInitiativeBase(mockActor({ agi: 4, wits: 9 }))).toBe(9);
    expect(normalizeInitiativeMethod('controlled')).toBe('controlled');
    expect(normalizeInitiativeMethod('risky')).toBe('risky');
    expect(normalizeInitiativeMethod(undefined)).toBe('risky');
  });

  it('formats Controlled vs Risky flavor lines', () => {
    expect(formatInitiativeDiceRollLine(12, 'controlled')).toBe(
      'Controlled Initiative base was 12.',
    );
    expect(formatInitiativeDiceRollLine(18, 'risky')).toBe('Initiative Dice Roll was 18.');
  });

  it('Controlled determination applies flat modifiers once', async () => {
    const actor = mockActor({ agi: 14, wits: 7, mr: 4, passiveInit: 2 });
    const combatant: any = {
      id: 'c1',
      actor,
      initiative: null,
      getFlag: () => undefined,
      setFlag: async () => undefined,
      update: async (data: any) => {
        combatant.initiative = data.initiative;
      },
    };

    const first = await rollInitiativeForCombatant(combatant, { method: 'controlled' });
    expect(first.method).toBe('controlled');
    expect(first.diceTotal).toBe(14);
    // base 14 + passive 2
    expect(first.totalInitiative).toBe(16);
    expect(combatant.initiative).toBe(16);
  });

  it('save/reload keeps the recorded determination (method sticky)', async () => {
    const actor = mockActor({ agi: 11, wits: 5, mr: 3 });
    const combatant: any = {
      id: 'c1',
      actor,
      initiative: null,
      getFlag: () => undefined,
      setFlag: async () => undefined,
      update: async (data: any) => {
        combatant.initiative = data.initiative;
      },
    };

    const first = await rollInitiativeForCombatant(combatant, { method: 'controlled' });
    expect(first.totalInitiative).toBe(11);

    const flag = actor.getFlag('mastery-system', 'initiativeRolledFor') as any;
    expect(initiativeRollAlreadyRecorded(flag, 'cmb1', 1)).toBe(true);
    expect(flag.method).toBe('controlled');

    // Second call with a different requested method must not re-roll.
    const second = await rollInitiativeForCombatant(combatant, { method: 'risky' });
    expect(second.totalInitiative).toBe(11);
    expect(second.method).toBe('controlled');
    expect(second.diceTotal).toBe(11);
  });
});
