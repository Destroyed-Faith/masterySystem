import { describe, expect, it } from 'vitest';
import {
  compareInitiativeCombatants,
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
}): any {
  return {
    id: opts.id,
    initiative: opts.initiative,
    defeated: !!opts.defeated,
    actor: {
      type: opts.type ?? 'character',
      system: {
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

  it('lets a player win a tie against an NPC', () => {
    const pc = combatant({ id: 'pc', initiative: 8, type: 'character', agility: 2 });
    const npc = combatant({ id: 'npc', initiative: 8, type: 'npc', agility: 20 });
    expect(compareInitiativeCombatants(pc, npc)).toBeLessThan(0);
    expect(compareInitiativeCombatants(npc, pc)).toBeGreaterThan(0);
  });

  it('breaks player vs player ties by Agility, then Wits, then Intellect, then Resolve', () => {
    const slowAgi = combatant({ id: 'a', initiative: 6, agility: 4, wits: 10, intellect: 10, resolve: 10 });
    const fastAgi = combatant({ id: 'b', initiative: 6, agility: 8, wits: 1, intellect: 1, resolve: 1 });
    expect(compareInitiativeCombatants(fastAgi, slowAgi)).toBeLessThan(0);

    const lowWits = combatant({ id: 'c', initiative: 6, agility: 5, wits: 3, intellect: 12, resolve: 12 });
    const highWits = combatant({ id: 'd', initiative: 6, agility: 5, wits: 9, intellect: 1, resolve: 1 });
    expect(compareInitiativeCombatants(highWits, lowWits)).toBeLessThan(0);

    const lowInt = combatant({ id: 'e', initiative: 6, agility: 5, wits: 5, intellect: 2, resolve: 12 });
    const highInt = combatant({ id: 'f', initiative: 6, agility: 5, wits: 5, intellect: 7, resolve: 1 });
    expect(compareInitiativeCombatants(highInt, lowInt)).toBeLessThan(0);

    const lowRes = combatant({ id: 'g', initiative: 6, agility: 5, wits: 5, intellect: 5, resolve: 2 });
    const highRes = combatant({ id: 'h', initiative: 6, agility: 5, wits: 5, intellect: 5, resolve: 8 });
    expect(compareInitiativeCombatants(highRes, lowRes)).toBeLessThan(0);
  });
});
