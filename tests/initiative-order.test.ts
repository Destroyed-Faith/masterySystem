import { describe, expect, it } from 'vitest';
import {
  compareInitiativeCombatants,
  findTurnIndexHighestInitiativeFirst,
  needsNpcInitiativeRoll,
  remainingInitiativeAfterShop,
} from '../src/combat/initiative-roll';

function combatant(opts: {
  id: string;
  initiative: number;
  type?: string;
  defeated?: boolean;
  agility?: number;
  wits?: number;
  intellect?: number;
  resolve?: number;
  rank?: number;
  tieD8?: number;
}): any {
  return {
    id: opts.id,
    initiative: opts.initiative,
    defeated: !!opts.defeated,
    getFlag: (_scope: string, key: string) => (key === 'initiativeTieD8' ? opts.tieD8 ?? 0 : 0),
    actor: {
      type: opts.type ?? 'character',
      system: {
        mastery: { rank: opts.rank ?? 0 },
        attributes: {
          agility: { value: opts.agility ?? 0 },
          wits: { value: opts.wits ?? 0 },
          intellect: { value: opts.intellect ?? 0 },
          resolve: { value: opts.resolve ?? 0 },
        },
      },
    },
  };
}

describe('remainingInitiativeAfterShop', () => {
  it('keeps a negative leftover instead of clamping to 0', () => {
    expect(remainingInitiativeAfterShop(-4, 0)).toBe(-4);
    expect(remainingInitiativeAfterShop(-4, 2)).toBe(-6);
    expect(remainingInitiativeAfterShop(3, 5)).toBe(-2);
  });

  it('subtracts purchases from a positive pool', () => {
    expect(remainingInitiativeAfterShop(12, 4)).toBe(8);
  });
});

describe('compareInitiativeCombatants', () => {
  it('orders higher initiative first, including negatives', () => {
    const late = combatant({ id: 'a', initiative: -3 });
    const early = combatant({ id: 'b', initiative: 1 });
    expect(compareInitiativeCombatants(early, late)).toBeLessThan(0);
    expect(compareInitiativeCombatants(late, early)).toBeGreaterThan(0);
  });

  it('breaks an initiative tie by Mastery Rank, then Agility, then a stored d8', () => {
    const lowRank = combatant({ id: 'pc', initiative: 8, type: 'character', rank: 2, agility: 20 });
    const highRank = combatant({ id: 'npc', initiative: 8, type: 'npc', rank: 5, agility: 1 });
    expect(compareInitiativeCombatants(highRank, lowRank)).toBeLessThan(0);

    const slowAgi = combatant({ id: 'a', initiative: 6, rank: 3, agility: 4 });
    const fastAgi = combatant({ id: 'b', initiative: 6, rank: 3, agility: 8 });
    expect(compareInitiativeCombatants(fastAgi, slowAgi)).toBeLessThan(0);

    const lowDie = combatant({ id: 'c', initiative: 6, rank: 3, agility: 5, tieD8: 2 });
    const highDie = combatant({ id: 'd', initiative: 6, rank: 3, agility: 5, tieD8: 7 });
    expect(compareInitiativeCombatants(highDie, lowDie)).toBeLessThan(0);
    expect(compareInitiativeCombatants(highDie, lowDie)).toBe(compareInitiativeCombatants(highDie, lowDie));
  });

  it('does not put a negative-ini player first when an NPC rolled higher', () => {
    const finn = combatant({ id: 'finn', initiative: -2, type: 'character' });
    const npc = combatant({ id: 'goblin', initiative: 4, type: 'npc' });
    const combat = { turn: 0, turns: [finn, npc] } as unknown as Combat;
    expect(findTurnIndexHighestInitiativeFirst(combat)).toBe(1);
  });

  it('picks the highest Ini from combatants when turns is empty', () => {
    const finn = combatant({ id: 'finn', initiative: -2, type: 'character' });
    const npc = combatant({ id: 'goblin', initiative: 4, type: 'npc' });
    const combat = {
      turn: 0,
      turns: [],
      combatants: { values: () => [finn, npc] },
    } as unknown as Combat;
    expect(findTurnIndexHighestInitiativeFirst(combat)).toBe(1);
  });
});

describe('needsNpcInitiativeRoll', () => {
  function npc(opts: { initiative: number | null; rolled?: boolean; type?: string }): Combatant {
    return {
      initiative: opts.initiative,
      actor: { type: opts.type ?? 'npc' },
      getFlag: (_scope: string, key: string) => (key === 'npcInitiativeRolled' ? !!opts.rolled : null),
    } as unknown as Combatant;
  }

  it('treats Foundry seed 0 as unrolled', () => {
    expect(needsNpcInitiativeRoll(npc({ initiative: 0 }))).toBe(true);
    expect(needsNpcInitiativeRoll(npc({ initiative: null }))).toBe(true);
  });

  it('skips after the rolled flag, unless forced', () => {
    expect(needsNpcInitiativeRoll(npc({ initiative: 0, rolled: true }))).toBe(false);
    expect(needsNpcInitiativeRoll(npc({ initiative: 3, rolled: true }))).toBe(false);
    expect(needsNpcInitiativeRoll(npc({ initiative: 3, rolled: true }), true)).toBe(true);
  });

  it('does not roll player characters', () => {
    expect(needsNpcInitiativeRoll(npc({ initiative: 0, type: 'character' }))).toBe(false);
  });

  it('still rolls a surprised NPC — Surprise no longer sets Initiative to 0', () => {
    const surprised = npc({ initiative: 0 });
    (surprised.actor as any).system = { statusEffects: [{ id: 'surprise' }] };
    expect(needsNpcInitiativeRoll(surprised)).toBe(true);
    expect(needsNpcInitiativeRoll(surprised, true)).toBe(true);
  });
});
